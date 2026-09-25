# Frequenz – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: weiße Seite, hellgraue Tafeln mit großen Radien, ein Magenta-Block oben links, der den App-Namen trägt; kräftige Überschriften in Onest (800), Kontur-Buttons mit 4 px Radius, runde Icon-Buttons, eine Magenta-Kante am aktiven Navigationspunkt. Dunkel: Schwarz mit grauen Tafeln.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Frequenz/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: {{DATE}}. Änderungen am Text nur in der Vorlage.

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

{{FARB}}

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

{{KAT}}

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Frequenz ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--fq-cat-N) 60%, #fff)` mit Text `--fq-on-light`, 31–45 = `color-mix(in srgb, var(--fq-cat-N) 55%, #000)` mit Text `--fq-on-dark`. So scheint keine Vita-Farbe durch. Die Textklassen `.u-color-N-text` mischen Anthrazit bei, bis ≥ 4,5 : 1 auf Seite und Tafel erreicht ist (`tools/gen-color-text.mjs`).

### 3.4 Maß-, Schrift-, Radius-, Dichte- und Fokus-Tokens (modusneutral)

{{SKALA}}

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--fq-control-h 2.75rem`, `--fq-control-h-sm 2.25rem`, `--fq-control-h-lg 3rem`, `--fq-row-h 2.75rem`, `--fq-head-h 2.75rem`, `--fq-hit-min 2.75rem`, `--fq-checkbox-size 1.25rem`.

**Radien als Hierarchie, nicht ein Radius für alles:** Buttons, Felder, Checkboxen 4 · Menüeinträge 6 · Tabellen-Innenflächen, Menüs, Popups 10 · Karten, Dialoge, verschachtelte Tafeln 16 · Tafeln (Regionen) 24 · Hero und Login 40 · Pillen (Chips, Badges, Tab-Pillen, runde Icon-Buttons, Avatare) voll gerundet.

Druck (`tokens/print.css`, nur `print`): Tafeln und abgesenkte Flächen weiß, alle Schatten weg, `--fq-page-pad-x 0`; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare der Tabelle (Feld- und Button-Kanten, Magenta-Marken, Fokus) ≥ 3 : 1 – in hell **und** dunkel (`node Frequenz/tools/check-tokens.mjs`). Linien sind keine UI-Paare: Haarlinien und die kräftige Linie `--fq-line-strong` (Tabellenkopf, Kante der *Simple*-Buttons) liegen bewusst darunter (hell 2,1 : 1) – Simple-Buttons erkennt man an der Beschriftung.

{{KONTRAST}}

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
