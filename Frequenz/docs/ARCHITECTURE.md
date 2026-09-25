# Frequenz – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: weiße Seite, hellgraue Tafeln mit großen Radien, ein Magenta-Block oben links, der den App-Namen trägt; kräftige Überschriften in Onest (800), Kontur-Buttons mit 4 px Radius, runde Icon-Buttons, eine Magenta-Kante am aktiven Navigationspunkt. Dunkel: Schwarz mit grauen Tafeln.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Frequenz/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

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

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--fq-*` oder aus UT-/APEX-Tokens, die die Brücke setzt. `color-mix()` nur mit Tokens.
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen.
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--fq-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--fq-c-*` auf dem Komponenten-Selektor (§5.4). Geprüft von `Frequenz/tools/lint-tokens.mjs`.
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui (TreeNav-Hover, Drawer-Radius, IR-Dialogliste …), mit gleichem Selektor und einem Kommentar zur Quelle (§5.3).
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** Ring in Anthrazit (dunkel: fast Weiß), 2 px, 2 px Abstand; nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` lokal anpassen oder `--fq-focus-shadow*` verwenden (§5.5). Einzige Ausnahme: im Magenta-Block ein weißer Ring nach innen. Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--fq-control-h`, `--fq-row-h`, `--fq-head-h` ableiten (Desktop 36/36/40 px, Touch 44 px automatisch; §5.6).
9. **Magenta-Disziplin:** Magenta ist die Marke (Block oben links, Login) und markiert Primäraktion (Hot als Fläche, Typ *Primary* als Kontur), Auswahl (Checkbox, Radio, Schalter, Segment der Radio-Gruppe, Sterne) und den aktuellen Ort (Navigation, Tabs, Wizard-Schritt, „heute“). `--fq-accent` für Flächen und Marken, `--fq-accent-text` nur für Magenta-*Schrift* (§5.8). Links sind Petrol, Fokus ist Anthrazit, Daten sind Kategoriefarben.
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--fq-header-h`, mobil kleiner über `scale.css`).
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§6).

---

## 1. Dateistruktur und Zuständigkeit

```
Frequenz/
  theme.json                   Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta); Theme-Variante 144
  assets/fonts/                Onest latin + latin-ext (variabel, wght 100–900) + OFL-Lizenz
  assets/THIRD-PARTY-NOTICES.txt  Drittanbieter-Hinweise: MapLibre-Lizenztext (BSD-3-Clause, Kartensymbole), UT-Delta (Auto)
  docs/ARCHITECTURE.md         dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)
  docs/THEME-VARIANTE.md       Theme-Variante (Theme 144)
  tools/check-tokens.mjs       Kontraste, Danger↔Magenta, Palette (CVD, Magenta-Abstand, Farbton), Oracle-Blau
  tools/check-refs.mjs         undefinierte --fq-*-Verweise
  tools/lint-tokens.mjs        Token-Regeln für --fq-* als Einzelprüfung (dieselben Regeln prüft _tools/lint.mjs über "tokenPrefix")
  tools/gen-color-text.mjs     Mischanteile für .u-color-N-text (utilities.css §2)
  tools/gen-token-tables.mjs   Token-Tabellen für dieses Dokument
  tools/build-architecture.mjs baut docs/ARCHITECTURE.md
  tools/screenshots.mjs        Vorschaubilder für die README
  src/
    frequenz-light.css         Einstieg Light: tokens/light.css → index.css
    frequenz-dark.css          Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css
    frequenz-auto.css          Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                               (beide „screen and (prefers-color-scheme: dark)“) → index.css
    index.css                  modusneutraler Kern: Reihenfolge aller Imports
    tokens/light.css           Farb-Tokens hell   – NUR :root, NUR --fq-* (+ --ut-color-scheme)
    tokens/dark.css            Farb-Tokens dunkel – exakt dieselben Namen wie light.css
    tokens/scale.css           Maß-, Schrift-, Radius-, Dichte-, Fokus-Geometrie-Tokens (modusneutral) + < 640 px
    tokens/print.css           Druck: Tafeln weiß, Schatten weg (nur unter „print“ geladen)
    fonts.css                  @font-face „Frequenz Sans“ (Onest)
    bridge.css                 --fq-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender Ebenen, pointer: coarse
    base.css                   Schrift, h1–h6, Links, ::selection, Fokus, Scrollbars, tabular-nums, pre, Druck
    components/shell.css       Kopf mit Magenta-Block, Tree Nav mit Magenta-Kante, Menüleiste, Tabs-Navigation,
                               Mega Menu, Spalten, Footer, Title Bar, Breadcrumb, RDS/Tabs, mobile Schublade
    components/login.css       Login (Karte mit Magenta-Kopf; geteilte Ansicht mit Markenfläche --fq-brand-area)
    components/regions.css     Tafeln (Standard-Region, Akzente, Collapsible), Hero, Alert, Button Container, Carousel,
                               Tabs Container, Wizard, Content Block, Image Region
    components/buttons.css     t-Button/a-Button/ui-button, Hot/Primary/Status, Icon-Buttons rund, Gruppen, Radio-Gruppe als Segmentleiste
    components/forms.css       Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker, Datei, RTE, Validierung
    components/overlays.css    Menüs, Dialoge, Drawer, Popups, Tooltips, Seitenmeldungen, Spinner
    components/reports.css     Classic Report, Interactive Report, Interactive Grid, Pagination, u-Report, List View, AVP
    components/search.css      Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css       Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css     Badges, Avatare, Template Components, Links-Liste, Media List, Timeline, Comments, Metric Card
    components/viz.css         Charts (JET), Kalender, Karte, Tree
    components/utilities.css   u-color-*, u-hot/u-success …
