# Universal Theme – Anatomie der Daten- und Report-Komponenten

Dieses Dokument ist für alle, die eigene Theme Styles auf Basis des Universal Theme (UT, Theme 42) bauen. Nach dem Muster
„Vita bzw. Vita-Dark als Basis + eigenes Token-/Komponenten-CSS“ beschreibt es für jede Daten-Komponente:

- DOM-Kurzstruktur,
- die steuernden Variablen,
- hart codierte Farben und in welcher Datei sie stehen,
- was Vita-Dark zusätzlich anpasst (und was es vergisst),
- Fallstricke und passende CSS-Beispiele.

**Basis der Untersuchung**

- Quelldateien unter `_reference/`: `app_ui/css/Core.css`, `app_ui/css/Theme-Standard.css`, `ut-26.1/css/{Core,Vita,Vita-Dark,Redwood}.css`, `ut-24.2/css/*`, `ut-26.1/js/theme42.js`.
- Live-Messungen in App 9042 (UT 26.1) und stichprobenartig in App 9242 (UT 24.2), beide auf APEX-26.1-Runtime.
- Werkzeug: Chrome über CDP (`CSS.getMatchedStylesForNode`). Damit ist zu jeder gemessenen Eigenschaft die gewinnende Regel
  mit Datei, Selektor und Rohwert bekannt. Skripte liegen unter `_tmp/research/reports/` (siehe Anhang).
- Vita-Dark wurde mit einem leeren Recherche-Style gemessen (`_tmp/research/reports/basetheme`, Basis `Vita-Dark`, kein eigenes CSS).

**Kennzeichnung der Aussagen**

- **[LV]**: live verifiziert (gemessen und/oder im Screenshot geprüft).
- **[CSS]**: aus den Quelldateien abgeleitet, nicht live ausgelöst (z. B. Edit-Modus im IG, weil das Demo-IG read-only ist).
- **[unverifiziert]**: plausible Vermutung ohne Beleg.

Ergänzend dazu: `_docs/ut-tokens.md` enthält die vollständige Token-Landkarte, `_docs/ut-shell.md` die Seitenhülle.

---

## Inhalt

