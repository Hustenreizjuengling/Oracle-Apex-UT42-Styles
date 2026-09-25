# Passer – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: **Zweifarbendruck auf kühlem Papier.** Teal ist die Arbeitsfarbe, Fluoreszenz-Pink der zweite Farbauszug, der leicht verrutscht darunter liegt (Passerversatz), Gelb der Marker. Text steht in der Überdruck-Tusche, einem tiefen Indigo. Schrift: Bricolage Grotesque.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Passer/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

## Inhalt

0. [Die zwölf Regeln (Kurzfassung)](#0-die-zwölf-regeln-kurzfassung)
1. [Dateistruktur und Zuständigkeit](#1-dateistruktur-und-zuständigkeit)
2. [Ladereihenfolge](#2-ladereihenfolge)
3. [Token-System](#3-token-system)
4. [Brücke: was auf welche UT-Hebel zeigt](#4-brücke-was-auf-welche-ut-hebel-zeigt)
5. [Regeln für Komponenten-Dateien](#5-regeln-für-komponenten-dateien)
6. [Test-Rezepte](#6-test-rezepte)
7. [Bekannte Grenzen und offene Punkte](#7-bekannte-grenzen-und-offene-punkte)

---

## 0. Die zwölf Regeln (Kurzfassung)

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--pa-*` oder aus UT-/APEX-Tokens, die die Brücke setzt. Masken nehmen `var(--pa-ink)` als deckende Farbe.
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen. Auch die Mischart des Überdrucks ist ein Token (`--pa-overprint`: hell `multiply`, dunkel `screen`).
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--pa-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--pa-c-*` auf dem Komponenten-Selektor (§5.4). Geprüft von `Passer/tools/lint-tokens.mjs` – ebenso, dass jeder gelesene Token deklariert ist (auch Haken mit Rückfallwert, die ihren Standardwert auf dem Komponenten-Selektor deklarieren) und jeder deklarierte gelesen wird (keine toten Tokens).
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui, mit gleichem Selektor und einem Kommentar zur Quelle (§5.3).
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** nie eigene Ringfarben; nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` lokal anpassen oder `--pa-focus-shadow*` verwenden (§5.5). Einzige Ausnahme ist der Kopf: Dort setzt shell.css den Hook auf Papierfarbe (`--pa-header-text`), weil ein Teal-Ring auf dem Teal-Kopf unsichtbar wäre. Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--pa-control-h`, `--pa-row-h`, `--pa-head-h` ableiten (Desktop 32/34/36 px, Touch 40 px automatisch; §5.6).
9. **Druck-Disziplin:** Der Passerversatz (Pink-Platte `--pa-plate` um `--pa-passer` versetzt) erscheint nur an Seitentitel und Logo, Hot-Buttons, Volltonbadges, der aktiven Navigation (Druckmarke), dem aktiven Reiter und im Login. **Nie** auf Fließtext, Eingabefeldern, in Tabellen, Karten-Listen oder dichten Listen. Pink ist nie Schrift und nie Bedeutung (§5.8).
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--pa-header-h`). Die Pink-Kante unter dem Kopf ist ein `box-shadow` – er ändert die von `theme42.js` gemessene Höhe nicht.
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§6).

---

## 1. Dateistruktur und Zuständigkeit

```
Passer/
  theme.json                       Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta); Theme-Variante 146   [Fundament]
  assets/fonts/                    Bricolage Grotesque latin + latin-ext (opsz 12–96, wght 200–800, wdth 75–100) + OFL  [Fundament]
  docs/ARCHITECTURE.md             dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)                   [Fundament]
  docs/THEME-VARIANTE.md           eigenes Theme 146: Ablauf und Grenzen                                     [Fundament]
  tools/check-tokens.mjs           Kontraste, Danger↔Teal/Pink, Palette (CVD, Farbton), Oracle-Blau        [Fundament]
  tools/lint-tokens.mjs            Token-Regeln für das Präfix --pa- (Ergänzung zu _tools/lint.mjs)          [Fundament]
  tools/build-architecture.mjs     baut docs/ARCHITECTURE.md (Tabellen aus gen-token-tables.mjs + check-tokens) [Fundament]
  tools/screenshots.mjs            Vorschaubilder der README (screenshots/)                                  [Fundament]
  src/
    passer-light.css                 Einstieg Light: tokens/light.css → index.css                                [Fundament]
    passer-dark.css                  Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css  [Fundament]
    passer-auto.css                  Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                                   (beide „screen and (prefers-color-scheme: dark)“) → index.css             [Fundament]
    index.css                      modusneutraler Kern: Reihenfolge aller Imports                            [Fundament]
    tokens/light.css               Farb-Tokens hell   – NUR :root, NUR --pa-* (+ --ut-color-scheme)          [Fundament]
    tokens/dark.css                Farb-Tokens dunkel – exakt dieselben Namen wie light.css                   [Fundament]
    tokens/scale.css               Maß-, Schrift-, Druckbild-, Dichte-, Fokus-Geometrie-Tokens + < 640 px      [Fundament]
    tokens/print.css               Druck: weißes Papier, kein Korn, kein Neon, kein Passer                    [Fundament]
    fonts.css                      @font-face „Passer Grotesk“                                                  [Fundament]
    bridge.css                     --pa-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender Ebenen (+ pointer: coarse) [Fundament]
    base.css                       @property --pa-c-shift, Papierkorn, Schrift, Skala, h1–h6, Links, ::selection/mark, Fokus, Scrollbars, tabular-nums, Druck [Fundament]
    components/shell.css           Kopf (Teal, Korn, Raster, Pink-Kante), Tree Nav + Druckmarke, Menüleiste, NavTabs, Mega Menu, Title Bar, Breadcrumb, RDS/Tabs, Spalten, Footer, Schublade
    components/login.css           Login: Plakat (Überdruck-Scheiben), Bogen mit Schnittmarken, Einrasten der Passung
    components/regions.css         Standard-Region, Akzente, Hero, Alert, Collapsible, Button Container, Content Block, Wizard, Carousel
    components/buttons.css         t-Button/a-Button/ui-button, Hot (Teal + Pink-Platte), Primary/Status, Gruppen, Buttons in Feldern
    components/forms.css           Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker (heute = Marker), Datei, RTE, Validierung
    components/overlays.css        Menüs, Dialoge, Drawer, Popups, Tooltips, Meldungen
    components/reports.css         Classic Report, Interactive Report, Interactive Grid, Pagination, leere Zustände (Rasterfleck)
    components/search.css          Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css           Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css         Badges (Volltonbadge mit Platte), Avatare, Template Components, Listen, Wizard Progress
    components/viz.css             Charts (JET), Kalender (heute = Marker), Karte, Tree
    components/utilities.css       u-color-*, u-hot/u-success …, sonstige u-*-Klassen
```

Der Kern der Komponenten-Dateien stammt aus dem Schwester-Theme dieses Projekts (gleiche UT-Selektoren, gleiche Dichte-, Fokus- und RTL-Mechanik). Neu gestaltet sind Shell, Login, Hot-Buttons, Badges, Tabellenfläche, Reiter, leere Zustände, „heute“ und die gesamte Farb- und Schriftebene.

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#passer/passer-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
Folge: Bei gleicher Spezifität gewinnt unser Bundle gegen alles von Oracle, App-/Seiten-CSS gewinnt gegen uns (gewollt: Apps bleiben übersteuerbar).

### 2.2 Im Bundle (verbindlich)

| # | Datei | Inhalt |
|---:|---|---|
| 1 | `tokens/light.css` **oder** `tokens/dark.css` | Farb-Tokens des Styles (Auto: hell, danach Delta + dunkel unter Media) |
| 2 | `tokens/scale.css` | Maße, Schrift, Druckbild (Passer, Raster, Korn), Dichte, Fokus-Geometrie, Mobil-Überschreibung |
| 3 | `fonts.css` | `@font-face` |
| 4 | `bridge.css` | Mapping auf UT/APEX/JET, `@media (pointer: coarse)` |
| 5 | `base.css` | `@property`, globale Grundlagen, niedrige Spezifität (`:where`; Ausnahmen: Überschriften `h1`–`h6` 0,0,1, §5.7; Tastatur-Fokusring 0,2,0, §5.5) |
| 6–17 | `components/*.css` | in der Reihenfolge von `index.css`: shell, login, regions, buttons, forms, overlays, reports, search, cards, content, viz, utilities |
| 18 | `tokens/print.css` | nur `@media print` |

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `passer-dark.css` die hellen Tokens zusätzlich unter `print`; Light braucht es nicht, Auto bekommt den hellen Druck über `screen and (…dark)`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`passer-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (verifiziert, §6). Das gilt auch für Papierkorn (Data-URI-Token) und Überdruck (`--pa-overprint`).

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--pa-surface`, `--pa-accent`, `--pa-plate`, `--pa-grain` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--pa-control-h`, `--pa-passer`, `--pa-fs-2xl` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--a-button-padding-y: var(--pa-control-pad-y)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-TreeNav { --pa-c-stamp-bg: var(--pa-accent) }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--hot { --a-button-shadow: … var(--pa-plate) }` | Komponenten |

Benennung: `--pa-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--pa-accent-text`, `--pa-soft-hover`, `--pa-success-tint`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--pa-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--pa-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal. Einzige Ausnahme ist die Grundfläche schwebender Ebenen (§3.6): Dort löst das Fundament die Fokus-Lücke und die beiden Fokus-Schatten selbst noch einmal auf (bridge §18).

**Registrierte Eigenschaft:** base.css registriert `--pa-c-shift` per `@property` als `<number>` (0 = in Passung, 1 = voll verrutscht). Die Login-Seite animiert diese eine Zahl; Titel-Schatten, Pink-Scheibe und Bogen-Platte rechnen sie in ihre eigene Länge um (§5.8).

### 3.2 Farb-Tokens (hell / dunkel)

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Papier und Bögen** | | | |
| `--pa-surface` | `#ECEEF3` | `#17172E` | Papier: Seitengrund, Navigation, Title Bar, Regionen |
| `--pa-sheet` | `#FAFAFD` | `#1E1E3A` | Bogen: Tabellen, Karten, Felder – ein hellerer Zettel auf dem Papier |
| `--pa-sheet-stripe` | `#F1F2F7` | `#22223F` | Zebra-Zeile auf dem Bogen |
| `--pa-surface-sunken` | `#DFE2EB` | `#0E0E20` | Rastertönung: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Segment-Spur |
| `--pa-surface-raised` | `#FAFAFD` | `#252545` | schwebend: Menüs, Dialoge, Popups |
| `--pa-raised-hover` | `#E6E8F0` | `#32325A` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--pa-soft`/`--pa-hover`, die dort dunkel kaum sichtbar sind |
| `--pa-ground` | `var(--pa-surface)` | `var(--pa-surface)` | aktuelle Grundfläche: an der Wurzel das Papier, in Menüs, Dialogen, Popups und Seiten-Dialogen `--pa-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--pa-hover` | `#E3E6EE` | `#222242` | Zeilen-/Listen-Hover auf dem Papier |
| `--pa-press` | `#D9DDE7` | `#2A2A4E` | gedrückt auf dem Papier |
| `--pa-soft` | `#E0E3EC` | `#2A2A4C` | Sekundär-Fläche : Tabs, Chips, Zähler-Spur |
| `--pa-soft-hover` | `#D5D9E4` | `#333358` | Sekundär-Button Hover |
| `--pa-soft-press` | `#C9CEDB` | `#3C3C63` | Sekundär-Button gedrückt |
| `--pa-tint-hover` | `rgb(30 32 73 / .07)` | `rgb(236 235 248 / .08)` | transparente Tusche-Tönung: Hover auf jeder Fläche |
| `--pa-tint-press` | `rgb(30 32 73 / .12)` | `rgb(236 235 248 / .13)` | dito gedrückt |
| `--pa-field` | `#FAFAFD` | `#1E1E3A` | Eingabefelder |
| `--pa-field-readonly` | `#E3E6EE` | `#141430` | schreibgeschützte Felder: Rastertönung |
| `--pa-scrim` | `rgb(23 23 46 / .42)` | `rgb(6 6 18 / .66)` | Abdunklung hinter Dialogen/Schublade |
| **Kopf: Vollton Teal** | | | |
| `--pa-header-bg` | `#00767C` | `#0D4448` | Teal-Vollton |
| `--pa-header-text` | `#FAFAFD` | `#ECEBF8` | Schrift auf dem Kopf |
| `--pa-header-hover` | `rgb(15 16 40 / .18)` | `#23555A` | Hover auf dem Kopf: Tusche über Teal |
| `--pa-header-press` | `rgb(15 16 40 / .30)` | `#336066` |  |
| `--pa-header-plate` | `#FF48B0` | `#FF5CB8` | Passer-Platte im Kopf |
| `--pa-header-dots` | `#FF48B0` | `#84122A` | Halbton-Punkte im Kopf |
| **Text** | | | |
| `--pa-ink` | `#1E2049` | `#ECEBF8` | Überdruck-Tusche: Text, Titel, Icons |
| `--pa-ink-2` | `#33365E` | `#D2D1EA` | Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute |
| `--pa-muted` | `#585B7C` | `#A9A8C8` | Sekundärtext, Breadcrumb |
| `--pa-placeholder` | `#5E6182` | `#9C9BBE` | Platzhalter |
| `--pa-disabled` | `#8B8DA6` | `#6F6E92` | deaktivierte Beschriftung |
| `--pa-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--pa-on-light` | `#1E2049` | `#1E2049` | Text auf hellen Flächen |
| **Linien** | | | |
| `--pa-line-subtle` | `#DEE1EA` | `#262646` | sehr zart: innere Trenner in Karten/Listen |
| `--pa-line` | `#CDD1DD` | `#34345A` | Haarlinie: Tabellenzeilen, Trenner, Region-Titel |
| `--pa-line-strong` | `#A9AEC2` | `#4C4C78` | kräftig: Kontur der Sekundär-Buttons, Container |
| `--pa-edge` | `#767993` | `#7E7DA2` | Feldkante – WCAG 1.4.11 |
| `--pa-edge-hover` | `#4A4D70` | `#A9A8C8` | Feldkante Hover |
| `--pa-head-rule` | `#1E2049` | `#D2D1EA` | Grundlinie unter Tabellenköpfen |
| **Arbeitsfarbe Teal (Primäraktion, Auswahl, Fokus, aktive Navigation)** | | | |
| `--pa-accent` | `#00767C` | `#3CCFC0` | Vollton |
| `--pa-accent-hover` | `#00686E` | `#5ADCCD` | Primär-Fläche Hover |
| `--pa-accent-press` | `#005A5F` | `#7BE6D9` | Primär-Fläche gedrückt |
| `--pa-accent-on` | `#FAFAFD` | `#111126` | Text/Icon auf Primär-Fläche |
| `--pa-accent-text` | `#00696F` | `#5ADCCD` | als Text/Marke |
| `--pa-accent-tint` | `#D3EBEA` | `#173F4A` | Auswahl-Fläche |
| `--pa-accent-tint-2` | `#BCE1DF` | `#1C5058` | kräftigere Auswahl |
| `--pa-accent-ring` | `rgb(0 118 124 / .22)` | `rgb(90 220 205 / .30)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| `--pa-plate` | `#FF48B0` | `#FF5CB8` | Fluoreszenz-Pink: zweiter Farbauszug |
| `--pa-overprint` | `multiply` | `screen` | Druckfarben mischen sich: hell multipliziert, nachts addiert |
| **Marker: Gelb (Textauswahl, Treffer, heute)** | | | |
| `--pa-marker` | `#FFE800` | `#FFE600` | Druckgelb als Fläche |
| `--pa-marker-soft` | `#FFF3A6` | `#4A4418` | Marker hell: Such-Treffer, Hervorhebung in Reports |
| `--pa-marker-text` | `#1E2049` | `#111126` | Schrift auf dem Marker-Gelb |
| **Fokus (ein System, überall >= 3:1)** | | | |
| `--pa-focus-ring-color` | `#00696F` | `#5ADCCD` | Ring |
| `--pa-focus-gap` | `var(--pa-ground)` | `var(--pa-ground)` | Innenring/Lücke des Doppelrings (= `--pa-ground`: Papier, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Tusche mit Unterstrich, Hover-Unterstrich in Teal** | | | |
| `--pa-link-text` | `#1E2049` | `#ECEBF8` | Linkfarbe im Fließtext (= Tusche) |
| `--pa-link-underline` | `#767993` | `#7E7DA2` | Unterstrich im Ruhezustand |
| `--pa-link-underline-hover` | `#00696F` | `#5ADCCD` | Unterstrich bei Hover (Teal) |
| **Textauswahl: gelber Marker** | | | |
| `--pa-selection` | `#FFEB3B` | `#FFE600` | ::selection-Hintergrund |
| `--pa-selection-text` | `#1E2049` | `#111126` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--pa-required-color` | `#B3263A` | `#FF8F8A` | = Danger-Text |
| **Status: Fläche · Hover · on (Text auf Fläche) · Text · Tönung (Alert-Grund)** | | | |
| `--pa-success` | `#0E7446` | `#3FCB8E` | Erfolg: Fläche (Buttons, Badges) |
| `--pa-success-hover` | `#0B6139` | `#62D7A4` | Erfolg: Fläche Hover |
| `--pa-success-on` | `#FFFFFF` | `#111126` | Erfolg: Text/Icon auf der Fläche |
| `--pa-success-text` | `#0E6B40` | `#5DD39A` | Erfolg: Textfarbe auf Papier, Bogen und Tönung |
| `--pa-success-tint` | `#D8EDE2` | `#173A36` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pa-warning` | `#FFC21A` | `#FFC94D` | Warnung: Fläche (Buttons, Badges) |
| `--pa-warning-hover` | `#FFD04F` | `#FFD674` | Warnung: Fläche Hover |
| `--pa-warning-on` | `#1E2049` | `#111126` | Warnung: Text/Icon auf der Fläche |
| `--pa-warning-text` | `#8A5200` | `#FFCF62` | Warnung: Textfarbe auf Papier, Bogen und Tönung |
| `--pa-warning-tint` | `#F8ECCB` | `#3A3322` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pa-danger` | `#A91F33` | `#F46A4E` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--pa-danger-hover` | `#8E1A2B` | `#FF826A` | Fehler/Gefahr: Fläche Hover |
| `--pa-danger-on` | `#FFFFFF` | `#111126` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--pa-danger-text` | `#B3263A` | `#FF8F8A` | Fehler/Gefahr: Textfarbe auf Papier, Bogen und Tönung |
| `--pa-danger-tint` | `#F6DDE0` | `#432234` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pa-info` | `#6A4BAA` | `#B39AF2` | Information: Fläche (Buttons, Badges) |
| `--pa-info-on` | `#FFFFFF` | `#111126` | Information: Text/Icon auf der Fläche |
| `--pa-info-text` | `#5B3F99` | `#C4A8FF` | Information: Textfarbe auf Papier, Bogen und Tönung |
| `--pa-info-tint` | `#E5DFF3` | `#2D2552` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--pa-code-keyword` | `#00696F` | `#5ADCCD` | Schlüsselwörter, Selektoren, Klassen: Teal |
| `--pa-code-string` | `#0E6B40` | `#5DD39A` | Zeichenketten: Grün |
| `--pa-code-number` | `#8A5200` | `#FFCF62` | Zahlen, Wahrheitswerte, Konstanten: Ocker |
| **Tiefe: gestapelte Bögen statt weicher Schatten** | | | |
| `--pa-float-shadow` | `0 0 0 1px rgb(30 32 73 / .14), .25rem .25rem 0 rgb(30 32 73 / .10), 0 12px 32px -12px rgb(30 32 73 / .28)` | `0 0 0 1px rgb(236 235 248 / .12), .25rem .25rem 0 rgb(0 0 0 / .35), 0 14px 36px -12px rgb(0 0 0 / .7)` | gestapelter Bogen: Kante, harter Versatz in Tusche, weicher Schatten – nur schwebende Ebenen (Menüs, Dialoge, Popups) |
| `--pa-tooltip-bg` | `#1E2049` | `#ECEBF8` | Tooltip-Fläche (invertiert) |
| `--pa-tooltip-text` | `#FAFAFD` | `#17172E` | Tooltip-Text |
| **Scrollbars** | | | |
| `--pa-scrollbar-thumb` | `rgb(30 32 73 / .28)` | `rgb(236 235 248 / .26)` | Scrollbar-Daumen |
| `--pa-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Druckbild: Papierkorn und Halbton-Raster (Data-URI, einmal gerastert)** | | | |
| `--pa-grain` | *SVG (Data-URI)* | *SVG (Data-URI)* | Papierkorn: feTurbulence-Kachel als Data-URI (einmal gerastert, kein CSS-Filter) |
| `--pa-halftone-ink` | `#FF48B0` | `#FF5CB8` | Punktfarbe der Raster auf Papier |
| **Icons** | | | |
| `--pa-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (Nebenschrift, als Data-URI) |

**Entscheidungen zur Farbe:**
- *Warum Teal + Pink (+ Gelb):* Es ist die klassische Zweifarben-Passer-Kombination; im Überdruck (multiply) ergeben die beiden ein tiefes Indigo – das ist die Schriftfarbe `--pa-ink` (`#1E2049`). Teal trägt weiße Schrift (Vollton `#00767C`: 5,2 : 1 auf dem Bogen-Weiß) und liegt weit weg von Oracle-Blau (ΔE00 ≥ 20 zu jeder Referenz); Pink ist die bekannteste Passer-Farbe, trägt aber keine Bedeutung und ist deshalb frei für den Passerversatz. Gelb (Druckgelb `#FFE800`) ist nur Marker: Textauswahl, `<mark>`, „heute“. Ein Marine-Blau schied aus (ΔE00 7,7 zu `#056AC8`), ebenso Orange als Platte (Verwechslung mit Warnung).
- *Papier statt Weiß:* Seitengrund, Navigation, Title Bar und Regionen liegen auf einem kühlen, leicht blau getönten Papier (`#ECEEF3`, kein Creme). Daten und Eingaben liegen auf dem helleren **Bogen** (`--pa-sheet` `#FAFAFD`: Tabellen, Karten, Felder, Menüs, Dialoge; 1,11 : 1 gegen das Papier).
- *Nachtdruck:* tief indigo gefärbtes Papier (`#17172E`), Mint-Teal `#3CCFC0` als Vollton mit dunkler Schrift, Pink `#FF5CB8`, Gelb `#FFE600`. Die Druckfarben mischen sich nachts additiv (`--pa-overprint: screen`). Der Kopf ist ein tiefes Teal (`#0D4448`) statt einer leuchtenden Fläche.
- *Danger ≠ Pink ≠ Teal:* hell Danger `#A91F33` (Rot, dunkler als Teal: Helligkeit 1,32 : 1; ΔE00 zur Platte normal 30 / Protan 38 / Deutan 38 / Tritan 24). Dunkel `#F46A4E` (Rot-Orange; zur Platte 28 / 44 / 35, bei Tritanopie nur 2,0 – deshalb trägt die Platte nie Bedeutung und Danger immer ein Symbol).
- *Info* ist Violett (Druckviolett `#6A4BAA` / `#B39AF2`), nicht APEX-Blau.
- *Code:* eigene Rollen-Tokens `--pa-code-keyword|string|number` (Teal, Grün, Ocker). Kommentare = `--pa-muted`, Namen = `--pa-ink`/`--pa-ink-2`; Zuordnung auf `--prism-*` in bridge §17.
- *Druckbild als Token:* `--pa-grain` ist eine SVG-`feTurbulence`-Kachel (180 px, `stitchTiles`) als Data-URI – hell Tusche mit rund 3–5 % Deckung, dunkel Papierweiß. Sie wird einmal gerastert und scrollt als normales Hintergrundbild mit (kein CSS-Filter, kein `background-attachment: fixed`). `--pa-header-dots` und `--pa-halftone-ink` sind die Punktfarben der Halbton-Raster.

### 3.3 Kategorie- und Diagrammpalette (`--pa-cat-*` → `--u-color-*`)

**Die Druckfarben sind die Datenfarben.** Serie 1 ist Teal, Serie 2 Pink, Serie 3 das Überdruck-Indigo, danach Sonnengelb, Violett, Mattgold, Burgund, Koralle, Druckgrün, Orange, Schiefer, Moos. Die Reihenfolge ist per Suche über alle Kandidaten auf Farbfehlsichtigkeit optimiert (Chart-Reihenfolge des UT: `.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`; Brettel/Viénot-Simulation). Erste 6 Serien min. ΔE00 normal / Protan / Deutan / Tritan: hell 17,8 / 11,0 / 16,8 / 9,5, dunkel 13,4 / 11,0 / 12,3 / 10,0; erste 8 Serien hell 12,6 / 8,1 / 13,4 / 3,0, dunkel 12,5 / 7,8 / 7,0 / 7,0. Hell alle ≥ 2,5 : 1 gegen das Papier, dunkel alle ≥ 3,6 : 1.

Das Pink der Daten ist im Dunkeln bewusst tiefer (`#CC3389`) als die Platte (`#FF5CB8`): Das hellere Pink war für Deuteranope neben dem Mint-Teal der Serie 1 kaum zu unterscheiden (ΔE00 4,7 → jetzt 15,6).

`check-tokens.mjs` prüft außerdem die **gleiche Identität hell/dunkel:** Der HSL-Farbton einer Kategorie weicht zwischen den Modi um höchstens 25° ab (heute max. 9°).

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--pa-cat-1` | `#00767C` | `#FFFFFF` | `#3CCFC0` | `#111126` | 1 | Teal |
| 2 | `--pa-cat-2` | `#1B8049` | `#FFFFFF` | `#4FD08A` | `#111126` | 9 | Druckgrün |
| 3 | `--pa-cat-3` | `#8C6D3F` | `#FFFFFF` | `#C9A56B` | `#111126` | 6 | Mattgold |
| 4 | `--pa-cat-4` | `#EC4FA4` | `#1E2049` | `#CC3389` | `#FFFFFF` | 2 | Fluoreszenz-Pink |
| 5 | `--pa-cat-5` | `#EE6A36` | `#1E2049` | `#FF8A57` | `#111126` | 10 | Orange |
| 6 | `--pa-cat-6` | `#4F6B3A` | `#FFFFFF` | `#93B86F` | `#111126` | 12 | Moos |
| 7 | `--pa-cat-7` | `#363C80` | `#FFFFFF` | `#8C93F0` | `#111126` | 3 | Überdruck-Indigo (Teal × Pink) |
| 8 | `--pa-cat-8` | `#8E3B5E` | `#FFFFFF` | `#D37FA8` | `#111126` | 7 | Burgund |
| 9 | `--pa-cat-9` | `#C68C00` | `#1E2049` | `#FFC94D` | `#111126` | 4 | Sonnengelb |
| 10 | `--pa-cat-10` | `#D9677A` | `#1E2049` | `#FF9FB0` | `#111126` | 8 | Koralle |
| 11 | `--pa-cat-11` | `#4B5A6B` | `#FFFFFF` | `#9AAABB` | `#111126` | 11 | Schiefer |
| 12 | `--pa-cat-12` | `#9B86D6` | `#1E2049` | `#C4B5F5` | `#111126` | 5 | Violett |
| 13 | `--pa-cat-13` | `#1F5C5F` | `#FFFFFF` | `#4E9EA0` | `#111126` | – | Tiefes Teal |
| 14 | `--pa-cat-14` | `#8B8DA6` | `#1E2049` | `#A9A8C8` | `#111126` | – | Tusche 40 % |
| 15 | `--pa-cat-15` | `#585B7C` | `#FFFFFF` | `#7E7DA2` | `#111126` | – | Tusche 70 % |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Passer ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--pa-cat-N) 60%, #fff)` mit Text `--pa-on-light` (min. 4,6 : 1), 31–45 = `color-mix(in srgb, var(--pa-cat-N) 55%, #000)` mit Text `--pa-on-dark` (min. 4,8 : 1). So scheint keine Vita-Farbe durch. Die Textvarianten `.u-color-N-txt` mischen Tusche bei, bis jede Stufe auf Papier **und** Bogen ≥ 4,5 : 1 erreicht (utilities.css, berechnet aus den Tokens).

### 3.4 Maß-, Schrift-, Druckbild-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--pa-font` | `"Passer Grotesk", "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Schriftfamilie der gesamten Oberfläche (Bricolage Grotesque als „Passer Grotesk“, dann System) |
| `--pa-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--pa-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--pa-fw-medium` | `500` | Labels, Buttons, Navigation |
| `--pa-fw-semibold` | `620` | Titel, aktive Einträge, Tabellenköpfe |
| `--pa-fw-bold` | `680` | „fett“ im Fließtext (<b>, <strong>) – variable Achse |
| `--pa-fw-display` | `760` | Seitentitel, Login-Titel: Plakatgewicht |
| `--pa-stretch-narrow` | `88%` | schmal geschnitten (wdth 88): Tabellenköpfe, dichte Spaltenlabels, Zellen auf dem Telefon |
| **Größen-Skala 12 · 13 · 14 · 16 · 20 · 32 (+ 12,5 für Tabellenköpfe)** | | |
| `--pa-fs-xs` | `.75rem` | 12  Klein: Hilfe, Badges, Zähler |
| `--pa-fs-head` | `.78125rem` | 12,5 Tabellenköpfe |
| `--pa-fs-sm` | `.8125rem` | 13  Tabellenzellen, Labels, Breadcrumb, Menüs klein |
| `--pa-fs-md` | `.875rem` | 14  UI, Fließtext, Felder, Buttons |
| `--pa-fs-lg` | `1rem` | 16  Region-Titel |
| `--pa-fs-xl` | `1.25rem` | 20  Abschnitt (Content Block h2) |
| `--pa-fs-2xl` | `2rem` | 32  Seitentitel (Plakat-Schnitt, schmal) |
| `--pa-fs-display` | `3.25rem` | 52  Login-Titel (Plakat) |
| `--pa-lh-xs` | `1rem` | zu 12 / 12,5 |
| `--pa-lh-sm` | `1.25rem` | zu 13 (Tabellenzellen 13/20) |
| `--pa-lh-md` | `1.25rem` | zu 14 |
| `--pa-lh-body` | `1.375rem` | zu 14 im Fließtext (Regionen, Content Blocks) |
| `--pa-lh-lg` | `1.5rem` | zu 16 |
| `--pa-lh-xl` | `1.75rem` | zu 20 |
| `--pa-lh-2xl` | `2.5rem` | zu 32 |
| `--pa-lh-display` | `3.25rem` | zu 52 (1,0) |
| `--pa-tracking-title` | `-.025em` | Seitentitel, Login-Titel |
| `--pa-tracking-heading` | `-.012em` | Region-/Abschnittstitel, h1–h4 |
| `--pa-tracking-ui` | `0em` | Buttons |
| **Geometrie: Papier** | | |
| `--pa-page-pad-x` | `2rem` | Innenabstand des Inhalts, waagerecht |
| `--pa-page-pad-y` | `1.25rem` | Innenabstand des Inhalts, senkrecht (Title Bar, Inhalt) |
| `--pa-r-lg` | `.25rem` | 4  Bögen: Tabellen, Karten, Menüs, Alerts – gestanzt, nicht weich |
| `--pa-r-md` | `.1875rem` | 3  Controls: Buttons, Felder, Tabs |
| `--pa-r-sm` | `.125rem` | 2  Checkbox, Chips |
| `--pa-r-dialog` | `.375rem` | 6  Dialoge/Drawer |
| `--pa-r-pill` | `62rem` | Pillen (Zähler, Badges, Avatare rund) |
| `--pa-header-h` | `3.5rem` | Kopfzeile (statisch – nie per JS/Font verändern) |
| `--pa-brand-lh` | `1.5rem` | feste Zeilenhöhe Logo/Branding: Font-Swap verschiebt nichts |
| `--pa-nav-w` | `15rem` | aufgeklappte Side-Navigation |
| `--pa-nav-rail-w` | `3.5rem` | eingeklappte Icon-Leiste |
| **Druckbild: Passer, Raster, Korn** | | |
| `--pa-passer` | `2px` | Versatz der Pink-Platte in Ruhe (Hot-Button, Badge, Nav-Marke) |
| `--pa-passer-hover` | `3px` | bei Hover driftet die Platte weiter |
| `--pa-passer-press` | `0px` | gedrückt: Platten in Passung |
| `--pa-passer-text` | `.06em` | Versatz an Schrift (Seitentitel, Logo) – wächst mit der Größe |
| `--pa-halftone-step` | `6px` | Rasterweite der Halbton-Punkte |
| `--pa-halftone-dot` | `1.35px` | Punktradius bei voller Deckung |
| `--pa-grain-size` | `180px` | Kachel des Papierkorns |
| **Abstände (4er-Raster)** | | |
| `--pa-space-1` | `.25rem` | 4 |
| `--pa-space-2` | `.5rem` | 8 |
| `--pa-space-3` | `.75rem` | 12 |
| `--pa-space-4` | `1rem` | 16 |
| `--pa-space-5` | `1.25rem` | 20 |
| `--pa-space-6` | `1.5rem` | 24 |
| `--pa-space-8` | `2rem` | 32 |
| `--pa-space-12` | `3rem` | 48 |
| `--pa-region-gap` | `2rem` | Abstand zwischen Regionen (→ --ut-region-margin) |
| **Dichte (Desktop 32 px; unter pointer: coarse 40 px – siehe bridge.css)** | | |
| `--pa-control-h` | `2rem` | Höhe Buttons, Felder, Selects, Pillen (inkl. Rand) |
| `--pa-control-h-sm` | `1.5rem` | kleine Buttons (t-Button--small), Toolbar-Icons |
| `--pa-control-h-lg` | `2.5rem` | große Buttons (t-Button--large), Login |
| `--pa-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--pa-control-pad-x` | `.75rem` | Innenabstand waagerecht (Felder); Buttons +2 px |
| `--pa-control-pad-y` | `calc((var(--pa-control-h) - var(--pa-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--pa-row-h` | `2.125rem` | Tabellenzeile 34 px inkl. Haarlinie |
| `--pa-row-lh` | `1.25rem` | Zeilenhöhe in Zellen (13/20) |
| `--pa-row-pad-x` | `.75rem` | Zellen-Innenabstand waagerecht |
| `--pa-row-pad-y` | `calc((var(--pa-row-h) - var(--pa-row-lh) - 1px) / 2)` | = 6,5 px |
| `--pa-head-h` | `2.25rem` | Tabellenkopf 36 px |
| `--pa-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.5rem |
| `--pa-checkbox-size` | `1.125rem` | Checkbox/Radio |
| **Linien-Geometrie** | | |
| `--pa-hairline` | `1px` | Haarlinie: Zeilen, Trenner, Region-Titel |
| `--pa-head-rule-width` | `2px` | Grundlinie unter Tabellenköpfen (Tusche, gedruckte Formularlinie) |
| `--pa-rule-strong` | `2px` | kräftige Tusche-Linie (Summenzeile, Region-Titel) |
| **Fokus-Geometrie (Farben: --pa-focus-ring-color / --pa-focus-gap)** | | |
| `--pa-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--pa-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Innenring) |
| `--pa-focus-outline` | `var(--pa-focus-ring-width) solid var(--pa-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--pa-focus-shadow` | `0 0 0 var(--pa-focus-ring-offset) var(--pa-focus-gap), 0 0 0 calc(var(--pa-focus-ring-offset) + var(--pa-focus-ring-width)) var(--pa-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--pa-focus-gap` innen, Teal außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--pa-focus-shadow-inset` | `inset 0 0 0 var(--pa-focus-ring-width) var(--pa-focus-ring-color), inset 0 0 0 calc(var(--pa-focus-ring-width) + 1px) var(--pa-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--pa-focus-field-shadow` | `0 0 0 1px var(--pa-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--pa-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--pa-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--pa-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--pa-required-mark` | `"*"` | in Textschrift, nicht als Icon |
| `--pa-required-gap` | `.25rem` | Abstand Label-Text → Markierung |
| **Bewegung** | | |
| `--pa-duration` | `.12s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--pa-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| `--pa-ease-snap` | `cubic-bezier(.3, 1.6, .5, 1)` | Einrasten der Passung (Login) – kurzer Überschwinger |
| **Mobil (< 640 px): kleinerer Innenabstand – Überschreibung `@media (max-width: 639px)`** | | |
| `--pa-page-pad-x` | `.75rem` | 12 px – Inhaltsbreite bei 390 px: 366 px |
| `--pa-page-pad-y` | `.75rem` | 12 px |
| `--pa-region-gap` | `1.5rem` | 24 px zwischen Regionen |
| `--pa-fs-2xl` | `1.5rem` | 24 Seitentitel auf dem Telefon |
| `--pa-lh-2xl` | `1.875rem` |  |
| `--pa-fs-display` | `2.5rem` | 40 Login-Titel |
| `--pa-lh-display` | `2.625rem` |  |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--pa-control-h 2.5rem`, `--pa-control-h-sm 2rem`, `--pa-control-h-lg 3rem`, `--pa-row-h 2.5rem`, `--pa-head-h 2.5rem`, `--pa-hit-min 2.5rem`, `--pa-checkbox-size 1.25rem`. Alle abgeleiteten Hebel rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): weißes Papier und weißer Bogen, Kopf ohne Vollton (weiß mit Tusche), `--pa-plate`, `--pa-header-plate`, `--pa-header-dots`, `--pa-halftone-ink` transparent, `--pa-grain: none`, keine Schatten; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

**Schrift:** Bricolage Grotesque trägt drei Achsen. `font-optical-sizing: auto` (base.css) stellt `opsz` auf die Schriftgröße: Seitentitel (32 px) werden eng und kräftig, Tabellenzellen (13 px) offen und ruhig. Seitentitel stehen im Plakat-Schnitt (`--pa-fw-display` 760, `font-stretch: --pa-stretch-narrow` 88 %), der Login-Titel mit 800 und 86 %.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Passer/tools/check-tokens.mjs`).

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--pa-ink` / `--pa-surface` | Text auf Papier | 13.32 | 14.86 | 4.5 |
| `--pa-ink` / `--pa-sheet` | Text auf Bogen (Tabellen, Karten) | 14.84 | 13.68 | 4.5 |
| `--pa-ink` / `--pa-surface-sunken` | Text auf Rastertönung | 11.94 | 16.15 | 4.5 |
| `--pa-ink` / `--pa-surface-raised` | Text in Menü/Dialog | 14.84 | 12.46 | 4.5 |
| `--pa-ink` / `--pa-soft` | Sekundär-Button | 12.05 | 11.61 | 4.5 |
| `--pa-ink` / `--pa-soft-hover` | Sekundär-Button Hover | 10.95 | 10.14 | 4.5 |
| `--pa-ink` / `--pa-accent-tint` | Auswahl-Zeile | 12.40 | 9.64 | 4.5 |
| `--pa-ink` / `--pa-accent-tint-2` | Auswahl kräftig | 11.03 | 7.62 | 4.5 |
| `--pa-ink-2` / `--pa-surface` | Label, Nav-Text | 9.89 | 11.72 | 4.5 |
| `--pa-muted` / `--pa-surface` | Sekundärtext | 5.65 | 7.61 | 4.5 |
| `--pa-muted` / `--pa-sheet` | Sekundärtext auf Bogen | 6.29 | 7.01 | 4.5 |
| `--pa-muted` / `--pa-surface-sunken` | Sekundärtext Rastertönung | 5.06 | 8.28 | 4.5 |
| `--pa-muted` / `--pa-surface-raised` | Sekundärtext Menü | 6.29 | 6.38 | 4.5 |
| `--pa-muted` / `--pa-hover` | Sekundärtext Zeilen-Hover | 5.25 | 6.63 | 4.5 |
| `--pa-header-text` / `--pa-header-bg` | Schrift auf dem Kopf (Teal-Vollton) | 5.19 | 9.19 | 4.5 |
| `--pa-marker-text` / `--pa-marker` | Schrift auf Marker-Gelb | 12.37 | 14.64 | 4.5 |
| `--pa-ink` / `--pa-marker-soft` | Tusche auf Marker hell (Treffer) | 13.71 | 8.35 | 4.5 |
| `--pa-ink` / `--pa-raised-hover` | Menüeintrag Hover/Fokus | 12.64 | 10.24 | 4.5 |
| `--pa-muted` / `--pa-raised-hover` | Tastenkürzel im Menü-Hover | 5.36 | 5.24 | 4.5 |
| `--pa-placeholder` / `--pa-field` | Platzhalter | 5.75 | 6.03 | 4.5 |
| `--pa-ink` / `--pa-field` | Feldtext | 14.84 | 13.68 | 4.5 |
| `--pa-ink` / `--pa-field-readonly` | Feldtext readonly | 12.39 | 15.19 | 4.5 |
| `--pa-link-text` / `--pa-surface` | Link | 13.32 | 14.86 | 4.5 |
| `--pa-accent-text` / `--pa-surface` | Teal-Text Papier | 5.57 | 10.47 | 4.5 |
| `--pa-accent-text` / `--pa-sheet` | Teal-Text Bogen | 6.20 | 9.64 | 4.5 |
| `--pa-accent-text` / `--pa-surface-raised` | Teal-Text Menü | 6.20 | 8.78 | 4.5 |
| `--pa-accent-text` / `--pa-accent-tint` | Akzent-Text auf Tönung | 5.18 | 6.80 | 4.5 |
| `--pa-accent-on` / `--pa-accent` | Primär-Button | 5.19 | 9.61 | 4.5 |
| `--pa-accent-on` / `--pa-accent-hover` | Primär-Button Hover | 6.29 | 11.09 | 4.5 |
| `--pa-accent-on` / `--pa-accent-press` | Primär-Button gedrückt | 7.67 | 12.51 | 4.5 |
| `--pa-selection-text` / `--pa-selection` | ::selection | 12.66 | 14.64 | 4.5 |
| `--pa-required-color` / `--pa-surface` | Pflicht-Markierung | 5.56 | 7.97 | 4.5 |
| `--pa-required-color` / `--pa-surface-sunken` | Pflicht-Markierung abgesenkt | 4.98 | 8.66 | 4.5 |
| `--pa-tooltip-text` / `--pa-tooltip-bg` | Tooltip | 14.84 | 14.86 | 4.5 |
| `--pa-edge` / `--pa-surface` | Feldkante/Papier (1.4.11) | 3.67 | 4.46 | 3 |
| `--pa-edge` / `--pa-surface-sunken` | Feldkante/Rastertönung | 3.29 | 4.85 | 3 |
| `--pa-edge` / `--pa-field` | Feldkante/Feld | 4.09 | 4.10 | 3 |
| `--pa-edge` / `--pa-surface-raised` | Feldkante/Dialog | 4.09 | 3.74 | 3 |
| `--pa-focus-ring-color` / `--pa-surface` | Fokus auf Papier | 5.57 | 10.47 | 3 |
| `--pa-focus-ring-color` / `--pa-sheet` | Fokus auf Bogen | 6.20 | 9.64 | 3 |
| `--pa-header-text` / `--pa-header-bg` | Fokus auf dem Kopf (Ring in Papierfarbe) | 5.19 | 9.19 | 3 |
| `--pa-focus-ring-color` / `--pa-surface-sunken` | Fokus Rastertönung | 4.99 | 11.39 | 3 |
| `--pa-focus-ring-color` / `--pa-surface-raised` | Fokus in Menü/Dialog | 6.20 | 8.78 | 3 |
| `--pa-focus-ring-color` / `--pa-soft` | Fokus neben Sekundär-Button | 5.04 | 8.18 | 3 |
| `--pa-focus-ring-color` / `--pa-field` | Fokus-Feldkante/Feld | 6.20 | 9.64 | 3 |
| `--pa-focus-ring-color` / `--pa-focus-gap` | Doppelring innen/außen | 5.57 | 10.47 | 3 |
| `--pa-focus-ring-color` / `--pa-raised-hover` | Fokus-Innenring auf Menü-Hover | 5.28 | 7.22 | 3 |
| `--pa-accent-text` / `--pa-raised-hover` | Häkchen/Radio im Menü-Hover (Marke) | 5.28 | 7.22 | 3 |
| `--pa-link-underline` / `--pa-surface` | Link-Unterstrich | 3.67 | 4.46 | 3 |
| `--pa-link-underline` / `--pa-surface-sunken` | Link-Unterstrich Rastertönung | 3.29 | 4.85 | 3 |
| `--pa-link-underline-hover` / `--pa-surface` | Link-Unterstrich Hover | 5.57 | 10.47 | 3 |
| `--pa-accent` / `--pa-surface` | Teal-Vollton gegen Papier (Druckmarke, Hot-Button) | 4.66 | 9.08 | 3 |
| `--pa-accent` / `--pa-sheet` | Teal-Vollton gegen Bogen | 5.19 | 8.36 | 3 |
| `--pa-code-keyword` / `--pa-surface` | Code keyword (Papier) | 5.57 | 10.47 | 4.5 |
| `--pa-code-keyword` / `--pa-surface-sunken` | Code keyword (Rastertönung) | 4.99 | 11.39 | 4.5 |
| `--pa-code-keyword` / `--pa-surface-raised` | Code keyword (Dialog) | 6.20 | 8.78 | 4.5 |
| `--pa-code-keyword` / `--pa-field` | Code keyword (Markdown-Editor) | 6.20 | 9.64 | 4.5 |
| `--pa-code-string` / `--pa-surface` | Code string (Papier) | 5.66 | 9.39 | 4.5 |
| `--pa-code-string` / `--pa-surface-sunken` | Code string (Rastertönung) | 5.07 | 10.21 | 4.5 |
| `--pa-code-string` / `--pa-surface-raised` | Code string (Dialog) | 6.31 | 7.87 | 4.5 |
| `--pa-code-string` / `--pa-field` | Code string (Markdown-Editor) | 6.31 | 8.64 | 4.5 |
| `--pa-code-number` / `--pa-surface` | Code number (Papier) | 5.50 | 11.98 | 4.5 |
| `--pa-code-number` / `--pa-surface-sunken` | Code number (Rastertönung) | 4.93 | 13.02 | 4.5 |
| `--pa-code-number` / `--pa-surface-raised` | Code number (Dialog) | 6.13 | 10.04 | 4.5 |
| `--pa-code-number` / `--pa-field` | Code number (Markdown-Editor) | 6.13 | 11.02 | 4.5 |
| `--pa-muted` / `--pa-field` | Code-Kommentar (Markdown-Editor) | 6.29 | 7.01 | 4.5 |
| `--pa-danger-text` / `--pa-surface-raised` | Code gelöscht (diff) (Dialog) | 6.19 | 6.68 | 4.5 |
| `--pa-danger-text` / `--pa-field` | Code gelöscht (diff) (Markdown-Editor) | 6.19 | 7.33 | 4.5 |
| `--pa-success-on` / `--pa-success` | success-Fläche | 5.82 | 8.96 | 4.5 |
| `--pa-success-on` / `--pa-success-hover` | success-Fläche Hover | 7.55 | 10.40 | 4.5 |
| `--pa-success-text` / `--pa-surface` | success-Text Papier | 5.66 | 9.39 | 4.5 |
| `--pa-success-text` / `--pa-sheet` | success-Text Bogen | 6.31 | 8.64 | 4.5 |
| `--pa-success-text` / `--pa-surface-sunken` | success-Text Rastertönung | 5.07 | 10.21 | 4.5 |
| `--pa-success-text` / `--pa-success-tint` | success-Text auf Tönung | 5.36 | 6.64 | 4.5 |
| `--pa-ink` / `--pa-success-tint` | Text auf success-Tönung | 12.62 | 10.51 | 4.5 |
| `--pa-warning-on` / `--pa-warning` | warning-Fläche | 9.56 | 12.11 | 4.5 |
| `--pa-warning-on` / `--pa-warning-hover` | warning-Fläche Hover | 10.59 | 13.36 | 4.5 |
| `--pa-warning-text` / `--pa-surface` | warning-Text Papier | 5.50 | 11.98 | 4.5 |
| `--pa-warning-text` / `--pa-sheet` | warning-Text Bogen | 6.13 | 11.02 | 4.5 |
| `--pa-warning-text` / `--pa-surface-sunken` | warning-Text Rastertönung | 4.93 | 13.02 | 4.5 |
| `--pa-warning-text` / `--pa-warning-tint` | warning-Text auf Tönung | 5.43 | 8.56 | 4.5 |
| `--pa-ink` / `--pa-warning-tint` | Text auf warning-Tönung | 13.15 | 10.62 | 4.5 |
| `--pa-danger-on` / `--pa-danger` | danger-Fläche | 7.17 | 6.20 | 4.5 |
| `--pa-danger-on` / `--pa-danger-hover` | danger-Fläche Hover | 9.00 | 7.64 | 4.5 |
| `--pa-danger-text` / `--pa-surface` | danger-Text Papier | 5.56 | 7.97 | 4.5 |
| `--pa-danger-text` / `--pa-sheet` | danger-Text Bogen | 6.19 | 7.33 | 4.5 |
| `--pa-danger-text` / `--pa-surface-sunken` | danger-Text Rastertönung | 4.98 | 8.66 | 4.5 |
| `--pa-danger-text` / `--pa-danger-tint` | danger-Text auf Tönung | 5.02 | 6.29 | 4.5 |
| `--pa-ink` / `--pa-danger-tint` | Text auf danger-Tönung | 12.03 | 11.74 | 4.5 |
| `--pa-info-on` / `--pa-info` | info-Fläche | 6.56 | 7.79 | 4.5 |
| `--pa-info-text` / `--pa-surface` | info-Text Papier | 6.92 | 8.67 | 4.5 |
| `--pa-info-text` / `--pa-sheet` | info-Text Bogen | 7.71 | 7.98 | 4.5 |
| `--pa-info-text` / `--pa-surface-sunken` | info-Text Rastertönung | 6.20 | 9.43 | 4.5 |
| `--pa-info-text` / `--pa-info-tint` | info-Text auf Tönung | 6.19 | 6.94 | 4.5 |
| `--pa-ink` / `--pa-info-tint` | Text auf info-Tönung | 11.92 | 11.89 | 4.5 |
| `--pa-sheet` / `--pa-surface` | Bogen gegen Papier | 1.11 | 1.09 | 1.08 |
| `--pa-header-text` / `--pa-header-dots` | Kopfschrift über Raster-Punktkern | 13.68 | 5.55 | 4.5 |
| `--pa-header-text` / `--pa-header-dots` | Kopfschrift Hover über Raster | 14.53 | 7.07 | 4.5 |
| `--pa-header-text` / `--pa-header-dots` | Kopfschrift gedrückt über Raster | 15.09 | 5.92 | 4.5 |
| `--pa-header-text` / `--pa-header-hover` | Kopfschrift Hover | 6.65 | 7.07 | 4.5 |
| `--pa-header-text` / `--pa-header-press` | Kopfschrift gedrückt | 7.87 | 5.92 | 4.5 |
| `--pa-line` / `--pa-surface` | Haarlinie | 1.31 | 1.49 | – |
| `--pa-line-strong` / `--pa-surface` | kräftige Linie | 1.90 | 2.18 | – |
| `--pa-head-rule` / `--pa-sheet` | Tabellenkopf-Grundlinie | 14.84 | 10.79 | – |
| `--pa-soft` / `--pa-surface` | Rastertönung (Sekundär-Fläche) | 1.11 | 1.28 | – |
| `--pa-surface-sunken` / `--pa-surface` | abgesenkte Rastertönung | 1.12 | 1.09 | 1.08 |
| `--pa-plate` / `--pa-surface` | Pink-Platte gegen Papier | 2.66 | 6.24 | – |
| `--pa-header-bg` / `--pa-surface` | Kopf gegen Papier | 4.66 | 1.62 | – |
| `--pa-raised-hover` / `--pa-surface-raised` | Hover auf schwebender Fläche | 1.17 | 1.22 | 1.15 |

**Paare außerhalb der Tabelle, die die Minima nicht erreichen** – Komponenten dürfen diese Kombinationen nicht erzeugen:
- `--pa-plate` (Pink) als **Schrift**: auf dem hellen Papier 2,66 : 1, Tusche auf Pink dunkel 2,38 : 1. Pink ist deshalb nie Text und nie Fläche mit Schrift – nur Platte, Raster und Datenfarbe (die Datenvariante `--pa-cat-4` hat eine eigene Kontrastschrift).
- `--pa-muted` auf `--pa-soft-press`: hell 4,16 – Sekundärtext nie auf gedrückten Sekundär-Flächen.
- `--pa-hover` bzw. `--pa-soft` als Hover **auf `--pa-surface-raised`**: dunkel 1,04 bzw. 1,07 : 1, also kaum sichtbar. In Menüs, Dialogen und Popups `--pa-raised-hover` verwenden (§3.6).
- `--pa-edge` auf `--pa-header-bg`: hell 1,27 – Felder im Kopf (Suchfeld der Navigationsleiste) brauchen die Feldfläche `--pa-field` als Grund.
- `--pa-marker` (Gelb) als Fläche nur mit `--pa-marker-text`; Tusche (`--pa-ink`) ist dunkel hell und hätte dort 1,07 : 1.

### 3.6 Grundfläche schwebender Ebenen (`--pa-ground`, `--pa-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--pa-surface-raised` (hell = Bogen, dunkel `#252545`, heller als das Papier). Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht das Papier nehmen, sonst entsteht eine dunkle Linie oder ein dunkler Punkt.
- **`--pa-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--pa-surface)`. Auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 `var(--pa-surface-raised)`.
- **`--pa-focus-gap`** ist `var(--pa-ground)`. bridge §18 löst die Lücke und die beiden Schatten `--pa-focus-shadow` / `--pa-focus-shadow-inset` auf den genannten Ebenen neu auf; `check-tokens.mjs` vergleicht die Formeln mit `scale.css`.
- **`--pa-raised-hover`** ist der Hover bzw. die Tastatur-Auswahl auf schwebenden Flächen (hell `#E6E8F0`, dunkel `#32325A`). `check-tokens.mjs` verlangt ≥ 1,15 : 1 gegen `--pa-surface-raised`.
- **Tiefe:** Schwebende Ebenen sind *gestapelte Bögen* – `--pa-float-shadow` = 1-px-Kante + harter Versatz in Tusche (10 %) + weicher Schatten. Nie auf dem Papier.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--pa-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte: 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Papier, Kopf, Navigation, Title Bar, Inhalt) · 7 Regionen · 8 Tabs · 9 Buttons · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Passer | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--pa-link-text)` (Tusche) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--pa-focus-ring-color)` | bridge §3 |
| `:root --ut-header-background-color` | `var(--pa-header-bg)` (Teal-Vollton) | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--pa-ink)` (Zähler in Tusche) | bridge §6 |
| `:root --a-menu-focused-background-color` | `var(--pa-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--pa-info)` (Violett) | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--pa-ink)` (Zähler in Tusche) | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--pa-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--pa-accent-text)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--pa-accent-tint)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--pa-accent-text)` (Häkchen `--pa-sheet`) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | `var(--pa-focus-ring-color)` / `var(--pa-soft)` / `var(--pa-soft)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-group input:checked + label, … radioButtonGroup …` | Teal-Vollton `--pa-accent*` + Pink-Platte `--a-button-*-shadow` | `components/buttons.css` |
| `… .t-Button--simple` / `--link` / `--noUI` | `var(--pa-accent-text)`, ohne Platte | `components/buttons.css` |
| `.t-Button--hot .fa:after, .t-Button--simple.t-Button--hot:hover .fa:after` | `var(--pa-accent)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | Druckmarke / `var(--pa-tint-hover) !important` | `components/shell.css` |

Laufzeit-Audit (`audit-blue.mjs`, §6): **0 Treffer** auf den Core-Seiten in hell und dunkel inkl. erzwungenem `:hover`/`:focus-visible` und geöffneten Menüs, Date Picker, Popup-LOV und Dialogen; `audit.mjs` über alle 111 Seiten: 0 Blau-Treffer.

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--pa-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--pa-focus-outline)` = `2px solid <Ring>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--pa-focus-ring-offset)` = `2px` | dito |
| `--ut-focus-outline` auf `.t-Header`, `.t-NavTabs`, Menüleiste | `2px solid var(--pa-header-text)` | Ring in Papierfarbe auf dem Teal-Kopf (Regel 7) |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--pa-focus-shadow-inset)` | Tree-Knoten |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 32 px | 40 px |
| `--a-field-input-padding-y` | dito | 32 px | 40 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--pa-row-h)` / `(row-h − row-lh − 1px) / 2` | 34 px | 40 px |
| `--a-gv-header-cell-height` | `var(--pa-head-h)` | 36 px | 40 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-xs − head-rule-width) / 2` | 36 px | 40 px |
| `--a-checkbox-size` | `var(--pa-checkbox-size)` | 18 px | 20 px |

### 4.4 Gestaltungsentscheidungen in der Brücke

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Palette | `--ut-palette-primary*` | `--pa-accent` / `-on` / `-tint` / `-text` | Primär = Teal |
| | `--ut-palette-primary-alt*` (`t-Button--primary`) | `--pa-accent-tint-2`, Schrift `--pa-ink` | leise Primäraktion als Tönung, ohne Platte |
| Sekundär-Buttons | `--a-button-background-color`, `-border-color` | `--pa-sheet`, `--pa-line-strong` | ein Bogen mit Kontur auf dem Papier; Hover `--pa-raised-hover`, Kante `--pa-edge` |
| Flächen | `--ut-body-background-color`, `--ut-body-main-background-color`, `--ut-body-nav-background-color` | `--pa-surface`, transparent, transparent | eine Papierfläche für alles; das Korn liegt einmal auf `body` |
| Daten | `--a-gv-background-color`, `--a-cv-background-color`, `--ut-component-background-color` | `--pa-sheet` | Daten liegen auf dem Bogen |
| Kopf | `--ut-header-background-color`, `--ut-header-menubar-background-color`, `--ut-navtabs-background-color` | `--pa-header-bg` | ein Teal-Band über die ganze Breite |
| Navigation | `--ut-body-nav-border-*` | 1 px `--pa-line` | Haarlinie als Fuge zwischen Navigation und Inhalt |
| Tabellenkopf | `--a-gv-header-background-color`, `--ut-report-header(-cell)-background-color` | `--pa-sheet` | Kopf auf dem Bogen, 2-px-Tusche-Grundlinie (reports.css) |
| Zebra | `--ut-report-cell-alt-background-color` | `--pa-sheet-stripe` | eine zarte Stufe auf dem Bogen statt der Rastertönung |
| Zähler | `--ut-navbar-button-badge-*`, `--a-button-count-*`, `--ut-treeview-badge-*` | Tusche; auf dem Kopf Papier | Zähler sind Information, keine Aktion |
| Seitentitel | `--ut-breadcrumb-title-font-size` / `-line-height` / `-font-weight` | 32/40, 760 | Plakat-Schnitt |
| Checked-Controls | `--a-checkbox-checked-background-color`, `--a-switch-checked(-hover)-background-color`, `--a-starrating-stars-fg-color` | `--pa-accent-text` | Marke ohne Schrift ≥ 3 : 1 |
| Date Picker | `--a-datepicker-calendar-day-current-*` (forms.css) | `--pa-marker` / `--pa-marker-text` | heute = gelber Marker, gewählt = Teal |
| Code | `--prism-*` (§17) | `--pa-code-*`, `--pa-muted`, `--pa-ink(-2)`, `--pa-danger-text` | statt VS-Code-Paletten |
| Markdown | `--a-md-h1…h6-*`, `--a-md-blockquote-*` | 20/28 · 16/24 · 14/20 · 13/20 · 12/16 · 12/16 | eine #-Überschrift im Feld bleibt kleiner als der Seitentitel |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--pa-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt. Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anlegen (in `light.css` **und** `dark.css`).
- Halbtransparente Überlagerungen (`--pa-tint-hover`, `--pa-header-hover` hell, `--pa-scrollbar-thumb`) sind Token-Werte, keine Regel-Werte. Nachts sind `--pa-header-hover`/`-press` deckend (dieselbe Mischung, vorab gerechnet): Eine Kopf-Taste deckt beim Überfahren das Halbton-Raster unter sich ab, statt es aufzuhellen.
- **Grund und Hover schwebender Ebenen (§3.6):** Aussparungen nehmen `--pa-ground`, Hover in schwebenden Ebenen `--pa-raised-hover`.
- **Papier oder Bogen?** Lesetext, Regionen, Navigation und Title Bar stehen auf dem Papier (`--pa-surface`); Tabellen, Karten, Felder und schwebende Ebenen sind Bögen (`--pa-sheet` / `--pa-surface-raised`). Klebende Flächen, unter denen Inhalt durchläuft (Title Bar, mobile Schublade), tragen Papier **und** Korn (`background-image: var(--pa-grain)`).

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Vorgehen: Selektor in `_reference/ut-26.1/css/Vita.css` (und `Vita-Dark.css`) suchen, **identische Selektorliste** übernehmen, nur die betroffenen Deklarationen mit Tokens neu setzen. Die Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen.

**Button-Zustände:** app_ui zeichnet die Kontur aus `--a-button-state-border-color` → `--a-button-type-border-color` → `--a-button-border-color`. Weil Sekundär-Buttons in Passer eine Kontur haben (`--pa-line-strong`, Hover `--pa-edge`), setzt jede Button-Variante **ohne** Fläche (noUI, Link, Icon-Knöpfe in Suchfeldern, Dialog-Schließen, Region-Schalter) auch `--a-button-hover-/active-/focus-border-color: transparent`.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen (Vita, UT Core, app_ui) – mit gleichem Selektor und Kommentar zur Quelle.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color … !important }` | shell.css (Hover und Druckmarke) |
| Vita | `.t-TreeNav--styleB … .is-current--top.is-hover { color / background-color … !important }` | shell.css |
| UT Core | `apex-core-font` an den Pflicht-Sternchen (`:after`) | forms.css |
| UT Core | `.u-color-N { --u-color: … !important }` | utilities.css |
| app_ui | `.a-IRR-dialogList a` Textfarbe/Hover | reports.css |
| app_ui | Farbwähler im IR-Filter, `.a-Customize-button.a-Button--hot:active`, `.fc .fc-helper` | reports.css, buttons.css, viz.css |

### 5.4 Lokale Komponenten-Tokens

- Name: **`--pa-c-<komponente>-<name>`** (z. B. `--pa-c-stamp-bg`, `--pa-c-tab-bar`, `--pa-c-empty-size`, `--pa-c-crop`). Das Präfix `--pa-c-` ist für lokale Tokens reserviert.
- Deklaration auf dem **Wurzel-Selektor der Komponente**, nie auf `:root`. Werte nur aus globalen Tokens oder Längen.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament.
- Ausnahme `--pa-c-shift`: lokal (Login), aber in base.css per `@property` registriert, weil `@property` nur global stehen kann.

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--pa-focus-ring-color` (hell `#00696F`, dunkel `#5ADCCD`), 2 px, 2 px Abstand – auf Papier, Bogen und Rastertönung ≥ 3 : 1. Der Abstand zeigt den Grund als Innenring.
- `base.css` zeichnet `:focus-visible` mit den Hooks, entfernt den Ring bei Maus-Fokus und lässt `tabindex="-1"` aus. Der Tastatur-Ring hat bewusst Spezifität **0,2,0**; wo Oracle den Fokus anders zeigt, nimmt die Komponente lokal `--ut-focus-outline: none` (Tree-Labels, Facetten-Optionen, IR-Dialogliste).
- **Komponenten ändern den Ring nur über die Hooks:** abgeschnittener Kontext → Ring nach innen (`--ut-focus-outline-offset: calc(-1 * var(--pa-focus-ring-width))` oder `--pa-focus-shadow-inset`); Felder → Kante in Ringfarbe + `--pa-focus-field-shadow`; Checkbox/Radio/Switch → Ring am sichtbaren Kästchen; Roving-Tabindex-Listen zeichnen den Ring selbst.
- Die **Pink-Platte ist nie Fokus.** Hot-Buttons behalten bei Tastatur-Fokus Platte **und** Ring (outline), die Druckmarke der Navigation Platte **und** Innenring.
- Visuell versteckte Formular-Eingaben zeichnen keinen eigenen Ring (base.css).

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe (Polster enthält den 1-px-Rand). Eigene Elemente: `min-block-size: var(--pa-control-h)` bzw. `var(--pa-row-h)`.
- Controls 32 px, Tabellenzeilen 34 px, Tabellenköpfe 36 px (`--pa-head-h`; gemessen mit Grundlinie im Tabellenrahmen: Classic Report 35, IG 36, IR 37 px); unter `pointer: coarse` automatisch 40 px. Trefferflächen kleiner Icon-Buttons ≥ `--pa-hit-min`.
- **Telefon (< 640 px):** Classic Report und IR setzen ihre Zellen im schmalen Schnitt (`--pa-stretch-narrow`) mit 8 px Seiten- und 6 px Höhenpolster; `block-size: var(--pa-row-h)` auf der Zelle hält die Zeilenhöhe als Mindestmaß (einzeilig 34 bzw. Touch 40 px, zweizeilig 53 statt 60–80 px). Lokale Tokens `--pa-c-cell-pad-x/-y` (reports.css §11). Das IG bleibt (feste Zeilen, scrollt waagerecht).

### 5.7 Typografie

- Nur die Skala: `--pa-fs-xs|head|sm|md|lg|xl|2xl|display` mit passender `--pa-lh-*`, Gewichte `--pa-fw-*` (400 · 500 · 620 · 680 · 760), Laufweite `--pa-tracking-*`, Breite `--pa-stretch-narrow` (88 %; der Login-Titel steht bei 86 %). Hilfsklassen `.ri-text-*` in `base.css`.
- **Rohe Überschriften** setzt base.css auf die Skala: `h1` 32/40 · `h2` 20/28 · `h3` 16/24 · `h4` 14/20 · `h5` 13/20 · `h6` 12/16.
- **Tabellenköpfe:** 12,5 px / 620 in Tusche, schmal (`--pa-stretch-narrow`), kein Kopfband, keine Versalien, darunter die 2-px-Tusche-Grundlinie.
- Zahlen in Spalten: `font-variant-numeric: tabular-nums` global für Tabellen, Grids, Badges, Pagination, Date Picker.
- **Nie Schrift-Eigenschaften auf JET-SVG-Text** (`.oj-dvtbase text`: kein `font-variant-numeric`, `letter-spacing`, `font-stretch`): JET misst Beschriftungen ohne diese Regeln und entscheidet danach über Drehen/Auslassen. Tabellenziffern machten die X-Achsen-Beschriftungen auf 1902 breiter als gemessen – sie liefen bei mittlerer Diagrammbreite ineinander. Schrift, Größe und Gewicht nur über die JET-Hebel der Brücke.
- **Monospace nur für Code** (`--pa-font-mono`), nie für Beschriftungen; keine ALL-CAPS-Labels. Labels immer linksbündig (forms.css).

### 5.8 Druckfarben, Passer, Status

- **Teal (`--pa-accent*`)** nur für: Primäraktion, Checked/Selected, Fokus, Druckmarke der Navigation, aktiven Reiter, Wizard-Schritt. `--pa-accent` für Flächen mit Schrift, `--pa-accent-text` für Marken im Vordergrund und Text.
- **Pink (`--pa-plate`)** nur als versetzter Farbauszug, als Halbton-Raster und als Datenfarbe. Stellen: Seitentitel und Logo (`text-shadow` um `--pa-passer-text` = 0,06 em; der Breadcrumb-Titel nur ab 640 px – darunter setzt UT ihn als 13-px-Breadcrumb-Eintrag, wo ein Versatz < 1 px wie unscharfe Schrift wirkt), Hot-Buttons (`--a-button-shadow` um `--pa-passer`, Hover `--pa-passer-hover`, gedrückt `--pa-passer-press` = in Passung + 1 px Nachrücken), Volltonbadges (1,5 px), Druckmarke der Navigation, aktiver Menüleisten- und NavTabs-Eintrag, Balken des aktiven Reiters, aktives Segment der Pill-Tabs (außerhalb der Kontur), Pink-Kante unter dem Kopf, Login. **Verboten** auf Fließtext, Feldern, in Tabellen (`.t-Report`, `.a-IRR`, `.a-GV`), Karten-Listen und dichten Listen (content.css nimmt die Badge-Platte dort weg).
- **Gelb (`--pa-marker*`)** nur für Textauswahl, `<mark>`, „heute“ (Date Picker, Kalender).
- **Halbton-Raster** (`radial-gradient` in `--pa-halftone-step`/`--pa-halftone-dot`): Kopf-Ende, Login, leere Zustände. Nie hinter Text in Tabellen. Am Kopf-Ende steht die Navbar-Schrift auf dem Raster: `--pa-header-dots` ist so gewählt, dass die Kopfschrift auch über einem vollen Punktkern (Überdruck, 90 % Maskendeckung) ≥ 4,5 : 1 hat – hell 13,7, dunkel 5,5 : 1; `check-tokens.mjs` rechnet das mit Hover und gedrückt nach („Kopf-Raster“, Maskendeckung aus shell.css gelesen).
- **Überdruck:** wo sich zwei Druckfarben tatsächlich überlagern, `mix-blend-mode: var(--pa-overprint)` in einer isolierten Ebene (`isolation: isolate`) – Kopf-Raster über Teal, Login-Scheiben.
- **Bewegung:** genau ein orchestrierter Moment – das Einrasten der Passung beim Laden der Login-Seite (`@keyframes ri-register`, 0,9 s, `--pa-ease-snap`), nur unter `prefers-reduced-motion: no-preference`. Sonst nur kurze Zustandswechsel (`--pa-duration` 0,12 s, bei reduzierter Bewegung 0 s).
- **Status:** Fläche `--pa-<s>` + Schrift `--pa-<s>-on`; Text auf Papier/Bogen `--pa-<s>-text`; Alert-Grund `--pa-<s>-tint`. Warnung nie in Danger-Farbe, Danger nie in Pink. **Empfehlung Freigeben/Ablehnen:** Hot (Freigeben) neben Danger **`--simple`** (Ablehnen).
- Pflichtfeld: `content: var(--pa-required-mark)` (Sternchen in Textschrift), `color: var(--pa-required-color)`.

### 5.9 RTL und Responsivität

- Logische Eigenschaften; wo UT physisch setzt, physisch überschreiben **und** `.u-RTL`-Variante liefern. Raster und Scheiben werden mit `:dir(rtl)` gespiegelt (Kopf-Raster, Login-Plakat).
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (nur lesen). Unter 640 px werden Innenabstände und Titelgrößen über Tokens kleiner.
- **Lese-Hebel `--js-sticky-top`:** Eigene klebende oder fixierte Elemente unter dem Kopf lesen ihn **immer mit Fallback**: `top: var(--js-sticky-top, 0px)` (mobile Schublade, rechte Spalte). Nie setzen (Regel 11).

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; CSS-`filter` auf großen oder scrollenden Flächen (Korn nur als Hintergrundbild); `background-attachment: fixed`; Bitmap-Texturen; Oracle-Blau, Vita-Werte kopieren; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `passer-auto.css`; eine Datei zweimal importieren; Pink als Schrift.

---

## 6. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`. Eigene Ausgabepfade unter `_tmp/passer/` verwenden.

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Passer` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Passer` und `node Passer/tools/lint-tokens.mjs` | „OK – keine Fehler“ |
| Token-Kontraste, Palette | `node Passer/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Passer --style light,dark --pages core --out _tmp/passer/shots` | ansehen (Read) |
| Nav aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | Druckmarke mit Pink-Platte |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 40 px) | Schublade über dem Inhalt |
| Auto-Äquivalenz | `THEME=Passer VERIFY_OUT=_tmp/passer/verify bash _tools/verify-auto.sh 1101,1201,1500,1601,1402,1410,3100` | alle `GLEICH 0 px` |
| UT 24.2 | `… --app 9242` bzw. `verify-auto.sh … 9242` | wie 26.1 |
| Oracle-Blau | `node _tools/audit-blue.mjs --theme Passer --pages core --styles light,dark --states --overlays --out _tmp/passer/audit-blue.json` | 0 Treffer |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Passer --style light,dark --pages all --out _tmp/passer/audit` | 0 Blau, 0 Überlauf, 0 JS; Kontrast nur Demo-CSS (§7) |
| Leistung Korn | Chrome-Trace beim Scrollen mit/ohne `--pa-grain` (Skript unter `_tmp/passer/scripts/perf2.mjs`) | kein messbarer Unterschied |
| Doku neu erzeugen | `node Passer/tools/build-architecture.mjs` | Tabellen = Quellen |
| README-Bilder | `node Passer/tools/screenshots.mjs` | `Passer/screenshots/*.webp` (PNG-Zwischenbilder in `_tmp/passer/readme-shots`) |

---

## 7. Bekannte Grenzen und offene Punkte

- **Kontrast-Befunde des Laufzeit-Audits** (302 über 111 Seiten × hell/dunkel) stammen ausschließlich aus fest eingefärbten Demo-Inhalten der Referenz-App: 6302 (Opacity-Beispiele `u-opacity-10…` auf `u-info`), 6303/6304/6400 (Klassen- und Code-Beispiele in `#008676` und `#9C27B0`; 6304 nur dunkel), 6307 (`#FF0000`) und 6100 (`.dm-Icon` in `#767676`). Ein Theme Style kann sie nur mit Eingriffen in das Demo-CSS der App beheben – das bleibt bewusst so. Text auf Fotos (3110, 3005, 423) wertet das Audit als „nicht bewertbar“, verborgene Carousel-Folien (1205) gar nicht. Ebenfalls Demo-CSS: Das Suchfeld der Icons-Seite 4000 ist per ID weiß gefärbt (`input#P4000_SEARCH { background: #fff }`) – im Dark-Style steht die helle Eingabe dort auf Weiß (wie in Vita-Dark); das Audit bewertet Eingabetext nicht.
- **Tritanopie:** Das Danger-Rot-Orange der Nacht (`#F46A4E`) und die Pink-Platte sind für Tritanope kaum unterscheidbar (ΔE00 2,0). Die Platte trägt nie Bedeutung, Danger immer ein Symbol oder Text.
- **Pink-Kante unter dem Kopf:** Seiten mit sehr hellen App-eigenen Flächen direkt unter dem Kopf zeigen die 2-px-Kante deutlicher; sie ist Teil des Druckbilds und über App-CSS abschaltbar (`.t-Header { box-shadow: none }`).
- **Body-Schriftgröße:** `--ut-base-font-size` ist 14 px (Vita 16 px).
- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Überdruck in Diagrammen** wurde bewusst nicht aktiviert: `mix-blend-mode` auf den Datenflächen ließe die 1-px-Fuge zwischen Balken- und Tortensegmenten verschwinden.
- **Breite Classic Reports:** Passer setzt an `.t-Report`, `.t-Report-wrap`, `.t-Report-tableWrap` und am Region-Körper kein `overflow: clip/hidden` (einzige Ausnahme: der Folien-Körper des Carousels, den UT ohnehin abschneidet). Waagerecht gescrollt wird wie im UT im Region-Körper mit *Body Overflow: Scroll* – geprüft mit 12 Zusatzspalten, Standard und `t-Report--stretch`, 1440 und 390 px, UT 26.1/24.2. *Hide* und Content Blocks haben – wie in Vita – keinen Scroll-Container (Telefon: UT schneidet am Formular ab). Der Bogen wächst mit: `.t-Report-tableWrap` ist `fit-content` mit `min-inline-size: 100%` – eine zu breite Tabelle zieht Bogenfläche und Abschluss-Haarlinie bis zur letzten Spalte, passende Tabellen bleiben pixelgleich (Core- und Report-Seiten, hell/dunkel, Desktop/Telefon).
- **Scrollbars:** `scrollbar-color` (vererbt) + `scrollbar-width: thin` für innere Container; die Seiten-Scrollbar bleibt normal breit. Die Navigation scrollt ohne sichtbare Leiste.
- **Bewusst entfallene Template-Option „Label Alignment: Right“:** Labels stehen immer linksbündig (forms.css).
- **Markdown im Chat** setzt eigene Größen (UT); sie bleiben der Chat-Komponente überlassen.
- **Theme-Variante (146):** vom Build erzeugt, der Installationstest in einer Wegwerf-App steht noch aus (docs/THEME-VARIANTE.md).