```

Frequenz entstand als Kopie von Passepartout (`node _tools/new-theme.mjs`); Aufbau, Brücke und Prüfwerkzeuge sind geerbt, Gestalt, Tokens und Shell sind neu.

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#frequenz/frequenz-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
Folge: Bei gleicher Spezifität gewinnt unser Bundle gegen alles von Oracle, App-/Seiten-CSS gewinnt gegen uns (gewollt: Apps bleiben übersteuerbar).

### 2.2 Im Bundle (verbindlich)

| # | Datei | Inhalt |
|---:|---|---|
| 1 | `tokens/light.css` **oder** `tokens/dark.css` | Farb-Tokens des Styles (Auto: hell, danach Delta + dunkel unter Media) |
| 2 | `tokens/scale.css` | Maße, Schrift, Radien, Dichte, Fokus-Geometrie, Mobil-Überschreibung |
| 3 | `fonts.css` | `@font-face` |
| 4 | `bridge.css` | Mapping auf UT/APEX/JET, `@media (pointer: coarse)` |
| 5 | `base.css` | globale Grundlagen, niedrige Spezifität (`:where`; Ausnahmen: Überschriften `h1`–`h6` 0,0,1 gegen die Element-Regeln aus UT Core; Tastatur-Fokusring 0,2,0, §5.5) |
| 6–17 | `components/*.css` | in der Reihenfolge von `index.css`: shell, login, regions, buttons, forms, overlays, reports, search, cards, content, viz, utilities |
| 18 | `tokens/print.css` | nur `@media print` |

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `frequenz-dark.css` die hellen Tokens zusätzlich unter `print`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`frequenz-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (verifiziert, §6).

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--fq-panel`, `--fq-accent`, `--fq-danger-tint` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--fq-control-h`, `--fq-r-panel`, `--fq-fs-3xl` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--ut-region-background-color: var(--fq-panel)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-TreeNav { --fq-c-nav-row-pad-y: … }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--hot { --a-button-background-color: var(--fq-accent) }` | Komponenten |

Benennung: `--fq-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--fq-accent-text`, `--fq-soft-hover`, `--fq-success-tint`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

**Das Flächenmodell.** `--fq-surface` ist die Seite (hell Weiß, dunkel Schwarz): Kopf, Navigation, Inhalt. `--fq-panel` ist die Tafel, auf der Regionen, Hero, Hinweisblöcke und Button Container liegen. Was *in* einer Tafel liegt – Felder, Tabellen, Karten, verschachtelte Regionen – nimmt wieder die Seitenfarbe (`--fq-surface`, `--fq-field`, `--ut-component-background-color`). `--fq-surface-raised` ist die schwebende Ebene (Menüs, Dialoge, Popups). `--fq-soft` ist die weiche Füllung für Chips, Badges, Tabellenkopfband, Ja/Nein-Pillen und den Schalter der Filterzeile (IR/IG). `--fq-strong` ist die kräftige Neutralfläche (aktive Pille, aktive Seite der Pagination, Tooltip). `--fq-brand-area` ist die große Markenfläche der geteilten Anmeldung: hell das Block-Magenta, dunkel ein tiefes Magenta (`#660034`), weil volles `#E20074` auf zwei Dritteln des Schirms im Dunkeln blendet.

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--fq-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--fq-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal. Einzige Ausnahme ist die Grundfläche schwebender Ebenen (§3.6).

### 3.2 Farb-Tokens (hell / dunkel)

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Marke: der Markenblock oben links (Kopf, Login)** | | | |
| `--fq-brand` | `#E20074` | `#E20074` | Blockfläche |
| `--fq-brand-hover` | `#C9006A` | `#C9006A` | Block als Link überfahren |
| `--fq-brand-on` | `#FFFFFF` | `#FFFFFF` | Logo/Schrift im Block |
| `--fq-brand-area` | `var(--fq-brand)` | `#660034` | große Markenfläche: geteilte Anmeldung |
| **Flächen** | | | |
| `--fq-surface` | `#FFFFFF` | `#000000` | Seite: Kopf, Navigation, Inhalt; innere Flächen in Tafeln |
| `--fq-panel` | `#F4F4F6` | `#1B1B1B` | Tafel: Regionen, Hero, Hinweisblöcke |
| `--fq-surface-sunken` | `#F4F4F6` | `#1B1B1B` | abgesenkte Fläche: Toolbars, Code-Blöcke, Readonly, Kalender-Köpfe |
| `--fq-surface-raised` | `#FFFFFF` | `#262626` | schwebend: Menüs, Dialoge, Popups |
| `--fq-raised-hover` | `#EDEDED` | `#383838` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) |
| `--fq-ground` | `var(--fq-surface)` | `var(--fq-surface)` | aktuelle Grundfläche: an der Wurzel die Seite, in Menüs, Dialogen, Popups und Seiten-Dialogen `--fq-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--fq-hover` | `#F4F4F6` | `#1B1B1B` | Zeilen-/Listen-Hover auf Weiß |
| `--fq-press` | `#EDEDED` | `#262626` | gedrückt auf Weiß |
| `--fq-soft` | `#EDEDED` | `#2E2E2E` | weiche Füllung: Chips, Badges, Zähler-Grund, Icon-Kacheln |
| `--fq-soft-hover` | `#E3E3E3` | `#3A3A3A` | weiche Füllung Hover |
| `--fq-soft-press` | `#D9D9D9` | `#454545` | weiche Füllung gedrückt |
| `--fq-wash-hover` | `rgb(0 0 0 / .05)` | `rgb(255 255 255 / .08)` | Hover auf beliebigem Grund |
| `--fq-wash-press` | `rgb(0 0 0 / .09)` | `rgb(255 255 255 / .13)` | gedrückt auf beliebigem Grund (transparent) |
| `--fq-button-fill` | `transparent` | `#1B1B1B` | Fläche der Standard-Buttons: hell ohne Fläche (Kontur), dunkel Tafelgrau – in der Tafel unsichtbar, auf fest weißen Flächen aus App-CSS bleibt die Schrift lesbar |
| `--fq-button-fill-hover` | `var(--fq-wash-hover)` | `#2E2E2E` | Standard-Button Hover/Fokus (hell Schleier, dunkel deckend) |
| `--fq-button-fill-press` | `var(--fq-wash-press)` | `#3A3A3A` | Standard-Button gedrückt (hell Schleier, dunkel deckend) |
| `--fq-field` | `#FFFFFF` | `#000000` | Eingabefelder |
| `--fq-field-readonly` | `#F4F4F6` | `#141414` | schreibgeschützte Felder |
| `--fq-scrim` | `rgb(0 0 0 / .45)` | `rgb(0 0 0 / .7)` | Abdunklung hinter Dialogen/Schublade |
| **Text** | | | |
| `--fq-ink` | `#262626` | `#F5F5F5` | Anthrazit: Überschriften, Text, Icons |
| `--fq-ink-2` | `#383838` | `#D9D9D9` | Labels, Unterebenen der Navigation; im Code Eigenschaften, Variablen, Attribute |
| `--fq-muted` | `#6B6B6B` | `#A6A6A6` | Sekundärtext, Breadcrumb |
| `--fq-placeholder` | `#737373` | `#8F8F8F` | Platzhalter |
| `--fq-disabled` | `#A3A3A3` | `#666666` | deaktivierte Beschriftung |
| `--fq-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--fq-on-light` | `#262626` | `#262626` | Text auf hellen Flächen |
| `--fq-strong` | `#262626` | `#F5F5F5` | kräftige Neutralfläche: Button-Typ Primary, aktive Pille, aktive Seite der Pagination (dunkel invertiert) |
| `--fq-strong-hover` | `#000000` | `#FFFFFF` | kräftige Neutralfläche Hover |
| `--fq-strong-on` | `#FFFFFF` | `#000000` | Text auf der kräftigen Neutralfläche |
| **Linien** | | | |
| `--fq-line-subtle` | `#EDEDED` | `#262626` | zart: Zeilentrenner, Kartenkante auf der Tafel |
| `--fq-line` | `#D0D0D0` | `#3D3D3D` | Haarlinie: Trenner, Kartenkante auf Weiß |
| `--fq-line-strong` | `#B2B2B2` | `#5C5C5C` | kräftig: Rand von Simple-Buttons, Tabellenkopf-Linie |
| `--fq-edge` | `#7C7C7C` | `#8A8A8A` | Feld-/Checkbox-Kante – WCAG 1.4.11 |
| `--fq-edge-hover` | `#383838` | `#C2C2C2` | Feldkante Hover |
| `--fq-button-edge` | `#6B6B6B` | `#A6A6A6` | Rand der Standard-Buttons |
| `--fq-head-rule` | `#B2B2B2` | `#5C5C5C` | Linie unter Tabellenköpfen |
| **Akzent (Primäraktion, Auswahl, aktive Navigation)** | | | |
| `--fq-accent` | `#E20074` | `#E20074` | Fläche mit Schrift , Checkbox-/Schalter-Marke |
| `--fq-accent-hover` | `#C9006A` | `#C9006A` | Primär-Fläche Hover |
| `--fq-accent-press` | `#B00060` | `#B00060` | Primär-Fläche gedrückt |
| `--fq-accent-on` | `#FFFFFF` | `#FFFFFF` | Text/Icon auf Primär-Fläche |
| `--fq-accent-text` | `#D0006F` | `#FF6EB8` | Akzent als Text: aktive Navigation |
| `--fq-accent-tint` | `#FDEAF4` | `#3D0F26` | Auswahl-Fläche |
| `--fq-accent-tint-2` | `#F9CFE5` | `#5A1439` | kräftigere Auswahl |
| `--fq-accent-ring` | `rgb(226 0 116 / .22)` | `rgb(255 110 184 / .3)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| `--fq-focus-ring-color` | `#262626` | `#F5F5F5` | Fokusring (Anthrazit, dunkel fast Weiß) – unabhängig vom Magenta |
| `--fq-focus-gap` | `var(--fq-ground)` | `var(--fq-ground)` | Innenring/Lücke des Doppelrings (= `--fq-ground`: die Seite, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Petrol mit Unterstrich** | | | |
| `--fq-link-text` | `#00748F` | `#4FB8C8` | Linkfarbe im Fließtext (Petrol) |
| `--fq-link-underline` | `#00748F` | `#4FB8C8` | Unterstrich im Ruhezustand |
| `--fq-link-underline-hover` | `#262626` | `#F5F5F5` | Unterstrich bei Hover (Anthrazit) |
| **Textauswahl** | | | |
| `--fq-selection` | `#F9CFE5` | `#5A1439` | ::selection-Hintergrund |
| `--fq-selection-text` | `#262626` | `#FFFFFF` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--fq-required-color` | `#A02A08` | `#FF9A70` | = Danger-Text |
| **Status: Fläche · Hover · on (Text auf Fläche) · Text · Tönung (Alert-Grund)** | | | |
| `--fq-success` | `#0B7A3E` | `#3FB56F` | Erfolg: Fläche (Buttons, Badges) |
| `--fq-success-hover` | `#096433` | `#57C283` | Erfolg: Fläche Hover |
| `--fq-success-on` | `#FFFFFF` | `#000000` | Erfolg: Text/Icon auf der Fläche |
| `--fq-success-text` | `#0B7A3E` | `#5CCB8A` | Erfolg: Textfarbe auf Seite, Tafel und Tönung |
| `--fq-success-tint` | `#E6F4EC` | `#0F2A1B` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--fq-warning` | `#F2A400` | `#F2B01E` | Warnung: Fläche (Buttons, Badges) |
| `--fq-warning-hover` | `#F5B42E` | `#F5C04A` | Warnung: Fläche Hover |
| `--fq-warning-on` | `#262626` | `#000000` | Warnung: Text/Icon auf der Fläche |
| `--fq-warning-text` | `#8A5A00` | `#F7C548` | Warnung: Textfarbe auf Seite, Tafel und Tönung |
| `--fq-warning-tint` | `#FDF3DC` | `#2E2410` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--fq-danger` | `#A02A08` | `#FF7A45` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--fq-danger-hover` | `#86230A` | `#FF8F66` | Fehler/Gefahr: Fläche Hover |
| `--fq-danger-on` | `#FFFFFF` | `#000000` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--fq-danger-text` | `#A02A08` | `#FF9A70` | Fehler/Gefahr: Textfarbe auf Seite, Tafel und Tönung |
| `--fq-danger-tint` | `#FBE9E7` | `#3A1210` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--fq-info` | `#00748F` | `#4FB8C8` | Information: Fläche (Buttons, Badges) |
| `--fq-info-hover` | `#005F75` | `#6CC5D2` | Information: Fläche Hover |
| `--fq-info-on` | `#FFFFFF` | `#000000` | Information: Text/Icon auf der Fläche |
| `--fq-info-text` | `#00748F` | `#6CC7D4` | Information: Textfarbe auf Seite, Tafel und Tönung |
| `--fq-info-tint` | `#E3F2F5` | `#0B2A30` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--fq-code-keyword` | `#00748F` | `#6CC7D4` | Petrol |
| `--fq-code-string` | `#0B7A3E` | `#5CCB8A` | Grün |
| `--fq-code-number` | `#8A5A00` | `#F7C548` | Ocker |
| **Tiefe** | | | |
| `--fq-header-shadow` | `0 1px 0 rgb(0 0 0 / .06), 0 4px 16px -6px rgb(0 0 0 / .12)` | `0 1px 0 #262626` | weicher Schatten unter dem Kopf |
| `--fq-card-shadow` | `0 6px 24px -10px rgb(0 0 0 / .18)` | `0 0 0 1px #5C5C5C` | Karten-Hover |
| `--fq-float-shadow` | `0 16px 40px -12px rgb(0 0 0 / .24), 0 2px 8px rgb(0 0 0 / .06), 0 0 0 1px rgb(0 0 0 / .05)` | `0 18px 44px -12px rgb(0 0 0 / .8), 0 0 0 1px rgb(255 255 255 / .1)` | Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – nie auf Tafeln |
| `--fq-tooltip-bg` | `#262626` | `#F5F5F5` | Tooltip-Fläche (invertiert) |
| `--fq-tooltip-text` | `#FFFFFF` | `#000000` | Tooltip-Text |
| **Scrollbars** | | | |
| `--fq-scrollbar-thumb` | `rgb(0 0 0 / .26)` | `rgb(255 255 255 / .28)` | Scrollbar-Daumen |
| `--fq-scrollbar-thumb-hover` | `rgb(0 0 0 / .42)` | `rgb(255 255 255 / .45)` | Scrollbar-Daumen Hover |
| `--fq-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Icons** | | | |
| `--fq-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (dünn, in --fq-muted wie die Feldsymbole; als Data-URI) |

**Entscheidungen:**
- *Magenta* `#E20074` ist in beiden Modi dieselbe Fläche (Block, Primär-Button, Checkbox, Schalter, Kanten). Weiß darauf 4,7 : 1, gegen Weiß 4,7 : 1, gegen Schwarz 4,5 : 1 – als Marke überall ≥ 3 : 1. Als *Schrift* ist Magenta eine eigene Rolle: `--fq-accent-text` hell `#D0006F` (≥ 4,5 auch auf der grauen Tafel), dunkel `#FF6EB8` (auch im Menü-Hover ≥ 4,5).
- *Petrol-Links* `#00748F`: Ein Petrol um `#00739F` läge nur ΔE00 9 von Oracle-Blau entfernt und würde vom Blau-Audit als Oracle-Blau gewertet. `#00748F` ist 4° grüner, ΔE00 15 zu jeder Referenz. Links tragen immer einen Unterstrich (Petrol gegen Anthrazit-Text < 3 : 1).
- *Danger ≠ Magenta:* hell Ziegelrot `#A02A08` (deutlich dunkler, Helligkeit 1,6 : 1 zum Magenta, ΔE00 ≥ 21 normal/Protan/Deutan), dunkel Orangerot `#FF7A45` (heller, 1,8 : 1). Warnung ist Sonnengelb mit Anthrazit-Schrift.
- *Fokus* ist Anthrazit (dunkel fast Weiß) und damit unabhängig vom Magenta: Ein Primär-Button mit Fokus zeigt Magenta-Fläche, Lücke und Anthrazit-Ring.
- *Code:* eigene Rollen-Tokens `--fq-code-keyword|string|number` (Petrol, Grün, Ocker), Kommentare `--fq-muted`, Namen `--fq-ink`/`--fq-ink-2` (bridge §17).

### 3.3 Kategorie- und Diagrammpalette (`--fq-cat-*` → `--u-color-*`)

Eine eigene Palette, **ohne Vita-Farben und ohne Magenta**: Petrol, Sonnengelb, Graphit, Violett, Grün, Türkis, Oliv, Rotbraun, Kaffee, Lavendel, Koralle, Tanne (Chart-Reihenfolge des UT: `.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`). `check-tokens.mjs` prüft:
- **CVD:** Die ersten 6 Serien sind auch bei Protanopie und Deuteranopie unterscheidbar (min. ΔE00 ≥ 6, Werte unten in der Ausgabe von `check-tokens.mjs`).
- **Magenta-Abstand:** jede Kategorie ≥ 20 ΔE00 von `--fq-accent`, `--fq-accent-text` und `--fq-brand` – keine Datenfarbe liest sich als Auswahl.
- **Gleiche Identität hell/dunkel:** HSL-Farbton hell ↔ dunkel ≤ 25° (Grautöne ausgenommen).
- **Kontrast:** hell alle ≥ 2,4 : 1 gegen die Seite, dunkel alle ≥ 3,3 : 1; jede `-on`-Schrift ≥ 4,5 : 1.

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--fq-cat-1` | `#00748F` | `#FFFFFF` | `#29A6B1` | `#000000` | 1 | Petrol |
| 2 | `--fq-cat-2` | `#8C6A3F` | `#FFFFFF` | `#B89468` | `#000000` | 9 | Kaffee |
| 3 | `--fq-cat-3` | `#3BA89A` | `#262626` | `#5FCFBF` | `#000000` | 6 | Türkis |
| 4 | `--fq-cat-4` | `#D99A00` | `#262626` | `#F2B82E` | `#000000` | 2 | Sonnengelb |
| 5 | `--fq-cat-5` | `#9A86D6` | `#262626` | `#B8A6F0` | `#000000` | 10 | Lavendel |
| 6 | `--fq-cat-6` | `#3E6B2F` | `#FFFFFF` | `#6FA35A` | `#000000` | 12 | Tanne |
| 7 | `--fq-cat-7` | `#525A63` | `#FFFFFF` | `#7E868F` | `#000000` | 3 | Graphit |
| 8 | `--fq-cat-8` | `#6B7A1F` | `#FFFFFF` | `#8F9C2C` | `#000000` | 7 | Oliv |
| 9 | `--fq-cat-9` | `#7446C4` | `#FFFFFF` | `#A683F2` | `#000000` | 4 | Violett |
| 10 | `--fq-cat-10` | `#8A4B3D` | `#FFFFFF` | `#B07366` | `#000000` | 8 | Rotbraun |
| 11 | `--fq-cat-11` | `#E07B53` | `#262626` | `#F59A74` | `#000000` | 11 | Koralle |
| 12 | `--fq-cat-12` | `#187A50` | `#FFFFFF` | `#3DBA80` | `#000000` | 5 | Grün |
| 13 | `--fq-cat-13` | `#2E5A5E` | `#FFFFFF` | `#6E9E9C` | `#000000` | – | Tiefsee |
| 14 | `--fq-cat-14` | `#8E969E` | `#262626` | `#BFC6CC` | `#000000` | – | Nebel |
| 15 | `--fq-cat-15` | `#5E6873` | `#FFFFFF` | `#8D98A4` | `#000000` | – | Schiefer |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Frequenz ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--fq-cat-N) 60%, #fff)` mit Text `--fq-on-light`, 31–45 = `color-mix(in srgb, var(--fq-cat-N) 55%, #000)` mit Text `--fq-on-dark`. So scheint keine Vita-Farbe durch. Die Textklassen `.u-color-N-text` mischen Anthrazit bei, bis ≥ 4,5 : 1 auf Seite und Tafel erreicht ist (`tools/gen-color-text.mjs`).

### 3.4 Maß-, Schrift-, Radius-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--fq-font` | `"Frequenz Sans", "Onest", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Schriftfamilie der gesamten Oberfläche (Onest als „Frequenz Sans“, dann System) |
| `--fq-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--fq-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--fq-fw-medium` | `500` | Unterebenen der Navigation, Menüs |
| `--fq-fw-semibold` | `600` | Labels, Tabs, Buttons |
| `--fq-fw-bold` | `700` | Navigation, Tabellenköpfe, <b>/<strong> |
| `--fq-fw-heavy` | `800` | Überschriften, Seitentitel, App-Name im Block |
| **Größen-Skala 12 · 13 · 14 · 16 · 20 · 24 · 36 · 44** | | |
| `--fq-fs-xs` | `.75rem` | 12  Klein: Hilfe, Badges, Zähler |
| `--fq-fs-head` | `.8125rem` | 13  Tabellenköpfe |
| `--fq-fs-sm` | `.8125rem` | 13  Tabellenzellen, Labels, Breadcrumb |
| `--fq-fs-md` | `.875rem` | 14  UI, Fließtext, Felder, Buttons |
| `--fq-fs-lg` | `1rem` | 16  Kartentitel, Unterüberschriften |
| `--fq-fs-xl` | `1.25rem` | 20  Region-Titel |
| `--fq-fs-2xl` | `1.5rem` | 24  Abschnitt (Content Block h2), Dialogtitel groß |
| `--fq-fs-3xl` | `2.25rem` | 36  Seitentitel (mobil 28) |
| `--fq-fs-hero` | `2.75rem` | 44  Hero-Titel (mobil 32) |
| `--fq-fs-brand` | `1.125rem` | 18  App-Name im Markenblock |
| `--fq-lh-xs` | `1rem` |  |
| `--fq-lh-sm` | `1.25rem` |  |
| `--fq-lh-md` | `1.25rem` |  |
| `--fq-lh-body` | `1.375rem` | 14 im Fließtext |
| `--fq-lh-lg` | `1.5rem` |  |
| `--fq-lh-xl` | `1.75rem` |  |
| `--fq-lh-2xl` | `2rem` |  |
| `--fq-lh-3xl` | `2.75rem` |  |
| `--fq-lh-hero` | `3.25rem` |  |
| `--fq-lh-brand` | `1.5rem` | feste Zeilenhöhe im Block: Font-Swap verschiebt nichts |
| `--fq-tracking-title` | `-.02em` | Seiten- und Hero-Titel |
| `--fq-tracking-heading` | `-.01em` | Region-/Abschnittstitel, h1–h4, App-Name |
| `--fq-tracking-ui` | `0em` | Buttons |
| **Radien: Hierarchie statt eines Radius für alles** | | |
| `--fq-r-control` | `.25rem` | 4 Buttons, Felder, Checkbox |
| `--fq-r-item` | `.375rem` | 6 Menüeinträge, kleine Flächen in Listen |
| `--fq-r-box` | `.625rem` | 10 Tabellen-Container, Menüs, Popups, Code, Meldungen |
| `--fq-r-card` | `1rem` | 16 Karten, Dialoge, verschachtelte Tafeln |
| `--fq-r-panel` | `1.5rem` | 24 Tafeln: Regionen, Hinweisblöcke |
| `--fq-r-hero` | `2.5rem` | 40 Hero, Login-Tafel |
| `--fq-r-pill` | `62rem` | Pillen: Chips, Badges, Tab-Pillen, runde Icon-Buttons |
| **Geometrie: Kopf, Navigation, Seite** | | |
| `--fq-header-h` | `4rem` | Kopfzeile 64 px (statisch – nie per JS/Font verändern) |
| `--fq-nav-w` | `16rem` | aufgeklappte Navigation |
| `--fq-nav-rail-w` | `4rem` | Icon-Leiste = Kopfhöhe: Block und Leiste bilden eine Spalte |
| `--fq-nav-mark-w` | `.25rem` | Akzentkante des aktiven Navigationspunkts |
| `--fq-tab-mark-h` | `.1875rem` | Akzent-Unterstrich aktiver Tabs/Menüpunkte |
| `--fq-page-pad-x` | `2rem` | Seiten-Innenabstand waagerecht |
| `--fq-page-pad-y` | `1.5rem` | Seiten-Innenabstand senkrecht (Title Bar, Inhalt) |
| `--fq-panel-pad` | `1.5rem` | Innenabstand der Tafeln |
| `--fq-float-inset` | `0px` | Abstand schwebender Schubladen zum Fensterrand |
| **Abstände (4er-Raster)** | | |
| `--fq-space-1` | `.25rem` | 4 |
| `--fq-space-2` | `.5rem` | 8 |
| `--fq-space-3` | `.75rem` | 12 |
| `--fq-space-4` | `1rem` | 16 |
| `--fq-space-5` | `1.25rem` | 20 |
| `--fq-space-6` | `1.5rem` | 24 |
| `--fq-space-8` | `2rem` | 32 |
| `--fq-space-12` | `3rem` | 48 |
| `--fq-region-gap` | `1.5rem` | Abstand zwischen Regionen/Tafeln (→ --ut-region-margin) |
| **Dichte (Desktop 36 px; unter pointer: coarse 44 px – siehe bridge.css)** | | |
| `--fq-control-h` | `2.25rem` | Höhe Buttons, Felder, Selects (inkl. Rand) |
| `--fq-control-h-sm` | `1.75rem` | kleine Buttons, Toolbar-Icons |
| `--fq-control-h-lg` | `2.75rem` | große Buttons, Login |
| `--fq-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--fq-control-pad-x` | `.75rem` | Innenabstand Felder; Buttons: --fq-button-pad-x |
| `--fq-button-pad-x` | `1rem` |  |
| `--fq-control-pad-y` | `calc((var(--fq-control-h) - var(--fq-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--fq-row-h` | `2.25rem` | Tabellenzeile 36 px inkl. Haarlinie |
| `--fq-row-lh` | `1.25rem` |  |
| `--fq-row-pad-x` | `.75rem` |  |
| `--fq-row-pad-y` | `calc((var(--fq-row-h) - var(--fq-row-lh) - 1px) / 2)` | = 7,5 px |
| `--fq-head-h` | `2.5rem` | Tabellenkopf 40 px |
| `--fq-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.75rem |
| `--fq-checkbox-size` | `1.125rem` |  |
| **Linien-Geometrie** | | |
| `--fq-hairline` | `1px` |  |
| `--fq-head-rule-width` | `1px` |  |
| `--fq-rule-strong` | `2px` |  |
| **Fokus-Geometrie (Farben: --fq-focus-ring-color / --fq-focus-gap)** | | |
| `--fq-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--fq-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Lücke) |
| `--fq-focus-outline` | `var(--fq-focus-ring-width) solid var(--fq-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--fq-focus-shadow` | `0 0 0 var(--fq-focus-ring-offset) var(--fq-focus-gap), 0 0 0 calc(var(--fq-focus-ring-offset) + var(--fq-focus-ring-width)) var(--fq-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--fq-focus-gap` innen, Ring außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--fq-focus-shadow-inset` | `inset 0 0 0 var(--fq-focus-ring-width) var(--fq-focus-ring-color), inset 0 0 0 calc(var(--fq-focus-ring-width) + 1px) var(--fq-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--fq-focus-field-shadow` | `0 0 0 1px var(--fq-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--fq-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--fq-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--fq-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--fq-required-mark` | `"*"` |  |
| `--fq-required-gap` | `.25rem` |  |
| **Bewegung** | | |
| `--fq-duration` | `.14s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--fq-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| **Mobil (< 640 px): flacherer Kopf, schmalere Ränder, kleinere Titel – Überschreibung `@media (max-width: 639px)`** | | |
| `--fq-header-h` | `3.5rem` | 56 px |
| `--fq-page-pad-x` | `1rem` |  |
| `--fq-page-pad-y` | `1rem` |  |
| `--fq-panel-pad` | `1rem` |  |
| `--fq-region-gap` | `1rem` |  |
| `--fq-r-panel` | `1.25rem` |  |
| `--fq-r-hero` | `1.75rem` |  |
| `--fq-fs-3xl` | `1.75rem` | 28 |
| `--fq-lh-3xl` | `2.25rem` |  |
| `--fq-fs-hero` | `2rem` | 32 |
| `--fq-lh-hero` | `2.5rem` |  |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--fq-control-h 2.75rem`, `--fq-control-h-sm 2.25rem`, `--fq-control-h-lg 3rem`, `--fq-row-h 2.75rem`, `--fq-head-h 2.75rem`, `--fq-hit-min 2.75rem`, `--fq-checkbox-size 1.25rem`.

**Radien als Hierarchie, nicht ein Radius für alles:** Buttons, Felder, Checkboxen 4 · Menüeinträge 6 · Tabellen-Innenflächen, Menüs, Popups 10 · Karten, Dialoge, verschachtelte Tafeln 16 · Tafeln (Regionen) 24 · Hero und Login 40 · Pillen (Chips, Badges, Tab-Pillen, runde Icon-Buttons, Avatare) voll gerundet.

Druck (`tokens/print.css`, nur `print`): Tafeln und abgesenkte Flächen weiß, alle Schatten weg, `--fq-page-pad-x 0`; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare der Tabelle (Feld- und Button-Kanten, Magenta-Marken, Fokus) ≥ 3 : 1 – in hell **und** dunkel (`node Frequenz/tools/check-tokens.mjs`). Linien sind keine UI-Paare: Haarlinien und die kräftige Linie `--fq-line-strong` (Tabellenkopf, Kante der *Simple*-Buttons) liegen bewusst darunter (hell 2,1 : 1) – Simple-Buttons erkennt man an der Beschriftung.

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--fq-ink` / `--fq-surface` | Text auf der Seite | 15.13 | 19.26 | 4.5 |
| `--fq-ink` / `--fq-panel` | Text in der Tafel | 13.78 | 15.80 | 4.5 |
| `--fq-ink` / `--fq-surface-raised` | Text in Menü/Dialog | 15.13 | 13.88 | 4.5 |
| `--fq-ink` / `--fq-soft` | Text auf weicher Füllung (Chip, Kopfband) | 12.93 | 12.46 | 4.5 |
| `--fq-ink` / `--fq-soft-hover` | Text auf weicher Füllung Hover | 11.79 | 10.43 | 4.5 |
| `--fq-ink` / `--fq-accent-tint` | Auswahl-Zeile | 13.15 | 14.88 | 4.5 |
| `--fq-ink` / `--fq-accent-tint-2` | Auswahl kräftig | 10.87 | 12.08 | 4.5 |
| `--fq-ink-2` / `--fq-surface` | Label | 11.73 | 14.88 | 4.5 |
| `--fq-ink-2` / `--fq-panel` | Label in der Tafel | 10.67 | 12.20 | 4.5 |
| `--fq-muted` / `--fq-surface` | Sekundärtext | 5.33 | 8.63 | 4.5 |
| `--fq-muted` / `--fq-panel` | Sekundärtext in der Tafel | 4.85 | 7.08 | 4.5 |
| `--fq-muted` / `--fq-surface-raised` | Sekundärtext Menü | 5.33 | 6.22 | 4.5 |
| `--fq-muted` / `--fq-hover` | Sekundärtext Zeilen-Hover | 4.85 | 7.08 | 4.5 |
| `--fq-muted` / `--fq-soft` | Sekundärtext auf weicher Füllung | 4.55 | 5.58 | 4.5 |
| `--fq-ink` / `--fq-raised-hover` | Menüeintrag Hover/Fokus | 12.93 | 10.76 | 4.5 |
| `--fq-ink` / `--fq-button-fill` | Standard-Button | 15.13 | 15.80 | 4.5 |
| `--fq-ink` / `--fq-button-fill-hover` | Standard-Button Hover | 13.55 | 12.46 | 4.5 |
| `--fq-ink` / `--fq-button-fill-press` | Standard-Button gedrückt | 12.36 | 10.43 | 4.5 |
| `--fq-muted` / `--fq-raised-hover` | Tastenkürzel im Menü-Hover | 4.55 | 4.82 | 4.5 |
| `--fq-placeholder` / `--fq-field` | Platzhalter | 4.74 | 6.49 | 4.5 |
| `--fq-ink` / `--fq-field` | Feldtext | 15.13 | 19.26 | 4.5 |
| `--fq-ink` / `--fq-field-readonly` | Feldtext readonly | 13.78 | 16.90 | 4.5 |
| `--fq-link-text` / `--fq-surface` | Link | 5.39 | 9.02 | 4.5 |
| `--fq-link-text` / `--fq-panel` | Link in der Tafel | 4.91 | 7.40 | 4.5 |
| `--fq-accent-text` / `--fq-surface` | Magenta-Text (aktive Navigation) | 5.37 | 8.17 | 4.5 |
| `--fq-accent-text` / `--fq-panel` | Magenta-Text in der Tafel | 4.89 | 6.70 | 4.5 |
| `--fq-accent-text` / `--fq-hover` | Magenta-Text auf aktiver Nav-Zeile | 4.89 | 6.70 | 4.5 |
| `--fq-accent-text` / `--fq-surface-raised` | Magenta-Text Menü | 5.37 | 5.89 | 4.5 |
| `--fq-accent-text` / `--fq-raised-hover` | Magenta-Text im Menü-Hover | 4.59 | 4.56 | 4.5 |
| `--fq-brand-on` / `--fq-brand` | App-Name im Magenta-Block | 4.68 | 4.68 | 4.5 |
| `--fq-brand-on` / `--fq-brand-hover` | App-Name im Block (Hover) | 5.69 | 5.69 | 4.5 |
| `--fq-accent-on` / `--fq-accent` | Primär-Button | 4.68 | 4.68 | 4.5 |
| `--fq-accent-on` / `--fq-accent-hover` | Primär-Button Hover | 5.69 | 5.69 | 4.5 |
| `--fq-accent-on` / `--fq-accent-press` | Primär-Button gedrückt | 6.97 | 6.97 | 4.5 |
| `--fq-strong-on` / `--fq-strong` | aktive Pille / aktive Seite | 15.13 | 19.26 | 4.5 |
| `--fq-strong-on` / `--fq-strong-hover` | aktive Pille Hover | 21.00 | 21.00 | 4.5 |
| `--fq-accent-text` / `--fq-button-fill` | Primary-Typ (Magenta-Kontur) | 5.37 | 6.70 | 4.5 |
| `--fq-accent-text` / `--fq-accent-tint` | Primary-Typ Hover/Druck | 4.67 | 6.31 | 4.5 |
| `--fq-selection-text` / `--fq-selection` | ::selection | 10.87 | 13.18 | 4.5 |
| `--fq-required-color` / `--fq-surface` | Pflicht-Markierung | 7.42 | 10.11 | 4.5 |
| `--fq-required-color` / `--fq-panel` | Pflicht-Markierung in der Tafel | 6.76 | 8.29 | 4.5 |
| `--fq-tooltip-text` / `--fq-tooltip-bg` | Tooltip | 15.13 | 19.26 | 4.5 |
| `--fq-edge` / `--fq-surface` | Feldkante/Seite (1.4.11) | 4.17 | 6.08 | 3 |
| `--fq-edge` / `--fq-panel` | Feldkante/Tafel | 3.80 | 4.99 | 3 |
| `--fq-edge` / `--fq-field` | Feldkante/Feld | 4.17 | 6.08 | 3 |
| `--fq-edge` / `--fq-surface-raised` | Feldkante/Dialog | 4.17 | 4.38 | 3 |
| `--fq-button-edge` / `--fq-surface` | Button-Kontur/Seite | 5.33 | 8.63 | 3 |
| `--fq-button-edge` / `--fq-panel` | Button-Kontur/Tafel | 4.85 | 7.08 | 3 |
| `--fq-button-edge` / `--fq-surface-raised` | Button-Kontur/Dialog | 5.33 | 6.22 | 3 |
| `--fq-button-edge` / `--fq-field` | Trenner der Radio-Segmentleiste (Segmente in Feldfläche) | 5.33 | 8.63 | 3 |
| `--fq-accent` / `--fq-surface` | Magenta-Marke (Checkbox, Schalter, Kante)/Seite | 4.68 | 4.49 | 3 |
| `--fq-accent` / `--fq-panel` | Magenta-Marke/Tafel | 4.26 | 3.68 | 3 |
| `--fq-accent` / `--fq-surface-raised` | Magenta-Marke/Dialog | 4.68 | 3.23 | 3 |
| `--fq-accent` / `--fq-hover` | Magenta-Kante auf aktiver Nav-Zeile | 4.26 | 3.68 | 3 |
| `--fq-strong` / `--fq-panel` | aktive Pille in der Tafel | 13.78 | 15.80 | 3 |
| `--fq-focus-ring-color` / `--fq-surface` | Fokus auf der Seite | 15.13 | 19.26 | 3 |
| `--fq-focus-ring-color` / `--fq-panel` | Fokus in der Tafel | 13.78 | 15.80 | 3 |
| `--fq-focus-ring-color` / `--fq-surface-raised` | Fokus in Menü/Dialog | 15.13 | 13.88 | 3 |
| `--fq-focus-ring-color` / `--fq-soft` | Fokus auf weicher Füllung | 12.93 | 12.46 | 3 |
| `--fq-focus-ring-color` / `--fq-field` | Fokus-Feldkante/Feld | 15.13 | 19.26 | 3 |
| `--fq-focus-ring-color` / `--fq-focus-gap` | Doppelring innen/außen | 15.13 | 19.26 | 3 |
| `--fq-focus-ring-color` / `--fq-raised-hover` | Fokus-Innenring auf Menü-Hover | 12.93 | 10.76 | 3 |
| `--fq-focus-ring-color` / `--fq-accent` | Fokus-Ring neben Primär-Button (Lücke dazwischen) | 3.23 | 4.29 | 3 |
| `--fq-link-underline` / `--fq-surface` | Link-Unterstrich | 5.39 | 9.02 | 3 |
| `--fq-link-underline` / `--fq-panel` | Link-Unterstrich in der Tafel | 4.91 | 7.40 | 3 |
| `--fq-link-underline-hover` / `--fq-surface` | Link-Unterstrich Hover | 15.13 | 19.26 | 3 |
| `--fq-code-keyword` / `--fq-surface` | Code keyword (Seite) | 5.39 | 10.76 | 4.5 |
| `--fq-code-keyword` / `--fq-surface-sunken` | Code keyword (abgesenkt) | 4.91 | 8.82 | 4.5 |
| `--fq-code-keyword` / `--fq-surface-raised` | Code keyword (Dialog) | 5.39 | 7.75 | 4.5 |
| `--fq-code-keyword` / `--fq-field` | Code keyword (Markdown-Editor) | 5.39 | 10.76 | 4.5 |
| `--fq-code-string` / `--fq-surface` | Code string (Seite) | 5.43 | 10.36 | 4.5 |
| `--fq-code-string` / `--fq-surface-sunken` | Code string (abgesenkt) | 4.94 | 8.50 | 4.5 |
| `--fq-code-string` / `--fq-surface-raised` | Code string (Dialog) | 5.43 | 7.47 | 4.5 |
| `--fq-code-string` / `--fq-field` | Code string (Markdown-Editor) | 5.43 | 10.36 | 4.5 |
| `--fq-code-number` / `--fq-surface` | Code number (Seite) | 5.93 | 13.03 | 4.5 |
| `--fq-code-number` / `--fq-surface-sunken` | Code number (abgesenkt) | 5.40 | 10.69 | 4.5 |
| `--fq-code-number` / `--fq-surface-raised` | Code number (Dialog) | 5.93 | 9.39 | 4.5 |
| `--fq-code-number` / `--fq-field` | Code number (Markdown-Editor) | 5.93 | 13.03 | 4.5 |
| `--fq-muted` / `--fq-surface-sunken` | Code-Kommentar (abgesenkt) | 4.85 | 7.08 | 4.5 |
| `--fq-muted` / `--fq-field` | Code-Kommentar (Markdown-Editor) | 5.33 | 8.63 | 4.5 |
| `--fq-danger-text` / `--fq-surface-raised` | Code gelöscht (diff) (Dialog) | 7.42 | 7.28 | 4.5 |
| `--fq-danger-text` / `--fq-field` | Code gelöscht (diff) (Markdown-Editor) | 7.42 | 10.11 | 4.5 |
| `--fq-success-on` / `--fq-success` | success-Fläche | 5.43 | 8.05 | 4.5 |
| `--fq-success-on` / `--fq-success-hover` | success-Fläche Hover | 7.29 | 9.45 | 4.5 |
| `--fq-success-text` / `--fq-surface` | success-Text Seite | 5.43 | 10.36 | 4.5 |
| `--fq-success-text` / `--fq-panel` | success-Text Tafel | 4.94 | 8.50 | 4.5 |
| `--fq-success-text` / `--fq-success-tint` | success-Text auf Tönung | 4.79 | 7.58 | 4.5 |
| `--fq-ink` / `--fq-success-tint` | Text auf success-Tönung | 13.34 | 14.09 | 4.5 |
| `--fq-warning-on` / `--fq-warning` | warning-Fläche | 7.27 | 11.00 | 4.5 |
| `--fq-warning-on` / `--fq-warning-hover` | warning-Fläche Hover | 8.25 | 12.52 | 4.5 |
| `--fq-warning-text` / `--fq-surface` | warning-Text Seite | 5.93 | 13.03 | 4.5 |
| `--fq-warning-text` / `--fq-panel` | warning-Text Tafel | 5.40 | 10.69 | 4.5 |
| `--fq-warning-text` / `--fq-warning-tint` | warning-Text auf Tönung | 5.37 | 9.47 | 4.5 |
| `--fq-ink` / `--fq-warning-tint` | Text auf warning-Tönung | 13.71 | 14.00 | 4.5 |
| `--fq-danger-on` / `--fq-danger` | danger-Fläche | 7.42 | 8.12 | 4.5 |
| `--fq-danger-on` / `--fq-danger-hover` | danger-Fläche Hover | 9.30 | 9.37 | 4.5 |
| `--fq-danger-text` / `--fq-surface` | danger-Text Seite | 7.42 | 10.11 | 4.5 |
| `--fq-danger-text` / `--fq-panel` | danger-Text Tafel | 6.76 | 8.29 | 4.5 |
| `--fq-danger-text` / `--fq-danger-tint` | danger-Text auf Tönung | 6.33 | 7.93 | 4.5 |
| `--fq-ink` / `--fq-danger-tint` | Text auf danger-Tönung | 12.91 | 15.12 | 4.5 |
| `--fq-info-on` / `--fq-info` | info-Fläche | 5.39 | 9.02 | 4.5 |
| `--fq-info-on` / `--fq-info-hover` | info-Fläche Hover | 7.26 | 10.55 | 4.5 |
| `--fq-info-text` / `--fq-surface` | info-Text Seite | 5.39 | 10.76 | 4.5 |
| `--fq-info-text` / `--fq-panel` | info-Text Tafel | 4.91 | 8.82 | 4.5 |
| `--fq-info-text` / `--fq-info-tint` | info-Text auf Tönung | 4.69 | 7.75 | 4.5 |
| `--fq-ink` / `--fq-info-tint` | Text auf info-Tönung | 13.18 | 13.88 | 4.5 |
| `--fq-panel` / `--fq-surface` | Tafel gegen Seite | 1.10 | 1.22 | 1.07 |
| `--fq-raised-hover` / `--fq-surface-raised` | Hover auf schwebender Fläche | 1.17 | 1.29 | 1.15 |
| `--fq-soft` / `--fq-panel` | weiche Füllung in der Tafel | 1.07 | 1.27 | 1.03 |
| `--fq-line` / `--fq-surface` | Haarlinie | 1.54 | 1.93 | – |
| `--fq-line-strong` / `--fq-surface` | kräftige Linie | 2.12 | 3.14 | – |
| `--fq-accent` / `--fq-surface` | Primär-Fläche | 4.68 | 4.49 | – |

**Paare außerhalb der Tabelle, die Komponenten nicht erzeugen dürfen:**
- `--fq-accent` (Magenta-Fläche) als **Schrift** auf der grauen Tafel: hell 4,3 : 1. Magenta-Schrift immer `--fq-accent-text`.
- `--fq-muted` auf `--fq-soft-hover`/`--fq-soft-press` (hell 4,1 / 3,7) – Sekundärtext nie auf überfahrenen weichen Flächen.
- `--fq-warning` als Fläche gegen die Tafel ist hell nur 1,9 : 1. Warn-Flächen tragen ihr Symbol in `--fq-warning-on` (7,3 : 1); die Fläche selbst ist nicht die Information.

### 3.6 Grundfläche schwebender Ebenen (`--fq-ground`, `--fq-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--fq-surface-raised` (hell Weiß mit Schatten, dunkel `#262626`). Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht die Seitenfarbe nehmen, sonst entsteht dunkel ein schwarzer Punkt.
- **`--fq-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--fq-surface)`. Auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 den Wert `var(--fq-surface-raised)`. Komponenten nehmen `--fq-ground` für Aussparungen, z. B. die Mitte des aktiven Wizard-Schritts.
- **`--fq-focus-gap`** ist `var(--fq-ground)`. bridge §18 löst die Lücke und die beiden Schatten `--fq-focus-shadow` / `--fq-focus-shadow-inset` auf den genannten Ebenen neu auf (dieselben Formeln wie `scale.css`, geprüft von `check-tokens.mjs`).
- **`--fq-raised-hover`** ist Hover und Tastatur-Auswahl auf schwebenden Flächen (hell `#EDEDED`, dunkel `#383838`). Die Brücke legt `--a-menu-focused-background-color` und `--a-datepicker-calendar-day-hover-background-color` darauf.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--fq-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte: 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Kopf, Navigation, Title Bar, Inhalt) · 7 Regionen · 8 Tabs · 9 Buttons · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Frequenz | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--fq-link-text)` (Petrol) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--fq-focus-ring-color)` (Anthrazit) | bridge §3 |
| `:root --ut-header-background-color` | `var(--fq-surface)` (weißer Kopf) | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--fq-soft)` | bridge §6 |
| `:root --a-menu-focused-background-color` | `var(--fq-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--fq-info)` (Petrol) | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--fq-accent)` (Zähler-Punkt) | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--fq-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--fq-ink)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--fq-soft)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--fq-accent)` (Häkchen weiß) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | Ring / `var(--fq-soft)` / `var(--fq-soft)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-group input:checked + label, … radioButtonGroup …` | `var(--fq-accent)`, `-hover`, `-press` | `components/buttons.css` |
| `… .t-Button--simple` / `--link` / `--noUI` der Hot-Familie | Kante `var(--fq-accent)`, Schrift `var(--fq-accent-text)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | transparent / `var(--fq-hover) !important` | `components/shell.css` |

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--fq-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--fq-focus-outline)` = `2px solid <Ring>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--fq-focus-ring-offset)` = `2px` | dito |
| `--a-combo-select-focus-outline(-color)`, `--a-combo-select-item-focus-outline-color` | Ring | Combobox |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--fq-focus-shadow-inset)` | Tree-Knoten |
| `--fq-focus-gap`, `--fq-focus-shadow`, `--fq-focus-shadow-inset` auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget`, `.t-Dialog-page`, `.t-Drawer-page` | neu aufgelöst mit `--fq-ground: var(--fq-surface-raised)` | Lücke = Dialogfläche (bridge §18) |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `var(--fq-control-pad-y)` = `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 36 px | 44 px |
| `--a-field-input-padding-y` | dito | 36 px | 44 px |
| `--ut-pillbutton-padding-y` | dito | 36 px | 44 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--fq-row-h)` / `(row-h − row-lh − 1px) / 2` | 36 px | 44 px |
| `--a-gv-header-cell-height` | `var(--fq-head-h)` | 40 px | 44 px |
| `--ut-report-cell-padding-y` | `var(--fq-row-pad-y)` | 36 px | 44 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-sm − head-rule-width) / 2` | 40 px | 44 px |
| `--a-checkbox-size` | `var(--fq-checkbox-size)` | 18 px | 20 px |

### 4.4 Gestaltungsentscheidungen in der Brücke

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Seite | `--ut-body-background-color`, `--ut-header-background-color`, `--ut-body-nav-background-color` | `--fq-surface` | weiße (dunkel: schwarze) Seite ohne Rahmen; Kopf und Navigation gehören zur Seite |
| Regionen | `--ut-region-background-color`, `-border-radius`, `-header-font-size` | `--fq-panel`, `--fq-r-panel`, `--fq-fs-xl` (800) | Regionen sind Tafeln, Titel kräftig |
| Palette | `--ut-palette-primary*` | `--fq-accent` / `-on` / `-tint` / `-text` | Primär = Magenta |
| | `--ut-palette-primary-alt*` (`t-Button--primary`, „Zum Inhalt springen“) | `--fq-accent` / `-on` / `-tint` / `-text` | Typ *Primary* = Magenta-Kontur mit Magenta-Schrift (buttons.css), die Marke als zweite Stufe; einzige Magenta-*Fläche* bleibt *Hot* |
| | `--ut-palette-info*` | Petrol (`--fq-info*`) | kein APEX-Blau |
| Buttons | `--a-button-background-color`, `-border-color`, `-border-radius` | `--fq-button-fill` (hell transparent, dunkel Tafelgrau), `--fq-button-edge`, `--fq-r-control` | Standard = Kontur 1 px, 4 px Radius |
| Tabs | `--ut-tabs-item-active-highlight-color`, `--ut-tabs-item-hint-highlight-width` | `--fq-accent`, `--fq-tab-mark-h` | Unterstrich-Tabs mit Magenta-Strich |
| Tabellen | `--a-gv-header-background-color`, `--ut-report-header-cell-background-color` | `--fq-surface-sunken` bzw. Kopfband `--fq-soft` (reports.css) | Kopf als weiches Band, Innenfläche weiß |
| Pagination | `--a-gv-pagination-button-selected-*` | `--fq-strong` / `--fq-strong-on` | aktive Seite als Anthrazit-Kreis |
| Zähler | `--a-button-count-*`, `--ut-navbar-button-badge-*` | `--fq-accent` / `--fq-accent-on` | Zähler an Knöpfen als Magenta-Punkt |
| Carousel | `--ut-carousel-nav-selected-background-color` | `--fq-accent` | Punkte: aktiv Magenta, sonst Grau |
| Seitentitel | `--ut-breadcrumb-title-font-size` / `-line-height` / `-font-weight` | `--fq-fs-3xl` / `--fq-lh-3xl` / 800 | 36/44 (mobil 28/36) |
| Code | `--prism-*` (§17) | `--fq-code-*`, `--fq-muted`, `--fq-ink(-2)` | statt VS-Code-Paletten |
| Markdown | `--a-md-h1…h6-*` | 24 · 20 · 16 · 14 · 13 · 12 | eine #-Überschrift im Feld darf nicht größer sein als der Seitentitel |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--fq-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt. Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anlegen (in `light.css` **und** `dark.css`).
- Halbtransparente Überlagerungen (`--fq-wash-hover`, `--fq-scrollbar-thumb`) sind Token-Werte, keine Regel-Werte.
- **Flächenmodell (§3.1):** Was in einer Tafel liegt, nimmt die Seitenfarbe (`--fq-surface`, `--ut-component-background-color`), nie `--fq-panel`. Verschachtelte Regionen wechseln Tafel ↔ Weiß (regions.css).
- **Schwebende Ebenen (§3.6):** Aussparungen nehmen `--fq-ground`, Hover `--fq-raised-hover`.
- **Hover von Listen im Inhalt:** Links List, Media List, Content Row, Timeline, Badge List, List View und Tree-Region können direkt auf der Tafel stehen. `--fq-hover` hat hell wie dunkel den Wert der Tafel und wäre dort unsichtbar – diese Listen überfahren deshalb mit dem Schleier `--fq-wash-hover` (gedrückt `--fq-wash-press`), der auf Seite und Tafel sichtbar ist. `--fq-hover` bleibt für Flächen, die immer auf Weiß liegen (Tabellenzeilen, Navigation, Kopf-Buttons, Buttons in Feldern).

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Vorgehen: Selektor in `_reference/ut-26.1/css/Vita.css` suchen, **identische Selektorliste** übernehmen, nur die betroffenen Deklarationen mit Tokens neu setzen. Die Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen (Vita, UT Core, app_ui), mit gleichem Selektor bzw. gleicher Spezifität und einem Kommentar zur Quelle.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important }` | shell.css (Hover und aktive Zeile) |
| Vita | `.t-TreeNav--styleB … .is-current--top.is-hover { color: white / background-color: #056dcd !important }` | shell.css |
| UT Core | Drawer-Radius `border-radius: 0 !important` | overlays.css (Innenseite 16 px gerundet) |
| UT Core | `apex-core-font` an den Pflicht-Sternchen (`:after`) | forms.css (`font-family: inherit !important`) |
| app_ui | `.a-IRR-dialogList a` Textfarbe/Hover | reports.css |
| app_ui | Farbwähler im IR-Filter (2 px Abstand), `.fc .fc-helper` (FullCalendar-Auswahl `#0572CE`) | reports.css, viz.css |

### 5.4 Lokale Komponenten-Tokens

- Name: **`--fq-c-<komponente>-<name>`** (z. B. `--fq-c-nav-row-pad-y`, `--fq-c-alert-disc`, `--fq-c-accent`). Das Präfix `--fq-c-` ist für lokale Tokens reserviert.
- Deklaration auf dem **Wurzel-Selektor der Komponente**, nie auf `:root`. Werte nur aus globalen Tokens oder Längen.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament. (Ausnahme im Bestand: `--fq-c-alert-disc` aus regions.css wird von den Seitenmeldungen in overlays.css gelesen – beides ist `t-Alert`.)

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--fq-focus-ring-color` (hell Anthrazit, dunkel fast Weiß), 2 px, 2 px Abstand – überall ≥ 3 : 1, auch neben Magenta-Flächen. Die Schatten-Varianten `--fq-focus-shadow(-inset)` zeichnen die Lücke in `--fq-focus-gap` = `--fq-ground`.
- Global (base.css): `:focus-visible` mit den Hooks, kein Ring bei Maus-Fokus, `tabindex="-1"` ausgenommen (wie UT). Der Tastatur-Ring hat bewusst Spezifität **0,2,0**.
- **Komponenten ändern den Ring nur über die Hooks** auf ihrem Selektor: abgeschnittener Kontext → Ring nach innen (`--ut-focus-outline-offset: calc(-1 * var(--fq-focus-ring-width))` oder `--fq-focus-shadow-inset`); **Felder:** `border-color` = Ringfarbe + `--fq-focus-field-shadow`; Checkbox/Radio/Switch: Ring am sichtbaren Kästchen; Roving-Tabindex-Listen zeichnen den Ring selbst am `.is-focused`-Eintrag.
- **Einzige Farbausnahme:** der Magenta-Block im Kopf (`.t-Header-logo-link`). Er liegt bündig an Fenster- und Kopfkante, ein äußerer Ring wäre abgeschnitten. Dort ist der Ring weiß (`--fq-brand-on`, 4,7 : 1 auf Magenta) und liegt nach innen.
- Nie `outline: none` ohne gleichwertigen Ersatz.

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe (app_ui-Konvention: Polster enthält den 1-px-Rand). Eigene Elemente: `min-block-size: var(--fq-control-h)` bzw. `var(--fq-row-h)`.
- Controls 36 px, Tabellenzeilen 36 px, Tabellenköpfe 40 px, Navigation 44 px (Unterebenen 36 px); unter `pointer: coarse` automatisch 44 px.
- Trefferflächen kleiner Icon-Buttons ≥ `--fq-hit-min` (24 px Desktop, 44 px Touch).

### 5.7 Typografie

- Nur die Skala: `--fq-fs-xs|head|sm|md|lg|xl|2xl|3xl|hero|brand` mit passender `--fq-lh-*`, Gewichte `--fq-fw-*`, Laufweite `--fq-tracking-*`.
- **Überschriften sind 800** (`--fq-fw-heavy`): Seitentitel 36/44, Hero 44/52, Content Block h1/h2/h3 36/24/20, Region-Titel 20, Karten- und Facettentitel 16, Dialogtitel 20. Navigation 14/700 (Unterebenen 500), Menüleiste 16/800, Buttons 14/700, Labels 13/600.
- **Rohe Überschriften** (Static Content, Rich Text, Hilfe) setzt base.css auf 24 · 20 · 16 · 14 · 13 · 12 px, h1–h3 in 800, h4–h6 in 700 – ein `h1` im Inhalt konkurriert nicht mit dem Seitentitel.
- Zahlen in Spalten: `font-variant-numeric: tabular-nums` (Onest hat echte Tabellenziffern).
- Keine Monospace-Schrift für UI-Beschriftungen, keine Versalien-Labels.
- **Labels immer linksbündig** (forms.css). Die Template-Option „Label Alignment: Right“ entfällt damit bewusst.

### 5.8 Links, Akzent, Status

- `base.css` stylt nur **Links ohne Klasse** (`a:not([class])`): Petrol mit Unterstrich, Hover mit 2-px-Unterstrich in Anthrazit. Komponenten-Links mit Klasse bleiben unberührt.
- **Welcher Magenta-Token?**
  - `--fq-brand` (+ `-hover`, Schrift `--fq-brand-on`): nur der Block im Kopf und der Login-Kopf; `--fq-brand-area` für die große Fläche der geteilten Anmeldung (dunkel zurückgenommen).
  - `--fq-accent` (+ `-hover`/`-press`, Schrift `--fq-accent-on`): Flächen und Marken – Hot-Button, Kontur des Typs *Primary*, Checkbox/Radio/Schalter, gewähltes Segment der Radio-Gruppe, Sterne, Kanten und Unterstriche der aktiven Navigation, Carousel-Punkte, „heute“, Wizard-Schritt, Spinner, Zähler-Punkt.
  - `--fq-accent-text`: nur Magenta-**Schrift** (aktive Navigation, aktiver Menüpunkt, Typ *Primary*, Hot-Simple/-Link).
  - `--fq-accent-tint`/`-tint-2`: gewählte Zeilen und Menüeinträge, `::selection`.
- **Aktueller Ort** = Magenta-Schrift + Magenta-Kante (`--fq-nav-mark-w`, 4 px, eckig) am Zeilenanfang: Navigation, Links-Liste, Mega Menu, ausgewählte Listen-Einträge. Tabs und Menüleiste: Magenta-Unterstrich (`--fq-tab-mark-h`, 3 px).
- **Daten** (Prozentbalken, Charts, Avatare) in Kategoriefarben `--fq-cat-*`, nie im Akzent.
- **Farbpaare immer zusammen setzen (Icon-Kacheln):** Wo UT Fläche und Schrift als zwei Tokens trennt, setzt die Komponente beide am Element (Media List, Timeline, Comments: `--fq-soft` + `--fq-ink`).
- Status: Fläche `--fq-<s>` + Schrift `--fq-<s>-on`; Text `--fq-<s>-text`; Hintergrund `--fq-<s>-tint`. Alerts zeigen ihr Symbol auf einem runden Grund in der Statusfarbe. Warnung nie in Danger-Farbe, Danger nie in Magenta.
- Pflichtfeld: `content: var(--fq-required-mark)`, `color: var(--fq-required-color)`.

### 5.9 RTL und Responsivität

- Logische Eigenschaften. Wo UT physisch setzt, physisch überschreiben **und** `.u-RTL`-Variante liefern.
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (`--js-mq-*`, nur lesen). Kopfhöhe, Seiten- und Tafel-Polster, Titelgrößen werden unter 640 px über Tokens kleiner – nicht in Komponenten nachbauen.
- **Lese-Hebel `--js-sticky-top`:** theme42.js misst `#t_Header` und schreibt die Höhe als Inline-Style an `<html>`. Eigene sticky oder fixierte Elemente unter dem Kopf lesen ihn **immer mit Fallback** (`var(--js-sticky-top, 0px)`); wo 0 px unter den Kopf rutschen ließe, mindestens `--fq-header-h`. Nie setzen (Regel 11).

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; Bitmap-Texturen; Oracle Sans/Redwood-Paletten; Vita-Werte kopieren; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `frequenz-auto.css`; eine Datei zweimal importieren; ein nachgebautes Marken-Logo.

---

## 6. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`. Ausgabeordner immer unter `_tmp/frequenz/`.

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Frequenz` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Frequenz` (Token-Präfix `--fq-` aus `theme.json`) und `node Frequenz/tools/lint-tokens.mjs` | „OK – keine Fehler“ (16 Hinweise: `!important` gegen Oracle-`!important`, Farb-Selektoren der JET-Attribute in viz.css) |
| Token-Verweise | `node Frequenz/tools/check-refs.mjs` | „OK – alle --fq-*-Verweise definiert“ |
| Token-Kontraste, Palette | `node Frequenz/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Frequenz --style light,dark --pages core --out _tmp/frequenz/shots` | ansehen |
| Navigation aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | Magenta-Kante am aktiven Punkt |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 44 px) | Kopf 56 px, Seitenrand 16 px |
| Auto-Äquivalenz | `THEME=Frequenz VERIFY_OUT=_tmp/frequenz/verify bash _tools/verify-auto.sh [seiten] [app]` | alle `GLEICH 0 px` |
| UT 24.2 | `… --app 9242`, `verify-auto.sh … 9242` | ohne Auffälligkeiten |
| Oracle-Blau | `node _tools/audit-blue.mjs --theme Frequenz --pages core --styles light,dark --states --overlays --out _tmp/frequenz/audit-blue.json` | 0 Treffer |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Frequenz --style light,dark --pages all --out _tmp/frequenz/audit` | kein Blau, kein Überlauf, keine JS-Fehler; Kontrast nur bei fest eingefärbtem Demo-CSS (gekappt auf 60 je Seite: 174, vollständig 198 – §7) |
| Kontaktbogen | `node _tools/contact-sheet.mjs --out _tmp/frequenz/sheets/x.png --cols 2 --dir <ordner>` | |
| Doku neu erzeugen | `node Frequenz/tools/build-architecture.mjs` | Tabellen = Quellen |
| README-Bilder | `node Frequenz/tools/screenshots.mjs` | `Frequenz/screenshots/*.png` |

Seiten-Sets (`_tools/testbed-pages.json`): core, shell, regions, lists, reports, components, forms, dialogs, misc.

---

## 7. Bekannte Grenzen und offene Punkte

- **Laufzeit-Audit – Kontrast-Befunde nur bei fest eingefärbtem Demo-CSS der Referenz-App** (Stand 24.09.2026: 111 Seiten × Light/Dark, Blau 0, Überlauf 0, JS 0, **198 Kontrastbefunde**, 22 nicht bewertbar). Gezählt mit einer ungekappten Kopie des Audits: `_tools/audit.mjs` listet höchstens 60 Befunde je Seite und Style und meldet deshalb 174 (6303 dunkel hat 84). Verteilung: hell 22 (6100: 3, 6302: 8, 6307: 11), dunkel 176 (6100: 3, 6302: 6, 6303: 84, 6304: 52, 6307: 11, 6400: 20). Die Seiten färben Code-Beispiele und Farbmuster per Seiten-CSS fest (`#9C27B0` auf Schwarz 3,3, `#FF0000` auf der Tafel 3,6 hell / 4,3 dunkel, `rgba(0,0,0,.55)` auf Schwarz, Deckkraft-Stufen `u-opacity-*` auf Farbfeldern); 6100 setzt den Hilfetext fest auf `#767676` (auf der Tafel 4,1 hell / 3,8 dunkel) und die Vorschaufläche fest auf Weiß (der Standard-Button darauf bleibt dank seiner Fläche `--fq-button-fill` auch im Dark-Style lesbar). **Genauer:** Jede beanstandete *Textfarbe* stammt aus dem Demo-CSS, aber nicht jeder *Grund*. 142 Befunde (6303: 84, 6304: 52, 6400: 6, alle dunkel) stehen in Doku-Tabellen `.u-Report.dm-Report--doc`, deren weißen Grund (`.dm-Report--doc { background: #fff }`, Zellen transparent) Frequenz bewusst übermalt: `.u-Report tr` (reports.css §6) trägt die Zellfläche – sonst stünde die helle Frequenz-Schrift aller übrigen Zellen auf Weiß. Das für Weiß gewählte Violett und Grau der Demo steht dadurch auf Schwarz. Die übrigen 14 dunklen Befunde auf 6400 liegen auf der schwarzen Seite des Dark-Styles. Text über Fotos (3110 Karten, 3005, 423) weist das Audit als „nicht bewertbar“ aus.
- **Akzentfarbe tauschen:** Die Markenfarbe steckt in `--fq-brand` und `--fq-accent*`; wer eine andere Akzentfarbe braucht, ersetzt nur diese Tokens (README, *Anpassen*).
- **Bild-Logos im Magenta-Block** werden per `filter: brightness(0) invert(1)` zur weißen Silhouette. Für farbige Bild-Logos oder Fotos passt das nicht; App-CSS schaltet es ab (`.t-Header-logo-link img { filter: none }`).
- **Lange App-Namen** brechen im Block auf zwei Zeilen um, sobald der Platz nicht reicht (Telefon, volle Navigationsleiste; „Universal Theme“ bei 390 px). Erst was auch in zwei Zeilen nicht passt, kürzt der Block mit Auslassungspunkten (höchstens 22 rem bzw. 60 % der Fensterbreite).
- **Tafel-Regel für verschachtelte Regionen:** Region in Region wird weiß, eine dritte Ebene wieder grau. Tiefere Verschachtelungen (selten) wechseln nicht weiter.
- **Tabellen-Innenfläche:** `.a-IRR` und `.t-Report-tableWrap` schneiden mit `overflow: clip` an ihrem Radius ab. Klebende Köpfe funktionieren weiter (`clip` erzeugt keinen Scroll-Container). Ausnahme *Stretch Report* (`t-Report--stretch`): Dort ist der Wrap 100 % breit und die Tabelle kann breiter werden – der Wrap scrollt waagerecht (`overflow-x: auto`), sonst wären Spalten abgeschnitten. CSS-sticky Tabellenköpfe aus App-CSS kleben in Stretch-Reports deshalb am Wrap statt an der Seite; der fixierte Kopf der Master-Detail-Seite (JS, `t-fht-*`) ist nicht betroffen. Ohne *Stretch* wächst der Wrap mit der Tabelle (UT: `float`), `clip` schneidet dort nichts ab – es scrollt der Region-Körper (*Body Overflow: Scroll*, UT-Standard `t-Region--scrollBody`) oder ohne diese Option die Seite. Geprüft (24.09.2026) mit acht angehängten, nicht umbrechenden Spalten: Standard und *Stretch*, 1440 und 390 px, eigene Standard-Region (mit und ohne *Scroll*) und die Region ohne Polster auf 1412 – die letzte Spalte ist überall erreichbar. Einzige Ausnahme, wie in Vita: Region ohne *Scroll* auf dem Telefon ohne *Stretch* – dort schneidet UT selbst ab (`form#wwvFlowForm { overflow: clip }` unter 640 px); *Stretch Report* scrollt auch dort. Regionen mit *Remove Body Padding* schneiden am Tafel-Radius ab (`bodyWrap` mit `clip`); der Ring-Raum des scrollenden Körpers (regions.css) gilt deshalb nur ohne Tafel (*noUI*) – mit Tafel lag er außerhalb des Schnitts und kostete am Ende einer waagerecht gescrollten Tabelle die letzten 3 px samt rechter Kante.
- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Druck:** hell, Tafeln weiß, ohne Schatten. Vita-Dark-Werte, die die Brücke nicht setzt (Chat, Diagramm), bleiben im Druck des Dark-Styles dunkel (Hintergründe druckt der Browser standardmäßig nicht).
- **Bewusst entfallene Template-Option „Label Alignment: Right“:** Labels stehen immer linksbündig (forms.css).
- **Nicht im Testbett vorhanden** und daher nur per Markup-Analyse geprüft: Rich Text Editor (CKEditor 5), Markdown-Live-Modus, IG-Bearbeitungsmodus mit echten Daten, Pull-out-Drawer oben/unten.