0. [Kurzfassung](#0-kurzfassung)
1. [Woher die Styles kommen: Schichten und Ladereihenfolge](#1-woher-die-styles-kommen)
2. [Globale Token, die alle Reports steuern](#2-globale-token-die-alle-reports-steuern)
3. [Classic Report (1401)](#3-classic-report-1401)
4. [Interactive Report (1402)](#4-interactive-report-1402)
5. [Interactive Grid (1410)](#5-interactive-grid-1410)
6. [Die vier Pagination-Systeme](#6-die-vier-pagination-systeme)
7. [Faceted Search, Smart Filters, Chips, Search Region (1411–1413)](#7-faceted-search-smart-filters-chips-search-region)
8. [Cards: Legacy `t-Cards` (3100) und Card Regions `a-CardView` (3110)](#8-cards)
9. [Template Components und Listen-Reports](#9-template-components-und-listen-reports)
10. [List View, Reflow, Column Toggle (1700/1710/1720)](#10-list-view-reflow-column-toggle)
11. [Visualisierung: Charts, Calendar, Map, Tree](#11-visualisierung)
12. [Dark Mode: Was Vita-Dark anpasst und was es vergisst](#12-dark-mode)
13. [Unterschiede UT 24.2 ↔ 26.1](#13-unterschiede-ut-242--261)
14. [Starter-CSS und Checkliste für Reports](#14-starter-css-und-checkliste)
15. [Anhang: Recherche-Artefakte](#15-anhang)

---

## 0. Kurzfassung

1. **Drei Quellen mit sehr unterschiedlicher Theme-Fähigkeit.**
   - `ut-26.1/css/Core.css` (Templates `t-Report`, `t-Cards`, Template Components …) ist in den Report-Abschnitten vollständig variablengesteuert. In den Abschnitten *Report*, *IRR/IG/FS/CardView*, *Timeline*, *Content Row*, *Comments*, *Media List*, *Metric Card*, *Badge List*, *AVP*, *List View*, *Calendar*, *Oracle JET* und *FullCalendar* steht keine einzige hart codierte Farbe.
   - Die Widgets (IG, IR, Chips, Faceted Search, Card View, Tree, Toolbar) stammen aus `app_ui/css/Core.css` und `app_ui/css/Theme-Standard.css`. Dort gibt es noch viele Hex-Werte, entweder als `var()`-Fallback oder fest verdrahtet.
2. **Vita.css setzt einige Report-Farben per Selektor, nicht per Token.** Wichtigstes Beispiel: `.a-IRR-header { background-color:#fafafa }` sowie `:hover #f2f2f2` in Vita und `#202223`/`#27292b` in Vita-Dark. `--a-gv-header-background-color` wirkt deshalb auf IG-Header und Classic-Report-Header, **nicht** auf IRR-Header [LV].
3. **Kopplungen in Vita.** Zwei Beobachtungen:
   - `--a-gv-header-background-color` und `--a-toolbar-background-color` verweisen beide auf `--ut-region-header-background-color`. Wer den Region-Header einfärbt, färbt damit auch IG/IR-Toolbars und Grid-/Report-Header [LV].
   - `--a-gv-background-color`, `--a-cv-background-color` und `--a-resultsitem-background-color` sind **nicht** an `--ut-region-background-color` gekoppelt, sondern eigene Hex-Werte. Sie müssen separat gesetzt werden.
4. **Ein einziger Hebel für die Auswahlfarbe.** `--a-gv-selected-background-color` steuert markierte Zeilen in IG und IR sowie die Auswahl in Media List, Timeline, Content Row, Comments, Metric Card und in der IG-Grand-Total-Zeile [LV/CSS]. Vita definiert den Token nicht, deshalb greift der Fallback `--a-palette-primary-shade`: in Vita `#e6f0fa`, in Vita-Dark `#010b14` (fast schwarz, kaum sichtbar) [LV].
5. **Dark-Mode-Lücken in Vita-Dark (belegt).**
   - IG-Pagination: Die gewählte Seite ist weiß auf `#E0E0E0` und damit unlesbar [LV].
   - `.a-GV-status` bleibt `#707070` [LV].
   - Die Splitter-Leiste in IG-Dialogen ist hell (`#EAEAEA`) [LV].
   - Der Tree im Inhalt übernimmt die Navigationsfarben: Auswahl `#171a1d` auch im hellen Style [LV]. Der Hover `rgba(0,0,0,.05)` ist im Dark Mode unsichtbar [LV].
   - JET-Dial-Gauge: `#393737` auf `#1b1d1e` [LV].
   - Search-Result-Items sind reines `#000` [LV].
   - Die `--fc-*`-Werte in Vita-Dark (`:root`) sind für FullCalendar 5 wirkungslos [LV].
   - Pivot- und Single-Row-Ansicht des IR behalten helle Hex-Hintergründe [CSS].
6. **Charts sind per CSS-Variable themebar, aber nur beim Rendern.** JET liest die Serienfarben aus den Klassen `.oj-dvt-category1…12`, die UT Core auf `--u-color-1/4/7/9/12/3/8/10/2/5/11/6` mappt. Textfarben kommen aus `--oj-core-text-color-primary/secondary`. Beides ist verifiziert: `--u-color-1` auf Magenta ergibt Balken in Magenta [LV]. Gitterlinien sind JET-JS-Defaults und über `--oj-core-divider-color` nicht erreichbar [LV]; die Gauge-Farbe `#393737` steht in keiner CSS-Datei (vermutlich JS-Default, [unverifiziert]).
7. **Scope-Fallen.**
   - UT Core definiert `--fc-*` auf `.apex-fullcalendar-5`. Werte auf `:root` greifen dort nicht; man muss `.apex-fullcalendar-5` ansprechen [LV].
   - `.a-IRR-button--pagination` setzt lokal `--a-button-border-radius:100%`. Ein globaler Button-Radius erreicht diese Buttons deshalb nicht [LV].
   - Die MapLibre-CSS wird **nach** dem Theme-CSS geladen und gewinnt bei gleicher Spezifität [LV].
   - JET-CSS (`oj-redwood-notag-min.css`) und die FullCalendar-Styles (`<style data-fullcalendar>`) laden dagegen **vor** app_ui [LV].

---

## 1. Woher die Styles kommen

### 1.1 Ladereihenfolge (gemessen, App 9042)

| Pos. | Datei | Anmerkung |
|---|---|---|
| (0) | `<style data-fullcalendar>` | nur Kalenderseiten; per JS ganz vorn in `<head>` eingefügt (266 Regeln via CSSOM) [LV] |
| (0) | `/i/libraries/oraclejet/20.0.2/css/libs/oj/20.0.2/redwood/oj-redwood-notag-min.css` | nur Seiten mit JET (Charts, IG, Faceted Search), vor app_ui [LV] |
| 1 | `/i/app_ui/css/Core.min.css` | Widget-Struktur: IG, IR, GV, Chips, FS, CardView, Toolbar, Tree, Menüs, Dialoge |
| 2 | `/i/app_ui/css/Theme-Standard.min.css` | Default-Tokens (`--a-*`) **und** eine Reihe fest verdrahteter Farben |
| 3 | `font-apex.min.css` | Icons |
| 4 | `/i/themes/theme_42/<ver>/css/Core.min.css` | UT-Templates (`t-*`), Brücke `--ut-*` → `--a-*` |
| 5 | `/i/themes/theme_42/<ver>/css/Vita.min.css` bzw. `Vita-Dark.min.css` | Token-Werte, einige harte Selektoren |
| 6 | eigenes Bundle (`theme.min.css`) | unser Style |
| (7) | `/i/libraries/maplibre-gl-js/5.6.1/maplibre-gl-apex.css` | nur Map-Seiten; steht im Dokument **nach** dem Theme-CSS [LV] |

Hinweis: `app_ui` kommt immer aus der Runtime. In beiden Testbetten ist das `app_ui` 26.1. Auf einer echten APEX-24.2-Instanz läge das `app_ui` von 24.2 darunter [unverifiziert, keine Referenzdatei vorhanden].

### 1.2 Muster in den Quellen

- **app_ui Core.css** nutzt `var(--a-…, <px-Fallback>)`. Die Fallbacks sind meist px-Werte oder helle Farben, etwa `var(--a-gv-footer-background-color,#fff)`. Wenn ein Token fehlt, schlägt der helle Fallback durch.
- **Theme-Standard.css** setzt die `--a-*`-Defaults auf `:root` und enthält ab Zeile 465 **fest verdrahtete Regeln** für GridView, IG-Dialog und IRR-Dialog, etwa `.a-GV-columnControls .a-Button{background-color:#F4F4F4;color:#707070}`. Vita und Vita-Dark überschreiben davon nur einen Teil (siehe §12).
- **UT Core.css** verwendet Hook-Ketten wie `var(--ut-report-header-cell-background-color, var(--a-gv-header-background-color))`. Jede Komponente hat eigene `--ut-<komponente>-*`-Hooks, die auf die generischen `--ut-component-*`-Token zurückfallen. Die Hooks selbst sind in Vita **fast nie gesetzt** und damit frei für eigene Themes.
- **Vita.css / Vita-Dark.css** setzen Token-Werte in mehreren `:root`-Blöcken; bei Doppelungen gewinnt der letzte (siehe `--a-cv-*` in §8). Dazu kommen einige Komponenten-Selektoren mit Hex-Werten (siehe §12.2).

---

## 2. Globale Token, die alle Reports steuern

Werte aus `ut-26.1/css/Vita.css` und `Vita-Dark.css`. Die Werte für 24.2 sind identisch (siehe §13).

| Token | Vita | Vita-Dark | wirkt auf |
|---|---|---|---|
| `--ut-component-background-color` | `white` | `#1b1d1e` | Fallback fast aller Template Components, Legacy-Cards, Calendar-Seite (`--fc-page-bg-color`) |
| `--ut-component-border-color` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.15)` | Rahmen IG/IR (`--a-gv-border-color`), FS-Trenner, Toolbar-Rahmen, Kalender-Linien |
| `--ut-component-inner-border-color` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` | List-View-Trenner, Toolbar-Separator (`--a-toolbar-sep-border-color`) |
| `--ut-component-text-default-color` / `-muted-color` | `#000` / `rgba(0,0,0,.65)` | `#fff` / `rgba(255,255,255,.65)` | Texte in Template Components, JET-Text (`--oj-core-text-color-*`) |
| `--ut-component-toolbar-background-color` | `rgba(0,0,0,.025)` | `rgba(255,255,255,.025)` | IR-Aggregatzeile, IG-Dialog-Seitenleiste, Radio-Icon-Liste |
| `--ut-component-highlight-background-color` | `rgba(0,0,0,.025)` | `rgba(255,255,255,.025)` | Hover in Media List, Streifen in `u-Report` (Reflow) |
| `--ut-component-badge-background-color` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` | `t-Badge`, List-View-Zähler |
| `--ut-region-header-background-color` | `white` | `#111213` | **zusätzlich** `--a-gv-header-background-color` (Vita.css Z. 451) und `--a-toolbar-background-color` (Z. 302), also IG-/IR-Toolbar, IG-Header und Classic-Report-Header [LV] |
| `--a-gv-background-color` | `white` | `#1b1d1e` | Fläche von IG und IR (Theme-Roller „Interactive Reports / Background“) |
| `--a-gv-cell-border-color` | `#e6e6e6` | `#323435` | Zellrahmen IG/IR |
| `--a-gv-header-cell-border-color` | `#e6e6e6` | `#333639` | Header-Rahmen IG/IR |
| `--a-gv-row-hover-background-color` | `#f9f9f9` | `#060606` | Hover in IG und IR |
| `--a-gv-selected-background-color` | *(nicht gesetzt → `--a-palette-primary-shade` = `#e6f0fa`)* | *(→ `#010b14`)* | Auswahl in IG/IR/Media List/Timeline/Content Row/Comments/Metric Card, Grand-Total-Auswahl |
| `--a-gv-header-text-color`, `--a-gv-text-color` | *(nicht gesetzt → geerbt)* | *(geerbt)* | Kopf- und Zelltext in IG/IR/`u-Report`; Redwood setzt den Header z. B. auf `--ut-component-text-muted-color` |
| `--ut-link-text-color` | `#056AC8` | `#349bfa` | **Spaltenüberschriften von Classic Report und IR** (sie sind `<a>`) [LV] |
| `--ut-palette-primary` / `-shade` | `#056AC8` / `#e6f0fa` | `#056AC8` / `#010b14` | Fokus-Rahmen im Grid (über `--a-palette-primary`), Hot-Buttons, Chip-Auswahl, Kalender-Events |
| `--u-color-1 … 45` | Hex-Palette | **identisch** | Chart-Serien, `u-colors`-Zyklus (Cards, Avatare, Badge List, Search Results) |

Weitere Werte in `_docs/ut-tokens.md`, Abschnitt 10.15.

---

## 3. Classic Report (1401)

### 3.1 DOM [LV]

```
div.t-Report.t-Report--stretch.t-Report--altRowsDefault.t-Report--rowHighlight   ← Template-Optionen
  div.t-Report-wrap                                   (float:left; bei --stretch float:none)
    table.t-Report-pagination                         (obere Pagination, leer → td:empty ausgeblendet)
    div.t-Report-tableWrap                            (theme42.js: setTableHeadersAsFixed() → .t-fht-*)
      table.t-Report-report
        thead > tr > th.t-Report-colHead[aria-sort]
                       div.u-Report-sort > span.u-Report-sortHeading > a.a-Report-SortHeading-Anchor--event
                                         + span.u-Report-sortIcon.a-Icon.icon-rpt-sort-asc
        tbody > tr > td.t-Report-cell[headers]
    div.t-Report-links                                (Export-/CSV-Links, :empty → none)
    table.t-Report-pagination.t-Report-pagination--bottom
```

### 3.2 Template-Optionen → Klassen → Wirkung (`ut-26.1/css/Core.css` Z. 13886–14123)

| Option (Seite 1401) | Klasse | CSS-Wirkung |
|---|---|---|
| Stretch Report | `t-Report--stretch` | `.t-Report-wrap`, `.t-Report-report {width:100%}` |
| Alternating Rows: Enable | `t-Report--altRowsDefault` | `tr:nth-child(odd) { --ut-report-cell-background-color: var(--ut-report-cell-alt-background-color) }` |
| Alternating Rows: Disable | `t-Report--staticRowColors` | `tr:nth-child(odd) { --ut-report-cell-background-color: transparent }` |
| Row Highlighting: Enable | `t-Report--rowHighlight` | `tr:hover { --ut-report-cell-background-color: var(--ut-report-cell-hover-background-color) }` |
| Row Highlighting: Disable | `t-Report--rowHighlightOff` | **keine eigene CSS-Regel**; die Klasse schaltet nur den Hover-Selektor ab |
| Report Border: Horizontal Only | `t-Report--horizontalBorders` | linke/rechte Zellrahmen = 0 |
| Vertical Only | `t-Report--verticalBorders` | obere/untere Rahmen der Zellen = 0 |
| No Borders | `t-Report--noBorders` | setzt `--ut-report-border-width`, `-links-border-width`, `-header-cell-border-width` und `-cell-border-width` auf 0 |
| No Outer Borders | `t-Report--inline` | `--ut-report-border-width:0; --ut-report-border-style:hidden` (gilt auch für `.t-Region--noPadding .t-Report--horizontalBorders`) |
| Advanced: Hide pagination … | `t-Report--hideNoPagination` | nur JS: `theme42.js` Z. 1941 blendet `.t-Report-pagination` aus, wenn kein `.t-Report-paginationLink` existiert |

### 3.3 Variablen (Hooks in UT Core; Vita setzt nur die ersten drei, dazu `--ut-report-header-background-color` für `u-Report`, siehe §10)

| Variable | Vita | Vita-Dark | Fallback in Core |
|---|---|---|---|
| `--ut-report-cell-border-color` | `#e6e6e6` | `#333639` | `--ut-component-inner-border-color` |
| `--ut-report-cell-hover-background-color` | `#fafafa` | `#202223` | – |
| `--ut-report-cell-alt-background-color` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` | – |
| `--ut-report-header-cell-background-color` | – | – | `--a-gv-header-background-color` (Vita: = Region-Header) |
| `--ut-report-header-cell-font-weight` / `-font-size` / `-padding-x/-y` | – | – | `700` / `.75rem` / `.75rem` |
| `--ut-report-cell-font-size` / `-line-height` / `-padding-x` / `-padding-y` | – | – | `.75rem` / `1rem` / `.75rem` / `.5rem` |
| `--ut-report-cell-background-color` | – | – | `transparent` (die Tabelle hat **keinen eigenen Hintergrund**) |
| `--ut-report-border-color/-width/-style` | – | – | Zellrahmen / 1px / solid |
| `--ut-report-links-*` | – | – | Zellwerte |
| `--ut-report-pagination-*` (Link-BG, -Text, -Hover, -Radius, -Padding) | – | – | Hover und aktive Seite: `--ut-palette-primary` / `-contrast` |

Gemessen in Vita [LV]: Header `bg #fff` (= Region-Header), Kopfzeilentext als Link `#056AC8`, ungerade Zeile `rgba(0,0,0,.05)`, Rahmen `#e6e6e6`, Zelle 12px/8px-Padding.
In Vita-Dark: Header `#111213`, Link `#349bfa`, ungerade Zeile `rgba(255,255,255,.1)`, Rahmen `#333639`.

### 3.4 Fallstricke

- **Blaue Spaltenköpfe.** `.t-Report-colHead` setzt keine eigene Textfarbe. Die sortierbaren Köpfe sind `<a>` und nehmen deshalb `--ut-link-text-color` an [LV]. Wer neutrale Köpfe möchte, braucht `.t-Report-colHead a { color: inherit; }`.
- **Keine Tabellenfläche.** Nur die Streifen und der Hover färben die Zellen. Der Hintergrund kommt aus der umgebenden Region oder dem ContentBlock.
- **Streifen im Dark Mode relativ kräftig** (`rgba(255,255,255,.1)`), der Hover ist dagegen dunkler (`#202223`) [LV].
- **Fixierte Kopfzeilen.** `theme42.js` klont Kopfzeilen in `.t-fht-thead`. Stile auf `.t-Report-colHead` wirken auf beide Kopien. `.t-fht-thead.is-stuck` bekommt einen Rahmen-Schatten aus den Header-Border-Tokens.
- **Kein Radius-Hook.** Für runde Ecken braucht es `.t-Report-report { border-collapse: separate; border-spacing:0 }` plus Radius an den Eckzellen, denn `border-collapse: collapse` verträgt keinen Radius.

```css
/* Beispiel: ruhige, "nicht-APEX" Tabelle */
.t-Report {
  --ut-report-cell-border-color: var(--my-line);
  --ut-report-cell-alt-background-color: transparent;          /* Streifen aus */
  --ut-report-cell-hover-background-color: var(--my-hover);
  --ut-report-header-cell-background-color: transparent;
  --ut-report-header-cell-font-weight: 600;
  --ut-report-cell-padding-y: .625rem;
}
.t-Report-colHead,
.t-Report-colHead a { color: var(--my-text-muted); text-transform: uppercase; letter-spacing: .04em; }
```

---

## 4. Interactive Report (1402)

### 4.1 DOM [LV]

```
div.t-IRR-region(.t-IRR-region--noBorders|--hideHeader|--removeHeader)   Region-Template "Interactive Report"
  h2.t-IRR-title (standardmäßig display:none)
  div.a-IRR-container.a-IRR-searchMode--row
    div.a-IRR
      div.a-IRR-singleRowView
      div.a-IRR-fullView
        div.a-IRR-toolbar
          div.a-IRR-controls
            div.a-IRR-controlGroup.a-IRR-controlGroup--search
              div.a-IRR-search
                div.a-IRR-colSelector > button.a-Button.a-IRR-button.a-IRR-button--colSearch
                div.a-IRR-searchFieldContainer > input.a-IRR-search-field + span.a-IRR-clearButton
                div.a-IRR-searchButtonContainer > button.a-Button.a-IRR-button--search ("Go")
            div.a-IRR-controlGroup--views     (Ansichtswechsel Icon/Report/Detail)
            div.a-IRR-controlGroup--options > div.a-IRR-actions > button.a-IRR-button--actions
          (div.a-IRR-buttons)                 (Buttons "Right of IR Search Bar")
        div.a-MediaBlock.a-IRR-controlsContainer.a-Collapsible   ← erst bei Filtern
          …a-IRR-controls > li.a-IRR-controls-item.a-IRR-controls-item--search|--filter|--highlight|…
             span.a-IRR-controls-cell (Checkbox) | span.a-IRR-controls-cell (Icon-Kachel) |
             span.a-IRR-controls-cell--label > span.a-IRR-controlsLabel | …--remove > button.a-IRR-button--remove
        div.a-IRR-content
          div.a-IRR-chartView | a-IRR-groupByView | a-IRR-pivotView | a-IRR-reportView
            div.a-IRR-tableContainer > table.a-IRR-table
              tbody > tr > th.a-IRR-header(.u-tL) > a.a-IRR-headerLink      (Kopfzeile liegt IM tbody)
              tbody > tr > td
            div.a-IRR-paginationWrap.a-IRR-paginationWrap--bottom > ul.a-IRR-pagination
              li.a-IRR-pagination-item > span.a-IRR-pagination-label | button.a-IRR-button--pagination
body > div.a-IRR-sortWidget.u-DisplayNone   ← Spaltenkopf-Menü, an <body> gehängt; sichtbar per inline style="display:block"
          ul.a-IRR-sortWidget-actions > li > button.a-IRR-sortWidget-button (asc/desc/hide/break …)
          div.a-IRR-sortWidget-help | div.a-IRR-sortWidget-search > input.a-IRR-sortWidget-searchField
          div.a-IRR-sortWidget-rows > a.a-IRR-sortWidget-row
body > div#<region>_actions_menu.a-Menu    ← Actions-Menü (app_ui Menü, Tokens --a-menu-*)
body > div.ui-dialog.a-IRR-dialog.a-IRR-dialog--filter|--highlight|--sort|--download|…  (jQuery UI)
```

Wichtig für Selektoren:

- Sort-Widget und Actions-Menü hängen an `<body>` und liegen damit **außerhalb** der Region. Ein Scope wie `.t-IRR-region .a-Menu` greift nicht.
- Das Sort-Widget behält die Klasse `u-DisplayNone` auch dann, wenn es sichtbar ist [LV].

### 4.2 Variablen, die das IR steuert

| Bereich | Variablen (Vita-Wert) |
|---|---|
| Container | `--a-gv-background-color` (`white`), `--a-gv-border-color` (`--ut-component-border-color`), `--a-gv-border-width`, `--a-gv-border-radius` (UT Core `.a-IRR{--a-gv-border-radius:.125rem}`), `--a-gv-font-size` (`.75rem`) |
| Toolbar | `--a-toolbar-background-color` (= Region-Header-BG), `--a-toolbar-border-color`, `--a-toolbar-sep-border-color`, `--a-irr-item-spacing`/`--a-toolbar-item-spacing` (`.5rem`) |
| Suchfeld | `--a-field-input-*` (bg `#f9f9f9`, Rahmen `#dfdfdf`), `--a-report-controls-input-*` (Padding, Fokusrahmen), `--a-report-controls-search-width` (210px) |
| Buttons | `--a-button-*` (Toolbar-Buttons sind `.a-Button` und nutzen die globalen UT-Button-Token) |
| Kopfzeile | `--a-gv-header-cell-height` (`2.5rem`), `-padding-x/-y` (`.5rem/.25rem`), `-font-weight`, `-border-color`; **Hintergrund siehe 4.3** |
| Zellen | UT Core `.a-IRR{--a-gv-cell-padding-y:.5rem;--a-gv-cell-padding-x:.75rem}`, `--a-gv-cell-border-color`, `--a-gv-cell-height` (`2rem`), `--a-gv-row-hover-background-color` |
| Auswahl (Row Selection 24.x+) | `--a-gv-selected-background-color` → `--a-palette-primary-shade`, `--a-cr-checkbox-*` |
| Pagination | `--a-gv-footer-padding-x/-y`, Buttons: `.a-Button` + lokale Overrides (siehe 4.4) |
| Report-Controls (Filterleiste) | `--a-report-controls-*` (Padding, Rahmen, Label-BG `white`/`#1b1d1e`, Label-Text, Label-Breite 18.75rem, Radius), Icon-Kachel `--a-report-controls-cell-label-icon-background-color` pro Typ |
| Menüs | `--a-menu-*` (Sort-Widget: `--a-menu-background-color`, `-border-color`, `-shadow`, `-focused-*`) |
| Dialoge | `--jui-dialog-*` (Vita setzt die meisten, siehe `ut-tokens.md` §10.14) |
| No-Data | `--a-gv-nodata-message-*` |

### 4.3 Hart codiert (belegt)

| Wo | Selektor | Wert Vita / Vita-Dark | Folge |
|---|---|---|---|
| **Vita.css** Z. 3210 | `.a-IRR-header` | `#fafafa` / `#202223` | `--a-gv-header-background-color` wirkt **nicht** auf IR-Köpfe [LV, Test mit rotem Token] |
| Vita.css Z. 3213 | `.a-IRR-header:hover` | `#f2f2f2` / `#27292b` | |
| Vita.css Z. 3223 | `.a-IRR-header--group` | `whitesmoke` / `#252729` | Control-Break-Köpfe |
| Vita.css Z. 3217 | `.a-IRR-header.is-active, .a-GV-header.is-active` | `--a-menu-background-color` / `--a-menu-text-color` | Kopf mit offenem Menü nimmt die Menüfarbe an |
| Vita.css Z. 3189 | `.a-IRR-button--controls` | `--a-button-background-color:#f8f8f8` / `#494a4b` | Auf-/Zuklappen der Filterleiste |
| Vita.css Z. 3247–3341 | `.a-IRR-controls-item--search/--filter/--highlight/…` | Icon-Kachel `#4AA4EC`, `#24CB7F`, `#FFBE2A`, `#3B83BD`, `#9EA7AD`, `#BDC3C7`; Hover-Label je Typ (Dark: eigene dunkle Werte) | bunte Filter-Chips (identisch mit app_ui Z. 13721 ff.) |
| app_ui Core Z. 8616 | `.a-IRR-button.a-IRR-button--pagination:hover` | `background:#4696fc; color:#FFF` (0,3,0) | Hover-Blau unabhängig von der Primärfarbe [LV, beide Styles] |
| app_ui Core Z. 8608 | `.a-IRR-button--pagination` | lokal `--a-button-border-radius:100%`, Padding 2px | runde Pfeil-Buttons; ein globaler Radius wirkt nicht [LV] |
| app_ui Core Z. 8371/8383 | `.a-IRR-header--group` (Rand `#E8E8E8`), `.a-IRR-header--pivotRow/--pivotColumn` `#F8F8F8` | nicht überschrieben | Pivot-Köpfe sind im Dark Mode hell [CSS] |
| app_ui Core Z. 8684–8741 | Single Row View: `.a-IRR-singleRow-link` `#F8F8F8`/`#E8E8E8`/`#F0F0F0`, `-name` `#FCFCFC`, Icon `#B0B0B0` | nicht überschrieben | Detailansicht im Dark Mode hell [CSS] |
| app_ui Core Z. 8242 | `.a-IRR-sortWidget-help` | `#fff` / `#000` | Spalten-Hilfetext im Sort-Widget ist im Dark Mode weiß [CSS] |
| app_ui Core Z. 8209, 8496 | `.a-IRR-sortWidget-searchIcon` `#C0C0C0`, `.a-IRR-headerSort` `#909090` | nicht überschrieben | |
| app_ui Core Z. 13547 | `.a-IRR-button--remove:hover` | `--a-button-text-color:#F00` | rotes „x“ an Filtern |
| app_ui Core Z. 9395–9489 | Compute-Dialog-Tastatur/Tabelle | `rgba(0,0,0,…)` | im Dark Mode kaum Kontrast [CSS] |
| Theme-Standard Z. 737–825 | IR-Dialog-Icon-Listen, `.a-IRR-dialogList a:hover` (primary) | teils `#fff !important` | Vita überschreibt nur Rahmen und Box-Shadow |

Vita bzw. UT Core korrigieren dagegen:

- `.a-IRR-rowSelector label` → muted (UT Core Z. 13024),
- `.a-IRR-sortWidget-searchLabel:before` / `-searchField` → Field-Token (Vita Z. 3227 ff.),
- `.a-IRR-aggregate` → Toolbar-BG (UT Core Z. 12987),
- `.a-IRR-dialogList`, `.a-IRR-dialogListContainer .u-Form-label` → Component-Token.

### 4.4 Weitere Fallstricke

- **Kopf und Zellen fluchten nicht.** Die Zellen haben `padding-inline .75rem` (UT Core `.a-IRR`), der Kopflink nutzt `--a-gv-header-cell-padding-x` = `.5rem`. Der Kopftext beginnt also 4px weiter links als der Zelltext [LV]. Abhilfe: `.a-IRR { --a-gv-header-cell-padding-x: var(--a-gv-cell-padding-x); }`
- **Kopfzeile im `<tbody>`.** Die Header-Zeile ist eine normale `tr` mit `th.a-IRR-header`. Ein Selektor wie `.a-IRR-table tr:hover td` trifft sie nicht, weil sie keine `td`-Zellen hat.
- **Filter-Dialog.** Die Tabs sind `.a-IRR-radioIconList-item`; aktiv markiert durch `box-shadow: inset var(--ut-palette-primary) 0 2px 0 0` (Vita Z. 3182).
- **Button-Leiste der Dialoge.** `--jui-dialog-buttonpane-background-color` kommt aus Theme-Standard (`rgba(0,0,0,.025)`) und ist auch in Vita-Dark schwarz getönt [LV].
- **Maximieren (Template-Option).** `theme42.js` (Z. 1404–1446) misst Toolbar-, Controls- und Pagination-Höhe und setzt `.t-fht-tbody` fest. Keine Höhen per `transform` oder Animation verändern.

```css
/* IR: Kopf eigenständig färben (Token allein reicht NICHT) */
.a-IRR-header            { background-color: var(--my-grid-head-bg); }
.a-IRR-header:hover      { background-color: var(--my-grid-head-hover); }
.a-IRR-header--group     { background-color: var(--my-grid-group-bg); border-top-color: var(--my-line); }
.a-IRR-headerLink        { color: var(--my-text-muted); }
.a-IRR { --a-gv-header-cell-padding-x: var(--a-gv-cell-padding-x); }
.a-IRR-button.a-IRR-button--pagination { --a-button-border-radius: var(--my-radius-sm); }
.a-IRR-button.a-IRR-button--pagination:hover { background-color: var(--my-accent); color: var(--my-on-accent); }
```

---

## 5. Interactive Grid (1410)

### 5.1 DOM [LV]

```
div.a-IG                                         (border: --a-gv-border-*; bg: --a-gv-background-color; KEIN border-radius)
  div.a-IG-header.js-stickyWidget-toggle         (bg --a-toolbar-background-color, border-bottom)
    div.a-Toolbar
      div.a-Toolbar-groupContainer--start
        div.a-Toolbar-group.a-Toolbar-group--search.a-Toolbar-group--together
          button.a-Button.a-Toolbar-item (Spaltenwahl) | input.a-Toolbar-inputText | button.a-Button ("Go")
        div.a-Toolbar-group > select.a-Toolbar-selectList (versteckt) | button "Actions" | "Edit" | "Save" …
      div.a-Toolbar-groupContainer--end > … button "Reset"
  div.a-IG-body
    div.a-MediaBlock.a-IG-controlsContainer     (wie beim IR, Klassen a-IG-controls-*)
    div.a-IG-contentContainer
      div.a-IG-gridView.a-GV.a-GV-dataEntryMode--cell[role=grid]  (.a-GV--editMode im Edit-Modus)
        div.a-GV-hdr.a-GV-hdr--fixed           (::after = Schattenverlauf rgba(0,0,0,.1))
          div.a-GV-w-frozen | div.a-GV-w-hdr > table.a-GV-table > thead > tr.a-GV-row
                                                  > th.a-GV-header(.u-tS/.u-tE/.is-readonly) > span.a-GV-headerLabel
        div.a-GV-bdy
          div.a-GV-noDataMsg.a-GV-altMessage | div.a-GV-moreDataMsg
          div.a-GV-w-scroll > table.a-GV-table > tbody > tr.a-GV-row(.is-selected|.is-hover|.is-updated|…)
                                                           > td.a-GV-cell(.is-focused|.is-active|.is-changed|.is-readonly)
        div.a-GV-footer                          (u-DisplayNone solange nicht benötigt; sticky)
          div.a-GV-stateIcons | div.a-GV-status | div.a-GV-pagination
             button.a-GV-pageButton.a-GV-pageButton--nav.a-Button (first/prev/next/last)
             span.a-GV-pageSelector > ul.a-GV-pageSelector-list > li.a-GV-pageSelector-item(.is-selected) > button.a-GV-pageButton
             span > span.a-GV-pageRange
        div.a-GV-columnControls > button.a-Button.js-asc / .js-desc   (erscheint beim Hover über einer Kopfzelle)
        div.a-GV-columnHandle
      div.a-IG-recordView.a-RV                   (Single-Row-View, eigene Toolbar .a-RV-toolbar.a-Toolbar--small)
body > div#<id>_ig_column_header_menu.a-IRR-sortWidget   ← Spaltenkopf-Menü nutzt die IR-Klassen [LV]
body > div.ui-dialog > div.a-IG-dialog-region / a-IG-dialog-side / a-IG-dialog-main   (Columns, Filter, …)
```

### 5.2 Variablen (`--a-gv-*`; Werte aus Vita, danach Vita-Dark)

| Variable | Vita | Vita-Dark |
|---|---|---|
| `--a-gv-font-size` / `-line-height` | `.75rem` / `1rem` | = |
| `--a-gv-background-color` | `white` | `#1b1d1e` |
| `--a-gv-header-background-color` | `var(--ut-region-header-background-color)` → `white` | → `#111213` |
| `--a-gv-cell-border-color` / `--a-gv-header-cell-border-color` | `#e6e6e6` / `#e6e6e6` | `#323435` / `#333639` |
| `--a-gv-cell-padding-x/-y`, `--a-gv-cell-height` | `.5rem/.25rem`, `2rem` | = |
| `--a-gv-header-cell-padding-x/-y`, `-height` | `.5rem/.25rem`, `2.5rem` | = |
| `--a-gv-row-hover-background-color` | `#f9f9f9` | `#060606` |
| `--a-gv-selected-background-color` | – (→ primary-shade `#e6f0fa`) | – (→ `#010b14`) |
| `--a-gv-updated-background-color` / `--a-gv-inserted-…` | `--a-palette-info-shade` / `--a-palette-success-shade` | dunkle Shades |
| `--a-gv-deleted-background-color` / `--a-gv-grandtotal-background-color` | `#f2f2f2` / `#e6e6e6` | `#0d0d0d` / `#1a1a1a` |
| `--a-gv-footer-padding-x/-y` | `.75rem/.5rem` | = |
| `--a-gv-pagination-button-*` | bg `transparent`, Text `--a-button-text-color`, Hover = Button-Hover | = |
| `--a-gv-pagination-button-selected-background-color` | **nicht gesetzt** → Fallback `#E0E0E0` (Theme-Standard Z. 638) | **nicht gesetzt** |
| `--a-gv-row-disabled-background-color` | **nicht gesetzt** → Fallback `#f0f0f0` (app_ui Z. 6226) | **nicht gesetzt** |
| `--a-gv-nodata-message-*` | Muted-Text, 2rem-Icon | = |

### 5.3 Zustände

| Zustand | Regel (Datei) | Vita / Vita-Dark |
|---|---|---|
| Zeile ausgewählt | `.a-GV-table tr.is-selected{--a-gv-background-color: var(--a-gv-selected-background-color, primary-shade)}` (app_ui Z. 6187) | `#e6f0fa` / `#010b14` [LV] |
| Zeilen-Hover | `.a-GV-row.is-hover:not(.is-selected, :has(.has-selected-cells))` (UT Core Z. 12854) | `#f9f9f9` / `#060606` [LV] |
| Fokuszelle | `.a-GV-cell.is-focused{box-shadow:0 0 0 1px var(--a-palette-primary) inset}` (Theme-Standard Z. 467) | Primärfarbe [LV] |
| aktive Edit-Zelle | `.a-GV-table .a-GV-cell.is-active` Vita Z. 3343 | `#e6e6e6` / `#1a1a1a` [CSS] |
| Editor-Input mit Fokus | `.a-GV-cell .a-GV-columnItem input:focus` Vita Z. 3353 | `#fff` / `#000` [CSS] |
| Zeilen-Editmodus | `.a-GV-dataEntryMode--row.a-GV--editMode .a-GV-cell.is-active` (Theme-Standard Z. 482): Rahmen Primärfarbe, BG Field-Token | [CSS] |
| read-only im Edit-Modus | `.a-GV--editMode .a-GV-row.is-readonly .a-GV-cell` Vita Z. 3347 | `#f2f2f2` / `#0d0d0d`, Text muted [CSS] |
| geändert (Dreieck) | `.a-GV-cell.is-changed:not(.is-active):before` in `--a-palette-primary` | [CSS] |
| Fehler / Warnung | `.is-error` / `.is-warning`: Text und Inset-Rahmen in `--a-palette-danger`/`-warning`, Icon `\e010`/`\e017` | [CSS] |
| aktualisiert / eingefügt / gelöscht | `--a-gv-updated/inserted/deleted-background-color`; gelöscht zusätzlich durchgestrichen | [CSS] |
| deaktiviert | `--a-gv-row-disabled-background-color` → `#f0f0f0` | im Dark Mode hell [CSS] |
| Aggregatzeile | `.is-aggregate .a-GV-cell{bg: var(--a-gv-background-color,#F8F8F8)}`, `.is-aggregate .a-GV-rowHeader{color:#707070}` (Theme-Standard) | [CSS] |
| Grand Total | `.a-GV-row.is-grandTotal .a-GV-cell{background-color:var(--a-gv-grandtotal-background-color)!important}` (UT Core Z. 12862) | `#e6e6e6` / `#1a1a1a` [CSS] |
| Control Break | `.a-GV-table th.a-GV-controlBreakHeader` Vita Z. 3239 | `whitesmoke` / `#252729`, Text muted [CSS] |
| Frozen Columns | `.a-GV-frozen--startLast` Rahmen 4px (`--a-gv-frozen-last-border-width`), Rahmenfarbe = Zellrahmen | [CSS] |

### 5.4 Hart codiert und Dark-Mode-Probleme

| Selektor (Datei) | Wert | Befund |
|---|---|---|
| `.a-GV-pageSelector-item.is-selected .a-GV-pageButton` (Theme-Standard Z. 637) | Fallback `#E0E0E0` | **Vita-Dark: weißer Text auf `#E0E0E0`, unlesbar** [LV Screenshot, 9042 und 9242] |
| `.a-GV-status` (Theme-Standard Z. 627) | `#707070` | „1 rows selected“ ist grau auf dunkel [LV] |
| `.a-GV-columnControls .a-Button` (Theme-Standard Z. 498) | `#F4F4F4` / Text `#707070`; `.is-active` `#E0E0E0` | helle Sortierknöpfe auch im Dark Mode [LV computed] |
| `.a-GV-header-dragHelper` (Theme-Standard Z. 552) | `#F4F4F4`, Text `#404040`, Rahmen `#e0e0e0` | Spalte ziehen [CSS] |
| `.a-GV-rownum`, `.is-aggregate .a-GV-rowHeader` | `#707070` | [CSS] |
| `.a-GV-floatingItem.is-expanded .a-GV-expandCollapse` (Theme-Standard Z. 612) | `#404040` / `#FFF` | [CSS] |
| `.a-GV-hdr--fixed:after` (app_ui Z. 6035) | Verlauf `rgba(0,0,0,.1)` | Schatten unter der fixierten Kopfzeile |
| `.a-Button.a-Button--actions:hover` (app_ui Z. 6722) | `rgba(0,0,0,.1)` | Zeilenaktions-Button; im Dark Mode ohne Wirkung |
| IG-Dialoge: `.a-IG-dialog-list-link` `#404040`, `.a-IG-dialog-label-checkbox` (`#FFF`, Rahmen `#C0C0C0`), `.a-Button.a-IG-dialog-button` `#F4F4F4` (Theme-Standard Z. 650–730) | | [CSS] |
| Splitter in IG-Dialogen: `--a-splitter-bar-background-color:#EAEAEA` (Theme-Standard Z. 251) | nicht von Vita-Dark gesetzt | **helle Trennleiste im Columns-Dialog** [LV Screenshot] |

Nicht live prüfbar: Das Demo-IG auf 1410 ist read-only. Edit-Modus, Aggregat-, Control-Break- und Grand-Total-Zeilen sind nur aus dem CSS belegt [CSS].

```css
/* IG: Dark-Mode-Lücken schließen (Beispiel) */
:root {
  --a-gv-selected-background-color: color-mix(in srgb, var(--my-accent) 18%, var(--a-gv-background-color));
  --a-gv-pagination-button-selected-background-color: var(--my-accent);
  --a-gv-pagination-button-selected-text-color: var(--my-on-accent);
  --a-gv-row-disabled-background-color: var(--my-surface-2);
  --a-splitter-bar-background-color: var(--my-surface-2);
  --a-splitter-bar-hover-background-color: var(--my-surface-3);
}
.a-GV-status, .a-GV-rownum, .is-aggregate .a-GV-rowHeader { color: var(--ut-component-text-muted-color); }
.a-GV-columnControls .a-Button { background-color: var(--a-gv-header-background-color); color: var(--ut-component-text-muted-color); }
.a-IG-dialog-list-link { color: var(--ut-component-text-default-color); }
.a-IG { border-radius: var(--my-radius); }   /* IG hat keinen Radius-Hook; Kinder ggf. per clip-path begrenzen */
```

Zu `overflow:hidden` auf `.a-IG` als Alternative zu `clip-path`: Das kann die Sticky-Mechanik von Kopfzeile und Footer (`js-stickyWidget-toggle`) stören [unverifiziert]. Daher lieber `clip-path: inset(0 round var(--my-radius))` testen.

---

## 6. Die vier Pagination-Systeme

| System | Wo | Markup | Stil-Hebel | Besonderheit |
|---|---|---|---|---|
| Classic Report | `t-Report`, Legacy-Cards, Listen-Reports mit Report-Template | `table.t-Report-pagination` > `span.t-Report-paginationText` + `a.t-Button.t-Button--small.t-Button--noUI.t-Report-paginationLink(--prev/--next)` [LV 1407] | `--ut-report-pagination-*` (Link-BG/-Text/-Hover/-Radius/-Padding), aktive Seite und Hover = `--ut-palette-primary` | Die Links sind NoUI-Buttons; `.t-Report-paginationLink` setzt `--a-button-font-size:.75rem` |
| Interactive Report | `.a-IRR-paginationWrap` | `ul.a-IRR-pagination > li > span.a-IRR-pagination-label / button.a-IRR-button--pagination` | globale Button-Token, **plus** lokales `--a-button-border-radius:100%` und Hover `#4696fc` (app_ui) | siehe §4.3 |
| GridView (IG, Card-Region-Pagination) | `.a-GV-footer` bzw. `.a-TMV--cards .a-GV-footer` | `.a-GV-pageButton`, `.a-GV-pageSelector-item.is-selected` | `--a-gv-pagination-button-*` inkl. `-selected-background-color` / `-selected-text-color` / `-hover-*` / `-border-*` / `-gap-x` / `-min-width` | Dark-Bug bei der aktiven Seite, siehe §5.4 |
| Template Components (TMV) | Content Row, Comments, Timeline, Media List, Metric Card, Avatar | `div.a-TMV-footer > div.a-TMV-pagination > button.a-TMV-pageButton.a-Button` + `span.a-TMV-pageRange` [LV 3004] | nur globale `.a-Button`-Token; `--a-tmv-footer-padding-*`, `-text-color` | `.a-TMV-footer` wird ausgeblendet, wenn alle Buttons disabled sind (UT Core Z. 15062) |

---

## 7. Faceted Search, Smart Filters, Chips, Search Region

### 7.1 Faceted Search (1411) [LV]

```
div.a-FS.a-FS--facets                       (keine eigene Fläche; liegt in einer t-Region)
  div.a-FS-search > div.apex-item-group--search > input.apex-item-text + span.a-FS-search-clear + span.apex-item-icon
  div.a-FS-control.js-controlRoot           (+ .a-FS-control für jede Facette; Trenner border-block-start)
    div.a-FS-header > h3.a-FS-label | button.a-FS-clearButton ("Clear") | button.a-FS-moreOptions.a-Button--noUI
    div.a-FS-body > div.a-FS-filter (Facettensuche) + div.a-FS-wrap > div.a-FS-bodyInner
        div.apex-item-group--rc.apex-item-checkbox.a-FS--hideEmpty > div.apex-item-option > input + label > span.label + span.apex-item-option-badge
        div.a-FS-listFooter > button.a-FS-toggleOverflow ("Show All")
div#active_facets.a-FS-currentList          (eigene Region "Current Facets")
  div.a-FS-totalArea > span.a-FS-totalLabel + span.a-FS-totalCount
  ul.a-FS-currentItems > li.a-FS-currentItem > span.a-FS-currentLabel + button.a-FS-clear (Chip mit ×)
```

Variablen (Vita APP_UI-Block Z. 107–130 und Z. 515–523):

- `--a-fs-control-seperator-border-color` (= Component-Rahmen; Schreibweise `seperator` ist so im Original),
- `--a-fs-control-header-padding-x/-y` (`.75rem`), `--a-fs-control-header-font-size` (`1rem`), `--a-fs-control-body-padding-*`,
- `--a-fs-filter-group-*`, `--a-fs-chart-*` (Facettendiagramme im Region-Look),
- `--a-fs-toggle-*` (= Button-Token), `--a-fs-search-container-*`,
- `--ut-fs-total-font-size`/`-weight`/`-margin` (UT Core),
- `--a-fs-control-item-badge-opacity` (.7), `--a-fs-popup-min-width`, `--a-fs-facet-option-padding-*`.

Die Checkbox und das Radio sind UT-Formularelemente (`--a-checkbox-*`). Gemessene Werte [LV]:

- Label 16px/600, Text geerbt,
- „Clear“ und „Show All“ in `--a-button-text-color`: Vita `#056AC8` wegen `--a-button-text-color: var(--a-base-link-text-color,#0076DF)` auf `.a-FS-clearAll/-clearButton/-toggleOverflow` (app_ui),
- Trenner `rgba(0,0,0,.1)` bzw. `rgba(255,255,255,.15)`.

Hart codiert (app_ui Z. 4632–5504):

- `.a-FS-clear` (Current-Facet-Chip) setzt `--a-button-background-color: rgba(0,0,0,.05)` sowie dieselben Werte für Hover, Active und Focus. Im Dark Mode ist der Chip damit kaum sichtbar [CSS].
- Alle weiteren Farben sind `var()`-Fallbacks mit `rgba(0,0,0,…)`.

### 7.2 Smart Filters (1412) und Chips [LV]

```
div.a-FS.a-FS--smart
  div.a-FS-smartFilter[role=search]
    div.a-FS-searchBarButton > button.a-Button (Lupe, nur zusammengeklappt)
    div.a-FS-searchBar.apex-item-comboselect   (Field-Token: bg, Rahmen, Radius)
      span.a-Icon.icon-search
      ul.a-Chips.a-Chips--applied.a-Chips--wrap > li.a-Chip.a-Chip--applied (…) + li.a-Chip.a-Chip--input > input
    div.a-FS-suggestionChips > ul.a-Chips > li.a-Chip > span.a-Chip-label + span.a-Chip-text > span.a-Chip-value + span.a-Chip-count
  div.u-hidden > div.a-FS-body …            (Facetten-Popups, .a-FS-facetPopup)
```

Chip-Token (Vita Z. 321–343; Stil-Kaskade `--a-chip-state-*` → `--a-chip-type-*` → `--a-chip-*`, app_ui Z. 17427 ff.):

| Token | Vita | Vita-Dark |
|---|---|---|
| `--a-chip-padding-y/-x`, `-spacing`, `-font-size`, `-line-height`, `-border-radius` | `.125rem/.25rem`, `.25rem`, `.75rem`, `1rem`, `.125rem` | = |
| `--a-chip-border-color` | `--a-field-input-border-color` (`#dfdfdf`) | (`#393d40`) |
| `--a-chip-hover-background-color` | `rgba(0,0,0,.025)` | `rgba(255,255,255,.025)` |
| `--a-chip-active-background-color` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` |
| `--a-chip-applied-background-color` | `rgba(0,0,0,.075)` | `rgba(255,255,255,.075)` |
| `--a-chip-applied-hover-background-color` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.15)` |
| `--a-chip-applied-is-active-*` | Fallback `--a-palette-primary` / `-contrast` | = |
| `--a-chip-remove-*` | halbtransparente Overlays | = |
| `--a-chip-label-opacity` / `--a-chip-value-font-weight` | `.7` / semibold | = |

Die Chips sind vollständig tokenisiert; ein Pill-Look braucht nur `--a-chip-border-radius: 999px`.

### 7.3 Search Region (1413) [LV nach Suche „e“]

```
div.t-ResultsRegion.u-colors(.t-ResultsRegion--boxed|--flat|--hideSep|--iconSm|--iconMd|--iconLg)
  div.t-ResultsRegion-search > (Suchfeld, Field-Token)
  div.a-SearchResults > div.a-SearchResults-count.u-vh + ul.a-SearchResults-list
    li.a-SearchResults-item > div.a-ResultsItem
       div.a-ResultsItem-icon | a-ResultsItem-initials.u-color-var | a-ResultsItem-image
       div.a-ResultsItem-content > div.a-ResultsItem-header > span.a-ResultsItem-title (+ .a-ResultsItem-badge)
                                  + a-ResultsItem-subTitle / -description / -attributes / -misc
  div.a-SearchResults-pagination
```

Token:

- `--a-resultsitem-*`, Vita Z. 344–383: Hintergrund `#fff` (**Vita-Dark `#000`**), Rahmen Component-Border, Radius `.25rem`, Padding `1rem`, Titel `1rem/700`.
- `--ut-resultsregion-*`, Vita Z. 549–554: BG `#fff`/`#000`, Suchleiste `rgba(…,.025)`.
- `--a-searchresults-*`.

Icons und Initialen nutzen den `u-colors`-Zyklus (`--u-color-N`) oder `--a-resultsitem-icon-background-color`.

Fallstrick: Im Dark Mode liegen reine `#000`-Karten auf `#252729` (Body) [LV Screenshot]. `--a-resultsitem-background-color` und `--ut-resultsregion-background-color` am besten an die eigene Surface-Farbe koppeln.

---

## 8. Cards

### 8.1 Legacy Card Templates `t-Cards` (3100, List- oder Report-Template „Cards“) [LV]

```
ul.t-Cards.u-colors.t-Cards--featured|--basic|--compact .t-Cards--block|--float|--cols|--3cols…|--spanHorizontally|--stacked
          .t-Cards--displayIcons|--displayInitials .t-Cards--iconsRounded|--iconsSquare .t-Cards--desc-2ln…
          .t-Cards--animColorFill|--animRaiseCard .t-Cards--displaySubtitle .t-Cards--hideBody
  li.t-Cards-item
    div.t-Card
      a.t-Card-wrap                      (bg/Rahmen/Radius/Shadow → --ut-cardlist-*)
        div.t-Card-icon.u-color > span.t-Icon.fa > span.t-Card-initials
        div.t-Card-titleWrap > h3.t-Card-title + h4.t-Card-subtitle
        div.t-Card-body > div.t-Card-desc + div.t-Card-info
        span.t-Card-colorFill.u-color    (Farbfläche; wächst bei animColorFill)
```

- Token: `--ut-cardlist-*`, 45 Hooks, UT Core Z. 7297–7906. Fallbacks gehen auf `--ut-component-*`; Vita setzt nur `--ut-cardlist-box-shadow: var(--ut-shadow-sm)`.
- Farben kommen über `u-colors`/`u-color` (`--u-color`, `--u-color-contrast`).
- Keine hart codierten Farben (Abschnittsanalyse). Im Dark Mode ist alles sauber [LV Screenshot].

### 8.2 Card Regions `a-CardView` (3110, Region-Typ „Cards“) [LV]

```
div.t-CardsRegion.u-colors(.t-CardsRegion--styleA|--styleB|--styleC)(.t-CardsRegion--hideHeader)
  h2.t-CardsRegion-title
  div.a-TMV--cards.a-TMV.a-TMV--variableHeight > div.a-TMV-body > div.a-TMV-w-scroll
    ul.a-CardView-items.a-CardView-items--grid|--grid2col…5col|--row|--float
      li.a-CardView-item
        div.a-CardView.has-title.has-subtitle.has-body.has-icon.has-icon--start|--top|--end
                      .has-media.has-media--first|--body|--background.has-media--cover .has-actions
          div.a-CardView-media.a-CardView-media--background|--first|--body > img.a-CardView-mediaImg
          div.a-CardView-header
            div.a-CardView-iconWrap(--start|--top) > span.a-CardView-icon.u-color.fa | a-CardView-initials | img.a-CardView-iconImg
            div.a-CardView-headerBody > h3.a-CardView-title(>a.a-CardView-titleLink) + h4.a-CardView-subTitle
            div.a-CardView-badge > span.a-CardView-badgeLabel(u-vh) + span.a-CardView-badgeValue
          div.a-CardView-body > div.a-CardView-mainContent + div.a-CardView-subContent
          div.a-CardView-actions > div.a-CardView-actionsPrimary > a.a-CardView-button(--hot) | div.a-CardView-actionsSecondary
          a.a-CardView-fullLink (optional, Full-Card-Link)
  div.a-GV-footer (Pagination, bg/Rahmen über --a-cv-grid-footer-*)
```

Token (`--a-cv-*`, ~95 Hooks in app_ui Z. 1154–1769, Stil-Kaskade `--a-cv-state-*` → `--a-cv-type-*` → `--a-cv-*`). Vita definiert die Werte **zweimal**, im APP_UI-Block Z. 29–55 und im Block „Card View“ Z. 2326–2373. Es gewinnt der zweite Block, z. B. `--a-cv-border-radius:.1875rem` (3px gemessen) und `--a-cv-item-width:19rem`.

| Token | Vita | Vita-Dark |
|---|---|---|
| `--a-cv-background-color` | `white` | `#1b1d1e` |
| `--a-cv-border-color` / `-width` | `rgba(0,0,0,.1)` / 1px | `rgba(255,255,255,.15)` |
| `--a-cv-shadow` / `-hover-shadow` | `0 2px 4px -2px rgba(0,0,0,.075)` / `0 4px .5rem 0 rgba(0,0,0,.1)` | = (Schatten bleiben schwarz) |
| `--a-cv-header-border-color` / `-actions-border-color` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.1)` |
| `--a-cv-subtitle-text-color` / `-subcontent-text-color` | `#666666` | `#b6b6b6` |
| `--a-cv-icon-background-color` / `-initials-background-color` | `#056AC8` (**Hex-Kopie der Primärfarbe**) | = |
| `--a-cv-focus-border-color` | `#056AC8` (Hex-Kopie) | = |
| `--a-cv-badge-background-color` | `rgba(0,0,0,.1)` | `rgba(255,255,255,.15)` |
| `--a-cv-selected-background-color` | – (→ `--a-palette-primary-shade`) | – |
| `--a-cv-grid-gap`, `-item-width`, Paddings | `1rem`, `19rem`, `1rem` | = |

Die Stilvarianten `.t-CardsRegion--styleA/B/C` (Vita Z. 2424–2660) setzen jeweils eigene `--a-cv-*`: Overflow hidden, Media-BG `rgba(0,0,0,.025)`, Overlay `rgba(0,0,0,.75)`, Icon-Größen, Badge-Radius `1.25rem`. Bei `has-media--background` stellt Vita Z. 2409 den Text auf Weiß (`--a-cv-text-color:#fff`).

Fallstricke:

- **Hex-Kopien.** `--a-cv-icon-background-color` und `--a-cv-focus-border-color` sind Kopien von `#056AC8` und folgen **nicht** automatisch einem geänderten `--ut-palette-primary`. Sie müssen explizit gesetzt werden.
- **Icon-Farben.** Icons mit `u-color` (Theme Colors an) nehmen `--u-color-N` statt `--a-cv-icon-background-color` [LV: `rgb(48,159,219)` = `--u-color-1`].
- **Schatten im Dark Mode** bleiben schwarz-transparent und sind damit kaum sichtbar.

---

## 9. Template Components und Listen-Reports

Gemeinsames Muster in UT Core, belegt über die Abschnittsanalyse (`rep-sections.mjs`):

- Jede Komponente hat eigene `--ut-<kürzel>-*`-Hooks und fällt auf `--ut-component-*` zurück. In den Abschnitten gibt es **keine hart codierten Farben**; Vita setzt nur wenige Hooks.
- **Auswahlfarbe:** `--ut-<kürzel>-item-selected-background-color` → `--a-gv-selected-background-color` → `--a-palette-primary-shade`.
- **Gruppierung (neu in 26.1):** `.t-<Komp>-groupItems`, `-groupHeader`, `-groupIcon`, `-groupTitle` mit `--ut-<kürzel>-group-header-*`.
- **Avatare** sind `.t-Avatar(--icon|--initials|--image)(--circle|--rounded|--square|--noShape)(--xxs…--xxl)`. Farbe per `u-color` (`--u-color`) oder `--ut-avatar-background-color` → `--a-palette-primary`.
- **Badges** sind `.t-Badge(--success|--danger|--warning|--info)(--subtle|--outline)(--square|--circle|--rounded)`. Farbe über `--ut-badge-<status>-*` → `--a-palette-<status>(-contrast)`.

| Komponente (Seiten) | DOM-Kern [LV] | Hook-Präfix (Anzahl) | Vita setzt | Hinweise |
|---|---|---|---|---|
| **Content Row** (1407, 3004) | `ul.t-ContentRow > li.t-ContentRow-item > div.t-ContentRow-wrap > (div.t-ContentRow-selection) + div.t-ContentRow-avatar > span.t-Avatar… + div.t-ContentRow-body > div.t-ContentRow-content > div.t-ContentRow-overline + h3.t-ContentRow-title + div.t-ContentRow-description; div.t-ContentRow-misc; div.t-ContentRow-actions > .t-Button` | `--ut-cr-*` (62) | – | Optionen `--styleCompact`, `--hideBorders`, `--alignTop`, `--stackMobile` (26.1 erweitert), `--hideIcon/-Title/-Description/-Misc/-Actions/-Selection`, `--removePadding` |
| **Comments** (1405, 3003) | `ul.t-Comments.t-Comments--basic|--chat > li.t-Comments-item > div.t-Comments-item > div.t-Comments-icon > .t-Avatar + div.t-Comments-body > div.t-Comments-info > span.t-Comments-user + span.t-Comments-date; div.t-Comments-comment` | `--ut-comment-*` (59) | `--ut-comment-chat-background-color` `rgba(0,0,0,.05)` / `rgba(255,255,255,.1)`; `-chat-active-…` | 26.1: `.t-Comments-item--outbound` (Chat rechtsbündig) und Gruppierung |
| **Timeline** (1406, 3006) | `ul.t-Timeline > li.t-Timeline-item > div > div.t-Timeline-wrap > div.t-Timeline-user > .t-Avatar + div.t-Timeline-userinfo > span.t-Timeline-username + span.t-Timeline-date; div.t-Timeline-content > div.t-Timeline-typeWrap > span.t-Badge--warning… + div.t-Timeline-body > h3.t-Timeline-title + p.t-Timeline-desc` | `--ut-timeline-*` (93) | – | Typfarben (`--ut-timeline-type-is-new/-updated/-removed-*`) fallen auf `--ut-palette-success/-info/-danger/-generic`; Option `--compact` |
| **Media List** (1301, 3005) | `ul.t-MediaList.u-colors(.t-MediaList--showIcons|--showDesc|--showBadges|--cols|--2cols…|--horizontal|--large|--iconsRounded|--iconsSquare) > li.t-MediaList-item > (a|div).t-MediaList-itemWrap > div.t-MediaList-iconWrap > .t-Avatar.u-color + div.t-MediaList-body > h3.t-MediaList-title + p.t-MediaList-desc; span.t-Badge` | `--ut-medialist-*` / `--ut-media-list-*` (60) | – | Titel mit Link = `--ut-link-text-color`; Hover `--ut-component-highlight-background-color` |
| **Value Attribute Pairs** (1403) | `dl.t-AVPList(--leftAligned|--rightAligned|--fixedLabelSmall/Medium/Large|--variableLabel…|--hideNulls) > dt.t-AVPList-label + dd.t-AVPList-value` | `--ut-avp-*` (15) | – | Label `--ut-component-text-title-color`, Wert `-subtitle-color`, Trenner Inner-Border |
| **Badge List** (1304) | `ul.t-BadgeList.u-colors(.t-BadgeList--circular|--dash|--cols|--3cols…|--flex|--float|--stacked|--small…--xxlarge) > li.t-BadgeList-item > a.t-BadgeList-wrap.u-color > span.t-BadgeList-label + span.t-BadgeList-value` | `--ut-badgelist-*` (46) | – | Wert-Kreis = `--ut-component-icon-background-color` bzw. `u-color` |
| **Metric Card** (3007, **nur 26.1**) | `ul.t-MetricCards(--cols|--2cols…|--stacked|--overflow) > li.t-MetricCards-item > div.t-MetricCard.u-color-var > div.t-MetricCard-body(--avatarPositionTop|Inline, --avatarAlignment…) > div.t-MetricCard-avatar + div.t-MetricCard-content > div.t-MetricCard-title/-metric/-meta; div.t-MetricCard-badge > .t-Badge` | `--ut-metric-card-*` (60) | – | Rahmen/Radius/Schatten über Component-Token; `.t-MetricCard-avatar--subtle` nutzt Primary-Shade und ist im Dark Mode fast unsichtbar [LV Screenshot] |
| **Flexbox Container** (3008, **nur 26.1**) | `.a-FlexContainer(--fill|--grow|--noGrow) > *`, dazu `.t-Region` in `.a-FlexContainer` als Flex-Column | – | – | reines Layout, keine Farben |
| **Avatar** (3001) / **Badge** (3002) | siehe oben | `--ut-avatar-*` (27) / `--ut-badge-*` (30) | – | 26.1: `.t-Badge--rounded`, Avatar-Gruppierung `.t-Avatar-groupItems`, `--ut-avatar-list-gap-spacing` |

Im Dark Mode waren Content Row, Comments, Timeline, Media List, AVP, Badge List, Avatar und Badge unauffällig [LV, Screenshots `9042-3xxx-dark.png`].

Der einzige systemische Punkt ist die Auswahlfarbe `#010b14` (siehe §2). Subtile Badges im Dark Mode (Text `--ut-palette-*-text` auf `-shade`) haben geringen Kontrast [LV Screenshot 3007].

---

## 10. List View, Reflow, Column Toggle

**List View (1700)** [LV]

```
ul.a-ListView[data-role=listview] > li.a-ListView-item(.has-link) > a.ui-btn > text + span.fa.fa-angle-right
   (+ .a-ListView-item .ui-li-count / .ui-li-aside, li.apex-load-more)
```

Token: `--ut-lv-*` (20, UT Core Z. 11547). Verhalten:

- Trenner `--ut-component-inner-border-color`,
- Text `--ut-component-text-default-color`,
- Zähler `--ut-component-badge-*`,
- Divider `--ut-lv-divider-background-color` → Toolbar-BG.

Keine Farbprobleme im Dark Mode.

**Reflow (1710) und Column Toggle (1720)** [LV]

```
table.ui-responsive.table-stripe.table-stroke.u-Report.a-Table.a-Table--reflow|--columntoggle
  thead > tr > th.u-tL|u-tC|u-tR(.ui-table-priority-N)
  tbody > tr > td > b.a-Table-cellLabel (nur Reflow, mobil sichtbar) + Wert
button.a-Table-columntoggleBtn + Popup .a-Table-columntogglePopup (Column Toggle)
```

UT Core Z. 14128–14142 überschreibt die hellen app_ui-Defaults: Kopf `--ut-report-header-background-color` (`rgba(0,0,0,.025)`/`rgba(255,255,255,.025)`), Zellen `--ut-report-cell-background-color` → `--ut-component-background-color`, Streifen `--ut-report-cell-stripe-background-color` → Highlight-BG. Rahmen `--a-gv-border-color` (app_ui `.table-stroke`).

Falle: app_ui `.u-Report th[scope=row]{background-color:#fff}` und `th[scope=rowgroup]{#FAFAFA}` haben die Spezifität (0,2,1). Das ist höher als der UT-Override `.u-Report th` (0,1,1), deshalb bleiben sie hell. `.u-Report--staticBG` erzwingt `#FFF` [CSS].

Breakpoints: Reflow wird ab 560px zur Tabelle; Column-Toggle-Prioritäten gelten ab 320/480/640/800/960/1120px (app_ui Z. 14766–14910).

---

## 11. Visualisierung

### 11.1 Charts (1902, Oracle JET `oj-chart` / `oj-statusmetergauge`) [LV]

DOM: `div#R…_jet.oj-dvtbase.oj-chart.oj-component-initnode > svg` innerhalb der Region (Gauge: `div#R…_jet.oj-dvtbase.oj-statusmetergauge.oj-statusmetergauge-circular-fit`) [LV].

**Woher kommen die Farben? (gemessen per `page.evaluate`)**

| Element | gemessener Wert | Herkunft | per CSS themebar? |
|---|---|---|---|
| Serien (Balken, Donut-Segmente) | SVG-Attribut `fill="rgb(48, 159, 219)"` usw. | JET liest beim Rendern die Farbe der Klassen `.oj-dvt-category1…12`. JET-CSS setzt `color:RGB(var(--oj-palette-dvt-rgb-N))`, UT Core Z. 25196–25242 überschreibt mit `--u-color-1,4,7,9,12,3,8,10,2,5,11,6` | **Ja**, über `--u-color-*` oder direkt `.oj-dvt-categoryN{color:…}`. Test: `--u-color-1:#ff00aa` ergibt `fill="rgb(255, 0, 170)"` [LV] |
| Achsen-/Legendentexte | Attribut `fill="rgb(0,0,0)"` bzw. `rgba(0,0,0,.65)`; dunkel: `#fff`/`.65` | `--oj-core-text-color-primary/secondary` (Vita Z. 3416 f. = `--ut-component-text-default/muted-color`) | **Ja**. Test: `--oj-core-text-color-primary:#00aa00` ergibt Textfill grün [LV] |
| Gitternetz / Achslinie | Attribut `stroke="rgba(196,206,215,0.4)"`, `rgba(78,82,86,0.4)`, `#9E9E9E` | JET-JS-Defaults, weder in der JET-CSS noch über `--oj-core-divider-color` zu finden [LV: Override blieb wirkungslos] | nur per CSS-Attributselektor (z. B. `.oj-chart path[stroke="rgba(196,206,215,0.4)"]{stroke:…}`) [unverifiziert] oder über Chart-Optionen (JS-Initialisierung) |
| Dial Gauge | Metrik `fill="#393737"`, Spur `rgba(49,45,42,0.15)` (= `--oj-palette-neutral-rgb-170` @ .15) | JET-Default; der Wert `#393737` taucht in der JET-CSS nicht auf, stammt also vermutlich aus JS [unverifiziert] | **Nein** per Token. In Vita-Dark **fast unsichtbar** (`#393737` auf `#1b1d1e`) [LV Screenshot] |
| Datatip (Tooltip) | `.oj-dvt-datatip` (app_ui Z. 12625): `--jui-tooltip-background-color` (Theme-Standard `#fff`) | Vita/Vita-Dark setzen den Wert nicht, der Tooltip ist also auch im Dark Mode weiß | ja; `--ojet-tooltip-*-text-color` (Vita: schwarz) muss dazu passen |
| Legend-Hover | `.oj-legend-hover{fill: --ut-component-highlight-background-color}` (UT Core) | | ja |
| Schriftgrößen | `--ut-ojet-*` (UT Core, Fallbacks .875/.75/1rem) und `--ojet-*` (Vita, app_ui) | | ja |

Weitere JET-Brücken in Vita (Z. 3415–3447): `--oj-core-divider-color`, `--oj-core-focus-border-color`, `--oj-popup-bg-color`, `--oj-core-bg-color-hover`, `--oj-collection-*` (für JET-Collections), `--oj-private-gantt-*` (Gantt), `--oj-heading-text-color`, `--oj-text-field-*`.

Fallstricke:

- **Farben werden beim Rendern „eingebrannt“.** JET schreibt Serien- und Textfarben als SVG-Attribute. Tokens müssen beim Seitenaufbau im CSS stehen; spätere Änderungen, etwa ein Stilwechsel ohne Reload, erreichen gerenderte Charts nicht [LV Mechanismus; Re-Render-Verhalten unverifiziert].
- **Serienfarben aus den Chart-Attributen** (APEX „Color“) sind inline und schlagen den Theme-Wert.
- **Mapping der Serienreihenfolge.** Serie 2 ist `--u-color-4`, nicht `--u-color-2`. Wer eine eigene Chart-Palette will, setzt am besten direkt `.oj-dvt-category1 … .oj-dvt-category12 { color: … }`.
- Gleiches gilt für IR-/IG-Chartansichten und Facettendiagramme, sofern sie JET nutzen [CSS].

### 11.2 Calendar (1800, FullCalendar 5 als `apex-fullcalendar-5`) [LV]

DOM: `div.fc.fc-media-screen.fc-direction-ltr.fc-theme-standard.apex-fullcalendar.apex-fullcalendar-5(.apex-fullcalendar-multiline)`, darin:

- `div.fc-header-toolbar > div.fc-toolbar-chunk` mit `.fc-button-group > button.fc-button.fc-button-primary` und `h2.fc-toolbar-title`,
- `div.fc-view-harness > table.fc-scrollgrid` mit `th.fc-col-header-cell > a.fc-col-header-cell-cushion` und `td.fc-daygrid-day(.fc-day-today|.fc-day-other)`,
- Events: `a.fc-event.fc-daygrid-event.fc-daygrid-dot-event.apex-cal-green`.

**CSS-Schichten:**

1. FullCalendar-Basis als `<style data-fullcalendar>` (CSSOM, ganz vorn in `<head>`, also niedrigste Priorität).
2. app_ui Z. 742–1150: Legacy-FC3-Regeln und **Event-Farbklassen `.fc .fc-event.apex-cal-*`** (hart, siehe unten).
3. UT Core Z. 25397–25479: Block `.apex-fullcalendar-5 { --fc-*: … }` mit Mapping auf UT-Token.
4. Vita/Vita-Dark `:root { --fc-neutral-bg-color; --fc-neutral-text-color; --fc-event-selected-overlay-color; --fc-non-business-color }`.

| `--fc-*` (auf `.apex-fullcalendar-5`) | Quelle |
|---|---|
| `--fc-page-bg-color` / `--fc-border-color` | `--ut-component-background-color` / `--ut-component-border-color` |
| `--fc-button-*` | `--a-button-*` |
| `--fc-event-bg-color`, `-border-color`, `-text-color` | `--ut-palette-primary(-contrast)` |
| `--fc-today-bg-color` | **`rgba(255,220,40,.15)`** (gelb, hart) |
| `--fc-neutral-bg-color` / `--fc-non-business-color` / `--fc-highlight-color` | `rgba(208,208,208,.3)` / `rgba(215,215,215,.3)` / `rgba(188,232,241,.3)` (hart) |
| `--fc-neutral-text-color` / `--fc-bg-event-color` | `--u-color-29` / `--u-color-20` |
| `--fc-now-indicator-color` | `--ut-palette-danger` |
| `--fc-list-event-hover-bg-color` | Highlight-BG |

Befunde:

- **`--fc-*` auf `:root` sind für FC5 wirkungslos.** `.apex-fullcalendar-5` definiert dieselben Variablen am Element neu. Vita-Darks Werte (`rgba(255,255,255,.2)` usw.) kommen deshalb nie an; im Dark Mode bleibt `--fc-neutral-bg-color` = `hsla(0,0%,82%,.3)` [LV]. Test: `:root{--fc-today-bg-color:red}` ohne Wirkung, `.apex-fullcalendar-5{--fc-border-color:blue}` wirkt [LV].
- **Event-Farben sind hart codiert** (app_ui Z. 1004–1073, Spezifität 0,3,0). Beispiele: `.apex-cal-black #303030`, `-blue #4183D7`, `-green #2ECC71` mit Weiß, `-yellow #F1C40F` mit `#404040`, `-gray #A0A0A0`, `-white #F0F0F0`, `-red #D91E18` usw. Dazu `.fc-list-item.apex-cal-* .fc-event-dot`.
  - Im Dark Mode ist `apex-cal-black` auf `#1b1d1e` praktisch unsichtbar.
  - Grün mit weißem Text hat einen schwachen Kontrast [LV Screenshot].
  - Die Variable `--fc-event-bg-color` auf `.apex-cal-green` wirkt nicht, weil die Klasse `background-color` direkt setzt [LV].
- **„Heute“ ist gelb** in beiden Styles; im Dark Mode sieht es bräunlich aus [LV].
- **Legacy-FC3/FC4** (`.apex-fullcalendar-3`, `.fc-content …`) enthält viele Hex-Werte (`#E6EEF7`, `#404040`, `#F0F0F0`). Das betrifft nur alte Kalender [CSS].

```css
.apex-fullcalendar-5 {                         /* NICHT :root */
  --fc-today-bg-color: color-mix(in srgb, var(--my-accent) 12%, transparent);
  --fc-neutral-bg-color: var(--my-surface-2);
  --fc-non-business-color: color-mix(in srgb, var(--my-text) 6%, transparent);
  --fc-highlight-color: color-mix(in srgb, var(--my-accent) 20%, transparent);
}
.fc .fc-event.apex-cal-black { background-color: var(--my-neutral-strong); border-color: var(--my-neutral-strong); }
```

### 11.3 Map (1906, MapLibre) [LV]

```
div.a-MapRegion > div.a-MapRegion-container
  div.a-MapRegion-map.maplibregl-map > div.maplibregl-canvas-container > canvas.maplibregl-canvas
     div.maplibregl-control-container > div.maplibregl-ctrl-top-right > div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-in …
                                       div.maplibregl-ctrl-bottom-left > div.maplibregl-ctrl-scale
                                       div.maplibregl-ctrl-bottom-right > div.maplibregl-ctrl-attrib
  div.a-MapRegion-legend > div.a-MapRegion-legendItem > input.a-MapRegion-legendSelector + label.a-MapRegion-legendLabel
  div.a-MapRegion-messages
```

- **Token:** `--mg-*` aus `maplibre-gl-apex.css` (~50 Hooks). Die Fallbacks sind hell, z. B. `--mg-ctrl-group-background-color` `#fff`, `--mg-ctrl-scale-background-color` `rgba(255,255,255,.75)` und `--mg-ctrl-attrib-background-color` `rgba(255,255,255,.5)`. Hinzu kommen `--a-map-*` (app_ui Z. 11257–11460: Legende, Meldungen, Overview).
- **Vita und Vita-Dark** setzen beide `--mg-ctrl-group-button-text-color:#000` und `--mg-popup-content-box-shadow`. Im Dark Mode bleiben die Controls also weiß mit schwarzen Icons, was zumindest konsistent ist. Die Attribution ist dagegen weißer Text auf halbtransparentem Weiß [LV].
- **Ladereihenfolge.** Die MapLibre-CSS steht im Dokument **nach** dem Theme-Bundle [LV]. Eigene Regeln brauchen deshalb höhere Spezifität (z. B. `.a-MapRegion .maplibregl-ctrl-group`) oder, besser, die `--mg-*`-Tokens.
- **Kartenkacheln** (Basemap) lassen sich per CSS nicht umfärben; im Dark Mode bleibt die Karte hell. Abhilfe schafft nur eine dunkle Basemap in den Region-Attributen. `--ut-base-filter: invert(1)` aus Vita-Dark gilt ausschließlich für `.t-Login-bg .t-Login-bgImg` (UT Core Z. 3064).

### 11.4 Tree (1901, `a-TreeView`) [LV]

```
div#<region>_tree.a-TreeView[role=tree] > ul > li.a-TreeView-node(.a-TreeView-node--topLevel|--leaf|.is-expandable|.is-collapsible)
   div.a-TreeView-row (absolute Hover-/Auswahlfläche, .is-hover|.is-selected|.is-focused)
   span.a-TreeView-toggle
   div.a-TreeView-content(.is-selected) > span.a-Icon.icon-tree-folder + span.a-TreeView-label[role=treeitem]
   ul (Kinder)
```

- **Token:** `--a-treeview-*` (Theme-Standard Z. 320–338, Vita Z. 311–320 sowie Z. 989–1019 als Theme-Roller „Navigation“).
- **Problem: Die Token werden mit der Side-Navigation geteilt.**
  - Vita setzt `--a-treeview-node-selected-background-color` und `-focused-background-color` auf `#171a1d`, also die Farbe der dunklen Navigation. Ein Tree im Inhalt zeigt die Auswahl deshalb **auch im hellen Style als fast schwarzen Balken** [LV].
  - `--a-treeview-node-hover-background-color: rgba(0,0,0,.05)` (Theme-Standard) ist im Dark Mode unsichtbar [LV].
- **Kein Region-Wrapper.** Der Inhalts-Tree hat keinen eigenen Wrapper, nur `div.js-apex-region#Demo1`. Die Nav-Instanz steckt in `.t-TreeNav`.

Empfehlung: Content-Tree-Werte auf `:root` definieren, Nav-Werte unter `.t-TreeNav` überschreiben (oder umgekehrt):

```css
:root {                                   /* Tree im Inhalt */
  --a-treeview-node-selected-background-color: var(--a-gv-selected-background-color);
  --a-treeview-node-selected-text-color: var(--ut-component-text-default-color);
  --a-treeview-node-selected-icon-color: var(--my-accent);
  --a-treeview-node-focused-background-color: var(--a-treeview-node-selected-background-color);
  --a-treeview-node-focused-text-color: var(--a-treeview-node-selected-text-color);
  --a-treeview-node-hover-background-color: color-mix(in srgb, currentColor 6%, transparent);
}
.t-TreeNav { /* Navigations-spezifische Werte hier */ }
```

---

## 12. Dark Mode

### 12.1 Was Vita-Dark für Reports zusätzlich anpasst (Diff Vita ↔ Vita-Dark, 26.1)

- Alle `--ut-component-*`, Region- und Body-Token (siehe `ut-tokens.md`).
- **Grid/Report:**
  - `--a-gv-background-color #1b1d1e`, Zellrahmen `#323435`, Header-Zellrahmen `#333639`,
  - Hover `#060606`, gelöscht `#0d0d0d`, Grand Total `#1a1a1a`,
  - `--ut-report-cell-border-color #333639`, `-hover #202223`, `-alt rgba(255,255,255,.1)`, `--ut-report-header-background-color rgba(255,255,255,.025)`,
  - `--a-report-controls-cell-label-background-color #1b1d1e`, `-text-color whitesmoke`.
- **Harte Selektoren mit Dark-Werten:**
  - `.a-IRR-header #202223`, `:hover #27292b`, `--group #252729`,
  - `.a-GV-table th.a-GV-controlBreakHeader #252729`, `.a-GV-table .a-GV-cell.is-active #1a1a1a`,
  - Read-only im Edit-Modus `#0d0d0d`, Editor-Fokus-BG `#000`,
  - `.a-IRR-button--controls #494a4b`, dunkle Hover-Werte der Control-Typen.
- **Cards:** `--a-cv-background-color #1b1d1e`, Rahmen `rgba(255,255,255,.15)`, Subtitle/Subcontent `#b6b6b6`, Media-BG `rgba(255,255,255,.025)`, Badge `rgba(255,255,255,.15)`.
- **Chips:** alle `--a-chip-*`-Overlays weiß-transparent.
- **Suche:** `--a-resultsitem-background-color #000`, `--ut-resultsregion-background-color #000`.
- **JET:** `--oj-color-spectrum-border-color #333333` (Texte folgen über `--ut-component-*`).
- **FullCalendar:** `--fc-*` auf `:root`, allerdings wirkungslos (siehe §11.2).
- **Palette:** `--ut-palette-*-shade` sehr dunkel (`primary #010b14`, `success #0c1e09`, `danger #340200`, `warning #372d10`, `info #001830`), Link `#349bfa`.

### 12.2 Was Vita-Dark vergisst (belegte Lücken, gilt für UT 24.2 und 26.1)

| Nr. | Komponente | Problem | Ursache (Datei, Selektor/Token) | Beleg |
|---|---|---|---|---|
| 1 | IG/Cards-Pagination | aktive Seite weiß auf `#E0E0E0` | Theme-Standard `.a-GV-pageSelector-item.is-selected .a-GV-pageButton`, `--a-gv-pagination-button-selected-background-color` nicht gesetzt | [LV 9042+9242] |
| 2 | Auswahl allgemein | Auswahl `#010b14` kaum von `#1b1d1e` unterscheidbar | `--a-gv-selected-background-color` nicht gesetzt, `--ut-palette-primary-shade:#010b14` | [LV] |
| 3 | IG-Footer | Status `#707070` | Theme-Standard `.a-GV-status` | [LV] |
| 4 | IG-Spaltenknöpfe | `#F4F4F4` / `#707070` | Theme-Standard `.a-GV-columnControls .a-Button` | [LV computed] |
| 5 | IG-Dialoge | helle Splitter-Leiste | `--a-splitter-bar-background-color:#EAEAEA` (Theme-Standard) | [LV Screenshot] |
| 6 | IG-Dialoge | Listen-Links `#404040`, Checkbox `#FFF` | Theme-Standard / app_ui `.a-IG-dialog-*` | [CSS] |
| 7 | IG | deaktivierte Zeilen `#f0f0f0` | Fallback `--a-gv-row-disabled-background-color` | [CSS] |
| 8 | IR Pivot / Single Row | helle Hintergründe `#F8F8F8`/`#FCFCFC` | app_ui `.a-IRR-header--pivot*`, `.a-IRR-singleRow-*` | [CSS] |
| 9 | IR Sort-Widget | Hilfetext `#fff`/`#000` | app_ui `.a-IRR-sortWidget-help` | [CSS] |
| 10 | IR Pagination | Hover `#4696fc` statt Primärfarbe | app_ui `.a-IRR-button--pagination:hover` | [LV] |
| 11 | Tree im Inhalt | Hover unsichtbar; Auswahl = Nav-Farbe | Theme-Standard Hover `rgba(0,0,0,.05)`; Vita `--a-treeview-node-selected-*` | [LV] |
| 12 | Charts | Dial Gauge `#393737` auf dunkel | JET-Default | [LV Screenshot] |
| 13 | Charts | Datatip weiß | `--jui-tooltip-background-color:#fff` (Theme-Standard) | [CSS] |
| 14 | Calendar | Vita-Dark `--fc-*` wirkungslos; „heute“ gelb; `apex-cal-black` unsichtbar | UT Core `.apex-fullcalendar-5{--fc-*}`; app_ui `.apex-cal-*` | [LV] |
| 15 | Search Region | reine `#000`-Karten | Vita-Dark `--a-resultsitem-background-color:#000` | [LV] |
| 16 | Map | Controls weiß, Kacheln hell, Attribution weiß auf hell | `maplibre-gl-apex.css`-Fallbacks, Basemap | [LV] |
| 17 | Dialog-Buttonleiste | schwarzes 2,5-%-Overlay statt hellem | `--jui-dialog-buttonpane-background-color` (Theme-Standard) | [LV] |
| 18 | Cards / Charts | Schatten schwarz-transparent (kaum sichtbar) | `--a-cv-shadow`, `--ut-shadow-*` | [LV] |
| 19 | `u-Report` | `th[scope=row]` `#fff`, `th[scope=rowgroup]` `#FAFAFA`, `--staticBG` `#FFF` | app_ui, Spezifität über UT-Override | [CSS] |

---

## 13. Unterschiede UT 24.2 ↔ 26.1

- **Report-, GV- und CV-Variablen sind identisch.** Der Diff der Mengen `--ut-report-*`, `--a-gv-*` und `--a-cv-*` in `Core.css` 24.2 gegen 26.1 ist leer.
- **Vita und Vita-Dark:** keine report-relevanten Unterschiede. Der Diff zeigt nur `--a-field-input-border-style` (24.2 `dashed`, 26.1 `solid`, im APP_UI-Block), `--a-kb-shortcut-*`, `--ut-component-pre-background-color`, `--a-button-count-*`, `--a-datepicker-footer-border-color`, Workflow-Diagram-Token sowie zwei Navigationsdetails. Die harten Selektoren (`.a-IRR-header` usw.) stehen in beiden Versionen gleich (24.2 Vita Z. 3202 ff.).
- **Neu in UT 26.1** (in 24.2 `Core.css` nicht vorhanden):
  - Metric Card (`t-MetricCard*`, 91 Treffer, Seite 3007 fehlt in App 9242),
  - Flexbox Container (`a-FlexContainer`, Seite 3008 fehlt in 9242),
  - `t-InlineActions`, `t-Badge--rounded`,
  - Gruppierungen für Media List, Timeline, Comments und Avatar (`*-groupHeader` usw.; Content Row hatte sie schon in 24.2),
  - `.t-Comments-item--outbound`, erweiterte `t-ContentRow--stackMobile`-Regeln, `.t-Cards--displayInitials`-Fix, `.t-Region--visibleOverflow`, weitere `u-*`-Utilities (`u-gap-*`, `u-overflow-*`, `u-tabular-nums`).
- **app_ui** (IG/IR/Chips/FS/CardView) kommt aus der Runtime. In beiden Testbetten ist das 26.1, deshalb sind IG/IR-Befunde in 9042 und 9242 gleich (Pagination-Bug in 9242 nachgemessen [LV]). Features wie die AI-Suche im IR (`.a-IRR-toolbar--ai-enabled`, `.a-IRR-searchMode--ai`) hängen an der Runtime, nicht an der UT-Version.
- **Eigene Styles sollten neue 26.1-Klassen nur additiv stylen**, damit sie auf 24.2 schlicht ins Leere greifen.

---

## 14. Starter-CSS und Checkliste

### 14.1 Token-Mapping für Reports (auf eigene Design-Tokens `--my-*` gemünzt)

```css
:root {
  /* Flächen & Linien – diese sind in Vita NICHT an Region-Token gekoppelt */
  --a-gv-background-color: var(--my-surface);
  --a-gv-border-color: var(--my-line);
  --a-gv-cell-border-color: var(--my-line-soft);
  --a-gv-header-cell-border-color: var(--my-line-soft);
  --a-gv-header-background-color: var(--my-surface-2);   /* entkoppelt vom Region-Header */
  --a-gv-header-text-color: var(--my-text-muted);
  --a-gv-row-hover-background-color: var(--my-hover);
  --a-gv-selected-background-color: var(--my-selected);  /* wirkt auf IG/IR/MediaList/Timeline/ContentRow/Comments/MetricCard */
  --a-gv-selected-text-color: var(--my-text);
  --a-gv-deleted-background-color: var(--my-surface-3);
  --a-gv-grandtotal-background-color: var(--my-surface-3);
  --a-gv-row-disabled-background-color: var(--my-surface-3);
  --a-gv-pagination-button-selected-background-color: var(--my-accent);
  --a-gv-pagination-button-selected-text-color: var(--my-on-accent);
  --a-toolbar-background-color: var(--my-surface);        /* entkoppelt vom Region-Header */
  --a-report-controls-cell-label-background-color: var(--my-surface);
  --a-report-controls-cell-label-text-color: var(--my-text);

  /* Classic Report an GV-Token koppeln (Redwood-Muster, Redwood.css Z. 1113 ff.) */
  --ut-report-cell-border-color: var(--a-gv-cell-border-color);
  --ut-report-cell-hover-background-color: var(--a-gv-row-hover-background-color);
  --ut-report-cell-alt-background-color: var(--my-stripe);
  --ut-report-header-cell-background-color: var(--a-gv-header-background-color);

  /* Cards & Suche */
  --a-cv-background-color: var(--my-surface);
  --a-cv-border-color: var(--my-line);
  --a-cv-icon-background-color: var(--my-accent);        /* Hex-Kopie in Vita! */
  --a-cv-initials-background-color: var(--my-accent);
  --a-cv-focus-border-color: var(--my-accent);
  --a-resultsitem-background-color: var(--my-surface);
  --ut-resultsregion-background-color: var(--my-surface);

  /* Charts */
  --oj-core-text-color-primary: var(--my-text);
  --oj-core-text-color-secondary: var(--my-text-muted);
  --jui-tooltip-background-color: var(--my-surface-elevated);
  --ojet-tooltip-primary-text-color: var(--my-text);
  --ojet-tooltip-secondary-text-color: var(--my-text-muted);

  /* Splitter (IG-Dialoge) */
  --a-splitter-bar-background-color: var(--my-surface-2);
}
.oj-dvt-category1 { color: var(--my-chart-1); }   /* … bis category12 */

/* Harte Selektoren, die Token nicht erreichen */
.a-IRR-header { background-color: var(--a-gv-header-background-color); }
.a-IRR-header:hover { background-color: var(--my-hover); }
.a-IRR-header--group,
.a-GV-table th.a-GV-controlBreakHeader { background-color: var(--my-surface-2); }
.a-GV-status, .a-GV-rownum, .is-aggregate .a-GV-rowHeader { color: var(--my-text-muted); }
.a-GV-columnControls .a-Button { background-color: var(--my-surface-2); color: var(--my-text-muted); }
.t-Report-colHead a, .a-IRR-headerLink { color: inherit; }
.a-IRR { --a-gv-header-cell-padding-x: var(--a-gv-cell-padding-x); }
.a-IRR-button.a-IRR-button--pagination:hover { background-color: var(--my-accent); color: var(--my-on-accent); }
.apex-fullcalendar-5 { --fc-today-bg-color: var(--my-accent-soft); --fc-neutral-bg-color: var(--my-surface-2); }
```

### 14.2 Prüf-Checkliste (Testbett-Seiten)

- [ ] 1401: Kopf (Linkfarbe?), Streifen, Hover, alle Border-Optionen, fixierter Kopf beim Scrollen.
- [ ] 1402: Toolbar, Suchfeld-Fokus, Kopf (**harter Vita-Selektor**), Header-Menü (an `<body>`), Actions-Menü, Filter-Dialog, Filterleiste nach Suche, Pagination inkl. Hover.
- [ ] 1410: Header, Auswahl, Hover, Fokuszelle, Footer/Pagination (**aktive Seite im Dark Mode**), Spaltenknöpfe beim Hover, Columns-Dialog (Splitter).
- [ ] 1411/1412/1413: Facetten-Trenner, „Clear“/„Show All“, Current-Facet-Chip, Smart-Filter-Chips (Suggestion/Applied), Suchergebnis-Karten.
- [ ] 3100/3110: Legacy-Cards (Farbzyklus), Card Regions inkl. Style A/B/C, Media-Background, Badge, Hot-Button, Pagination.
- [ ] 3003–3007, 1301, 1304, 1403: Auswahl- und Hover-Farbe, Badges (subtle!), Avatare, Gruppierung (nur 26.1).
- [ ] 1700/1710/1720: Trenner, Zähler, Streifen, Reflow unter 560px (`--mobile`).
- [ ] 1902: Serienfarben, Achsentext, Gauge (**Dark**), Tooltip.
- [ ] 1800: heute/neutral (`.apex-fullcalendar-5`-Scope), `apex-cal-*`-Kontraste.
- [ ] 1906: Controls, Legende, Attribution.
- [ ] 1901: Auswahl, Hover und Fokus im Content-Tree **und** in der Side-Nav.
- [ ] Alles zusätzlich in App 9242 (UT 24.2) prüfen.

---

## 15. Anhang

**Recherche-Skripte** (`_tmp/research/reports/`):

- `rep-probe.mjs`: Berechnete Werte plus gewinnende CSS-Regel (Datei, Selektor, Rohwert) via CDP, in Vita und Vita-Dark. Unterstützt Klicks, Hover und Eingaben.
- `rep-skeleton.mjs`: kompaktes DOM-Skelett.
- `rep-dump-dom.mjs`: DOM, Klasseninventar und Stylesheet-Liste pro Seite (Ausgabe `dom/`).
- `rep-sections.mjs`: Variablen und hart codierte Farben pro Zeilenbereich einer CSS-Datei.
- `rep-chartlever.mjs`, `rep-tokenlever.mjs`, `rep-fclever.mjs`: Hebel-Tests mit `testtheme/` (Chart-Farben, IR-Header vs. GV-Header, FullCalendar-Scope).
- `rep-headorder.mjs`: Stylesheet-Reihenfolge inkl. FullCalendar- und MapLibre-CSS.
- `specs/*.json`: die verwendeten Mess-Spezifikationen.
- `basetheme/`: leerer Style (Basis Vita/Vita-Dark); `testtheme/`: Hebel-Test-Style.
- `oj-redwood-notag-min.css`, `maplibre-gl-apex.css`: vom Server geladene Bibliotheks-CSS zur Analyse.

**Screenshots** (`_tmp/research/reports/shots/`, jeweils `-light-`/`-dark-`):

- `cr-*`, `irr-*`, `irr-sortwidget-*`, `irr-filterdlg-*`, `irr-controls-*`,
- `ig-*`, `ig-columnsdlg-*`, `ig-242-dark-9242.png`,
- `facets-*`, `smartfilter-*`, `searchregion-*`, `cardview-first-*`,
- `charts-*`, `calendar-*`, `map-*`, `tree-*`, `listview-*`, `reflow-*`,
- Ganzseiten `9042-<seite>-light|dark|base.png`.
