# Orbit – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: die Bedienkonsole eines Raumschiffs – Kopf als dunkles Bedienfeld mit Skala, Regionen als Anzeige-Panels mit Haarlinie, Abschnitts-Labels in gesperrten Versalien, Kennzahlen wie Telemetrie. Dunkel „Konsole“ (tiefes Navy, Eisblau), hell „Kabine“ (Weiß und Kabinengrau, graphitgrauer Kopf, Navy-Tinte). Schrift Barlow und Barlow Semi Condensed.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Orbit/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

## Inhalt

0. [Die zwölf Regeln (Kurzfassung)](#0-die-zwölf-regeln-kurzfassung)
1. [Dateistruktur und Zuständigkeit](#1-dateistruktur-und-zuständigkeit)
2. [Ladereihenfolge](#2-ladereihenfolge)
3. [Token-System](#3-token-system)
4. [Brücke: was auf welche UT-Hebel zeigt](#4-brücke-was-auf-welche-ut-hebel-zeigt)
5. [Regeln für Komponenten-Dateien](#5-regeln-für-komponenten-dateien)
6. [Signatur-Elemente](#6-signatur-elemente)
7. [Test-Rezepte](#7-test-rezepte)
8. [Bekannte Grenzen](#8-bekannte-grenzen)

---

## 0. Die zwölf Regeln (Kurzfassung)

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--ob-*` oder aus UT-/APEX-Tokens, die die Brücke setzt. Masken zeichnen mit `currentColor` (nur die Deckkraft zählt).
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen.
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--ob-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--ob-c-*` auf dem Komponenten-Selektor (§5.4).
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui (TreeNav-Hover, Drawer-Geometrie, IR-Dialogliste …), mit gleichem Selektor und einem Kommentar zur Quelle (§5.3).
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** Ring = `--ob-focus-ring-color` (Eisblau bzw. Stahlpetrol), auf dem Bedienfeld `--ob-console-accent` (Fundament, bridge §19). Komponenten passen nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` an oder nehmen `--ob-focus-shadow*` (§5.5). Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--ob-control-h`, `--ob-row-h`, `--ob-head-h` ableiten (Desktop 32/34/36 px, Touch 40 px automatisch; §5.6).
9. **Marken-Disziplin:** `--ob-accent` ist die **eine gefüllte Taste** (Hauptaktion: dunkel Weiß mit Navy-Schrift, hell Navy mit Weiß). `--ob-accent-text` (Eisblau/Stahlpetrol) ist die **Marke**: Abschnitts-Labels, Fokus, Checked/Selected, die Kante am aktiven Nav-Eintrag und Reiter, Missionsfortschritt, Tankanzeigen. Nie als Fläche oder Dekoration. Zähler sind neutral, Daten nehmen Kategoriefarben (§5.8).
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--ob-header-h`). Skalen und Marken im Kopf sind absolut positionierte Pseudo-Elemente – sie ändern die gemessene Höhe nicht.
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§7).

---

## 1. Dateistruktur und Zuständigkeit

```
Orbit/
  theme.json                       Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta), Theme-Variante 147 [Fundament]
  assets/fonts/                    Barlow 300/400/500/600 + Barlow Semi Condensed 600, je latin + latin-ext, OFL-Lizenz [Fundament]
  assets/THIRD-PARTY-NOTICES.txt   Drittanbieter-Hinweise (Kartensymbole, UT-Delta)                           [Fundament]
  docs/ARCHITECTURE.md             dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)                      [Fundament]
  tools/check-tokens.mjs           Kontraste (auch Bedienfeld), Panel/Grund, Danger↔Hauptaktion, Palette (CVD, Marken-Abstand, Farbton), Oracle-Blau [Fundament]
  tools/build-architecture.mjs     baut docs/ARCHITECTURE.md (Tabellen aus gen-token-tables.mjs + check-tokens) [Fundament]
  tools/screenshots.mjs            Bilder für die README (screenshots/)
  src/
    orbit-light.css                Einstieg Light: tokens/light.css → index.css                                [Fundament]
    orbit-dark.css                 Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css  [Fundament]
    orbit-auto.css                 Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                                   (beide „screen and (prefers-color-scheme: dark)“) → index.css             [Fundament]
    index.css                      modusneutraler Kern: Reihenfolge aller Imports                            [Fundament]
    tokens/light.css               Farb-Tokens hell „Kabine“ – NUR :root, NUR --ob-* (+ --ut-color-scheme)   [Fundament]
    tokens/dark.css                Farb-Tokens dunkel „Konsole“ – exakt dieselben Namen wie light.css         [Fundament]
    tokens/scale.css               Maß-, Schrift-, Dichte-, Skalen-, Fokus-Geometrie-Tokens + < 640 px        [Fundament]
    tokens/print.css               Druck: Bedienfeld wird Papier, keine Skala, keine Schatten (nur „print“)   [Fundament]
    fonts.css                      @font-face „Orbit Sans“ (Barlow) und „Orbit Label“ (Barlow Semi Condensed) [Fundament]
    bridge.css                     --ob-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender
                                   Ebenen (§18), Fokus auf dem Bedienfeld (§19), pointer: coarse              [Fundament]
    base.css                       Schrift, Skala, h1–h6, Links, ::selection, Fokus, Scrollbars, tabular-nums, pre, Druck [Fundament]
    components/shell.css           Kopf (Bedienfeld + Skala), Tree Nav, Top-Menü, Tabs-Navigation, Mega Menu, Title Bar
                                   (Abschnitts-Label + Skala), RDS/Tabs, Spalten, Footer, mobile Schublade
    components/login.css           Login: Rundinstrument, gebogene Zeitleiste, Panel
    components/regions.css         Panels, Akzente (Statuslampe), Collapsible, Hero, Alert („Caution“), Button Container, Wizard, Carousel, Content Block
    components/buttons.css         umrandete Tasten, Hot (gefüllt), Status als Kontur, Gruppen, Zähler, Buttons in Feldern
    components/forms.css           Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker, Datei, RTE, Tankanzeige (Prozent)
    components/overlays.css        Menüs, Dialoge, Drawer, Popups, Tooltips, Seitenmeldungen, Spinner
    components/reports.css         Classic Report, Interactive Report und Grid (als Panels), Pagination, u-Report, List View
    components/search.css          Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css           Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css         Badges, Avatare, Template Components, Metric Card (Telemetrie), Badge List, Wizard Progress
    components/viz.css             Charts (JET), Kalender, Karte, Tree
    components/utilities.css       u-color-*, u-hot/u-success …, sonstige u-*-Klassen
```

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#orbit/orbit-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
Folge: Bei gleicher Spezifität gewinnt unser Bundle gegen alles von Oracle, App-/Seiten-CSS gewinnt gegen uns (gewollt: Apps bleiben übersteuerbar).

### 2.2 Im Bundle (verbindlich)

| # | Datei | Inhalt |
|---:|---|---|
| 1 | `tokens/light.css` **oder** `tokens/dark.css` | Farb-Tokens des Styles (Auto: hell, danach Delta + dunkel unter Media) |
| 2 | `tokens/scale.css` | Maße, Schrift, Dichte, Skala, Fokus-Geometrie, Mobil-Überschreibung |
| 3 | `fonts.css` | `@font-face` |
| 4 | `bridge.css` | Mapping auf UT/APEX/JET, schwebende Ebenen (§18), Bedienfeld (§19), `@media (pointer: coarse)` |
| 5 | `base.css` | globale Grundlagen, niedrige Spezifität (`:where`; Ausnahmen: Überschriften `h1`–`h6` 0,0,1 gegen die Element-Regeln aus UT Core, §5.7; Tastatur-Fokusring 0,2,0, §5.5) |
| 6–17 | `components/*.css` | in der Reihenfolge von `index.css`: shell, login, regions, buttons, forms, overlays, reports, search, cards, content, viz, utilities |
| 18 | `tokens/print.css` | nur `@media print` |

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `orbit-dark.css` die hellen Tokens zusätzlich unter `print`; Light braucht es nicht, Auto bekommt den hellen Druck über `screen and (…dark)`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`orbit-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (§7). Jede Regel, die nur in einem Modus greift, bricht diese Eigenschaft.

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--ob-surface`, `--ob-console`, `--ob-accent-text` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--ob-control-h`, `--ob-r-lg`, `--ob-tick-step` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--a-button-border-color: var(--ob-edge)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-TreeNav { --ob-c-nav-inset: .375rem }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--danger { --a-button-border-color: var(--ob-danger-text) }` | Komponenten |

Benennung: `--ob-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--ob-accent-text`, `--ob-soft-hover`, `--ob-console-muted`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

Die Namen der Flächen: **Grund** (`--ob-frame`: Seite, Navigation, Title Bar), **Panel** (`--ob-surface`: Regionen, Karten, IR/IG, aktiver Nav-Eintrag), **abgesenkt** (`--ob-surface-sunken`), **schwebend** (`--ob-surface-raised`), **Bedienfeld** (`--ob-console`: der Kopf, in beiden Modi dunkel).

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--ob-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--ob-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal. Ausnahmen, in denen das Fundament die Fokus-Tokens selbst neu auflöst: schwebende Ebenen (bridge §18, §3.6) und das Bedienfeld (bridge §19, §3.7).

### 3.2 Farb-Tokens (hell / dunkel)

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Flächen** | | | |
| `--ob-frame` | `#E9EDF1` | `#0A1424` | Grund: Kabinengrau – Seite, Navigation, Title Bar |
| `--ob-frame-hover` | `rgb(15 26 42 / .06)` | `rgb(238 243 248 / .06)` | Hover auf dem Grund |
| `--ob-frame-press` | `rgb(15 26 42 / .10)` | `rgb(238 243 248 / .10)` | gedrückt/aktiv auf dem Grund |
| `--ob-surface` | `#FFFFFF` | `#101D31` | Panel: Regionen, Karten, Tabellen; aktiver Nav-Eintrag |
| `--ob-surface-sunken` | `#F4F6F8` | `#0D192B` | abgesenkte Fläche: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Readonly |
| `--ob-surface-raised` | `#FFFFFF` | `#17263D` | schwebend: Menüs, Dialoge, Popups |
| `--ob-raised-hover` | `#E7ECF1` | `#22344F` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--ob-soft`/`--ob-hover`, die dort dunkel kaum sichtbar sind |
| `--ob-ground` | `var(--ob-surface)` | `var(--ob-surface)` | aktuelle Grundfläche: an der Wurzel das Panel, in Menüs, Dialogen, Popups und Seiten-Dialogen `--ob-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--ob-hover` | `#F1F4F7` | `#16253C` | Zeilen-/Listen-Hover im Panel |
| `--ob-press` | `#E7ECF1` | `#1B2B44` | gedrückt im Panel |
| `--ob-soft` | `#EBEFF3` | `#1C2C45` | neutrale Fläche: Chips, Zähler-Grund, aktiver Tab, Button-Hover |
| `--ob-soft-hover` | `#E0E6EC` | `#24354F` | neutrale Fläche Hover |
| `--ob-soft-press` | `#D5DDE5` | `#2B3D59` | neutrale Fläche gedrückt |
| `--ob-field` | `#FFFFFF` | `#0A1526` | Eingabefelder |
| `--ob-field-readonly` | `#F4F6F8` | `#0E1A2D` | schreibgeschützte Felder |
| `--ob-scrim` | `rgb(12 20 33 / .42)` | `rgb(2 6 14 / .66)` | Abdunklung hinter Dialogen/Schublade |
| `--ob-paper` | `#FFFFFF` | `#FFFFFF` | immer weiß, in beiden Modi: Grund für Codes |
| **Bedienfeld: Kopf (in beiden Modi dunkel)** | | | |
| `--ob-console` | `#1B2029` | `#060D19` | Graphit – Kopfzeile und Top-Menü |
| `--ob-console-ink` | `#F1F4F8` | `#EEF3F8` | App-Name, Kopf-Buttons |
| `--ob-console-muted` | `#A9B3C1` | `#97A6B8` | Nebentext im Kopf |
| `--ob-console-line` | `#3B4452` | `#26354B` | Unterkante des Kopfs |
| `--ob-console-tick` | `#5B6676` | `#3D4C62` | Teilstriche der Skala an der Kopfkante |
| `--ob-console-hover` | `rgb(241 244 248 / .10)` | `rgb(238 243 248 / .08)` | Hover auf dem Bedienfeld |
| `--ob-console-press` | `rgb(241 244 248 / .16)` | `rgb(238 243 248 / .14)` | gedrückt/aktiv auf dem Bedienfeld |
| `--ob-console-accent` | `#9FD3E8` | `#9FD3E8` | Fokus und Marke im Kopf: Eisblau |
| **Text** | | | |
| `--ob-ink` | `#0F1A2A` | `#EEF3F8` | Navy-Tinte: Text, Titel, Icons |
| `--ob-ink-2` | `#28364A` | `#C9D4E1` | Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute |
| `--ob-muted` | `#526074` | `#8C9FB4` | Stahlgrau: Sekundärtext, Tabellenköpfe |
| `--ob-placeholder` | `#5F6D81` | `#8094A9` | Platzhalter |
| `--ob-disabled` | `#8D99A8` | `#5A6778` | deaktivierte Beschriftung |
| `--ob-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--ob-on-light` | `#0F1A2A` | `#0F1A2A` | Text auf hellen Flächen |
| **Linien** | | | |
| `--ob-line-subtle` | `#E4E8ED` | `#1C2B41` | sehr zart: innere Trenner in Karten/Listen |
| `--ob-line` | `#D0D7DF` | `#2A3B53` | Haarlinie: Panel-Kante, Tabellenzeilen, Trenner |
| `--ob-line-strong` | `#B3BECA` | `#3E4E66` | kräftig: Skala, Container-Kanten |
| `--ob-edge` | `#737F8F` | `#687891` | Kante von Feldern und Buttons – WCAG 1.4.11 |
| `--ob-edge-hover` | `#525E6F` | `#8C9CB3` | Kante Hover |
| `--ob-head-rule` | `#8F9AA8` | `#5A6576` | Grundlinie unter Tabellenköpfen |
| **Akzent: Navy-Füllung für die Hauptaktion, Stahlpetrol für Marken** | | | |
| `--ob-accent` | `#15253D` | `#E6EEF6` | Fläche der Hauptaktion |
| `--ob-accent-hover` | `#24395A` | `#C9DCEA` | Primär-Fläche Hover |
| `--ob-accent-press` | `#0B1628` | `#B2CADE` | Primär-Fläche gedrückt |
| `--ob-accent-on` | `#FFFFFF` | `#0A1424` | Text/Icon auf Primär-Fläche |
| `--ob-accent-text` | `#1B6076` | `#9FD3E8` | Marke als Text/Kante: Labels, Fokus, Auswahl |
| `--ob-accent-tint` | `#E3EFF3` | `#15303F` | Auswahl-Fläche |
| `--ob-accent-tint-2` | `#CBE1E9` | `#1C3C4E` | kräftigere Auswahl, ::selection |
| `--ob-accent-ring` | `rgb(27 96 118 / .20)` | `rgb(159 211 232 / .28)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| **Fokus (ein System, überall >= 3:1)** | | | |
| `--ob-focus-ring-color` | `#1B6076` | `#9FD3E8` | Ring |
| `--ob-focus-gap` | `var(--ob-ground)` | `var(--ob-ground)` | Innenring/Lücke des Doppelrings (= `--ob-ground`: Panel, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Tinte mit Unterstrich, Hover-Unterstrich im Akzent** | | | |
| `--ob-link-text` | `#0F1A2A` | `#EEF3F8` | Linkfarbe im Fließtext (= Tinte) |
| `--ob-link-underline` | `#737F8F` | `#687891` | Unterstrich im Ruhezustand |
| `--ob-link-underline-hover` | `#1B6076` | `#9FD3E8` | Unterstrich bei Hover (Akzent) |
| **Textauswahl** | | | |
| `--ob-selection` | `#CBE1E9` | `#25495C` | ::selection-Hintergrund |
| `--ob-selection-text` | `#0F1A2A` | `#FFFFFF` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--ob-required-color` | `#B3261E` | `#FF9A94` | = Danger-Text |
| `--ob-success` | `#17754B` | `#4CC48E` | Erfolg: Fläche (Buttons, Badges) |
| `--ob-success-hover` | `#12613D` | `#6BD3A3` | Erfolg: Fläche Hover |
| `--ob-success-on` | `#FFFFFF` | `#0A1424` | Erfolg: Text/Icon auf der Fläche |
| `--ob-success-text` | `#146840` | `#6FD6A5` | Erfolg: Textfarbe auf Panel/Tönung |
| `--ob-success-tint` | `#E5F2EB` | `#112E2B` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ob-warning` | `#E9A21B` | `#F2B544` | Warnung: Fläche (Buttons, Badges) |
| `--ob-warning-hover` | `#F2B544` | `#F6C766` | Warnung: Fläche Hover |
| `--ob-warning-on` | `#0F1A2A` | `#0A1424` | Warnung: Text/Icon auf der Fläche |
| `--ob-warning-text` | `#85500A` | `#F4BF5C` | Warnung: Textfarbe auf Panel/Tönung |
| `--ob-warning-tint` | `#FCF1DC` | `#2A2518` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ob-danger` | `#C42B2B` | `#FF7A72` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--ob-danger-hover` | `#A82222` | `#FF968F` | Fehler/Gefahr: Fläche Hover |
| `--ob-danger-on` | `#FFFFFF` | `#0A1424` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--ob-danger-text` | `#B3261E` | `#FF9A94` | Fehler/Gefahr: Textfarbe auf Panel/Tönung |
| `--ob-danger-tint` | `#FBEBEA` | `#33191F` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ob-info` | `#1B6076` | `#7CC6DC` | Information: Fläche (Buttons, Badges) |
| `--ob-info-hover` | `#154C5E` | `#9AD4E6` | Information: Fläche Hover |
| `--ob-info-on` | `#FFFFFF` | `#0A1424` | Information: Text/Icon auf der Fläche |
| `--ob-info-text` | `#1B6076` | `#9FD3E8` | Information: Textfarbe auf Panel/Tönung |
| `--ob-info-tint` | `#E3EFF3` | `#13293A` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--ob-code-keyword` | `#6A3FB5` | `#C3AEFA` | Schlüsselwörter, Selektoren, Klassen: Violett |
| `--ob-code-string` | `#146840` | `#6FD6A5` | Zeichenketten: Grün |
| `--ob-code-number` | `#85500A` | `#F4BF5C` | Zahlen, Wahrheitswerte, Konstanten: Bernstein |
| **Tiefe** | | | |
| `--ob-panel-shadow` | `none` | `none` | Panels: nur Haarlinie, kein Schatten |
| `--ob-float-shadow` | `0 18px 44px -14px rgb(12 20 33 / .28), 0 2px 6px rgb(12 20 33 / .06), 0 0 0 1px rgb(12 20 33 / .08)` | `0 20px 48px -12px rgb(0 0 0 / .72), 0 0 0 1px rgb(238 243 248 / .10)` | Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – Panels bleiben flach |
| `--ob-tooltip-bg` | `#1B2029` | `#EEF3F8` | Tooltip-Fläche (invertiert) |
| `--ob-tooltip-text` | `#F1F4F8` | `#0A1424` | Tooltip-Text |
| **Scrollbars** | | | |
| `--ob-scrollbar-thumb` | `rgb(15 26 42 / .28)` | `rgb(238 243 248 / .24)` | Scrollbar-Daumen |
| `--ob-scrollbar-thumb-hover` | `rgb(15 26 42 / .45)` | `rgb(238 243 248 / .40)` | Scrollbar-Daumen Hover |
| `--ob-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Icons** | | | |
| `--ob-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (Stahlgrau, als Data-URI) |

**Designvorgaben, wie umgesetzt:**
- *Dunkel „Konsole“:* Grund `#0A1424` (tiefes Navy, keine Fast-Schwarz-Fläche), Panel `#101D31` eine Stufe heller (1,09 : 1). Das Panel trägt vor allem seine helle Haarlinie `#2A3B53` (1,5 : 1 gegen Grund und Panel). Der Kopf `#060D19` ist dunkler als der Grund – der Rahmen der Konsole.
- *Hell „Kabine“:* weiße Panels auf Kabinengrau `#E9EDF1` (1,18 : 1), Haarlinie `#D0D7DF`; der Kopf ist ein graphitgraues Bedienfeld `#1B2029`, die Schrift Navy-Tinte `#0F1A2A`.
- *Kein Oracle-Blau:* Navy-Flächen dürfen gesättigt sein, weil sie sehr dunkel sind. Linien und Stahlgrau im Bereich L 30–70 bleiben dagegen wenig gesättigt (Buntheit ≤ 13–18), sonst lägen sie näher als ΔE00 12 an `#045DAF`/`#309FDB`. Die Marke ist deshalb ein **Eisblau mit Cyan-Stich** (`#9FD3E8`, Farbton 233°) bzw. **Stahlpetrol** (`#1B6076`) – ein Stahlblau bei 260° wäre hell nicht möglich (ΔE00 < 10). `check-tokens.mjs` prüft alle Farb-Tokens und die abgeleiteten `--u-color-16…45`.
- *Hauptaktion:* dunkel eine weiße Fläche mit Navy-Schrift (15,8 : 1), hell Navy mit Weiß (15,4 : 1). Sie ist die einzige gefüllte Taste; alle anderen sind umrandet (Kante `--ob-edge` ≥ 3 : 1 auf Panel und Grund).
- *Missionskontrolle:* Grün nominal, Bernstein Vorsicht, Rot Halt. Danger ist gegen die Hauptaktion klar getrennt (hell ΔE00 42 / Protan 35 / Deutan 50, Helligkeit 2,7 : 1; dunkel 35 / 31 / 32, 2,2 : 1). Danger-Buttons sind Konturen („Halt-Taste“), nie Flächen.
- *Info* ist die Marke (Stahlpetrol bzw. Eis-Cyan): Hinweise sind Anzeigen, keine Aktion.
- *Code:* eigene Rollen-Tokens `--ob-code-keyword|string|number` (Violett, Grün, Bernstein), Kommentare `--ob-muted`, Namen `--ob-ink`/`--ob-ink-2` (bridge §17); alle ≥ 4,5 : 1 auf Panel, abgesenkt, Dialog und Feld.

### 3.3 Kategorie- und Diagrammpalette (`--ob-cat-*` → `--u-color-*`)

Kühle Instrumentenfarben – Eiscyan, Bernstein, Lila, Nominalgrün, Koralle, Stahl, Sand, Weinrot, Moos, Türkis, Glut, Schiefer (+ Pflaume, Nebel, Graphit ohne Chart-Serie). **Keine Vita-Farben, nichts in der Nähe von `#056AC8`/`#0572CE`.** Die Chart-Reihenfolge des UT (`.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`) ist berücksichtigt: die ersten Serien bleiben auch bei Farbfehlsichtigkeit unterscheidbar (Brettel/Viénot-Simulation, min. ΔE00 normal / Protan / Deutan / Tritan – erste 6 Serien hell 15,1 / 12,1 / 9,9 / 5,7, dunkel 13,8 / 12,5 / 6,8 / 6,0; erste 8 Serien hell 10,4 / 9,7 / 7,9 / 5,7, dunkel 11,5 / 5,4 / 6,8 / 6,0). Gegen das Panel: hell alle ≥ 3,08 : 1 (Serie 1–5 ≥ 3,23), dunkel alle ≥ 4,78 : 1 (die Prüfung in `check-tokens.mjs` verlangt mindestens 2,4 bzw. 3,3).

Zwei weitere Regeln prüft `check-tokens.mjs`:
- **Marken-Abstand:** Jede Kategorie liegt ≥ 10 ΔE00 von `--ob-accent` und `--ob-accent-text` (hell min. 11,3, dunkel 12,5 – beide Serie 1). Die Palette ist bewusst kühl, Serie 1 gehört zur Familie der Marke, liest sich aber nicht als Auswahl.
- **Gleiche Identität hell/dunkel:** Der HSL-Farbton einer Kategorie weicht zwischen den Modi um höchstens 25° ab (heute max. 5°).

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--ob-cat-1` | `#077F93` | `#FFFFFF` | `#40BFCC` | `#0A1424` | 1 | Eiscyan |
| 2 | `--ob-cat-2` | `#5F7228` | `#FFFFFF` | `#AFC06A` | `#0A1424` | 9 | Moos |
| 3 | `--ob-cat-3` | `#4F5B6E` | `#FFFFFF` | `#7D8BA1` | `#0A1424` | 6 | Stahl |
| 4 | `--ob-cat-4` | `#C08314` | `#0F1A2A` | `#F2B84B` | `#0A1424` | 2 | Bernstein |
| 5 | `--ob-cat-5` | `#1E9A86` | `#0F1A2A` | `#4FCBB6` | `#0A1424` | 10 | Türkis |
| 6 | `--ob-cat-6` | `#6B7482` | `#FFFFFF` | `#A3ACB8` | `#0A1424` | 12 | Schiefer |
| 7 | `--ob-cat-7` | `#7556C4` | `#FFFFFF` | `#A992F2` | `#0A1424` | 3 | Lila |
| 8 | `--ob-cat-8` | `#A88857` | `#0F1A2A` | `#D2BA86` | `#0A1424` | 7 | Sand |
| 9 | `--ob-cat-9` | `#1F6E47` | `#FFFFFF` | `#3FB27A` | `#0A1424` | 4 | Nominalgrün |
| 10 | `--ob-cat-10` | `#7A2F4B` | `#FFFFFF` | `#D06A8C` | `#0A1424` | 8 | Weinrot |
| 11 | `--ob-cat-11` | `#CC6A34` | `#0F1A2A` | `#F5A56E` | `#0A1424` | 11 | Glut |
| 12 | `--ob-cat-12` | `#D9677A` | `#0F1A2A` | `#F58A95` | `#0A1424` | 5 | Koralle |
| 13 | `--ob-cat-13` | `#5B3F6E` | `#FFFFFF` | `#A585B8` | `#0A1424` | – | Pflaume |
| 14 | `--ob-cat-14` | `#8A94A0` | `#0F1A2A` | `#B0B9C5` | `#0A1424` | – | Nebel |
| 15 | `--ob-cat-15` | `#3D4654` | `#FFFFFF` | `#7F8998` | `#0A1424` | – | Graphit |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Orbit ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--ob-cat-N) 60%, #fff)` mit Text `--ob-on-light`, 31–45 = `color-mix(in srgb, var(--ob-cat-N) 55%, #000)` mit Text `--ob-on-dark` (beide ≥ 5,4 : 1). Als Schrift (`.u-color-N-text`) mischt utilities.css so viel Tinte bei, dass jede Stufe in hell **und** dunkel ≥ 4,5 : 1 auf dem Panel erreicht (Tabelle dort; bei Palettenänderung neu rechnen).

### 3.4 Maß-, Schrift-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--ob-font` | `"Orbit Sans", "Barlow", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Schriftfamilie der gesamten Oberfläche (Barlow, dann System) |
| `--ob-font-label` | `"Orbit Label", "Barlow Semi Condensed", "Orbit Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` | Versal-Labels: Abschnitts-Label, Tabellenköpfe, App-Name, Metric-Card-Titel (Barlow Semi Condensed 600) |
| `--ob-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--ob-fw-light` | `300` | Telemetrie-Ziffern: Metric Cards, Badge-Listen, Login-Titel |
| `--ob-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--ob-fw-medium` | `500` | Labels, Buttons, Navigation |
| `--ob-fw-semibold` | `600` | Titel, aktive Einträge, Versal-Labels |
| `--ob-fw-bold` | `600` | „fett“ im Fließtext (<b>, <strong>) = Semibold (statischer Schnitt) |
| **Größen-Skala 12 · 13 · 14 · 16 · 20 · 28 · Telemetrie 36** | | |
| `--ob-fs-xs` | `.75rem` | 12  Klein: Hilfe, Badges, Zähler |
| `--ob-fs-sm` | `.8125rem` | 13  Tabellenzellen, Labels, Menüs klein |
| `--ob-fs-md` | `.875rem` | 14  UI, Fließtext, Felder, Buttons |
| `--ob-fs-lg` | `1rem` | 16  Region-Titel |
| `--ob-fs-xl` | `1.25rem` | 20  Abschnitt (Content Block h2) |
| `--ob-fs-2xl` | `1.75rem` | 28  Seitentitel |
| `--ob-fs-tele` | `2.25rem` | 36  Telemetrie-Wert (Metric Card, Badge-Liste), leicht (300) |
| `--ob-lh-xs` | `1rem` | zu 12 |
| `--ob-lh-sm` | `1.25rem` | zu 13 (Tabellenzellen 13/20) |
| `--ob-lh-md` | `1.25rem` | zu 14 |
| `--ob-lh-body` | `1.375rem` | zu 14 im Fließtext (Regionen, Content Blocks) |
| `--ob-lh-lg` | `1.5rem` | zu 16 |
| `--ob-lh-xl` | `1.75rem` | zu 20 |
| `--ob-lh-2xl` | `2.125rem` | zu 28 |
| `--ob-lh-tele` | `2.5rem` | zu 36 |
| `--ob-tracking-title` | `-.005em` | Seitentitel, Login-Titel |
| `--ob-tracking-heading` | `0em` | Region-/Abschnittstitel, h1–h4 |
| `--ob-tracking-ui` | `.01em` | Buttons |
| `--ob-fs-label` | `.75rem` | 12  Abschnitts-Label über dem Seitentitel, Metric-Card-Label |
| `--ob-lh-label` | `1rem` |  |
| `--ob-fs-head` | `.71875rem` | 11,5 Tabellenköpfe (Versalien) |
| `--ob-tracking-caps` | `.1em` | Sperrung der Versal-Labels |
| `--ob-tracking-head` | `.06em` | Sperrung der Tabellenköpfe (dichter) |
| **Geometrie: Konsole, Grund und Panels** | | |
| `--ob-page-pad-x` | `1.5rem` | Seiteninnenabstand waagerecht (Title Bar, Inhalt) |
| `--ob-page-pad-y` | `1.25rem` | Seiteninnenabstand senkrecht (Title Bar, Inhalt) |
| `--ob-panel-pad-x` | `1rem` | Innenabstand der Panels (Regionen, Karten) |
| `--ob-panel-pad-y` | `.875rem` |  |
| `--ob-r-lg` | `.5rem` | 8  Panels: Regionen, Tabellen, Karten, Menüs, Alerts |
| `--ob-r-md` | `.3125rem` | 5  Controls: Buttons, Felder, Nav-Einträge, Tabs |
| `--ob-r-sm` | `.1875rem` | 3  Checkbox, Badges, Chips |
| `--ob-r-dialog` | `.625rem` | 10 Dialoge/Drawer |
| `--ob-r-pill` | `62rem` | Pillen (Zähler, Avatare rund) |
| `--ob-header-h` | `3.5rem` | Kopfzeile (statisch – nie per JS/Font verändern) |
| `--ob-brand-lh` | `1.5rem` | feste Zeilenhöhe Logo/Branding: Font-Swap verschiebt nichts |
| `--ob-nav-w` | `15rem` | aufgeklappte Side-Navigation |
| `--ob-nav-rail-w` | `3.5rem` | eingeklappte Icon-Leiste (wie die Leiste einer Konsole) |
| `--ob-float-inset` | `.5rem` | Abstand schwebender Panels (Drawer) zum Fensterrand |
| **Skala: Teilstriche an der Kopfkante und unter dem Seitentitel** | | |
| `--ob-tick-step` | `.375rem` | 6 px zwischen zwei Teilstrichen |
| `--ob-tick-major` | `3.75rem` | 60 px: jeder zehnte Strich ist lang |
| `--ob-tick-h` | `.25rem` | 4 px kurzer Strich |
| `--ob-tick-h-major` | `.5rem` | 8 px langer Strich |
| `--ob-mark-w` | `2px` | Akzentkante: aktiver Nav-Eintrag, aktiver Tab, Menüleiste |
| **Abstände (4er-Raster)** | | |
| `--ob-space-1` | `.25rem` | 4 |
| `--ob-space-2` | `.5rem` | 8 |
| `--ob-space-3` | `.75rem` | 12 |
| `--ob-space-4` | `1rem` | 16 |
| `--ob-space-5` | `1.25rem` | 20 |
| `--ob-space-6` | `1.5rem` | 24 |
| `--ob-space-8` | `2rem` | 32 |
| `--ob-space-12` | `3rem` | 48 |
| `--ob-region-gap` | `1rem` | Abstand zwischen Regionen (→ --ut-region-margin) |
| **Dichte (Desktop 32 px; unter pointer: coarse 40 px – siehe bridge.css)** | | |
| `--ob-control-h` | `2rem` | Höhe Buttons, Felder, Selects, Pillen (inkl. Rand) |
| `--ob-control-h-sm` | `1.5rem` | kleine Buttons (t-Button--small), Toolbar-Icons |
| `--ob-control-h-lg` | `2.5rem` | große Buttons (t-Button--large), Login |
| `--ob-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--ob-control-pad-x` | `.75rem` | Innenabstand waagerecht (Felder); Buttons +2 px |
| `--ob-control-pad-y` | `calc((var(--ob-control-h) - var(--ob-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--ob-row-h` | `2.125rem` | Tabellenzeile 34 px inkl. Haarlinie |
| `--ob-row-lh` | `1.25rem` | Zeilenhöhe in Zellen (13/20) |
| `--ob-row-pad-x` | `.75rem` | Zellen-Innenabstand waagerecht |
| `--ob-row-pad-y` | `calc((var(--ob-row-h) - var(--ob-row-lh) - 1px) / 2)` | = 6,5 px |
| `--ob-head-h` | `2.25rem` | Tabellenkopf 36 px |
| `--ob-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.5rem |
| `--ob-checkbox-size` | `1.125rem` | Checkbox/Radio |
| `--ob-meter-h` | `.25rem` | dünne Balken wie Tankanzeigen: Fortschritt, Prozent, Meter |
| **Linien-Geometrie** | | |
| `--ob-hairline` | `1px` | Haarlinie: Panel-Kante, Zeilen, Trenner |
| `--ob-head-rule-width` | `1px` | Grundlinie unter Tabellenköpfen |
| `--ob-rule-strong` | `2px` | kräftige Linie (Summenzeile, betonte Köpfe) |
| **Fokus-Geometrie (Farben: --ob-focus-ring-color / --ob-focus-gap)** | | |
| `--ob-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--ob-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Innenring) |
| `--ob-focus-outline` | `var(--ob-focus-ring-width) solid var(--ob-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--ob-focus-shadow` | `0 0 0 var(--ob-focus-ring-offset) var(--ob-focus-gap), 0 0 0 calc(var(--ob-focus-ring-offset) + var(--ob-focus-ring-width)) var(--ob-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--ob-focus-gap` innen, Marke außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--ob-focus-shadow-inset` | `inset 0 0 0 var(--ob-focus-ring-width) var(--ob-focus-ring-color), inset 0 0 0 calc(var(--ob-focus-ring-width) + 1px) var(--ob-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--ob-focus-field-shadow` | `0 0 0 1px var(--ob-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--ob-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--ob-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--ob-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--ob-required-mark` | `"*"` | in Textschrift, nicht als Icon |
| `--ob-required-gap` | `.25rem` | Abstand Label-Text → Markierung |
| **Bewegung** | | |
| `--ob-duration` | `.12s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--ob-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| `--ob-sweep-duration` | `1.6s` | einzige Inszenierung: der Bogen des Login-Instruments läuft ein |
| **Mobil (< 640 px): kleinerer Seiteninnenabstand, engere Panels – Überschreibung `@media (max-width: 639px)`** | | |
| `--ob-page-pad-x` | `.75rem` | 12 px – Panel-Breite bei 390 px: 366 px |
| `--ob-page-pad-y` | `.75rem` | 12 px |
| `--ob-panel-pad-x` | `.75rem` | 12 px im Panel |
| `--ob-region-gap` | `.75rem` | 12 px zwischen Panels |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--ob-control-h 2.5rem`, `--ob-control-h-sm 2rem`, `--ob-control-h-lg 3rem`, `--ob-row-h 2.5rem`, `--ob-head-h 2.5rem`, `--ob-hit-min 2.5rem`, `--ob-checkbox-size 1.25rem`. Alle abgeleiteten Hebel rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): Grund und Bedienfeld werden Papier (`#FFF`, Kopfschrift Navy), Teilstriche transparent, `--ob-page-pad-x 0`, keine Schatten, kein Scrim; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Orbit/tools/check-tokens.mjs`).

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--ob-ink` / `--ob-surface` | Text auf Panel | 17.48 | 15.14 | 4.5 |
| `--ob-ink` / `--ob-frame` | Text auf Grund (Nav, Title Bar) | 14.86 | 16.52 | 4.5 |
| `--ob-ink` / `--ob-surface-sunken` | Text abgesenkt | 16.13 | 15.79 | 4.5 |
| `--ob-ink` / `--ob-surface-raised` | Text in Menü/Dialog | 17.48 | 13.62 | 4.5 |
| `--ob-ink` / `--ob-soft` | Sekundär-Button | 15.13 | 12.58 | 4.5 |
| `--ob-ink` / `--ob-soft-hover` | Sekundär-Button Hover | 13.90 | 11.08 | 4.5 |
| `--ob-ink` / `--ob-accent-tint` | Auswahl-Zeile | 14.90 | 12.32 | 4.5 |
| `--ob-ink` / `--ob-accent-tint-2` | Auswahl kräftig | 12.89 | 10.42 | 4.5 |
| `--ob-ink-2` / `--ob-surface` | Label | 12.23 | 11.26 | 4.5 |
| `--ob-ink-2` / `--ob-frame` | Nav-Text auf Grund | 10.40 | 12.29 | 4.5 |
| `--ob-muted` / `--ob-surface` | Sekundärtext | 6.39 | 6.23 | 4.5 |
| `--ob-muted` / `--ob-surface-sunken` | Sekundärtext abgesenkt | 5.90 | 6.49 | 4.5 |
| `--ob-muted` / `--ob-surface-raised` | Sekundärtext Menü | 6.39 | 5.60 | 4.5 |
| `--ob-muted` / `--ob-frame` | Sekundärtext Grund | 5.43 | 6.79 | 4.5 |
| `--ob-muted` / `--ob-hover` | Sekundärtext Zeilen-Hover | 5.79 | 5.67 | 4.5 |
| `--ob-ink` / `--ob-raised-hover` | Menüeintrag Hover/Fokus | 14.70 | 11.25 | 4.5 |
| `--ob-muted` / `--ob-raised-hover` | Tastenkürzel im Menü-Hover | 5.38 | 4.62 | 4.5 |
| `--ob-placeholder` / `--ob-field` | Platzhalter | 5.26 | 5.86 | 4.5 |
| `--ob-ink` / `--ob-field` | Feldtext | 17.48 | 16.38 | 4.5 |
| `--ob-ink` / `--ob-field-readonly` | Feldtext readonly | 16.13 | 15.62 | 4.5 |
| `--ob-link-text` / `--ob-surface` | Link | 17.48 | 15.14 | 4.5 |
| `--ob-accent-text` / `--ob-surface` | Akzent-Text Panel | 7.04 | 10.43 | 4.5 |
| `--ob-accent-text` / `--ob-surface-raised` | Akzent-Text Menü | 7.04 | 9.38 | 4.5 |
| `--ob-accent-text` / `--ob-frame` | Abschnitts-Label auf Grund | 5.99 | 11.38 | 4.5 |
| `--ob-accent-text` / `--ob-accent-tint` | Akzent-Text auf Tönung | 6.01 | 8.49 | 4.5 |
| `--ob-accent-on` / `--ob-accent` | Primär-Button | 15.40 | 15.75 | 4.5 |
| `--ob-accent-on` / `--ob-accent-hover` | Primär-Button Hover | 11.62 | 13.10 | 4.5 |
| `--ob-accent-on` / `--ob-accent-press` | Primär-Button gedrückt | 18.11 | 10.89 | 4.5 |
| `--ob-selection-text` / `--ob-selection` | ::selection | 12.89 | 9.61 | 4.5 |
| `--ob-required-color` / `--ob-surface` | Pflicht-Markierung | 6.54 | 8.29 | 4.5 |
| `--ob-required-color` / `--ob-surface-sunken` | Pflicht-Markierung abgesenkt | 6.03 | 8.65 | 4.5 |
| `--ob-tooltip-text` / `--ob-tooltip-bg` | Tooltip | 14.81 | 16.52 | 4.5 |
| `--ob-edge` / `--ob-surface` | Kante Feld/Button auf Panel (1.4.11) | 4.07 | 3.77 | 3 |
| `--ob-edge` / `--ob-frame` | Kante Button auf Grund (Title Bar) | 3.46 | 4.11 | 3 |
| `--ob-edge` / `--ob-surface-sunken` | Feldkante/abgesenkt | 3.76 | 3.93 | 3 |
| `--ob-edge` / `--ob-field` | Feldkante/Feld | 4.07 | 4.08 | 3 |
| `--ob-edge` / `--ob-surface-raised` | Feldkante/Dialog | 4.07 | 3.39 | 3 |
| `--ob-focus-ring-color` / `--ob-surface` | Fokus auf Panel | 7.04 | 10.43 | 3 |
| `--ob-focus-ring-color` / `--ob-frame` | Fokus auf Grund | 5.99 | 11.38 | 3 |
| `--ob-focus-ring-color` / `--ob-surface-sunken` | Fokus abgesenkt | 6.50 | 10.88 | 3 |
| `--ob-focus-ring-color` / `--ob-surface-raised` | Fokus in Menü/Dialog | 7.04 | 9.38 | 3 |
| `--ob-focus-ring-color` / `--ob-soft` | Fokus neben Sekundär-Button | 6.10 | 8.66 | 3 |
| `--ob-focus-ring-color` / `--ob-field` | Fokus-Feldkante/Feld | 7.04 | 11.29 | 3 |
| `--ob-focus-ring-color` / `--ob-focus-gap` | Doppelring innen/außen | 7.04 | 10.43 | 3 |
| `--ob-focus-ring-color` / `--ob-raised-hover` | Fokus-Innenring auf Menü-Hover | 5.93 | 7.75 | 3 |
| `--ob-accent-text` / `--ob-raised-hover` | Häkchen/Radio im Menü-Hover (Marke) | 5.93 | 7.75 | 3 |
| `--ob-link-underline` / `--ob-surface` | Link-Unterstrich | 4.07 | 3.77 | 3 |
| `--ob-link-underline` / `--ob-surface-sunken` | Link-Unterstrich abgesenkt | 3.76 | 3.93 | 3 |
| `--ob-link-underline-hover` / `--ob-surface` | Link-Unterstrich Hover | 7.04 | 10.43 | 3 |
| `--ob-console-ink` / `--ob-console` | App-Name/Kopf-Buttons | 14.81 | 17.43 | 4.5 |
| `--ob-console-muted` / `--ob-console` | Nebentext im Kopf | 7.71 | 7.84 | 4.5 |
| `--ob-console-ink` / `--ob-console-hover` | Kopf-Button Hover | 11.14 | 14.75 | 4.5 |
| `--ob-console-ink` / `--ob-console-press` | Kopf-Button aktiv | 9.17 | 12.37 | 4.5 |
| `--ob-console-accent` / `--ob-console` | Fokus/Marke im Kopf | 10.08 | 12.00 | 3 |
| `--ob-console-accent` / `--ob-console-press` | Marke auf aktivem Kopf-Eintrag | 6.24 | 8.52 | 3 |
| `--ob-accent` / `--ob-surface` | Hauptaktion: Fläche gegen Panel | 15.40 | 14.43 | 3 |
| `--ob-accent` / `--ob-frame` | Hauptaktion: Fläche gegen Grund | 13.09 | 15.75 | 3 |
| `--ob-accent-text` / `--ob-soft` | Marke auf neutraler Fläche (aktiver Tab) | 6.10 | 8.66 | 3 |
| `--ob-accent-text` / `--ob-hover` | Marke auf Zeilen-Hover (aktiver Nav-Eintrag) | 6.38 | 9.50 | 3 |
| `--ob-code-keyword` / `--ob-surface` | Code keyword (Panel) | 7.02 | 8.66 | 4.5 |
| `--ob-code-keyword` / `--ob-surface-sunken` | Code keyword (abgesenkt) | 6.48 | 9.03 | 4.5 |
| `--ob-code-keyword` / `--ob-surface-raised` | Code keyword (Dialog) | 7.02 | 7.79 | 4.5 |
| `--ob-code-keyword` / `--ob-field` | Code keyword (Markdown-Editor) | 7.02 | 9.37 | 4.5 |
| `--ob-code-string` / `--ob-surface` | Code string (Panel) | 6.81 | 9.53 | 4.5 |
| `--ob-code-string` / `--ob-surface-sunken` | Code string (abgesenkt) | 6.29 | 9.94 | 4.5 |
| `--ob-code-string` / `--ob-surface-raised` | Code string (Dialog) | 6.81 | 8.57 | 4.5 |
| `--ob-code-string` / `--ob-field` | Code string (Markdown-Editor) | 6.81 | 10.31 | 4.5 |
| `--ob-code-number` / `--ob-surface` | Code number (Panel) | 6.67 | 10.03 | 4.5 |
| `--ob-code-number` / `--ob-surface-sunken` | Code number (abgesenkt) | 6.16 | 10.46 | 4.5 |
| `--ob-code-number` / `--ob-surface-raised` | Code number (Dialog) | 6.67 | 9.02 | 4.5 |
| `--ob-code-number` / `--ob-field` | Code number (Markdown-Editor) | 6.67 | 10.85 | 4.5 |
| `--ob-muted` / `--ob-field` | Code-Kommentar (Markdown-Editor) | 6.39 | 6.74 | 4.5 |
| `--ob-danger-text` / `--ob-surface-raised` | Code gelöscht (diff) (Dialog) | 6.54 | 7.46 | 4.5 |
| `--ob-danger-text` / `--ob-field` | Code gelöscht (diff) (Markdown-Editor) | 6.54 | 8.97 | 4.5 |
| `--ob-success-on` / `--ob-success` | success-Fläche | 5.70 | 8.43 | 4.5 |
| `--ob-success-on` / `--ob-success-hover` | success-Fläche Hover | 7.49 | 10.08 | 4.5 |
| `--ob-success-text` / `--ob-surface` | success-Text Panel | 6.81 | 9.53 | 4.5 |
| `--ob-success-text` / `--ob-surface-sunken` | success-Text abgesenkt | 6.29 | 9.94 | 4.5 |
| `--ob-success-text` / `--ob-success-tint` | success-Text auf Tönung | 5.91 | 8.17 | 4.5 |
| `--ob-ink` / `--ob-success-tint` | Text auf success-Tönung | 15.17 | 12.98 | 4.5 |
| `--ob-warning-on` / `--ob-warning` | warning-Fläche | 8.03 | 10.07 | 4.5 |
| `--ob-warning-on` / `--ob-warning-hover` | warning-Fläche Hover | 9.55 | 11.66 | 4.5 |
| `--ob-warning-text` / `--ob-surface` | warning-Text Panel | 6.67 | 10.03 | 4.5 |
| `--ob-warning-text` / `--ob-surface-sunken` | warning-Text abgesenkt | 6.16 | 10.46 | 4.5 |
| `--ob-warning-text` / `--ob-warning-tint` | warning-Text auf Tönung | 5.96 | 9.05 | 4.5 |
| `--ob-ink` / `--ob-warning-tint` | Text auf warning-Tönung | 15.61 | 13.67 | 4.5 |
| `--ob-danger-on` / `--ob-danger` | danger-Fläche | 5.63 | 7.27 | 4.5 |
| `--ob-danger-on` / `--ob-danger-hover` | danger-Fläche Hover | 7.20 | 8.79 | 4.5 |
| `--ob-danger-text` / `--ob-surface` | danger-Text Panel | 6.54 | 8.29 | 4.5 |
| `--ob-danger-text` / `--ob-surface-sunken` | danger-Text abgesenkt | 6.03 | 8.65 | 4.5 |
| `--ob-danger-text` / `--ob-danger-tint` | danger-Text auf Tönung | 5.66 | 7.93 | 4.5 |
| `--ob-ink` / `--ob-danger-tint` | Text auf danger-Tönung | 15.13 | 14.47 | 4.5 |
| `--ob-info-on` / `--ob-info` | info-Fläche | 7.04 | 9.63 | 4.5 |
| `--ob-info-on` / `--ob-info-hover` | info-Fläche Hover | 9.43 | 11.36 | 4.5 |
| `--ob-info-text` / `--ob-surface` | info-Text Panel | 7.04 | 10.43 | 4.5 |
| `--ob-info-text` / `--ob-surface-sunken` | info-Text abgesenkt | 6.50 | 10.88 | 4.5 |
| `--ob-info-text` / `--ob-info-tint` | info-Text auf Tönung | 6.01 | 9.22 | 4.5 |
| `--ob-ink` / `--ob-info-tint` | Text auf info-Tönung | 14.90 | 13.38 | 4.5 |
| `--ob-surface` / `--ob-frame` | Panel gegen Grund | 1.18 | 1.09 | 1.08 |
| `--ob-line` / `--ob-frame` | Panel-Kante gegen Grund | 1.23 | 1.62 | 1.2 |
| `--ob-line` / `--ob-surface` | Panel-Kante gegen Panel | 1.45 | 1.49 | 1.2 |
| `--ob-line` / `--ob-surface` | Haarlinie | 1.45 | 1.49 | – |
| `--ob-line-strong` / `--ob-surface` | kräftige Linie | 1.89 | 2.00 | – |
| `--ob-head-rule` / `--ob-surface` | Tabellenkopf-Grundlinie | 2.85 | 2.86 | – |
| `--ob-soft` / `--ob-surface` | neutrale Fläche (Chips, aktiver Tab) | 1.16 | 1.20 | – |
| `--ob-raised-hover` / `--ob-surface-raised` | Hover auf schwebender Fläche | 1.19 | 1.21 | 1.15 |

**Paare außerhalb der Tabelle, die die Minima nicht erreichen** – Komponenten dürfen diese Kombinationen nicht erzeugen oder brauchen einen eigenen Token:
- `--ob-accent-text` (Stahlpetrol) **auf dem Bedienfeld** hell 2,4 : 1 – im Kopf gilt deshalb `--ob-console-accent` (Eisblau, ≥ 6 : 1), auch für den Fokusring (bridge §19).
- `--ob-warning` (Bernsteinfläche) als **Kante** gegen das helle Panel 2,1 : 1: Der „Caution“-Kasten trägt Titel, Text und Symbol in `--ob-warning-text` (≥ 5,9 : 1); die Kante ist Schmuck, nicht Träger der Information. Warn-**Buttons** nehmen die Kante `--ob-warning-text`.
- `--ob-muted` auf `--ob-soft-hover`/`--ob-soft-press` – Sekundärtext nie auf gedrückten/überfahrenen neutralen Flächen.
- `--ob-hover` bzw. `--ob-soft` als Hover **auf `--ob-surface-raised`** sind dunkel kaum sichtbar. In Menüs, Dialogen und Popups `--ob-raised-hover` verwenden (§3.6).

### 3.6 Grundfläche schwebender Ebenen (`--ob-ground`, `--ob-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--ob-surface-raised`, im Dunkeln heller als das Panel (`#17263D` gegen `#101D31`). Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht die Panel-Farbe nehmen.
- **`--ob-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--ob-surface)`. Auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 `var(--ob-surface-raised)`. Komponenten nehmen `--ob-ground` für Aussparungen (Haken im Wizard-Schritt, ausgestanzte Icon-Modifier).
- **`--ob-focus-gap`** ist `var(--ob-ground)`. bridge §18 löst die Lücke und die Schatten `--ob-focus-shadow` / `--ob-focus-shadow-inset` dort neu auf; `check-tokens.mjs` vergleicht die Formeln mit `scale.css`.
- **`--ob-raised-hover`** ist Hover und Tastatur-Auswahl auf schwebenden Flächen (Menüs, Date Picker, Mega Menu, Kartensteuerung); `check-tokens.mjs` verlangt ≥ 1,15 : 1 gegen `--ob-surface-raised`.

### 3.7 Bedienfeld (`--ob-console-*`)

Der Kopf (`.t-Header`: Branding-Zeile, Top-Menü) und die Tabs-Navigation (`.t-NavTabs`) sind in **beiden** Modi dunkel. Eigene Tokens: Fläche `--ob-console`, Schrift `--ob-console-ink`/`-muted`, Unterkante `--ob-console-line`, Teilstriche `--ob-console-tick`, Hover/gedrückt als halbtransparente Tönung, Marke/Fokus `--ob-console-accent` (Eisblau). bridge §19 setzt auf `.t-Header, .t-NavTabs` den Fokusring auf `--ob-console-accent`, die Lücke auf `--ob-console` und löst `--ob-focus-outline`/`-shadow(-inset)` neu auf. Menüs, die aus dem Kopf aufklappen, hängen an `<body>` und bekommen den normalen Ring der schwebenden Ebenen.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--ob-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte: 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Bedienfeld, Grund, Navigation, Title Bar, Inhalt) · 7 Regionen (Panels) · 8 Tabs · 9 Buttons (umrandet) · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen · 19 Bedienfeld · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Orbit | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--ob-link-text)` (Tinte) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--ob-focus-ring-color)` | bridge §3 |
| `:root --ut-header-background-color` | `var(--ob-console)` | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--ob-soft)` (Zähler neutral) | bridge §6 |
| `:root --a-menu-focused-background-color` | `var(--ob-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--ob-info)` | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--ob-soft)` | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--ob-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--ob-accent-text)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--ob-accent-tint)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--ob-accent-text)` (Häkchen in Panel-Farbe) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | `var(--ob-focus-ring-color)` / `var(--ob-soft)` / `var(--ob-soft)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-group input:checked + label, … radioButtonGroup …` | `var(--ob-accent)`, `-hover`, `-press`, Schrift `--ob-accent-on` | `components/buttons.css` |
| `… .t-Button--simple` / `--link` / `--noUI` | Kontur bzw. Schrift `var(--ob-accent-text)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | transparent / `var(--ob-frame-hover) !important` | `components/shell.css` |

Laufzeit-Audit (`audit-blue.mjs --pages core --states --overlays`): **0 Treffer** in hell und dunkel, inkl. erzwungenem `:hover`/`:focus-visible` und geöffneter Menüs, Date Picker, Popup-LOV und Dialoge.

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--ob-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--ob-focus-outline)` = `2px solid <Ring>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--ob-focus-ring-offset)` = `2px` | dito |
| `--a-combo-select-focus-outline(-color)`, `--a-combo-select-item-focus-outline-color` | Ring | Combobox |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--ob-focus-shadow-inset)` | Tree-Knoten |
| Fokus-Tokens auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget`, `.t-Dialog-page`, `.t-Drawer-page` | neu aufgelöst mit `--ob-ground: var(--ob-surface-raised)` | Lücke des Doppelrings = Dialogfläche (bridge §18) |
| Fokus-Tokens auf `.t-Header`, `.t-NavTabs` | Ring `--ob-console-accent`, Lücke `--ob-console` | Ring auf dem Bedienfeld ≥ 3 : 1 (bridge §19) |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `var(--ob-control-pad-y)` = `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 32 px | 40 px |
| `--a-field-input-padding-y` | dito | 32 px | 40 px |
| `--ut-pillbutton-padding-y` | dito | 32 px | 40 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--ob-row-h)` / `(row-h − row-lh − 1px) / 2` | 34 px | 40 px |
| `--a-gv-header-cell-height` | `var(--ob-head-h)` | 36 px | 40 px |
| `--ut-report-cell-padding-y` | `var(--ob-row-pad-y)` | 34 px | 40 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-xs − head-rule-width) / 2` | 36 px | 40 px |
| `--a-checkbox-size` | `var(--ob-checkbox-size)` | 18 px | 20 px |

### 4.4 Gestaltungsentscheidungen in der Brücke

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Grund und Panels | `--ut-body-main-background-color`, `--ut-region-*` | Grund `--ob-frame`, Regionen `--ob-surface` mit Haarlinie `--ob-line`, Radius 8 px, ohne Schatten | Anzeige-Panels einer Konsole |
| Kopf | `--ut-header-*`, `--ut-logo-*` | `--ob-console*`, Unterkante 1 px | dunkles Bedienfeld in beiden Modi |
| Buttons | `--a-button-*` | Fläche transparent, Kante `--ob-edge`, Hover `--ob-soft` | umrandete Tasten; nur Hot ist gefüllt |
| Palette | `--ut-palette-primary*` | `--ob-accent` / `-on` / `-tint` / `-text` | Primär = Hauptaktion |
| | `--ut-palette-primary-alt*` (`t-Button--primary`) | Kontur in der Marke (buttons.css) | leise Primäraktion |
| | `--ut-palette-generic*` | `--ob-soft` / `--ob-surface-sunken` / `--ob-ink` | neutral |
| Checked-Controls | `--a-checkbox-checked-background-color`, `--a-switch-checked(-hover)-background-color`, `--a-starrating-stars-fg-color` | `--ob-accent-text` | Marke ohne Schrift, ≥ 3 : 1 |
| Tankanzeige | `--a-percent-chart-*` | Füllung `--ob-accent-text`, Spur `--ob-soft`, Wert `--ob-ink` | dünner Balken, Wert darüber (forms.css) |
| Tabs/RDS | `--ut-tabs-item-active-highlight-color`, `-hint-highlight-width` | `--ob-accent-text`, `--ob-mark-w` (2 px) | Reiter mit Eis-Kante unten |
| Tabellenkopf | `--a-gv-header-*`, `--ut-report-header-*` | Fläche des Umfelds, Schrift `--ob-muted` | Versal-Label wie eine Telemetrie-Liste (reports.css) |
| Breadcrumb | `--ut-breadcrumb-item-*` | `--ob-accent-text`, 12 px, 600 | Abschnitts-Label über dem Titel (shell.css: Versalien, Sperrung) |
| Zähler | `--ut-navbar-button-badge-*`, `--a-button-count-*`, `--ut-treeview-badge-*` | Navbar Eisblau auf dem Bedienfeld, sonst `--ob-soft` | Zähler sind Information, keine Aktion |
| Code | `--prism-*` (§17) | `--ob-code-*`, `--ob-muted`, `--ob-ink(-2)` | statt der VS-Code-Paletten |
| Markdown | `--a-md-h1…h6-*` | 20/28 · 16/24 · 14/20 · 13/20 · 12/16 · 12/16 | nie größer als der Seitentitel |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--ob-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt. Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anlegen (in `light.css` **und** `dark.css`).
- Halbtransparente Überlagerungen (`--ob-frame-hover`, `--ob-console-hover`, `--ob-scrollbar-thumb`) sind Token-Werte, keine Regel-Werte.
- Grund und Hover schwebender Ebenen: `--ob-ground` und `--ob-raised-hover` (§3.6).

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Selektor in `_reference/ut-26.1/css/Vita.css` suchen, identische Selektorliste übernehmen, nur die betroffenen Deklarationen mit Tokens neu setzen. Die Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen (Vita, UT Core, app_ui), mit gleichem Selektor bzw. gleicher Spezifität und einem Kommentar zur Quelle.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important }` | shell.css (Hover und aktiver Eintrag) |
| Vita | `.t-TreeNav--styleB … .is-current--top.is-hover { color / background-color … !important }` | shell.css |
| UT Core | Drawer-Geometrie (`.t-Drawer…`/`.ui-dialog--drawer` Größen, Inset, Radius) | overlays.css (Drawer als schwebendes Panel) |
| UT Core | `apex-core-font` an den Pflicht-Sternchen | forms.css |
| UT Core | `.u-color-N { --u-color: … !important }` | nur am selben Element übersteuerbar (utilities.css) |
| app_ui | `.a-IRR-dialogList a`, Farbwähler im IR-Filter, `.a-Customize-button.a-Button--hot:active`, `.fc .fc-helper` | reports.css, buttons.css, viz.css |

`node _tools/lint.mjs Orbit` zählt die Vorkommen je Datei als Hinweis.

### 5.4 Lokale Komponenten-Tokens

- Name: **`--ob-c-<komponente>-<name>`** (z. B. `--ob-c-nav-inset`, `--ob-c-irr-pad`, `--ob-c-dial`). Das Präfix `--ob-c-` ist für lokale Tokens reserviert.
- Deklaration auf dem **Wurzel-Selektor der Komponente**, nie auf `:root`. Werte nur aus globalen Tokens oder Längen.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament. Einzige registrierte Eigenschaft: `--ob-c-sweep` (`@property`, Winkel des Login-Bogens, login.css).

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--ob-focus-ring-color`, 2 px, 2 px Abstand – auf Panel **und** Grund, hell und dunkel ≥ 3 : 1 (Tabelle §3.5). Der Abstand zeigt den Grund als Innenring, auch auf der gefüllten Hauptaktion. Auf dem Bedienfeld gilt §3.7.
- `base.css` zeichnet `:focus-visible` mit den Hooks, entfernt den Ring bei Maus-Fokus und lässt `tabindex="-1"` aus (wie UT); Spezifität 0,2,0, damit auch Oracle-Regeln geschlagen werden, die den Umriss unterdrücken. Wo Oracle den Fokus anders zeigt (Tree-Zeilen, Facetten-Kästchen, IR-Dialoglisten), nimmt die Komponente den Doppelring lokal mit `--ut-focus-outline: none` weg.
- Komponenten ändern den Ring nur über die Hooks: im abgeschnittenen Kontext nach innen (`--ut-focus-outline-offset: calc(-1 * var(--ob-focus-ring-width))` oder `--ob-focus-shadow-inset`), Felder mit Kantenfarbe + `--ob-focus-field-shadow`, Checkbox/Radio/Switch am sichtbaren Kästchen, Roving-Tabindex-Listen am `.is-focused`-Eintrag.
- Die Suche von IR und IG ist EIN Feld (Spaltenwahl | Eingabe | Go); „Go“ zeigt den Fokus als Innenring (`--ob-focus-shadow-inset`), weil das Feld abschneidet.
- Nie `outline: none` ohne gleichwertigen Ersatz.

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe (app_ui-Konvention: Polster enthält den 1-px-Rand). Eigene Elemente: `min-block-size: var(--ob-control-h)` bzw. `var(--ob-row-h)`.
- Controls 32 px, Tabellenzeilen 34 px, Tabellenköpfe 36 px; unter `pointer: coarse` automatisch 40 px. Trefferflächen kleiner Icon-Buttons ≥ `--ob-hit-min`.
- Menüleiste und Tabs-Navigation im Kopf sind 48 px hoch: unter dem Text liegen Eis-Kante und Skala.

### 5.7 Typografie

- Zwei Familien aus einer Superfamilie: **„Orbit Sans“** (Barlow 300/400/500/600) für alles, **„Orbit Label“** (Barlow Semi Condensed 600) nur für Versal-Labels. Barlow ist statisch; `font-weight` 600–700 zeigen auf den 600er-Schnitt (keine synthetische Fettung).
- Skala 12 · 13 · 14 · 16 · 20 · 28 · Telemetrie 36 (`--ob-fs-*`), Versal-Labels 12 (`--ob-fs-label`, Sperrung `--ob-tracking-caps` .1em) und Tabellenköpfe 11,5 (`--ob-fs-head`, `--ob-tracking-head` .06em).
- **Versalien nur mit Bedeutung:** App-Name, Abschnitts-Label (Breadcrumb), Tabellenköpfe, Metric-Card-Titel, Kategorien im Mega Menu. Region-Titel, Formular-Labels, Buttons und Navigation bleiben in normaler Schreibung.
- **Telemetrie:** Kennzahlen (Metric Card, Badge List, Login-Titel) in Barlow 300 mit Tabellenziffern.
- Rohe Überschriften (Static Content, Rich Text) setzt base.css auf die Skala: `h1` 28/34 · `h2` 20/28 · `h3` 16/24 · `h4` 14/20 · `h5` 13/20 · `h6` 12/16.
- `font-variant-numeric: tabular-nums` global für Tabellen, Grids, Badges, Pagination, Date Picker, Zahlenfelder, Metric Cards.
- Monospace nur für Code (`--ob-font-mono`), nie als Dekoration.
- Labels immer linksbündig (forms.css); die Template-Option „Label Alignment: Right“ entfällt bewusst.

### 5.8 Links, Marke, Status

- `base.css` stylt nur **Links ohne Klasse**: Tinte, Unterstrich `--ob-link-underline`, Hover-Unterstrich in der Marke.
- **Welcher Akzent-Token?**
  - `--ob-accent` (+ `-hover`/`-press`, Schrift `--ob-accent-on`): nur die gefüllte Hauptaktion und der gewählte Tag im Date Picker.
  - `--ob-accent-text`: alles, was als **Marke** erkennbar sein muss – Abschnitts-Label, Fokusring, Checkbox/Radio checked, Switch-Spur, Sterne, Kante am aktiven Nav-Eintrag, Reiter und Menüeintrag, Missionsfortschritt (Wizard), Tankanzeige, Spinner.
  - `--ob-accent-tint`/`-tint-2`: gewählte Zeilen und Menüeinträge, `::selection`, Hover der Primary-Kontur.
- **Zähler** sind neutral (`--ob-soft` + `--ob-ink`), im Kopf Eisblau. **Daten** (Charts, Avatare, Akzent-Regionen) nehmen Kategoriefarben, nie die Marke.
- **Status:** Buttons als Kontur in `--ob-<s>-text`, Hover mit `--ob-<s>-tint`; Alerts als umrandeter Kasten (Kante `--ob-<s>`, Titel `--ob-<s>-text`, mit „Highlight Background“ die Tönung); Warnungen komplett in Bernstein („Caution“). Badges bleiben Flächen (`--ob-<s>` + `--ob-<s>-on`).
- **Freigeben/Ablehnen:** Hot (gefüllt) neben Danger (rote Kontur) – nie zwei gefüllte Tasten nebeneinander.
- Pflichtfeld: Sternchen in Textschrift in `--ob-required-color`.

### 5.9 RTL und Responsivität

- Logische Eigenschaften; wo UT physisch setzt, physisch überschreiben **und** `.u-RTL`-Variante liefern. Die Skala unter der Title Bar wird in RTL gespiegelt.
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (`--js-mq-*`, nur lesen). Seiten- und Panel-Innenabstand werden unter 640 px über Tokens schmal.
- **Lese-Hebel `--js-sticky-top`:** theme42.js misst `#t_Header` und schreibt die Höhe an `<html>`. Eigene sticky/fixierte Elemente lesen ihn immer mit Fallback (`var(--js-sticky-top, 0px)`, mobile Schublade, rechte Spalte); wo 0 px unter den Kopf rutschen ließe, mindestens `--ob-header-h` (Seitenmeldungen). Nie setzen.

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; Bitmap-Texturen und Bilder; Leuchteffekte auf Text; Oracle-Paletten; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `orbit-auto.css`; eine Datei zweimal importieren; mehr als eine Inszenierung (Animation) je Seite.

---

## 6. Signatur-Elemente

| Element | Umsetzung | Datei |
|---|---|---|
| Bedienfeld mit Skala | `.t-Header::after`: zwei `repeating-linear-gradient` (Striche alle 6 px, jeder zehnte lang) über den unteren 8 px, absolut positioniert – ohne Einfluss auf die gemessene Kopfhöhe | shell.css §1 |
| App-Name | Barlow Semi Condensed 600, Versalien, Sperrung .1em | shell.css §1 |
| Abschnitts-Label + Titel | Breadcrumb in Versalien und in der Marke, Trenner „/“, darunter der Seitentitel 28/34 | shell.css §6 |
| Messleiste unter der Title Bar | `.t-Body-title::after`: Haarlinie mit Teilstrichen im Seiteninnenabstand | shell.css §6 |
| Konsolen-Leiste | Tree Nav auf dem Grund, Icon-Leiste 56 px; aktiver Eintrag = Stück Panel mit Haarlinie und 2-px-Eiskante | shell.css §2 |
| Eis-Kante | aktiver Reiter (Tabs, RDS), Menüleiste und Tabs-Navigation im Kopf (über der Skala) | shell.css §3, §7 |
| Anzeige-Panels | Regionen, IR, IG, Cards, Wizard, Content Block „Light“ | regions.css, reports.css, cards.css |
| Statuslampe | Akzent-Regionen: 10-px-Kreis in der Kategoriefarbe vor dem Titel | regions.css §1 |
| Caution-Kasten | Alert „Warning“: Bernstein-Kante, Titel und Text in Bernstein | regions.css §4 |
| Umrandete Tasten, Halt-Taste | alle Buttons umrandet, nur Hot gefüllt; Danger als rote Kontur | buttons.css |
| Telemetrie | Metric Card: Versal-Titel, Wert 36 px/300 in Tabellenziffern; Badge List: leichte Ziffern im Ring | content.css §8, §10 |
| Tankanzeige | Prozentgrafik als 4-px-Spur mit Füllung in der Marke, Wert darüber | forms.css §11 |
| Missionsfortschritt | Wizard Progress: erledigte Punkte gefüllt in der Marke, zurückgelegte Strecke in der Marke | content.css §12 |
| Rundinstrument (Login) | `.t-Login-bg::before/::after`, `.t-Login-bgImg::before/::after`: Ringe, Teilstriche (`repeating-conic-gradient` + radiale Masken), Fadenkreuz, Bogen in der Marke mit Punkt an der Spitze (Position per `sin()`/`cos()`), gebogene Zeitleiste mit Ereignispunkten; der Bogen läuft beim Laden in 1,6 s ein (`@property --ob-c-sweep`), nicht bei `prefers-reduced-motion` | login.css |

---

## 7. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`.

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Orbit` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Orbit` | 0 Fehler (Hinweise prüfen) |
| Token-Kontraste, Palette | `node Orbit/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Orbit --style light,dark --pages core --out _tmp/orbit/<ordner>` | ansehen |
| Nav aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | Panel-Stück mit Eiskante |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 40 px) | Seiteninnenabstand 12 px, Schublade über dem Inhalt |
| Auto-Äquivalenz | `THEME=Orbit VERIFY_OUT=_tmp/orbit/verify bash _tools/verify-auto.sh [seiten] [app]` | alle `GLEICH 0 px` |
| UT 24.2 | `… verify-auto.sh core 9242`, Screenshots mit `--app 9242` | `GLEICH` |
| Oracle-Blau | `node _tools/audit-blue.mjs --theme Orbit --pages core --styles light,dark --states --overlays` | 0 Treffer |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Orbit --style light,dark --pages all --out _tmp/orbit/audit [--mobile] [--app 9242]` | kein Blau, kein Überlauf, keine Skriptfehler; Kontrast nur Demo-CSS |
| Fokus | Skript mit `launchLab` aus `_tools/lib/lab.mjs`: einmal `Tab`, dann `el.focus()`, Ausschnitt fotografieren | Ring sichtbar, genau einer |
| Doku neu erzeugen | `node Orbit/tools/build-architecture.mjs` | Tabellen = Quellen |
| README-Bilder | `node Orbit/tools/screenshots.mjs` | `Orbit/screenshots/*.png` |

---

## 8. Bekannte Grenzen

- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Barlow ist statisch:** Gewichte 300/400/500/600 liegen als eigene Dateien vor (je latin, latin-ext nur bei Bedarf). Fett (`<b>`) zeigt den 600er-Schnitt; Kursiv wird vom Browser schräggestellt.
- **Login-Instrument:** braucht CSS-Trigonometrie (`sin()`/`cos()`) und `@property` – in aktuellen Browsern vorhanden. Ohne `@property` steht der Bogen sofort vollständig; ohne Trigonometrie fehlen der Punkt an der Bogenspitze und die Ereignispunkte der Zeitleiste, Ringe und Skala bleiben.
- **Bild-Hintergründe der Login-Seite** (Template-Optionen „Background 1–3“) werden durch das Instrument ersetzt; eine Image Region im Login-Hintergrund liegt weiter darüber.
- **Druck:** hell, ohne Bedienfeld, Skalen und Schatten; Vita-Dark-Werte, die die Brücke nicht setzt (Chat, Diagramm), bleiben im Druck des Dark-Styles dunkel.
- **Regionen ohne Rahmen:** Regionen mit „Remove UI Decoration“ liegen – wie gewollt – ohne Panel auf dem Grund. Interactive Report und Grid in einer solchen Region sind selbst ein Panel.
- **Bewusst entfallene Template-Option „Label Alignment: Right“:** Labels stehen immer linksbündig.
