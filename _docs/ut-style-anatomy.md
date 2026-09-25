# Anatomie der Oracle Theme Styles – und Regeln für unsere eigenen Styles

> Universal Theme (Theme 42), UT-Dateiversionen **26.1** und **24.2**, APEX-Runtime 26.1 (Testbetten 9042 / 9242). Stand: 2026-09-23.
> Ergänzt [`ut-tokens.md`](ut-tokens.md) (Variablen-Landkarte). Dieses Dokument beschreibt, **wie Oracle Styles baut** (Vita, Vita-Dark, Iris, Redwood, Theme Roller) und leitet daraus Regeln ab.
> Alle Zahlen stammen aus Skripten unter `_tmp/research/` (siehe [Anhang](#9-anhang-methode-skripte-reproduktion)). Was nicht selbst gemessen oder im Code nachgelesen wurde, ist als **unverifiziert** markiert.

## Inhalt

0. [Kurzfassung](#0-kurzfassung)
1. [Wie ein Theme Style geladen wird](#1-wie-ein-theme-style-geladen-wird)
2. [Vita vs. Vita-Dark (26.1): Diff-Analyse](#2-vita-vs-vita-dark-261-diff-analyse)
3. [Machbarkeit eines „Auto“-Styles (prefers-color-scheme)](#3-machbarkeit-eines-auto-styles-prefers-color-scheme)
4. [Iris (neu in 26.1) vs. Vita](#4-iris-neu-in-261-vs-vita)
5. [Redwood Light: radikal anderer Look als Theme Style](#5-redwood-light-radikal-anderer-look-als-theme-style)
6. [Theme Roller: JSON-Annotationen, Kompilierung, eigenes Addon](#6-theme-roller-json-annotationen-kompilierung-eigenes-addon)
7. [UT 24.2 vs. 26.1: was für Theme Styles zählt](#7-ut-242-vs-261-was-für-theme-styles-zählt)
8. [Do / Don't für unsere Theme Styles](#8-do--dont-für-unsere-theme-styles)
9. [Anhang: Methode, Skripte, Reproduktion](#9-anhang-methode-skripte-reproduktion)

---

## 0. Kurzfassung

- **Oracle kennt drei Bauformen von Theme Styles** (gelesen aus `apex_application_theme_styles`, App 9042):
  1. *Vita-Familie* (Vita, Vita - Dark, Vita - Red, Vita - Slate): keine `css_file_urls`, die komplette Style-Datei ist die **Theme-Roller-Output-Datei** (`#THEME_FILES#css/Vita#MIN#.css`), Input ist die komplette `Vita.less`.
  2. *Iris*: `css_file_urls` = Oracle-Sans-Font-CSS, Output = komplette `Iris.css`, Input = komplette `Iris.less`.
  3. *Redwood Light*: `css_file_urls` = Oracle-Sans + statische `Redwood.css` (255 KB), Input = winziges Addon `Redwood-Theme.less`, Output = `Redwood-Theme.css`, die **nur Kommentare** enthält – Theme Roller schaltet dort ausschließlich **Body-Klassen**.
  Unser Muster (Vita-Basis als File-URL + eigenes Bundle) ist eine Mischung aus 3. und einem „Overlay“, das Oracle so nicht selbst nutzt – es ist aber mit der Ladekette voll kompatibel.
- **Vita-Dark ist strukturell identisch mit Vita**: gleiche 206 Nicht-Variablen-Regeln, *kein* Selektor nur in Dark. Unterschiede: 147 geänderte + 31 zusätzliche `:root`-Variablen und **50 Deklarationen in 38 Regeln** mit hart codierten Farben (Button-Statusfarben, IRR/IG-Header, Report-Controls, IG-Zellen, Cards-Media).
- **Ein „Auto“-Style ist machbar und verifiziert**: Vita als Basis + das automatisch erzeugte Delta Vita→Vita-Dark (178 Variablen + 38 Regeln, 12,4 KB minifiziert / 2,5 KB gzip) unter `@media (prefers-color-scheme: dark)` ergibt auf 11 Testseiten **0 Abweichungen** in berechneten Farben gegenüber echtem Vita-Dark – in 26.1 *und* 24.2; das 26.1-Delta ist Obermenge des 24.2-Deltas und funktioniert auf beiden. Einschränkung: bei **Live-Umschaltung** des OS-Schemas behalten JET-Charts ihre beim Rendern gesetzten SVG-Textfarben.
- **Die Primärfarbe ist in Vita 27-fach als Hex kopiert** (19× `#056AC8`, 8× daraus abgeleitete Werte). Nur `--ut-palette-primary` zu setzen ändert weder Hot-Button noch Header (live gemessen). Farb-Varianten (Vita-Red) ändern 36 Variablen + 21 Deklarationen in 13 Regeln – das ist die exakte „Akzent-Hebelliste“.
- **Iris** ist ein Vita-Klon mit Redwood-Farben: warme Neutrals, Radius `.25rem`, Header 3.5rem, Akzent-„Pillars“ als Theme-Roller-Auswahl, modernes CSS (`color-mix()`, `:has()`), Alias-Tokens (`--ut-badge-border-radius`) und Hook-Tokens mit Fallback (`--ut-header-strip-*`). „Oracle Sans“ wird zwar geladen, ist aber **per Default nicht aktiv** (Theme-Roller-Option „System“ überschreibt; live gemessen).
- **Redwood** ersetzt Vita komplett: eigener Primitive-Namespace `--rw-palette-*` (576 Definitionen), gemappt auf 838 `--ut-*` und 1051 `--a-*`; 74 % aller Deklarationen sind Custom Properties; Spezifität fast nur 0,1,0–0,3,0; Varianten über Body-Klassen (`rw-pillar--*`, `rw-mode-*`, `rw-layout--*`) mit Default-Fallback `body:not([class*=rw-pillar--])`.
- **Theme Roller** kompiliert die Input-LESS-Dateien im Browser (less.js 4.6.3), liest JSON-Kommentare (`groups`, `var`, `target:"class"`), speichert `{vars, classes, customCSS, useCustomLess}` + CSS-Output + Body-Klassen (Attribut „CSS Classes“). Ein eigenes Addon ist machbar – am robustesten nach Redwood-Vorbild **nur mit Klassen-Optionen**.
- **24.2 → 26.1** ist rein additiv: +130 Klassen (Metric Card, Inline Actions, `u-gap-*`, Group-Header …), 0 entfernte Klassen, 0 geänderte `:root`-Defaults in Core.css, 127 neu konsumierte Tokens. `app_ui/Core.css` kommt aus der **Runtime** (in beiden Testbetten 26.1) – ein echtes APEX 24.2 ist hier nicht testbar.

---

## 1. Wie ein Theme Style geladen wird

### 1.1 Ladekette im `<head>`

Seiten-Template „Standard“ (App 9042/9242, read-only aus `apex_application_temp_page` gelesen):

```html
#APEX_CSS#          <!-- app_ui/css/Core.css, app_ui/css/Theme-Standard.css, font-apex -->
#THEME_CSS#         <!-- themes/theme_42/<ver>/css/Core.css -->
#TEMPLATE_CSS#
#THEME_STYLE_CSS#   <!-- css_file_urls des Styles, danach theme_roller_output_file_url -->
#APPLICATION_CSS#   <!-- CSS-File-URLs der App (User Interface) -->
#PAGE_CSS#          <!-- Seiten-CSS -->
...
<body class="t-PageBody ... #PAGE_CSS_CLASSES#" ...>
```

Live-DOM (Harness, Seite 1101) bestätigt die Reihenfolge `app_ui Core → Theme-Standard → font-apex → UT Core → Vita → themelab/theme.css`.

Konsequenzen:
- Unser Bundle gewinnt bei **gleicher Spezifität** gegen alles von Oracle (kommt später) – aber App- und Seiten-CSS der Entwickler gewinnen gegen uns. Das ist gewollt („plug and play“, App bleibt übersteuerbar).
- Eine Theme-Roller-Output-Datei kommt **nach** unseren `css_file_urls` → Tokens aus einem Theme-Roller-Addon überschreiben unsere `:root`-Defaults.
- `#PAGE_CSS_CLASSES#` enthält u. a. `apex-theme-<name>` (beobachtet: Style „Theme Lab“ → `apex-theme-theme-lab`, in App 9242 trotz `static_id = theme-lab-2`, also **vom Namen abgeleitet**) sowie laut Oracle-Doku die Werte des Style-Attributs **„CSS Classes“** ([Doku 24.1, Theme Styles](https://docs.oracle.com/en/database/oracle/apex/24.1/htmdb/theme-styles.html): „appended to the #PAGE_CSS_CLASSES# substitution string“).

### 1.2 Style-Attribute der Oracle-Styles (App 9042)

| Style | css_file_urls | theme_roller_input_file_urls | theme_roller_output_file_url | Read Only |
|---|---|---|---|---|
| Vita / Vita - Dark / - Red / - Slate | – | `#THEME_FILES#less/theme/Vita[-Dark…].less` | `#THEME_FILES#css/Vita[-Dark…]#MIN#.css` | Y |
| Iris | `#APEX_FILES#libraries/oracle-fonts/oraclesans-apex#MIN#.css` | `…/Iris.less` | `…/css/Iris#MIN#.css` | Y |
| Redwood Light | Oracle-Sans-CSS **+** `#THEME_FILES#css/Redwood#MIN#.css` | `…/Redwood-Theme.less` | `…/css/Redwood-Theme#MIN#.css` | Y |
| Theme Lab (unser Labor) | `#THEME_FILES#css/Vita#MIN#.css` + `#APP_FILES#themelab/theme#MIN#.css` | – | – | Y |

`theme_roller_config` ist bei allen Oracle-Styles leer, `css_classes` ebenfalls.

### 1.3 Was aus welcher Datei kommt

- **`app_ui/css/Core.css`** (Widgets: IG, IR, Menüs, Dialoge, Date Picker …) und `Theme-Standard.css` (Default-Palette `--a-palette-*`) sind **Runtime-Dateien** – beide Testbetten laden `/i/app_ui/css/Core.min.css?v=26.1.0`, unabhängig von der UT-Version.
- **UT `Core.css`** enthält Layout und Komponenten; auf `:root` verdrahtet es nur **18** APP_UI-Tokens auf UT-Tokens (`--a-palette-*: var(--ut-palette-*)`, `--a-base-link-text-color`; `ut-26.1/css/Core.css` Z. 13–70). Alle übrigen `--a-*`-Werte setzt die **Style-Datei** direkt.
- Core.css Z. 22: `color-scheme: var(--ut-color-scheme, normal);` – das einzige „Dark-Mode-Signal“ des UT. Es gibt in keiner Referenzdatei `prefers-color-scheme`; `desktop_all.min.js` und `widget.jetChart.min.js` enthalten keine Dark-Mode-Erkennung.

---

## 2. Vita vs. Vita-Dark (26.1): Diff-Analyse

Skript: `_tmp/research/diff-vita.mjs` (eigener CSS-Parser `cssparse.mjs`; Regeln werden über at-rule-Kontext + Selektor + Vorkommensindex gepaart). Ergebnis: `diff-vita-26.1.txt`, `diff-vita-24.2.txt`.

### 2.1 Zahlen

| | Vita.css | Vita-Dark.css |
|---|---|---|
| Regeln gesamt | 245 | 246 |
| reine `:root`-Variablenblöcke | 39 (818 Custom-Property-Deklarationen) | 40 (867) |
| effektive `:root`-Variablen (letzte Definition) | 796 | 827 |
| sonstige Regeln (Komponenten-Selektoren) | 206 (575 Deklarationen) | 206 (575 Deklarationen) |

Vergleich:

| Kategorie | Anzahl |
|---|---|
| `:root`-Variablen mit anderem Wert | **147** |
| `:root`-Variablen nur in Dark | **31** |
| `:root`-Variablen nur in Vita | 0 |
| Regeln nur in Dark / nur in Vita | **0 / 0** (kein Dark-exklusiver Selektor) |
| gemeinsame Regeln mit abweichenden Deklarationen | **38** Regeln, **50** Deklarationen – alle 50 mit hart codierter Farbe |
| identische Nicht-Variablen-Regeln | 168 |

Die 178 Delta-Variablen: 156 hart codierte Farben, 15 `var()`-Referenzen, 7 sonstige (`--ut-color-scheme: dark`, `--ut-base-filter: invert(1)`, drei Radien `.125rem → 2px` – wertgleich, nur Einheit –, zwei `unset`).

### 2.2 Die 50 Deklarationen außerhalb von `:root`

| Bereich (Abschnitts-Kommentar in Vita.css) | Deklarationen | Selektoren / Art |
|---|---|---|
| Button-Status *Warning/Success/Danger* | 24 | `.t-Button--warning|success|danger` (+ `--simple`, `--link`, `--noUI`): `--a-button-*-color` und `color` |
| Button-Icons `.fa:after` | 3 | `.t-Button--danger|success|warning .fa:after` → `background-color` |
| Report-Controls „Control Types“ | 12 | `.a-IG-controls-item--savedReport|search|filter|controlBreak|groupBy|aggregate|highlight|flashback|chart|pivot|invalidSettings|inactiveSettings` → `--a-report-controls-cell-label-hover-background-color` |
| IG-Zellen | 3 | `.a-GV-table .a-GV-cell.is-active`, Readonly-Zellen im Edit-Mode, fokussierte Spalten-Inputs → `background-color` |
| IRR-Header / IG Control Break | 4 | `.a-IRR-header`, `:hover`, `.a-IRR-header--group`, `.a-GV-table th.a-GV-controlBreakHeader` |
| IG/IRR Control-Buttons | 1 | `.a-IG-button--controls, .a-IRR-button--controls` → `--a-button-background-color` |
| Cards-Media | 3 | `.t-CardsRegion--styleA|B|C` → `--a-cv-media-background-color` |

Nicht betroffen: Hot- und Primary-Buttons (in beiden Dateien gleich), alle Layout-/Abstandsregeln.

### 2.3 Die 178 Variablen nach Bereich

Geänderte Werte nach Präfix (Top): `ut-palette` 18, `ut-component` 12, `ut-body` 11, `a-chat` 10, `a-diagram` 10, `a-cv` 7, `a-field` 6, `a-gv` 6, `a-chip` 6, `a-button` 6, `ut-region` 5, `ut-report` 4, `a-datepicker`/`a-menu`/`ut-header`/`ut-resultsregion`/`a-checkbox` je 3 …

Nur in Dark (alle im letzten `:root`-Block, `Vita-Dark.css` Z. 3453 ff.): `--ut-base-filter` (Login-Hintergrundbild, konsumiert in `Core.css` Z. 3064), 3× `--a-datepicker-calendar-day-current-*`, 5× `--a-chat-*`, `--a-filedrop-icon-action-background-color`, 11× `--prism-*` (Code-Highlighting), 10× `--a-md-*` (Markdown). In Vita greifen dafür die Fallbacks in `app_ui/Core.css`.

### 2.4 Was man daraus lernt

1. **Hell/Dunkel ist bei Oracle eine Zahlen-Operation**, keine Struktur-Operation: gleiche Selektoren, andere Werte. Unser Bundle kann deshalb für hell und dunkel **identische Komponentenregeln** nutzen und nur Token-Werte tauschen.
2. **Abgeleitete Farben sind vorberechnet** (SCSS `mix()`/`darken()` zur Build-Zeit): `--ut-palette-primary-shade: #e6f0fa → #010b14`, Hover-/Active-Farben der Buttons als eigene Hex-Werte. Wer einen Basiswert ändert, muss die abgeleiteten selbst setzen – bei uns am besten zur Laufzeit per `color-mix()`.
3. **Komponenten-Tokens hängen an Modifier-Selektoren** (78 der 206 Nicht-Root-Regeln in Vita setzen Custom Properties, v. a. `t-Button` 20, `t-Form` 15, `a-IG` 13, `t-CardsRegion` 7). Ein `:root`-Override von `--a-button-background-color` erreicht `.t-Button--hot` nicht.
4. 26 Nicht-Root-Regeln in Vita setzen **echte Eigenschaften mit hart codierter Farbe** (v. a. `t-Button` 9, `t-TreeNav` 8, `a-GV` 4, `a-IRR` 3), dazu kommen vier `!important`-Deklarationen: drei in der TreeNav (`.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover` Z. 3026, Style-B-Hover Z. 3123/3126) und eine im Workflow-Diagramm (Z. 3412).

---

## 3. Machbarkeit eines „Auto“-Styles (prefers-color-scheme)

### 3.1 Problem

Ein Theme Style kann über `css_file_urls` nur **eine** Basis laden (Vita *oder* Vita-Dark); `#THEME_FILES#` wird nur in den File-URLs ersetzt, nicht in statischen CSS-Dateien. Ein bedingtes `@import` auf Vita-Dark wäre daher nur mit hart codiertem Pfad inkl. UT-Version und Image-Prefix möglich → nicht plug-and-play. Eine Media-Syntax für Theme-Style-File-URLs ist in der Oracle-Doku nicht beschrieben (**unverifiziert, nicht verwenden**).

### 3.2 Lösung: Delta Vita → Vita-Dark in unserem Bundle

Skript `_tmp/research/gen-dark-delta.mjs` erzeugt aus den Referenzdateien:

```css
@media (prefers-color-scheme: dark) {
  :root { /* 178 Variablen: 147 geänderte + 31 neue, inkl. --ut-color-scheme: dark */ }
  .t-Button--warning { --a-button-background-color: #FBCE4A; … }   /* 38 Regeln, nur die abweichenden Deklarationen */
  …
}
```

Größe: 15,5 KB unminifiziert, **12,4 KB minifiziert, 2,5 KB gzip** (lightningcss).

### 3.3 Verifikation (berechnete Styles, alle Elemente)

`_tmp/research/compare-dark.mjs`: Lauf A = Basis per Interception auf Vita-Dark getauscht, Bundle leer; Lauf B = Basis Vita, Bundle = Delta, `prefers-color-scheme: dark` emuliert. Verglichen werden je Element `color`, `background-color`, drei `border-*-color`, `box-shadow`, `outline-color`, `fill`, `stroke`, `background-image`, `color-scheme`, `filter` sowie `::before`-Farben.

| Testbett | Delta | Seiten | Elemente verglichen | Abweichungen |
|---|---|---|---|---|
| 9042 (UT 26.1) | 26.1 | 1101, 1201, 1500, 1601, 1402, 1410, 3100, 1114, 1800 | 9 050 | **0** |
| 9042 (UT 26.1) | 26.1 | 1902 (Charts), 6307 (CSS Variables) | 1 501 | **0** |
| 9242 (UT 24.2) | 24.2 | 1101, 1201, 1500, 1601, 1402, 1410, 3100, 1114 | alle | **0** |
| 9242 (UT 24.2) | **26.1** | 1201, 1410, 1601 | alle | **0** |
| Kontrolle 9042: Delta geladen, aber *hell* emuliert | 26.1 | 1201, 1410 | 2 236 | 2 236 (100 % → Test trennscharf) |

Robustheit 24.2/26.1: Die Deltas unterscheiden sich nur um 6 Variablen, die in 26.1 zusätzlich existieren (`--a-kb-shortcut-*` ×2, `--a-diagram-element-container-children-container-background-color`, `--a-diagram-element-subcontainer-*` ×2, `--ut-component-pre-background-color`); die 38 Regeln sind identisch. **Ein aus 26.1 erzeugtes Delta ist Obermenge und funktioniert auf 24.2.**

Nicht abgedeckt: geöffnete Popups/Dialoge/Menüs, `::after`, Hover-Zustände (nicht gerendert) – da das Delta aber aus einem vollständigen Datei-Diff stammt, gibt es dafür keine fehlenden Regeln; Risiko nur durch Kaskaden-Reihenfolge (siehe 3.5).

### 3.4 Live-Umschaltung (OS wechselt Schema bei offener Seite)

`_tmp/research/switch-live.mjs`: Seite hell laden → auf dunkel umschalten → mit „von Anfang an dunkel“ vergleichen.
- 1201 (Regionen): 0 Abweichungen – CSS schaltet sofort.
- **1902 (Charts): 24 SVG-`text`-Elemente** behalten ihre beim Rendern gesetzte `fill`-Farbe (z. B. `rgb(0,0,0)` statt `rgb(255,255,255)`) → Achsenbeschriftungen dunkel auf dunkel bis zum Neu-Rendern.
- Abhilfe braucht JavaScript (z. B. `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` + Chart-Region refreshen) – das kann ein Theme Style nicht mitliefern (nur CSS-URLs). Ob ein Region-Refresh genügt: **unverifiziert**.

### 3.5 Empfehlung

**Ja, ein Auto-Style ist robust machbar – als dritter Style neben expliziten Hell- und Dunkel-Styles, nicht als Ersatz.**

1. Explizite Styles bleiben der Standard: `<Theme> Light` (Basis Vita) und `<Theme> Dark` (Basis Vita-Dark). Dort liefert Oracle die Dunkel-Werte selbst, auch für künftige Komponenten.
2. `<Theme> Auto` = Basis Vita + Bundle-Reihenfolge:
   1. unsere hellen Tokens und Komponentenregeln,
   2. `@media screen and (prefers-color-scheme: dark) {` **generiertes Oracle-Delta** (aus der neuesten UT-Referenz) `}`,
   3. `@media screen and (prefers-color-scheme: dark) {` **unsere Dark-Tokens** (derselbe Block, den der Dark-Style auf `:root` setzt) `}`.
   `screen and` hält den Druck hell. Unsere Dark-Tokens stehen nach dem Oracle-Delta, damit sie gewinnen.
3. Delta und Dark-Tokens **im Build erzeugen**, nicht von Hand pflegen; bei neuer UT-Version Delta neu generieren und Zahlen gegenprüfen (Build-Check: Delta-Regelzahl/-Variablenzahl gegen Erwartung).
4. Kaskaden-Detail: Im echten Vita-Dark stehen die 38 Delta-Regeln an ihrer Originalposition, im Bundle *nach* ganz Vita. Das kann nur abweichen, wenn eine später in Vita stehende, *nicht* geänderte Regel dieselbe Eigenschaft auf demselben Element mit gleicher Spezifität setzt – die Messung zeigt, dass das in 26.1/24.2 nicht vorkommt.
5. `light-dark()` ist keine Alternative für das Oracle-Delta (wirkt nur für Farbwerte, braucht `color-scheme: light dark`, und Vitas vorberechnete Hex-Werte müssten trotzdem ersetzt werden). Für **unsere eigenen** Tokens wäre es möglich, bringt gegenüber dem Media-Block aber keinen Vorteil und koppelt an `--ut-color-scheme`.
6. Benutzerwahl statt OS: Styles mit „Is Public“ = Ja lassen sich vom Endbenutzer wählen; programmatisch per `APEX_THEME.SET_SESSION_STYLE`/`SET_USER_STYLE` (**API-Existenz aus Doku bekannt, hier nicht ausgeführt**).

---

## 4. Iris (neu in 26.1) vs. Vita

### 4.1 Aufbau

`Iris.css` beginnt mit „Vita SCSS Variables“ – es ist aus demselben Quellbaum wie Vita gebaut. Diff (`diff-vita-iris.txt`):

| | Anzahl |
|---|---|
| `:root`-Variablen mit anderem Wert | 193 (davon 90 `--u-color-*` = neue Akzentpalette) |
| nur in Iris / nur in Vita | 14 / 4 |
| Nicht-Root-Regeln: identisch / abweichend / nur Iris | 162 / 44 (80 Deklarationen) / 23 (64 Deklarationen, Abschnitt „Theme Overrides“ ab Z. 672, plus 1 in „Navigation“) |

### 4.2 Tokens

- **Farben:** Redwood-Neutrals statt Grau: Text `#161513`, Body `#FBF9F8`, Title-Bar `#F1EFED`, Header/Nav `#302D2A`; Primär `#00688c` (Pillar „sky“); Status-Farben gedeckt (`--ut-palette-warning: #8F520A` statt `#FFC628`, Danger `#B3311F`). Transparente Neutrals auf Textbasis: `rgba(22, 21, 19, .08|.12|.5|.7)` für Hover, Rahmen, Sekundärtext.
- **Geometrie:** `--ut-component-border-radius`, `--a-button-border-radius`, `--a-field-input-border-radius` `.125rem → .25rem`; neues Alias-Token `--ut-badge-border-radius: 1rem`, von `--a-cv-badge-border-radius`, `--a-resultsitem-badge-border-radius`, `--ut-navbar-button-badge-border-radius` konsumiert; `--ut-header-height: 3.5rem` (Vita 3rem); `--ut-header-box-shadow: none`.
- **Formularfelder:** weiß mit kräftigem Rahmen (`--a-field-input-background-color: #fff`, `--a-field-input-border-color: rgba(22,21,19,.5)`) statt grau gefüllt.
- **Buttons:** Standard-Button transparent-grau `rgba(22,21,19,.08)`, **Hot-Button fast schwarz** `#161513` (nicht Akzentfarbe!).

### 4.3 Schrift „Oracle Sans“

- `css_file_urls` lädt `oraclesans-apex.css`; `Iris.css` Z. 15 setzt `--a-base-font-family: "Oracle Sans", …`.
- **Aber** Z. 1089 (Theme-Roller-Option „Font Family“, Default `system`) überschreibt mit dem System-Stack und `--a-base-font-weight-semibold: 500`. Live gemessen (Iris-Datei per Interception, Seite 1101): `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", …`, **0 geladene Oracle-Sans-Fonts**.
- `Iris.less` Z. 2192–2206: Der Guard für „Oracle Sans“ prüft versehentlich `@g_Header_Style = oracle_sans` statt `@g_FontFamily`. Wählt man „Oracle Sans“, entfällt nur der System-Override und der Wert aus Z. 75 greift – funktioniert also zufällig.

### 4.4 Komponenten-Umbauten („Theme Overrides“)

- **Header-Strip:** `.t-Header:before { background-color: var(--ut-header-strip-background-color, var(--ut-palette-primary)); block-size: var(--ut-header-strip-size, .375rem) }` – die Strip-Tokens sind **nirgends definiert** (Hook-Tokens mit Fallback).
- **Header-Buttons:** Hover/Active per `color-mix(in srgb, currentColor 8% | 12%, transparent)` – Zustandsfarben aus der Textfarbe abgeleitet, funktioniert auf jedem Header-Hintergrund.
- **IRR-/IG-Suche als ein Feld:** `.a-IRR-search` und `.a-IG-header .a-Toolbar-group--search` bekommen Feld-Rahmen/-Hintergrund, Buttons darin werden randlos, Fokusring per `:focus-within:not(:has(.a-Button:focus))` (max. Spezifität 0,9,0).
- Navigation: aktueller TreeNav-Eintrag fett; Selektion `#00688c`.

### 4.5 Theme Roller in Iris

41 Annotationen (Vita: 101): 32 Farben, 4 Zahlen, 5 Selects – darunter **„Accent Pillar“** (16 Presets + `custom`, LESS-Guards `.dummyFunctionN() when (@g_Accent-Pillar = sky) { @g_Accent-BG: #00688c; }`), Header-Stil und Nav-Stil (`dark|light|pillar`), Schrift. Neu: Schlüssel **`dependingOn`** (Farbwähler „Accent“ nur sichtbar, wenn Pillar = `custom`).

### 4.6 Was Iris über Oracles aktuellen Token-Ansatz verrät

1. Oracle bleibt bei **einer monolithisch kompilierten Datei pro Style** und vorberechneten Hex-Werten – kein `@layer`, kein `light-dark()`, keine Laufzeit-Ableitung der Palette.
2. Neu sind **Alias-Tokens** (Komponenten-Token → gemeinsames semantisches Token, z. B. Badge-Radius) und **Hook-Tokens mit Fallback** als Erweiterungspunkte.
3. **Modernes CSS ist in 26.1 „erlaubt“**: `color-mix()` und `:has()` in Iris; UT Core 26.1 enthält `color-mix`/`:has` in 71 Zeilen (24.2: 36).
4. Richtung Redwood-Optik innerhalb der Vita-Struktur: Presets („Pillars“) statt freier Farbwahl, warme Neutrals, größere Radien, dunkler Hot-Button.

---

## 5. Redwood Light: radikal anderer Look als Theme Style

### 5.1 Aufbau

- **Kein Vita.** `Redwood.css` ist eine **vollständige, eigenständige Style-Datei** (740 Regeln, 3 500 Deklarationen, davon 2 598 = 74 % Custom Properties). Sie definiert alle UT-/APP_UI-Tokens selbst (838× `--ut-*`, 1051× `--a-*`, 90× `--u-color-*`) – daher version-gebunden (je UT-Version eine eigene Datei).
- **Eigener Primitive-Namespace** `--rw-*` (576 Definitionen): `--rw-palette-neutral-0 … -200`, `--rw-palette-oraclered-*`, `--rw-palette-brandlight-*`, Pillar-Paletten; `--rw-typography-*`; Zustände wie `--rw-active-pillar-background-color`, `--rw-dark-body-title-background-color`. Semantische UT-Tokens zeigen auf Primitive: `--ut-body-background-color: var(--rw-palette-neutral-20)`, `--ut-link-text-color: var(--rw-palette-blue-120)`, `--ut-focus-outline: var(--ut-focus-outline-color) dashed 1px` (`Redwood.css` Z. 876 ff.).
- Addon `Redwood-Theme.less`/`.css`: nur Gruppen + 6 Selects mit `"target": "class"`; die kompilierte CSS enthält **keine einzige Regel**.

### 5.2 Body-Klassen (vom Theme Roller gesetzt)

| Option (Theme Roller) | Klassen (`"r"`-Werte) |
|---|---|
| Pillar | `rw-pillar--neutral` (Default) · `pebble` · `slate` · `pine` · `teal` · `ocean` · `lilac` · `rose` · `sienna` · `plum` · `sky` (CSS kennt zusätzlich `beige`) |
| Layout | `rw-layout--edge-to-edge` · `rw-layout--fixed t-PageBody--scrollTitle` (eine Option = zwei Klassen) · `rw-layout--contained` |
| Header | `rw-mode-header--light` · `--dark` · `--pillar` |
| Navigation | `rw-mode-nav--light` · `--dark` · `--pillar` |
| Body-Header | `rw-mode-body-header--light` · `--dark` |
| Body-Hintergrund | `rw-mode-body--light` · `--dark` |

`rw-layout--foldout` (82 Selektoren) ist **nicht** im Theme Roller wählbar (manuell per CSS-Klasse). Defaults ohne Klasse: `body:not([class*=rw-pillar--]), .rw-pillar--neutral { … }` (23 Regeln mit `:not([class*=…])`, `Redwood.css` Z. 4205 ff.). Jede Pillar-Klasse setzt nur **Tokens + Texturbilder**; Komponenten konsumieren die Tokens.

Renderbeispiele (Iris/Redwood per Interception, ohne DB-Änderung): `_tmp/research/style-Iris-9042-1101.png`, `style-Redwood-9042-1101.png`, `style-Redwood-9042-1101-pine.png` (Pine + Pillar-Header/-Nav + Fixed-Layout).

### 5.3 Selektor-Spezifität (`profile-Redwood.txt`)

- Verteilung: 0,2,0 (348) · 0,1,0 (330) · 0,3,0 (274) · 0,4,0 (83) · 0,5,0 (35) · Rest klein. Vergleich Vita: 0,1,0 (132) · 0,2,0 (113) · 0,3,0 (65).
- Maximum: `#wwvFlowForm` (1,0,0) – ein ID-Selektor (`width: 100%`, Z. 1681).
- `!important`: 68 Deklarationen, davon 61 in `rw-typography-*`-Utilities (bewusste Utility-API) und 7 in 6 Hack-Regeln (`.t-Dialog-page … background-image`, `.ui-dialog-titlebar:before content`, `.a-FS-search .apex-item-text border-radius`, IRR-Dialog-Padding, Close-Alert-Transform, Workflow-Diagramm).
- Layout-Varianten mit `:not()`-Ketten: `.rw-layout--contained:not(.rw-layout--edge-to-edge):not(.rw-layout--fixed):not(.rw-layout--foldout)` (0,4,0).

### 5.4 Welche Komponenten Redwood umbaut

Top nach Deklarationen (Regeln / echte Eigenschaften / Tokens): Pillar-Varianten 204/132/553 · Layout-Varianten 85/142/116 · `t-Button` 60/28/200 · `apex-item-*` (Formulare) 127/107/120 · Mode-Klassen 40/6/218 · `a-IRR` 99/144/65 · Typografie-Utilities 42/108/0 · `a-FS` (Faceted Search) 27/14/94 · `a-IG` 59/73/32 · `a-DatePicker` 39/53/41 · `t-CardsRegion` 26/44/49 · `t-Form` 35/47/40 · Texturen 48/72/0 · `t-WizardSteps` 21/64/6 · `t-Alert` 18/24/34 · Dialoge, MegaMenu, TreeView, Avatar, Badges, Login …
Bilder: 126 `url()`-Deklarationen (PNG-Texturen, relativ `../images/rw/…`, je `_2x`-Variante per `min-resolution: 120dpi`).

### 5.5 Übernehmen / vermeiden

**Übernehmen**
- Zweistufige Tokens: **eigene Primitive** (`--<prefix>-*`) → Mapping auf `--ut-*`/`--a-*`. Komponentenregeln konsumieren nur Tokens.
- Varianten als **Body-Klassen, die nur Tokens umschalten**; Default ohne Klasse per `body:not([class*=<prefix>-accent--])`.
- Niedrige Spezifität (Klassen, max. ~0,3,0), keine IDs.
- Theme-Roller-Addon nur mit `"target": "class"` → keine LESS-Kompilierung, Output-Datei statisch.
- Utilities (`rw-typography-*`) als bewusste, dokumentierte API – mit `!important` *nur* dort.

**Vermeiden**
- Vita komplett ersetzen: 255 KB pro UT-Version, jede neue Oracle-Komponente muss nachgezogen werden. Unser Overlay auf Vita erbt neue Tokens automatisch.
- Große Bitmap-Texturen (126 `url()`); `!important`-Hacks; ID-Selektoren; `:not()`-Ketten für Layout-Exklusivität.
- Oracle Sans / Redwood-Paletten – Ziel ist ausdrücklich „nicht wie APEX“.

---

## 6. Theme Roller: JSON-Annotationen, Kompilierung, eigenes Addon

Quelle: `/i/apex_ui/js/widget.themeRoller.js` (unminifiziert vom Testserver, Kopie in `_tmp/research/`), Zeilenangaben daraus.

### 6.1 Ablauf

1. Theme Roller lädt **alle** `theme_roller_input_file_urls` per `$.get` und fügt sie zusammen – nach `inputB.i - inputA.i` sortiert (Z. 1400), also **in umgekehrter Reihenfolge** der URL-Liste (aus dem Code; nicht live getestet).
2. Kompiliert im Browser mit **less.js** aus `libraries/less-js/<apex.libVersions.lessJs>/` (Z. 864) – in der 26.1-Runtime **4.6.3** (live gelesen). LESS 4: Division nur in Klammern.
3. Ein less-Plugin sammelt Kommentare, die als JSON parsebar sind. Die vorgesehenen Filter (`groups` / `var` / `translate`) greifen wegen `pOptions.commentsFilter === "function"` (Z. 2310, fehlendes `typeof`) **nicht** – jeder JSON-Kommentar landet in allen Listen; erst die Auswertung unterscheidet: Objekte mit `groups` → Gruppen; `target === "class"` → Klassen-Option (Schlüssel `name`); sonst Objekte mit `var` → Variablen-Option.
4. Stil nur „rollable“, wenn mindestens eine Input-URL auf `.less` endet (Z. 2092).
5. **Vorschau:** Output- und File-URL-Links werden entfernt, die File-URLs *vor* dem `<style>`-Container mit dem LESS-Ergebnis wieder eingefügt (Z. 2108–2124) → gleiche Reihenfolge wie zur Laufzeit (File-URLs, dann Theme-Roller-CSS). Beim Speichern wird „Custom CSS“ hinter den LESS-Output gehängt (Z. 2792).
6. **Klassen-Optionen** (`swap()`, Z. 1745): alte Klassen vom `<body>` entfernen, neue hinzufügen; `config.classes` und `pageCssClasses` pflegen.
7. **Speichern** (`getThemeDataForSaving`, Z. 2787 ff.): `{ css: LESS-Output + Custom CSS, pageCssClasses, config: { classes, vars (modifyVars), customCSS, useCustomLess } }`. `pageCssClasses` landet im Style-Attribut „CSS Classes“ (Doku). Read-only-Styles (alle Oracle-Styles) → nur **„Save As“** (neuer Style). Wo APEX die gespeicherte CSS ablegt (bekannt aus Exporten als `#THEME_DB_FILES#…css` in `theme_roller_output_file_url`): **unverifiziert**.

### 6.2 Annotationen

Gruppen (einmal pro Datei, z. B. `Vita.less`):

```json
/* { "translate": true,
     "groups": [ { "name": "UTR.LESS.GLOBAL_COLORS", "common": true, "sequence": 1 }, … ] } */
```

Variable:

```json
/* { "var": "@g_Container-BorderRadius", "name": "UTR.LESS.CONTAINER_BORDER_RADIUS",
     "type": "number", "units": "px", "range": { "min": 0, "max": 30, "increment": 2 },
     "group": "UTR.LESS.CONTAINERS" } */
@g_Container-BorderRadius: .125rem;
:root { --ut-component-border-radius: @g_Container-BorderRadius; }
```

| Schlüssel | Wirkung (Code) |
|---|---|
| `var` | LESS-Variable; Wert geht als `modifyVars` in die Kompilierung |
| `name`, `group`, `d` | Beschriftung über `apex.lang.getMessage()` – unbekannte Schlüssel erscheinen als Klartext (Oracle selbst lieferte in 24.2 `"d": "Sky"`) |
| `type` | `color` (Farbwähler), `number` (Slider; `rem`-Werte werden ×16 in px umgerechnet, Z. 249–253), `select` (`options: [{d, r}]`), sonst Textfeld |
| `subgroup` | Variablen mit gleicher Subgruppe → Doppel-Farbwähler (z. B. Hintergrund/Text) mit Kontrastprüfung; `checkContrast: false` schaltet sie ab |
| `style: "big"` | große Darstellung (nur Primär-/Body-Akzent) |
| `dependingOn: [{propertyName, type: EQUALS|NOT_EQUALS, value}]` | Sichtbarkeit abhängig von anderer Option (neu, Iris) |
| `target: "class"` | Select-Option setzt Body-Klassen statt einer Variable (kein `var` nötig; Redwood) |

`Vita.less` (24.2 und 26.1 identisch gezählt): 101 Annotationen – 92 `color`, 7 `number`, 2 `select`; 10 Gruppen (Global Colors 4, Containers 11, Navigation 15, Regions 4, States 12, Palette 30, Buttons 15, Forms 4, Interactive Reports 1, Layout 5). In `Vita.css` stehen dieselben Kommentare mit `"var": "$g_Accent-BG"` (Z. 727) – **Vita.css wird aus SCSS gebaut, `Vita.less` ist die Theme-Roller-Portierung.** Nach „Save As“ ersetzt der LESS-Output die komplette Vita-Datei des neuen Styles.

### 6.3 Eigenes Addon für unsere Styles – machbar?

**Ja.** Zwei Stufen:

*Stufe 1 (empfohlen, Redwood-Muster)* – nur Klassen, keine Kompilierungsrisiken:

```json
/* { "groups": [ { "name": "Mein Theme", "common": true, "sequence": 1 } ] } */
/* { "name": "Akzent", "type": "select", "target": "class", "group": "Mein Theme",
     "options": [ { "d": "Violett (Standard)", "r": "nb-accent--violet" },
                  { "d": "Petrol",             "r": "nb-accent--teal" } ] } */
/* { "name": "Ecken", "type": "select", "target": "class", "group": "Mein Theme",
     "options": [ { "d": "Weich (Standard)", "r": "nb-radius--soft" },
                  { "d": "Kantig",           "r": "nb-radius--sharp" } ] } */
```

Style-Attribute: `theme_roller_input_file_urls = #APP_FILES#<theme>/roller.less`, `theme_roller_output_file_url = #APP_FILES#<theme>/roller#MIN#.css` (nur Kommentare), Read Only = Ja. Unser Bundle reagiert auf die Klassen; Default per `body:not([class*=nb-accent--])`.

*Stufe 2* – freie Werte über `var`:

```less
/* { "var": "@nb-accent", "name": "Akzentfarbe", "type": "color", "group": "Mein Theme" } */
@nb-accent: #6d28d9;
/* { "var": "@nb-radius", "name": "Eckenradius", "type": "number", "units": "px",
     "range": { "min": 0, "max": 24, "increment": 2 }, "group": "Mein Theme" } */
@nb-radius: 8px;
:root { --nb-accent: @nb-accent; --nb-radius: @nb-radius; }
```

Das Bundle leitet alle Zustände zur Laufzeit ab (`color-mix(in srgb, var(--nb-accent) 88%, black)` usw.), damit **ein** Token reicht.

**Risiken**
- Output-CSS wird beim Speichern **eingefroren** (pro gespeichertem Style); spätere Addon-Änderungen (neue/umbenannte Variablen) erreichen gespeicherte Styles nicht. Deshalb: wenige, stabile Variablen; Namen nie umbenennen.
- Jeder JSON-Kommentar mit `var` wird zur Option (Filter-Bug) – keine JSON-artigen Kommentare für andere Zwecke.
- Mehrere Input-Dateien werden **rückwärts** verkettet → nur **eine** `.less`-Datei verwenden.
- less.js-Version hängt an der Runtime (26.1: 4.6.3); moderne CSS-Syntax im Addon vermeiden, nur Variablen → `:root`.
- Theme Roller nur für Entwickler (Developer Toolbar); Endbenutzer sehen ihn nicht.
- Nutzer können im Feld „Custom CSS“ beliebiges CSS mitspeichern – außerhalb unserer Kontrolle.
- Ob „Save As“ `css_file_urls` und Input-URLs des Quell-Styles übernimmt, ist naheliegend, aber **unverifiziert** (erfordert DB-Änderung).

---

## 7. UT 24.2 vs. 26.1: was für Theme Styles zählt

Skript `_tmp/research/core-diff.mjs` (`core-diff.txt`, `vita-version-diff.txt`).

### 7.1 UT `Core.css`

| | 24.2 | 26.1 |
|---|---|---|
| Regeln | 4 266 | 4 449 |
| Klassen | 3 197 | 3 327 |
| Selektoren | 6 574 | 6 844 (+275 / −5) |
| definierte Custom Properties | 614 | 625 (+11, −0) |
| konsumierte `var()`-Tokens | 1 564 | 1 691 (+127, −0) |
| geänderte `:root`-Defaults | – | **0** |

**Neue Klassen (130, keine entfernt):** `t-MetricCard*` (20) und `t-MetricCards*` (9), `t-InlineActions*` (11), `t-Avatar-group*` (11), Group-Header für `t-Comments`/`t-MediaList`/`t-Timeline` (je 5–7), `u-gap-*` (16), `u-overflow-*` (7), `u-align-content-*` (6), `u-flex-direction-*` (3), `u-tabular-nums`, `a-FlexContainer*` (4), `t-PageBody--blank|--contain|--verticalTop|Middle|Bottom`, `t-PageBody-noScript`, `t-Drawer--pullOutTop|Bottom`, `t-Button--noTop|Bottom|Left|Right`, `t-Region--visibleOverflow`, `t-Tabs--inlineIcon`, `t-Badge--rounded`, `t-ContentRow--stackMobile`, `t-DialogRegion-footer`, `t-DrawerRegion-footer`, `a-Button--withIcon`, `a-FS--hideRadio`, `u-selector--single` u. a.
**Entfallene Selektoren (5):** `::-webkit-input-placeholder`, `:where(.t-TreeNav .a-TreeView-node .fa):before`, zwei `.u-RTL`-Varianten, `.t-Region--carousel:not(.t-Region--hideHeader) > .t-Region-header`.
**Neu konsumierte Tokens (127):** `--ut-metric-card-*` 40, `--u-space-*` 16, `--ut-media-list-*` 13, `--ut-comment-*` 13, `--ut-timeline-*` 11, `--ut-avatar-*` 10, `--a-button-*count*`/`--a-button-icon-color`/`--a-button-margin-inline-x` 8, `--ut-contextualinfo-*` 7, `--a-field-input-border-style`, `--ut-badge-rounded-border-radius`, `--ut-dialog-pullout-*`, `--ut-header-menubar-badge-text-color`, `--ut-no-script-padding-*` …

### 7.2 Style-Dateien

- **Vita:** Regeln/Selektoren identisch; 11 neue Variablen in 26.1 (`--a-button-count-*`, `--a-kb-shortcut-*`, `--a-diagram-element-*` ×5, `--a-datepicker-footer-border-color`, `--ut-component-pre-background-color`); ein geänderter Default: `--a-field-input-border-style: dashed` (24.2) → `solid` (26.1). In 24.2 wird der Wert nirgends konsumiert; in 26.1 nutzt ihn der Readonly-Block (`.apex-item-*-readonly …`, `Core.css` Z. ~16805).
- **Vita-Dark:** Delta 24.2 = 172 Variablen, 26.1 = 178 (Obermenge), identische 38 Regeln (Abschnitt 3).
- **Redwood:** 740 Regeln in beiden; 19 geändert, je 3 neu/entfallen (Breadcrumb-Trenner, `.t-Dialog-page, .t-Drawer-page`, Hot-Button im dunklen Header).
- **`theme42.js`:** Klassennamen (`t-*`, `js-*`, `is-*`) in beiden Versionen identisch.

### 7.3 Konsequenzen

- Ein gegen 26.1 geschriebener Style läuft auf 24.2, solange er gemeinsame Tokens/Selektoren nutzt. Tokens, die nur 26.1 konsumiert, sind in 24.2 wirkungslos (harmlos); Regeln für neue 26.1-Komponenten greifen in 24.2 ins Leere.
- **Eigene Regeln, die Oracle-Tokens lesen**, können versionsabhängig kippen (Beispiel: `var(--a-field-input-border-style)` liefert in 24.2 `dashed`).
- Testbett-Grenze: `app_ui/Core.css` ist in beiden Testbetten 26.1. Ein echtes APEX 24.2 hat ältere Widget-CSS (IG, IR, Menüs, Date Picker) – **nicht getestet**.

---

## 8. Do / Don't für unsere Theme Styles

### Do

1. **Basis über File-URL laden, Bundle danach:** `#THEME_FILES#css/Vita#MIN#.css` (bzw. `Vita-Dark`) + `#APP_FILES#<theme>/<style>#MIN#.css`. Keine UT-Version, kein `/i/`-Pfad hart codieren.
2. **Eigenen Präfix-Namespace** für Primitive und Theme-Tokens (`--<prefix>-*`), dann auf `--ut-*`/`--a-*` mappen (Redwood-Muster). Komponentenregeln lesen nur Tokens.
3. **Akzentfarbe vollständig umsetzen:** alle 36 Variablen + 21 Deklarationen, die Vita-Red gegenüber Vita ändert (`diff-vita-red.txt`), inkl. Header, Nav, TreeView, Menü-Fokus, Checkbox, Feld-Fokus, Cards-Icon/-Initialen, Button-Count, `--ut-palette-primary-alt*`.
4. **Tokens auf denselben Selektoren setzen wie Vita** (`.t-Button--hot`, `.t-Button--warning.t-Button--simple`, `.t-CardsRegion--styleA`, `.a-IRR-header` …) – gleiche Spezifität, spätere Position gewinnt. Die Liste liefert `diff-vita.mjs`.
5. **Abgeleitete Farben zur Laufzeit** berechnen (`color-mix()`, wie Iris) statt Hex-Kopien – sonst divergieren Hover/Active/Shade bei jeder Akzent-Änderung.
6. **Hell und Dunkel mit identischen Komponentenregeln**, nur Token-Sätze tauschen; Dark-Style auf Vita-Dark-Basis, damit Oracle-Werte für Chat, Diagramm, Prism, Markdown, IG-Controls mitkommen.
7. **Auto-Style nur mit generiertem Oracle-Delta** (Abschnitt 3.5) unter `@media screen and (prefers-color-scheme: dark)`, danach unsere Dark-Tokens; Delta im Build aus der neuesten UT-Referenz erzeugen und prüfen.
8. **`--ut-color-scheme` passend setzen** (`light`/`dark`) – steuert `color-scheme` (Scrollbars, native Controls).
9. **Varianten als Body-Klassen**, die nur Tokens umschalten; Default per `body:not([class*=<prefix>-variante--])`. Auslieferung über das Style-Attribut „CSS Classes“ oder ein Theme-Roller-Addon mit `"target": "class"`.
10. **Niedrige Spezifität** (Klassen, ≤ 0,3,0), Hooks mit Fallback (`var(--x, …)`) für eigene Erweiterungspunkte (Iris-Muster).
11. **Beide Testbetten prüfen** (9042 und 9242) und bei jeder UT-Version `core-diff.mjs` laufen lassen.
12. **`!important` nur, wo Vita es erzwingt** (TreeNav-Hover, Style-B-Hover) – dort mit gleicher Spezifität + `!important` gezielt überschreiben.

### Don't

1. **Nicht nur `--ut-palette-primary` ändern** – Hot-Button und Header bleiben blau (gemessen: `rgb(5,106,200)`).
2. **Keine `@layer` für Overrides** – Oracle-CSS ist ungelayert; gelayerte Regeln verlieren gegen ungelayerte unabhängig von der Reihenfolge.
3. **Nicht auf `apex-theme-<name>` scopen** – die Klasse hängt am Style-Namen, den Entwickler umbenennen können.
4. **Oracle-Tokens nicht ungeprüft in eigenen Regeln konsumieren** (Version-Drift, z. B. `--a-field-input-border-style`), lieber eigene Tokens mit eigenem Default.
5. **Keine IDs, keine `:not()`-Ketten für Exklusivität, keine Bitmap-Texturen** (Redwood-Lehren); keine Oracle-Schrift, keine Redwood-Paletten.
6. **Vita nicht komplett ersetzen** (Redwood-Weg) – kostet ~250 KB pro UT-Version und bricht bei neuen Komponenten.
7. **Kein bedingtes `@import` auf Oracle-Dateien** aus statischem CSS (Pfad/Version hart codiert) und keine undokumentierte Media-Syntax in File-URLs.
8. **Keine Werte aus Vita per Hand kopieren**, die sich im Build aus der Referenz erzeugen lassen (Delta, Akzentliste).
9. **Theme-Roller-Addon nicht mit mehreren `.less`-Dateien** (Rückwärts-Verkettung) und nicht mit Variablen, deren Namen sich später ändern (gespeicherte Styles frieren den Output ein).
10. **JSON-förmige Kommentare nur für Theme-Roller-Annotationen** verwenden.
11. **Keine Live-Umschaltung als „fertig“ betrachten**, wenn Charts auf der Seite sind – JET-Texte brauchen ein Neu-Rendern.

---

## 9. Anhang: Methode, Skripte, Reproduktion

Alle Skripte liegen in `_tmp/research/` und werden aus diesem Ordner mit `node <skript>` gestartet. Keines ändert die Datenbank; SQL wurde nur lesend über SQLcl (`-name hr_freepdb1`) ausgeführt.

| Skript | Zweck | Ausgabe |
|---|---|---|
| `cssparse.mjs` | minimaler CSS-Parser (Kommentare, Strings, verschachtelte at-rules, Abschnitts-Überschriften) | – |
| `diff-vita.mjs <ver> <A> <B>` | Regel-/Deklarations-/Variablen-Diff zweier Style-Dateien | `diff-vita-26.1.txt`, `diff-vita-24.2.txt`, `diff-vita-iris.txt`, `diff-vita-red.txt` |
| `gen-dark-delta.mjs <ver> [--plain]` | erzeugt Delta Vita→Vita-Dark (optional in `@media`) | `delta-26.1.css`, `delta-24.2.css` |
| `compare-dark.mjs <app> <seiten> [deltaVer]` | Vita-Dark vs. Vita+Delta, berechnete Farben aller Elemente | `compare-dark-9042.json`, `compare-dark-9242.json` |
| `compare-dark2.mjs` (mit `CONTROL=1`) | Kontrolllauf (Delta hell emuliert) | `compare-dark-9042-control.json` |
| `switch-live.mjs <app> <seiten>` | Live-Umschaltung hell→dunkel | Konsole |
| `render-style.mjs --base Iris|Redwood [--font] [--classes …]` | Oracle-Style per Interception rendern, Font/Farben messen | `style-*.png` |
| `inject-css.mjs <app> <seite> "<css>" "<sel>|<props>"` | beliebiges CSS als Bundle, berechnete Werte | Konsole |
| `profile-css.mjs <datei>` | Spezifität, Namespaces, Komponenten-Profil | `profile-Redwood.txt`, `profile-Vita.txt`, `profile-Iris.txt` |
| `core-diff.mjs Core|Vita` | Version-Diff 24.2↔26.1 | `core-diff.txt`, `vita-version-diff.txt` |
| `head.mjs`, `libv.mjs` | Head-Reihenfolge, Body-Klassen, `apex.libVersions` | Konsole |
| `styles*.sql`, `tmpl.sql` | Style-Attribute und Seiten-Template lesen | Konsole |
| `widget.themeRoller.js`, `devToolbar.min.js` | Theme-Roller-Quellcode vom Testserver | – |

Die Referenzdateien unter `_reference/ut-26.1/css/` (Vita, Vita-Dark, Iris, Redwood, Core) wurden byte-genau mit dem Server (`/i/themes/theme_42/26.1/css/*.css`) verglichen – identisch.

Externe Quelle: Oracle APEX 24.1 App Builder Guide, „Using Theme Styles“ – https://docs.oracle.com/en/database/oracle/apex/24.1/htmdb/theme-styles.html (File URLs, CSS Classes, Theme-Roller-Attribute).
