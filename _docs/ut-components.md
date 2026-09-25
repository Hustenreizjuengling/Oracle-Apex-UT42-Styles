# Universal Theme – Anatomie der Kern-Komponenten

> Zielgruppe: alle, die einen eigenen Theme Style bauen, der die UT-Basis (Vita bzw. Vita-Dark) lädt und danach per eigenem CSS-Bundle **Tokens überschreibt und Komponenten umgestaltet**.
> Geltungsbereich: UT-Dateiversion **26.1** (App 9042) und **24.2** (App 9242), beide auf APEX-26.1-Runtime (app_ui `Core.css`/`Theme-Standard.css` sind in beiden Testbetten **identisch 26.1**).
> Ergänzende Dokumente: `_docs/ut-tokens.md` (vollständige Token-Landkarte), `_docs/ut-shell.md` (Seitenrahmen, Header, Navigation, Title Bar im Detail).

**Legende**

| Kürzel | Bedeutung |
|---|---|
| `Core:1234` | `_reference/ut-26.1/css/Core.css`, Zeile 1234 (UT-Core) |
| `Vita:1234` / `Dark:1234` | `_reference/ut-26.1/css/Vita.css` / `Vita-Dark.css` |
| `appCore:1234` | `_reference/app_ui/css/Core.css` (APEX-Widgets, `a-*`, jQuery UI) |
| `Std:123` | `_reference/app_ui/css/Theme-Standard.css` (app_ui-Standardwerte) |
| **Hook** | Variable, die UT/app_ui per `var(--x, fallback)` **konsumiert, aber nirgends definiert** – frei für unser Theme, keine Kollision |
| **hart** | Farbe/Wert steht als Literal im Vita-CSS (meist vom LESS-Compiler aus Theme-Roller-Variablen erzeugt) → folgt keinem Token, muss **per gleichem Selektor** neu deklariert werden |
| **[gemessen]** | per `getComputedStyle` im Testbett bestätigt |
| **[Screenshot]** | Bild unter `_tmp/research/utc/` (nicht versioniert, `_tmp/` ist in `.gitignore`) |
| *unverifiziert* | aus dem CSS abgeleitet, im Testbett nicht nachgestellt |

---

## Inhalt

0. [Kurzfassung](#0-kurzfassung)
1. [Methodik und Werkzeuge](#1-methodik-und-werkzeuge)
2. [Querschnitt: wie Komponenten ihre Werte bekommen](#2-querschnitt-wie-komponenten-ihre-werte-bekommen)
3. [Regionen](#3-regionen)
4. [Buttons](#4-buttons)
5. [Formulare](#5-formulare)
6. [Menüs, Dialoge, Popups, Meldungen](#6-menüs-dialoge-popups-meldungen)
7. [Kleinteile: Badges, Avatare, Links List, Icons, Fokus](#7-kleinteile-badges-avatare-links-list-icons-fokus)
8. [Vita vs. Vita-Dark aus Komponentensicht](#8-vita-vs-vita-dark-aus-komponentensicht)
9. [Unterschiede UT 24.2 ↔ 26.1 (Komponenten)](#9-unterschiede-ut-242--261-komponenten)
10. [Rezept: verifizierte Hebel für einen eigenen Style](#10-rezept-verifizierte-hebel-für-einen-eigenen-style)
11. [Anhang: Screenshots und Skripte](#11-anhang-screenshots-und-skripte)

---

## 0. Kurzfassung

1. **Fast alle UT-Komponenten sind vollständig über Custom Properties gebaut.** UT-`Core.css` enthält in den Regeln für Regionen, Buttons, Alerts, Formulare, Tabs, Wizard, Badges, Avatare usw. praktisch **keine** Farbliterale (einzige Ausnahme im Komponentenbereich: Schließen-Button der Seitenmeldung, `Core:8947–8949`). Die Farben stecken in **`Vita.css`** (bzw. Vita-Dark) und in **`Theme-Standard.css`**.
2. **Die gefährlichen Literale liegen in Vita.css in komponentenlokalen Blöcken**: Hot-/Primary-/Success-/Warning-/Danger-Buttons (`Vita:2091–2262`), die zugehörigen `.fa:after`-Overlays (`Vita:2281–2321`), `--a-checkbox-checked-background-color`, `--a-field-input-focus-border-color`, `--a-menu-focused-background-color`, `--a-button-count-background-color` (alle `#056AC8`). Ein `:root`-Override von `--ut-palette-primary` erreicht diese Stellen **nicht** **[gemessen]**.
3. **Was der Primärfarbe tatsächlich folgt** (via `--a-palette-primary` → `--ut-palette-primary`, `Core:30`): Switch, Hero-Icon, Wizard-Aktivschritt, Datepicker-Auswahl/-Heute, Stern-Bewertung, Prozentbalken, Button-Fokusrahmen. Tabs, RDS, Links List und Link-Buttons folgen dem **eigenen** Token `--ut-link-text-color` (Vita ebenfalls `#056AC8`). **Nicht**: Hot-Button, Checkbox/Radio „checked“, Radio-Gruppe-als-Buttons, Feld-Fokusrahmen, Menü-Hover, Header **[gemessen]**.
4. **Radien sind nicht zentral.** `--ut-component-border-radius` (Vita effektiv `0.125rem`) steuert Regionen, Tabs-Pill, Dialoge; Buttons (`--a-button-border-radius`), Felder (`--a-field-input-border-radius`), Alerts (`--ut-alert-horizontal-border-radius`/`-wizard-`), Button-Container (`--ut-button-region-border-radius`, **ohne Fallback = 0**), Content Block (`--ut-content-block-border-radius` → `--ut-region-border-radius`, **in Vita undefiniert = 0**, `Core:12736`) und **Wizard (gar keine `border-radius`-Deklaration)** müssen einzeln gesetzt werden.
5. **Zustandsmodell Buttons**: `background-color: var(--a-button-state-*, var(--a-button-type-*, var(--a-button-*)))` (`Core:3262–3330`, `appCore:403`). Varianten setzen Basis-Tokens lokal, Stile (`--simple`, `--noUI`) die Type-Ebene, Hover/Active/Focus die State-Ebene.
6. **Alle Popups sind jQuery-UI-Dialoge** (`.ui-dialog`): Page Dialog, Inline Dialog, Inline Popup, Popup LOV, Datepicker-Popup, Select-One/Many-Liste, `apex.message.confirm`. Ein Satz Tokens (`--jui-dialog-*`) gestaltet alle **[gemessen]**. Page Dialogs zeigen ihren Inhalt in einem **iframe** (eigenes Dokument, eigenes Theme-CSS).
7. **Seitenfehler erscheinen gelb**: `#t_Alert_Notification` trägt `t-Alert--warning` auch bei Fehlern **[gemessen]** → Hintergrund `--ut-palette-warning`. Einer der stärksten „APEX-Look“-Marker.
8. **Form-Signaturen des APEX-Looks**: sehr kleine Felder (24 px Höhe, 12 px Schrift) **[gemessen]**, rechtsbündige Labels bei horizontalen Label-Templates, Pflicht-Asterisk als Icon-Glyphe, rotes Dreieck oben links bei Floating Labels, graue Feldhintergründe `#f9f9f9`.
9. **Vita-Dark hat Lücken**, die wir im dunklen Style selbst schließen müssen: Tooltips bleiben **weiß** **[gemessen]**, `a-MenuBar` außerhalb des Headers bleibt `#f0f0f0` mit **weißer** Schrift (unlesbar) **[gemessen, Screenshot]**, Switch-Aus `#8c8c8c`, Overlay, Select-Pfeil-SVG, Karussell-Punkte/-Pfeile, `.fa:after`-Overlays weiß.
10. **Fokus**: `*:focus { outline: var(--ut-focus-outline, auto 1px var(--ut-focus-outline-color)) }` (`Core:359`) – global, auf `:focus` (nicht `:focus-visible`). Über `--ut-focus-outline`/`--ut-focus-outline-offset` (Hooks) lässt sich der Ring zentral neu definieren. Ausnahme mit hart codiertem `-webkit-focus-ring-color`: Radio-Gruppe als Buttons (`Core:3815–3820`).
11. **24.2 vs. 26.1**: Die Token-API der Kern-Komponenten ist praktisch identisch (Hook-Listen-Diff nur bei Avatar-Gruppen, Button-Zähler, `--ut-badge-rounded-border-radius`). Relevante Verhaltensunterschiede: Button-`data-count`-Badge nur 26.1 **[Screenshot 9242]**, Karussell-Header in 24.2 standardmäßig ausgeblendet, `--a-field-input-border-style` in 24.2-Vita = `dashed` (unbenutzt, aber gefährlich wenn wir ihn konsumieren).
12. **Hebeltest bestanden**: Ein 60-Zeilen-Override (`_tmp/research/utc/lever-test.css`) hat Regionen, Buttons, Felder, Checkbox/Radio, Switch, Menüs, Dialoge, Tooltips und Alerts umgefärbt/-gerundet – in 9042 (UT 26.1) und 9242 (UT 24.2) mit identischem Ergebnis **[gemessen]** – übrig blieben genau die in Punkt 2 genannten harten Blöcke (`--hot.--simple/--link/--noUI`, `--primary`, Button-Zähler).

---

## 1. Methodik und Werkzeuge

- **Statische Analyse**: Abschnitte der Referenz-CSS gelesen, Variablen-Konsum/-Definition per Skript abgeglichen (`_tmp/research/utc/hooks.mjs` → `hooks-26.1.txt`, `hooks-24.2.txt`), Vita ↔ Vita-Dark und 24.2 ↔ 26.1 per `diff`.
- **Laufzeit** (Chrome/Puppeteer über `_tools/lib/lab.mjs`, Theme Lab ohne eigenes Theme = reines Vita):
  - `utc/probe.mjs <spec.json>` – Seite öffnen, optional **Vita → Vita-Dark tauschen** (der `<link>` auf `Vita.min.css` wird auf `Vita-Dark.min.css` umgeschrieben), Aktionen (Klick, Fokus, Taste, JS), `getComputedStyle`-Auszüge, Element-Screenshots; `cssFile`-Schritt injiziert Test-CSS **nach** Vita (wie unser Bundle).
  - `utc/gallery.mjs <buttons|regions|alerts> [Vita|Vita-Dark] [app]` – ersetzt den Inhalt von Seite 1201 durch eine **Galerie aus reinem UT-Markup** (alle Button-Typ×Stil-Kombinationen, alle Region-Modifier, alle Alert-Typen), damit alle Varianten auf einem Bild vergleichbar sind. `INJECT=<css>` lädt Test-CSS dazu.
- **Hinweise zum Testbett**
  - Die Reference App lädt eigenes `demo.css` (Klassen `dm-*`, z. B. die grauen „Template Options“-Kästen und `dm-Placeholder`). Diese Flächen sind **nicht** UT.
  - Seite 1903 enthält nur Seiten-Hilfe (Content Blocks), **keine** Item-Hilfe-Buttons; Required-Items und der Rich Text Editor kommen im Testbett nicht vor → dort nur CSS-Analyse (*unverifiziert* markiert).
  - Beim Vita-Dark-Tausch bleibt der **Inhalt von Page Dialogs hell**, weil der iframe eine eigene Seite mit dem ungetauschten Style lädt (Artefakt der Messmethode, in echten Apps nicht vorhanden).

---

## 2. Querschnitt: wie Komponenten ihre Werte bekommen

### 2.1 Drei Arten der Wertzuweisung

| Art | Beispiel | Überschreiben im eigenen Style |
|---|---|---|
| **A – globales Token mit Fallback-Kette** | `.t-Region { border-color: var(--ut-region-border-color, var(--ut-component-border-color)) }` (`Core:11614`) | `:root { --ut-component-border-color: … }` oder gezielt den Hook `--ut-region-border-color` |
| **B – komponentenlokal gesetztes Token** (meist hart) | `.t-Button--hot { --a-button-background-color: #056AC8 }` (`Vita:2091–2105`) | **gleicher Selektor** im Bundle (gleiche Spezifität, später geladen); `:root` wirkt hier nicht |
| **C – Literal-Eigenschaft** | `.t-Button--link { background-color: transparent }` (`Vita:2066–2070`), `.t-Alert--page .t-Button--closeAlert { background-color: #000 }` (`Core:8947`) | Eigenschaft direkt per Selektor überschreiben |

Kontextregeln der Art B im UT-Core (setzen Tokens lokal, `:root` wirkt dort nicht):

- `.t-Body-side .t-Region`, `.t-Body-actions .t-Region` → Schatten `none`, Rand nur oben, transparenter Hintergrund, Radius 0 (`Core:11811–11852`).
- `.t-Body-actions .t-ButtonRegion` → alles transparent/0 (`Core:9366–9386`).
- `.t-Form--large`/`--xlarge`, `.t-Form-fieldContainer--large`/`--xlarge` → Feldmaße (**in Vita.css**, `Vita:2670–2840`, nicht im Core!).
- `.t-Button--header` → transparente Header-Buttons (`Vita:2029–2043`).
- `.t-Form-helpButton` → transparente Hilfe-Buttons (`Vita:2266–2274`).
- `.a-DatePicker-nav` → transparente Monats-Pfeile (`Vita:2936–2954`).

### 2.2 Freie Hooks je Komponente (Auswahl)

Vollständige Listen: `_tmp/research/utc/hooks-26.1.txt`. Diese Variablen werden gelesen, aber von keiner Referenzdatei gesetzt – ideal, um gezielt nur eine Komponente zu verändern:

| Komponente | Wichtigste Hooks (Fallback) |
|---|---|
| Region | `--ut-region-border-color` (→ component border), `--ut-region-header-padding-y` (.75rem), `--ut-region-header-item-spacing` (.5rem), `--ut-region-header-icon-*` |
| Alert | `--ut-alert-type-border-radius`/`-border-color`/`-box-shadow`/`-border-width` (höchste Priorität), `--ut-alert-horizontal-border-radius` (.25rem), `--ut-alert-wizard-border-radius` (.125rem), `--ut-alert-horizontal-icon-size/-padding`, `--ut-alert-offset` (1rem), `--ut-alert-title-text-color`, `--ut-notification-title-*` |
| Button Container | `--ut-button-region-border-color`, `--ut-button-region-title-*` |
| Hero | `--ut-hero-region-icon-background-color` (→ `--ut-component-icon-background-color`), `--ut-hero-region-icon-text-color`, `--ut-hero-region-title-font-size` (2rem), `--ut-hero-region-column-spacing` |
| Carousel | **alle** `--ut-carousel-button-*` und `--ut-carousel-nav-*` (Fallbacks `rgba(0,0,0,.5)`, `#fff`, `rgba(0,0,0,.15)` …) |
| Tabs/RDS | `--ut-tabs-background-color`, `--ut-tabs-item-active-background-color`, `--ut-tabs-item-active-highlight-color` (currentColor), `--ut-tabs-item-hover-background-color`, `--ut-tabs-item-hint-highlight-width` (.125rem) |
| Wizard | **alle** `--ut-wizard-*` (Rahmen, Hintergrund, Schatten, Paddings, Titel) und `--ut-wp-*` (Marker, Track, Label) außer Marker-/Track-Farbe |
| Content Block | `--ut-content-block-border-radius` (→ `--ut-region-border-radius`), `-border-color`, `-text-color`, `-header-font-*` |
| Formular | `--ut-field-label-font-weight`, `--ut-field-inline-help-*`, `--ut-field-required-*`, `--ut-prepost-text-color`, `--ut-pillbutton-min-inline-size`, `--a-field-input-focus-text-color`, `--a-field-display-font-size` |
| Badge | alle `--ut-badge-*-background-color`/`-text-color` je Status und `--subtle`, `--ut-badge-gap`, `--ut-badge-rounded-border-radius` |
| Links List | `--ut-linkslist-hover-background-color` (**leer → kein Hover-Hintergrund**), `-text-color`, `-icon-color`, `-badge-*`, `-link-padding-x` |
| Buttons | `--a-button-focus-shadow`, `--a-button-disabled-opacity` (.5), `--a-button-icon-color` (26.1), `--ut-link-text-decoration` |

### 2.3 Radius-Landkarte

| Komponente | Deklaration | Vita-Wert | folgt `--ut-component-border-radius`? |
|---|---|---|---|
| Region `.t-Region` (+Header oben) | `var(--ut-region-border-radius, var(--ut-component-border-radius))` `Core:11615` | 2 px **[gemessen]** | **ja** **[gemessen: 12 px]** |
| Collapsible geschlossen (Header unten) | dito `Core:11766` | 2 px | ja |
| Tabs `--pill` | `--ut-tabs-border-radius: var(--ut-component-border-radius, .125rem)` `Core:7978ff` | 2 px | ja |
| jQuery-UI-Dialoge | `--jui-dialog-border-radius: var(--ut-region-border-radius, var(--ut-component-border-radius))` `Vita:400` | 2 px **[gemessen]** | ja |
| Button Container | `border-radius: var(--ut-button-region-border-radius)` `Core:9204` – **kein Fallback** | **0** | nein |
| Content Block Body | `var(--ut-content-block-border-radius, var(--ut-region-border-radius))` `Core:12736` – `--ut-region-border-radius` in Vita **nicht** global definiert | **0** | nein (erst wenn `--ut-region-border-radius` gesetzt) |
| Wizard `.t-Wizard` | **keine** `border-radius`-Deklaration (`Core:10071–10083`) | **0** **[gemessen]** | nein – eigene Regel nötig |
| Alert horizontal | `--ut-alert-border-radius: var(--ut-alert-horizontal-border-radius, .25rem)` `Core:8777` | 4 px | nein |
| Alert Wizard | `var(--ut-alert-wizard-border-radius, .125rem)` `Core:8822` | 2 px | nein |
| Seitenmeldung `.t-Alert--page` | `--ut-alert-border-radius: .25rem` **literal** `Core:8898` (schlägt `--horizontal`) | 4 px **[gemessen]** | nein (nur über `--ut-alert-type-border-radius`) |
| Buttons | `--a-button-border-radius` `Vita:19/1690` | 2 px | nein |
| Felder, Popup-LOV-Button, File Drop | `--a-field-input-border-radius`, `--a-filedrop-border-radius` `Vita:1855–1856` | 2 px | nein |
| Checkbox | `--a-checkbox-border-radius` `Vita:60` | 2 px | nein |
| Menü | `--a-menu-border-radius` `Vita:213` | 4 px **[gemessen]** | nein |
| Menü-Eintrag | Hook `--a-menu-item-border-radius` `appCore:12124` | – | nein (Hook) |
| Datepicker | `--a-datepicker-border-radius: var(--ut-border-radius)` `Vita:78` | 4 px **[gemessen]** | nein (folgt `--ut-border-radius`) |
| Badge | `var(--ut-badge-border-radius, .25rem)` | 4 px | nein |
| Avatar | `var(--ut-avatar-border-radius, .25rem)` | 4 px | nein |
| Tooltip | `--jui-tooltip-border-radius` `Vita:428` | 2 px | nein |
| Hero-Icon | `var(--ut-hero-region-icon-border-radius, 12.5%)` | 12,5 % | nein |

Achtung Doppeldefinition: `--ut-component-border-radius` steht in Vita zweimal (`.25rem` in `Vita:640`, `0.125rem` im Theme-Roller-Block `Vita:791`) – wirksam ist der spätere Wert. Unser Bundle lädt danach und gewinnt ohnehin.

### 2.4 Primärfarben-Landkarte (verifiziert mit `:root { --ut-palette-primary: #7c3aed }`)

| Folgt **ja** (über Token-Kette) | Folgt **nein** (hart in Vita.css) |
|---|---|
| Switch „an“ (`--a-switch-checked-background-color: var(--a-palette-primary)` `Std:279`) | Hot-Button inkl. Hover/Active (`Vita:2091–2105`) |
| Hero-Icon sowie Icon-Kacheln von Media List, Cards, Timeline, Comments, Badge List, App-Icon ohne `u-color` (`--ut-component-icon-background-color: var(--ut-palette-primary)` `Vita:650`, Konsum z. B. `Core:8424`, `9592`, `10978`) | `--hot.--simple/--link/--noUI` (`#056AC8`, `#0677e1`, `Vita:2106–2141`) |
| Wizard aktiver Schritt (`--ut-wp-active-background-color` Fallback `--ut-palette-primary`) | Checkbox/Radio „checked“ (`--a-checkbox-checked-background-color: #056AC8` `Vita:1891`) |
| Datepicker Auswahl (`Vita:98–100`) und „heute“ **[gemessen]** | Radio-Gruppe als Buttons (steht in der Hot-Selektorliste) |
| Stern-Bewertung (`--a-starrating-stars-fg-color` `Std:268`) | Feld-Fokusrahmen (`--a-field-input-focus-border-color: #056AC8` `Vita:1883`) |
| Prozentbalken (`--a-percent-chart-*` `Vita:247–253`) | Menü-Hover (`--a-menu-focused-background-color: #056AC8` `Vita:1106`) |
| Button-Fokusrahmen (`--a-button-focus-border-color: var(--ut-palette-primary)` `Vita:2054`) | Button-Zähler (`--a-button-count-background-color` `Vita:1714`) |
| Map-Marker, Chat, Diagramm (über `--ut-palette-primary`) | Header (`--ut-header-background-color` `Vita:813`), Links (`--ut-link-text-color` `Vita:759`), Fokusfarbe (`Vita:771`) – eigene Tokens, gleiche Farbe |

### 2.5 Fokus-Mechanik (gilt für alle Komponenten)

```css
/* Core:355–361 */
* { outline-color: var(--ut-focus-outline-color, -webkit-focus-ring-color); }
*:focus { outline: var(--ut-focus-outline, auto 1px var(--ut-focus-outline-color, -webkit-focus-ring-color));
          outline-offset: var(--ut-focus-outline-offset); }
```

- `--ut-focus-outline-color` (Theme Roller „Focus Outline“, Vita `#056AC8`) und die **Hooks** `--ut-focus-outline`, `--ut-focus-outline-offset` werden an ~42 Stellen im Core verwendet (Feldgruppen, Switch, Tabs, Star Rating, Metric Cards …).
- **[gemessen]** Per Tab fokussierter Button: `outline: auto 1px rgb(5,106,200)`, zusätzlich Rahmenfarbe = `--a-button-focus-border-color` und Hintergrund = Hover-Hintergrund.
- `.a-Button` (app_ui) schaltet Zustände auf `:focus-visible` (`appCore:452`), `.t-Button` auf `:focus` (`Core:3318`).
- Harte Ausnahmen: Radio-Gruppe als Buttons `outline: auto; outline-color: -webkit-focus-ring-color` (`Core:3815–3820`); Checkbox/Radio-Kästchen `outline: 1px auto var(--a-checkbox-outline-color, -webkit-focus-ring-color)` (`appCore:3241–3251`, Hook).
- Details und Empfehlung: Abschnitt [7.6](#76-fokus-ringe).

---

## 3. Regionen

### 3.1 Standard Region `.t-Region` (Seite 1201)

**DOM** (Seite 1201, gekürzt):

```html
<div class="t-Region t-Region--showIcon t-Region--scrollBody i-h240" role="region">
  <div class="t-Region-header">
    <div class="t-Region-headerItems t-Region-headerItems--title">
      <span class="t-Region-headerIcon"><span class="t-Icon fa fa-…"></span></span>
      <h2 class="t-Region-title">…</h2>
    </div>
    <div class="t-Region-headerItems t-Region-headerItems--buttons">…<span class="js-maximizeButtonContainer"></span></div>
  </div>
  <div class="t-Region-bodyWrap">
    <div class="t-Region-buttons t-Region-buttons--top"><div class="t-Region-buttons-left"></div><div class="t-Region-buttons-right"></div></div>
    <div class="t-Region-body"><div class="t-Region-orderBy"></div>…</div>
    <div class="t-Region-buttons t-Region-buttons--bottom">…</div>
  </div>
</div>
```

**Tokens** (`Core:11610–11750`, Werte Vita `Vita:491–500`, `Vita:1131–1161`):

| Eigenschaft | Variable (Fallback) | Vita | Vita-Dark |
|---|---|---|---|
| Rahmenbreite | `--ut-region-border-width` (→ component 1px) | 1px | 1px |
| Rahmenfarbe | **Hook** `--ut-region-border-color` → `--ut-component-border-color` | rgba(0,0,0,.1) | rgba(255,255,255,.15) |
| Radius | `--ut-region-border-radius` → `--ut-component-border-radius` | 2px | 2px |
| Schatten | `--ut-region-box-shadow` | `var(--ut-shadow-sm)` = `0 .125rem .25rem -.125rem rgba(0,0,0,.1)` | gleich |
| Abstand unten | `--ut-region-margin` | 1rem | 1rem |
| Hintergrund / Text | `--ut-region-background-color` / `--ut-region-text-color` | white / #262626 | #1b1d1e / whitesmoke |
| Header-Hintergrund / Text | `--ut-region-header-background-color` / `-text-color` | white / #262626 | **#111213** / #ebebeb |
| Header-Trennlinie | `--ut-region-header-border-width` (→ region border width), `--ut-region-header-border-color` | 1px, rgba(0,0,0,.075) | rgba(255,255,255,.075) |
| Header-Schrift | `--ut-region-header-font-size` (1rem), `-line-height` (1.5rem), Gewicht `--a-base-font-weight-semibold` | 16px / 24px / 600 **[gemessen]** | gleich |
| Header-Padding | **Hook** `--ut-region-header-padding-y` (.75rem), `--ut-region-header-padding-x` (.75rem) | 12px **[gemessen]** | gleich |
| Body-Padding | `--ut-region-body-padding-y/-x` | 1rem | 1rem |
| Buttonleisten | `--ut-region-buttons-padding-y/-x` | .5rem / .75rem | gleich |
| Schrift Body | `--ut-region-font-size` / `-line-height` | .875rem / 1.25rem | gleich |

**Template Options → Klassen → Wirkung**

| TO (Gruppe) | Klasse | Wirkung (Beleg) |
|---|---|---|
| Show Region Icon | `t-Region--showIcon` | blendet `.t-Region-headerIcon` ein (`Core:11675`); Icon-Kästchen `--ut-region-header-icon-padding/-border-radius` |
| Header: Hidden but accessible | `t-Region--hideHeader` | Header visuell versteckt (clip) (`Core:11949`) |
| Header: Hidden | `t-Region--removeHeader` | `display:none` (`Core:11963`) |
| Style: Remove Borders | `t-Region--noBorder` | Rahmen 0, Schatten none, Header-Linie 0, **Body `padding-top: 0`** (`Core:11864–11873`) |
| Style: Remove UI Decoration | `t-Region--noUI` | Rahmen/Schatten/Hintergrund weg, Body-Padding 0, Header-Padding-x 0 (`Core:11882–11894`) |
| Style: Stack Region | `t-Region--stacked` | nur oben/unten Rahmen, `border-radius: 0 !important`, kein Schatten, Folgeregion −1px (`Core:11915–11930`) – Basis für Akkordeons |
| Style: Text Content | `t-Region--textContent` | keine Box, Header/Body transparent (`!important`), Header-Linie 0 (`Core:11935–11944`) |
| Remove Body Padding | `t-Region--noPadding` | Body-Padding 0; enthaltenes IRR ohne Rahmen (`Core:11899–11910`) |
| Body Height 240…640px | `i-h240`…`i-h640` (+ `t-Region--scrollBody`) | feste Body-Höhe, `overflow:auto` (`Core:11970`, Höhen-Utilities ab `Core:21473`) |
| – | `t-Region--noBG` | nur Hintergrund transparent (`Core:11857`) |
| Accent 1–15 | `t-Region--accent1…15` | **nur Header**: `--ut-region-header-background-color: var(--u-color-N)`, Text `--u-color-N-contrast`; mit `--textContent` nur Titelfarbe (`Core:12054–12172`) |
| Show Maximize Button | `js-showMaximizeButton` | `.is-maximized`: fixed, Radius/Rahmen/Schatten 0 (`Core:11998–12026`) |
| Overflow | `t-Region--hiddenOverflow`, `t-Region--visibleOverflow` (26.1) | Body-Overflow (`Core:11984–11993`) |
| Collapsible | `t-Region--hideShow`, `--controlsPosEnd`, `--hideShowIconsMath` | siehe 3.2 |

Gerendert: **[Screenshot]** `gal-regions-Vita-9042.png`, `gal-regions-Vita-Dark-9042.png`.

**Hart codiert**: nichts im Region-Core. Einzig die Akzentfarben kommen aus der Palette `--u-color-1…45` (`Vita:1581ff.`, in Vita und Vita-Dark identisch).

**Fallstricke**

- Akzent-Header setzen `--ut-region-header-*` **am Header-Element** – ein `:root`-Override der Header-Farben beeinflusst Akzent-Regionen daher nicht (gewollt). Buttons im Akzent-Header behalten ihre normalen Button-Tokens (weiße „Edit“-Buttons auf farbigem Header **[Screenshot]**).
- `.t-Region` hat **kein** `overflow: hidden/clip`. Bei großen Radien können Inhalte mit eigenem Hintergrund an den Ecken überstehen (v. a. `--noPadding` mit IG/IRR/Karten/Map). Empfehlung: für `.t-Region--noPadding > .t-Region-bodyWrap` Radius oder `overflow: clip` ergänzen – *unverifiziert* in Kombination mit Sticky-Headern von IR/IG.
- In Seitenspalten (`.t-Body-side`, `.t-Body-actions`) werden Radius, Schatten, Hintergrund lokal auf 0/transparent gesetzt (`Core:11811–11852`) – bewusst so lassen oder mit gleichem Selektor neu gestalten.
- `--noBorder` entfernt auch das obere Body-Padding (Inhalt klebt am Header).

### 3.2 Collapsible `.t-Region--hideShow` / `.a-Collapsible` (Seite 1206)

- Markup: `t-Region t-Region--hideShow is-expanded|is-collapsed a-Collapsible`; Steuerung in `.t-Region-headerItems--controls` als **`<span class="t-Button t-Button--icon t-Button--hideShow">`** mit `.a-Icon.a-Collapsible-icon`; Titel als `<button class="t-Region-titleButton">` (`Core:11649`). JS: `theme42.js` ~Z. 1070–1090 setzt `is-expanded`/`is-collapsed`.
- Der Toggle nutzt **Button-Tokens** (`.t-Button--hideShow`: `--a-button-font-size .6875rem`, Padding .25rem, `min-width 1.5rem`, `Core:3585`) → wird mit unseren Button-Tokens mitgestylt (im Hebeltest rund **[Screenshot]** `gal-regions-Vita-9042-lever.png`).
- Header-Padding-x kleiner: Hook `--ut-region-hideshow-header-padding-x` (.5rem) (`Core:11755`).
- Zugeklappt: Header-Linie 0, Header erhält unten den Region-Radius, `.t-Region-bodyWrap` Höhe 0 + `visibility:hidden` (`Core:11763–11774`).
- `--controlsPosEnd`: Toggle rechts, Pfeil-Glyphe `\e002` (`Core:11776–11795`); `--hideShowIconsMath`: Plus/Minus (`\e069`/`\e167`, `Core:11797–11806`). Glyphen aus `apex-core-font` (`appCore:9875ff`).
- Akkordeon = mehrere `--hideShow` + `--stacked` (Kommentar `Core:11913`).

### 3.3 Hero `.t-HeroRegion` (Seite 1203)

- DOM: `.t-HeroRegion > .t-HeroRegion-top > .t-HeroRegion-wrap > .t-HeroRegion-col--beforeIcon | --left (Icon) | --content (h1.t-HeroRegion-title + p) | --right (.t-HeroRegion-form, .t-HeroRegion-buttons)`, darunter `.t-HeroRegion-bottom`.
- **Keine Box** (kein Hintergrund, kein Rahmen) – nur Padding `--ut-hero-region-padding-y/-x` (1rem, mobil .5rem) (`Core:8297–8306`).
- Icon: 4rem-Kachel, Radius 12.5 %, Hintergrund `--ut-hero-region-icon-background-color` → `--ut-component-icon-background-color` (Vita: `var(--ut-palette-primary)`) → **folgt Primärfarbe** **[gemessen im Hebeltest]**; Textfarbe → `--ut-component-icon-color` (`Core:8415–8431`).
- Titel: 2rem/2.5rem ab 640 px (mobil 1rem), Gewicht semibold, Farbe `--ut-hero-region-title-text-color` (Vita: `var(--ut-body-title-text-color)`, `Vita:486`), Schrift `--ut-hero-region-title-font-family` (Hook; bei `--headingFontAlt` = `--ut-alternate-heading-font-family`, Vita: Serif!) (`Core:8463–8476`, `8538`).
- Inhaltstext: `--ut-hero-region-content-text-color` → `--ut-component-text-muted-color`.
- Modifier: `--featured` (8rem-Icon, Font APEX Large), `--featured.--centered` (gestapelt, zentriert), `--iconsSquare|Rounded|Circle`, `--noPadding`, `--hideIcon`, `--headingFontAlt` (`Core:8449–8541`).
- Hebel für einen „nicht-APEX“-Look: Hero bekommt erst durch eigene Regeln eine Fläche (z. B. Verlauf/Hintergrund auf `.t-HeroRegion`), Icon über `--ut-hero-region-icon-border-radius` (z. B. 100 %).

### 3.4 Alert `.t-Alert` (Seite 1202) und Seitenmeldungen

**DOM**

```html
<div class="t-Alert t-Alert--defaultIcons t-Alert--warning t-Alert--horizontal [t-Alert--colorBG]" role="region">
  <div class="t-Alert-wrap">
    <div class="t-Alert-icon"><span class="t-Icon"></span></div>
    <div class="t-Alert-content"><div class="t-Alert-header"><h2 class="t-Alert-title">…</h2></div><div class="t-Alert-body">…</div></div>
    <div class="t-Alert-buttons"></div>
  </div>
</div>
```

**Token-Kette** (`Core:8706–8715`): jede Eigenschaft `var(--ut-alert-type-X, var(--ut-alert-X, var(--ut-component-X)))` – die **`--ut-alert-type-*`-Hooks haben die höchste Priorität**, `--ut-alert-*` wird von Modifiern gesetzt.

| Variante | Klassen | Wesentliches (Beleg) |
|---|---|---|
| Horizontal | `--horizontal` | Icon-Spalte 2rem Icon, 1rem Padding, Radius `--ut-alert-horizontal-border-radius` (.25rem), Titel 1.125→1.25rem (`Core:8774–8816`) |
| Wizard | `--wizard` | zentriert, max. 47.5rem, Icon 4rem, Radius `--ut-alert-wizard-border-radius` (.125rem), Titel 1.5rem (`Core:8820–8893`) |
| Typ | `--warning`/`--yellow`, `--success`, `--danger`/`--red`, `--info` | Icon-Farbe `--ut-palette-X`; bei `--horizontal` Icon-Spalte `--ut-palette-X-shade` (`Core:9144–9174`) |
| Farbiger Hintergrund | `--colorBG` | Fläche `--ut-palette-X-shade` (`Core:9129–9140`) |
| Icons | `--defaultIcons` (Glyphen `\e017` warn, `\e1ab` success, `\e010` danger, `\e1ac` info aus `apex-core-font`), `--customIcons` (eigene `fa`-Klasse), `--noIcon` (`Core:9046–9074`) | |
| Titel | `--accessibleHeading` (versteckt), `--removeHeading` (`Core:9078–9093`) | |

Vita setzt nur `--ut-alert-title-font-weight` (semibold) und `--ut-alert-box-shadow: var(--ut-shadow-sm)` (`Vita:526–527`). Hintergrund = `--ut-component-background-color`.

**Seitenmeldungen** (`apex.message.showPageSuccess` / `showErrors`, **[gemessen]**):

| Element | Klassen | Farbe |
|---|---|---|
| `#t_Alert_Success` | `t-Alert t-Alert--defaultIcons t-Alert--success t-Alert--horizontal t-Alert--page t-Alert--colorBG` | Fläche `--ut-palette-success` / Text `-contrast` (`Core:9186–9191`): Vita `#278701`, Dark `#388729` |
| `#t_Alert_Notification` (**auch für Fehler!**) | `… t-Alert--warning … t-Alert--page t-Alert--colorBG`, Body `.a-Notification.a-Notification--error` mit `.a-Notification-list/-item/-link` | Fläche `--ut-palette-warning` / `-contrast` (`Core:9192–9197`): Vita `#FFC628`, Dark `#FBCE4A`, schwarzer Text |

- Position `fixed`, oben rechts `--ut-alert-offset` (1rem), 20–40rem breit, `z-index:1000`; Radius **literal** `.25rem`; Schatten `inset 0 0 0 1px component-border, var(--ut-shadow-md)`; Icon-Hintergrund `transparent !important` (`Core:8897–8914`).
- **Hart**: Schließen-Button `.t-Alert--page .t-Button.t-Button--closeAlert { background-color:#000; color:#FFF; border-color: rgba(255,255,255,.25); --a-button-border-radius: 1.5rem }`, hängt bei −0.5rem außerhalb der Ecke (`Core:8942–8959`) – schwarzer Kreis in beiden Styles **[Screenshot]** `page-success-Vita-9042.png`.
- Liste der Fehler: Bullets per `:before` in `currentColor` (`Core:9012–9023`); Links unterstrichen über `--ut-link-text-decoration`.

**Screenshots**: `gal-alerts-Vita-9042.png`, `gal-alerts-Vita-Dark-9042.png`, `page-notification-Vita[-Dark]-9042.png`, `page-success-Vita[-Dark]-9042.png`.

**Fallstricke**

- Fehlerseite = gelbe Warnbox – wer Fehler rot/neutral will, überschreibt `.t-Alert--page.t-Alert--warning { --ut-alert-type-background-color: …; --ut-alert-type-text-color: … }` (Selektor gleich spezifisch wie `Core:9192`).
- Die Default-Icons sind gefüllte Kreise mit **transparenter Aussparung** – der Hintergrund scheint durch (in Vita-Dark erscheint das „✕“ im Danger-Icon schwarz **[Screenshot]**).
- Radius der Seitenmeldung folgt keinem Radius-Token außer `--ut-alert-type-border-radius`.

### 3.5 Button Container `.t-ButtonRegion` (Seiten 1204/1250)

- Grid `auto 1fr auto` mit `.t-ButtonRegion-col--left | --content | --right`, Buttons in `.t-ButtonRegion-buttons`, Titel visuell versteckt (außer `--showTitle`) (`Core:9228–9272`).
- Tokens (`Core:9202–9211`): `--ut-button-region-margin` (.75rem), **`--ut-button-region-border-radius` (kein Fallback → 0)**, `-border-width` (→ component), Hook `-border-color`, `-box-shadow` (Vita: `var(--ut-shadow-sm)` `Vita:503`), `-background-color` (→ component bg), `-text-color`, `-padding` (1rem).
- Modifier: `--noUI` (alles transparent, 0), `--noBorder`, `--slimPadding` (.5rem), `--noPadding`, `--stickToBottom` (mobil fixiert), `--sideBar`, `--dialogRegion`/`--wizard` (untere Ecken = `--jui-dialog-border-radius`) (`Core:9277–9430`).
- Kontexte: `.t-Region + .t-ButtonRegion` → 1rem Abstand; in Dialog-/Drawer-Footer und Wizard ohne Schatten (`Core:9390–9415`); in `.t-Body-actions` alles zurückgesetzt.
- Seite 1204 zeigt tatsächlich Pill-Buttons (`t-Button--pill*`) ohne `.t-ButtonRegion`; den Container zeigt 1250.

### 3.6 Title Bar `.t-BreadcrumbRegion` (Seite 1207)

- Liegt in `.t-Body-title` (Vita: weißer Hintergrund, `box-shadow: 0 1px 0 0 rgba(0,0,0,.1)`, `backdrop-filter: saturate(180%) blur(8px)` **[gemessen]**, `Vita:478–480`).
- Modifier: `--showBreadcrumb`, `--useBreadcrumbTitle`, `--useRegionTitle`, `--compactTitle`, `--headingFontAlt` (`Core:11223–11420`). Tokens `--ut-breadcrumb-*`, `--ut-body-title-*`.
- Detailanalyse (Sticky-Verhalten, JS-Offsets): siehe `_docs/ut-shell.md`. Kurios: Hook-Tippfehler `--a-button-paddiny-y` im Breadcrumb-Code.

### 3.7 Carousel `.t-Region--carousel` (Seite 1205)

- Region mit `overflow:hidden`, Body-Padding 0 (`Core:8546–8552`); Items `.a-Region-carouselItem` (Fade; `--carouselSlide` translateX, `--carouselSpin` rotateY) (`Core:8554–8599`).
- Pfeile `.a-Region-carouselControl .a-Tabs-button` (nur sichtbar mit `t-Region--showCarouselControls`): **alle Werte über Hooks** `--ut-carousel-button-*`, Fallbacks `background rgba(0,0,0,.5)`, Text `#fff`, Radius .25rem, Opazität .5 (`Core:8603–8648`) **[gemessen]**.
- Punkte `.a-Region-carouselLink`: Hooks `--ut-carousel-nav-*`, Fallbacks 0.5rem-Kreis, `rgba(0,0,0,.15)`, aktiv `rgba(0,0,0,.4)` (`Core:8652–8684`) **[gemessen]** – in dunklen Styles kaum sichtbar → Hooks setzen.
- Auto-Wechsel über Klassen `js-cycle5s|10s|15s|20s` (JS).
- **24.2**: Header der Karussell-Region standardmäßig ausgeblendet (siehe [9](#9-unterschiede-ut-242--261-komponenten)).

### 3.8 Tabs Container `.t-TabsRegion`, Tabs `.t-Tabs`, Region Display Selector `.apex-rds` (Seiten 1907, 1923)

**Tabs** (`Core:7906–8092`, **[gemessen]**, **[Screenshot]** `tabs-1907-Vita-9042.png`):

- `ul.t-Tabs.a-Tabs > li.t-Tabs-item(.is-active) > a.t-Tabs-link` (Icon `.t-Icon`, Label). Aktiv: Text `--ut-tabs-item-active-text-color` (Vita: `var(--ut-link-text-color)`), Gewicht `--ut-tabs-item-active-font-weight` (Vita bold), **Unterstrich** als `.t-Tabs-link:before` (Höhe Hook `--ut-tabs-item-hint-highlight-width` .125rem, Farbe `--ut-tabs-item-active-highlight-color` → `currentColor`).
- Default = „Simple“ (Unterstrich), `.t-Tabs--pill` = Kasten mit Rahmen/Radius/Schatten aus Component-Tokens (`Core:7976–8000`).
- Hover: `--ut-tabs-item-hover-background-color` → `--ut-component-highlight-background-color`.
- Modifier: `--fillLabels`, `--fitLabels`, `--fixedLabels`, `--largeIcons`, `--iconsAbove`, `--inlineIcons`, `--iconsOnly`, `--large`, `--small` (`Core:8004–8092`).
- Tabs Container: `.t-TabsRegion(.t-TabsRegion-mod--pill|--simple).apex-tabs-region > .t-TabsRegion-items > ul.t-Tabs` + Panels `.a-Tabs-panel`, Umschaltung per JS (`Core:8252–8280`).

**RDS** (`Core:8094–8250`, **[Screenshot]** `rds-1923-Vita-9042.png`): `.apex-rds-container > ul.apex-rds.a-RDS-list.a-Tabs > li.apex-rds-item(.apex-rds-selected) > a.a-RDS-link`. Nutzt **dieselben** `--ut-tabs-item-*`-Tokens (padding .75rem/.5rem), Unterstrich über `.a-RDS-link:before`; `.apex-rds-item--hint` für Hover-Vorschau; in `.t-Body-side`/`.vertical-rds` vertikal mit Balken rechts. Scroll-Pfeile `.apex-rds-hover a` sind komplett Button-Tokens.

→ **Ein Satz `--ut-tabs-*` gestaltet Tabs, Tabs Container, RDS und die Seiten-Navigation per RDS gleichzeitig.**

### 3.9 Wizard `.t-Wizard` (Seite 1208)

- DOM: `.t-Wizard > .t-Wizard-header (h1.t-Wizard-title, .u-Table.t-Wizard-controls: .t-Wizard-buttons | .t-Wizard-steps ul.t-WizardSteps | .t-Wizard-buttons) + .t-Wizard-body`.
- Container (`Core:10071–10083`): Rahmen Hook `--ut-wizard-border-*`, Hintergrund `--ut-wizard-background-color` → Region-Hintergrund, Schatten → `--ut-shadow-sm`, max. 78.75rem, **kein Radius** (**[gemessen]** 0px).
- Header-Hintergrund `--ut-wizard-header-background-color` (Vita `#fafafa`, Dark `#202223`; Theme-Roller-Gruppe Region-BG).
- Schritte (`Core:10149–10400`): Track `--ut-wp-track-color` (Vita `#d9d9d9`, Dark `#262626`), Marker `--ut-wp-marker-color` (dito), erledigt `--ut-wp-complete-background-color` → `--ut-palette-success` mit Häkchen `\e007` in `--ut-wp-checkmark-color` (#fff), aktiv `--ut-wp-active-background-color` → `--ut-palette-primary` **[gemessen]**.
- Modifier: `--showTitle`, `--hideSteps`, Steps `--vertical`, `--displayCurrentLabelOnly`, `--hideLabels`. Beobachtung: Markup auf 1208 trägt `t-Wizard--hideStepsSmall`, CSS kennt `.t-Wizard--hideSteps--small` (*unverifiziert*, ob Absicht).

### 3.10 Content Block `.t-ContentBlock` (Seite 1209)

- Standard **ohne Box**: nur Header (Titel, Buttons) + Body mit Abstand `--ut-content-block-margin` 2rem (`Core:12673–12760`).
- `--padded` (1rem Padding), `--shadowBG` (Fläche `--ut-component-badge-background-color`, Rahmen 1px, Region-Schatten), `--lightBG` (Fläche component bg), `--h1/--h2/--h3` (Titelgrößen), `--showIcon`, `--hideHeader`, `--removeHeader`, `--headingFontAlt`.
- Body-Radius: `var(--ut-content-block-border-radius, var(--ut-region-border-radius))` – ohne weiteren Fallback → in Vita **0**. Setzt unser Style `--ut-region-border-radius` global, folgen Region, Dialoge **und** Content Blocks.
- Wird in der Reference App massiv genutzt (alle „Overview/Instructions“-Blöcke; die grauen Kästen = `--shadowBG`).

---

## 4. Buttons

Seiten 1500 (Varianten mit Template-Options-Umschalter), 6100 (Button Builder). **[Screenshots]** `gal-buttons-Vita-9042.png`, `gal-buttons-Vita-Dark-9042.png`, `gal-buttons-Vita-9242.png`, `focus-buttons-Vita-9042.png`.

### 4.1 Markup und Templates

```html
<!-- Text -->           <button class="t-Button" type="button"><span class="t-Button-label">…</span></button>
<!-- Icon -->           <button class="t-Button t-Button--noLabel t-Button--icon" title="…"><span class="t-Icon fa fa-…"></span></button>
<!-- Text mit Icon -->  <button class="t-Button t-Button--icon t-Button--iconLeft">
                          <span class="t-Icon t-Icon--left fa fa-…"></span><span class="t-Button-label">…</span><span class="t-Icon t-Icon--right fa fa-…"></span></button>
<!-- Menü-Button -->    <button class="t-Button t-Button--icon t-Button--iconRight" data-menu="actions_menu" aria-haspopup="menu">…fa-angle-down…</button>
```

Ohne `--iconLeft/--iconRight` werden beide Icons gezeigt; `--iconLeft` versteckt `.t-Icon--right` und umgekehrt (`Core:3497–3509`).

### 4.2 Zustandsmaschine (`Core:3262–3380`, gleich in `appCore:403–470` für `.a-Button`)

```
background-color = var(--a-button-state-background-color,      ← :hover/:active/:focus setzen diese
                   var(--a-button-type-background-color,       ← --simple / --noUI / Hilfe-Button setzen diese
                   var(--a-button-background-color, transparent)))  ← Basis bzw. Typ-Farbe (--hot, --danger …)
```

Gleiches Muster für `color` (`-text-color`), `border-color`, `box-shadow`. Hover → `--a-button-hover-*`, `:active`/`.is-active` → `--a-button-active-*` (Fallback Hover), `:focus` → `--a-button-focus-*`. Disabled: `opacity: var(--a-button-disabled-opacity, .5)` + `pointer-events:none` (`Core:3331–3347`). Die Selektorlisten schließen `.a-Button`, `.ui-button`, `.a-CardView-button`, `.apex-button-group label`, Pill-Radio-Labels und `.t-Form-helpButton` ein – **ein Token-Satz gestaltet alle Button-Arten**.

### 4.3 Basis-Tokens (Vita)

| Token | Vita | Vita-Dark | Beleg |
|---|---|---|---|
| `--a-button-border-radius` | .125rem | 2px | `Vita:19`, `1690` |
| `--a-button-padding-y/-x` | .5rem / .75rem | gleich | `Vita:20–21` |
| `--a-button-font-size` / `-line-height` | .75rem / 1rem | gleich | → **32px Höhe** **[gemessen]** |
| `--a-button-font-weight` | (Core: 400; `--hot` → bold) | | `Core:3225`, `3384` |
| `--a-button-gap-x` | .25rem (Abstand `.t-Button + .t-Button`) | | `Core:3658` |
| `--a-button-icon-size` / `-icon-spacing` | 1rem / .375rem | | |
| `--a-button-background-color` / `-text-color` | #f8f8f8 / #393939 | #494a4b / white | `Vita:1712` |
| `--a-button-border-color` | rgba(0,0,0,.075) | rgba(255,255,255,.075) | `Vita:2046` |
| `--a-button-shadow` | `0 2px 4px -3px rgba(0,0,0,.1)` | gleich | `Vita:2047` |
| `--a-button-hover-background-color` | white | #626465 | `Vita:2048` |
| `--a-button-hover-shadow` | `0 2px 4px -2px rgba(0,0,0,.1)` | | |
| `--a-button-active-background-color` / `-shadow` | #e6e6e6 / inset | #1a1a1a | `Vita:2051–2052` |
| `--a-button-focus-background-color` / `-border-color` | = hover / `var(--ut-palette-primary)` | | `Vita:2053–2054` |
| `--a-button-count-background-color` / `-text-color` | **#056AC8** / white (26.1) | gleich | `Vita:1714` |

### 4.4 Typ-Modifier (alle **hart** in Vita.css)

| Klasse | Basis (bg/text/hover/active) | `--simple` | `--link`/`--noUI` Textfarbe | Beleg |
|---|---|---|---|---|
| `--hot` (+ `.a-Button--hot`, `.ui-button--hot`, `.a-CardView-button--hot`, `.apex-button-group input:checked + label`, `.t-Form-fieldContainer--radioButtonGroup .apex-item-group--rc input:checked + label`) | #056AC8 / white / #0784f9 / #045daf; Gewicht bold (Core) | Rahmen #056AC8, Text #0677e1, Hover-Text white | #0677e1 | `Vita:2091–2141` |
| `--primary` („Primary“ = helles Alt-Blau) | #9ccefd / #010e1a / #b5dbfd / #84c2fc | Rahmen/Text via `--ut-palette-primary-alt(-text)` | `--ut-palette-primary-alt-text` | `Vita:2237–2262` |
| `--success` | #278701 / #FFF / #36ba01 / #206e01 (Dark: #388729 …) | Text #4d7d3a | #4d7d3a | `Vita:2174–2199` |
| `--warning` | #FFC628 / #000 / #ffd45b / #ffbf0f (Dark: #FBCE4A …) | Text #8d7021 | #8d7021 | `Vita:2145–2170` |
| `--danger` (+ `.ui-button--danger`) | #CB1100 / #FFF / #fe1500 / #b20f00 (Dark: #EE0701 …) | Text #a64940 | #a64940 | `Vita:2203–2233` |

Zusätzlich hart: `.fa:after`-Hintergründe (Font-APEX-Modifier-Overlays, s. [7.5](#75-icons)) je Typ und `white` für `--noUI/--link/--simple` (`Vita:2281–2321`).

### 4.5 Stil-Modifier

| Klasse | Mechanik | Beleg |
|---|---|---|
| `--simple` | Type-Ebene: `--a-button-type-background-color: transparent; --a-button-type-shadow: none` → nur Rahmen; Hover füllt mit Hover-Farbe | `Vita:2059–2062` |
| `--link` | Text `--ut-link-text-color`, Unterstreichung bei Hover (`--ut-link-text-decoration`); **Literal** `background-color: transparent; border-color: transparent; box-shadow:none` → auch beim Hover keine Fläche | `Core:3513–3519`, `Vita:2066–2070` |
| `--noUI` (+ `.a-Button--noUI`) | Type-Ebene transparent + **Literal** `color: inherit; background-color: transparent` auch für `:hover/:active` | `Vita:2074–2087` |
| `--inlineLink` | Padding/Rahmen 0 mit `!important` | `Core:3523–3529` |

### 4.6 Größe, Icons, Gruppen, Abstände

- Größen (`Core:3533–3574`): `--tiny`/`--xsmall` (.625rem, Padding .25/.375), `--small` (.75rem, .25/.5), `--large` (.875rem, .75/1rem), `--xlarge` (1rem, 1/1.25rem). Gleiche Klassen gelten in 26.1 für `.t-InlineActions--*`.
- Icon-Buttons: `--icon` → `min-width: padding-x + icon-size`; `--slim`; `--noLabel` versteckt Label (`Core:3476–3495`). Icons `font-size: var(--a-button-icon-size)`; Farbe Hook `--a-button-icon-color` (26.1).
- Pill-Gruppe (`Core:3626–3654`): `--pillStart` (rechte Ecken 0), `--pill` (Radius 0, −1px Überlappung), `--pillEnd`.
- `--stretch` (100 % Breite, `display:block`), `--hideShow`, `--mobileHideLabel`, `--desktopHideIcon`, `--padLeft|Right|Top|Bottom`, `--gapLeft|…`, 26.1 zusätzlich `--noTop|Bottom|Left|Right`, Animationen `--hoverIconSpin`, `--hoverIconPush` (`Core:3576–3749`).
- **Zähler-Badge (nur 26.1)**: `button.t-Button[data-count]` → `:after` mit `attr(data-count)`, Farben `--a-button-(state|type)-count-*` → `--a-button-count-*`; bei `--hot` invertiert (`Core:3443–3468`). **Hart**: `--a-button-count-background-color: #056AC8`.
- `.t-Button-badge` (Badge im Label): Padding .375rem, Abstand icon-spacing (`Core:3434–3441`).

### 4.7 Weitere Button-Arten

| Art | Klassen | Hinweise |
|---|---|---|
| app_ui-Buttons | `.a-Button`, `--hot`, `--noUI`, `--danger`, `--small`, `--withIcon`, `--noLabel`, `--popupLOV`, `--calendar`, `--colorPicker`, `--comboSelect`, `--shuttle`, `--listManager` | gleiche Tokens (`appCore:403–500`), Zustände per `:focus-visible`; Popup-LOV-/Kalender-Button im Feld übernehmen den **Feld-Radius** (rechte Ecken) **[gemessen]** |
| jQuery-UI-Buttons | `.ui-button`, `.ui-button--hot`, `.ui-button--danger` | in `apex.message.confirm`/`alert`, Dialog-Buttonpane **[gemessen]** |
| Radio-Gruppe als Buttons | `.t-Form-fieldContainer--radioButtonGroup .apex-item-group--rc input + label`, `.apex-button-group label` | Button-Tokens; ausgewählt = Hot-Tokens; Padding `--ut-pillbutton-padding-y/-x` (.25/.5rem), Schrift `--ut-pillbutton-font-size` (.75rem), Innenradien 0 (`Core:3777–3938`) |
| Header-Buttons | `.t-Button--header`, `--headerRight`, `--headerUser` (lowercase!) | transparente lokale Tokens (`Vita:2029–2043`, `Core:3753–3768`) → `_docs/ut-shell.md` |
| Hilfe-Button | `.t-Form-helpButton` | transparent, Padding .25rem, Text muted → default (`Vita:2266–2274`) |
| Alert-Schließen | `.t-Button--closeAlert` | Padding .25rem; in Seitenmeldung hart schwarz (s. 3.4) |

### 4.8 Fallstricke Buttons

- **Die Hot-Selektorliste vollständig übernehmen** (6 Selektoren inkl. Radio-Pills und `.ui-button--hot`), sonst bleiben Radio-Gruppen und Bestätigungsdialoge blau.
- `--hot.--simple`, `--hot.--link`, `--hot.--noUI` haben **Spezifität 0,2,0** und setzen eigene harte Werte – eigene Farbe dort explizit setzen (im Hebeltest blieben sie blau **[Screenshot]** `gal-buttons-Vita-9042-lever.png`).
- `--noUI` und `--link` setzen `color`/`background-color` als **Eigenschaft** – Token-Änderungen allein ändern Hover-Flächen dort nicht.
- Header-Buttons, Hilfe-Buttons, Datepicker-Pfeile, IG/IRR-Steuer-Buttons (`.a-IG-button--controls { --a-button-background-color: #f8f8f8 }` `Vita:3189–3192`, hart) haben lokale Tokens.
- Ein großer Radius (z. B. 999px) macht Pill-Radio-Gruppen zu Pillen mit eckigen Innenkanten (Innen-Radius 0) – gewollt, aber prüfen **[gemessen]** `999px 0 0 999px`.

---

## 5. Formulare

Seiten 1600 (Label-Templates), 1601 (alle Item-Typen). **[Screenshots]** `9042-1601-base.png`, `form-errors-Vita[-Dark]-9042.png`, `forms-1600-Vita-9042.png`, `floating-idle/focus-Vita-9042.png`, `lever-forms-Vita-9042.png`.

### 5.1 Anatomie Feld-Container

```html
<div class="t-Form-fieldContainer [t-Form-fieldContainer--floatingLabel|--stacked] rel-col apex-item-wrapper apex-item-wrapper--text-field [is-required]">
  <div class="t-Form-labelContainer col col-2"><label class="t-Form-label" for="P1_X">Label</label></div>
  <div class="t-Form-inputContainer col col-2">
    <div class="t-Form-itemWrapper">[.t-Form-itemText--pre] <input class="text_field apex-item-text"> [.t-Form-itemText--post] [button.t-Form-helpButton]</div>
    <span class="a-Form-error" id="P1_X_error_placeholder"></span>   <!-- Fehler → <span class="t-Form-error"><div>…</div></span> -->
  </div>
</div>
```

- `apex-item-wrapper--<typ>` benennt den Item-Typ (u. a. `text-field`, `textarea`, `select-list`, `select-one`, `select-many`, `combobox`, `popup-lov`, `date-picker-apex(-popup|-inline|-native)`, `yes-no`, `checkbox`, `radiogroup`, `single-checkbox`, `file`, `image-upload`, `star-rating`, `color-picker`, `number-field`, `shuttle`, `list-manager`, `markdown-editor`, `rich-text-editor`, `display-only`, `pct-graph`, `qrcode`, `display-map`) **[gemessen, 1601]**. Diese Klassen sind der verlässlichste Selektor für typspezifisches Styling.
- `.t-Form-itemWrapper` ordnet per `order` (Icon 2, Input 3, Post-Text 4, Hilfe 5) (`Core:16668–16704`).

**Label-Templates → Klassen**

| Template | Container-Klasse | Wirkung |
|---|---|---|
| Optional / Required (horizontal) | `t-Form-fieldContainer` + Grid-Spalten `col-N` | Label **rechtsbündig** (`text-align:end` `Core:15662`), mobil linksbündig darüber; `t-Form--leftLabels` → links |
| Optional/Required – Above | `t-Form-fieldContainer--stacked` (oder Region-/Form-Klasse `t-Form--labelsAbove`) | Spalte, Label oben, kein Abstand dazwischen (`Core:15935–15952`) **[DOM 1600]** |
| Optional/Required – Floating | `t-Form-fieldContainer--floatingLabel` | siehe 5.4 |
| Hidden | `t-Form-labelContainer--hiddenLabel` bzw. `col-0` | Label 0 breit bzw. visuell versteckt (`Core:15966–16001`) |
| Required (alle) | `is-required` am Container | Label `:before` = Glyphe `\e058` aus `apex-core-font` in `--a-form-required-asterisk-text-color` (`Std:150` → `--a-palette-danger`) (`Core:15687–15695`); `--indicatorLabel` zeigt stattdessen Text `.t-Form-itemRequired` (*unverifiziert*, kein Required-Item im Testbett) |

**Abstände**: `--ut-field-padding-y/-x` (Core-Fallback .5rem; `--slimPadding` .25rem, `--noPadding` 0), Label `--ut-field-label-padding-y` (.25rem), `--ut-field-label-font-size` (.75rem), `--ut-field-label-line-height` (1rem), Farbe `--ut-field-label-text-color` (Vita #262626, Dark whitesmoke, `Vita:1837`), Gewicht Hook `--ut-field-label-font-weight` (normal) **[gemessen 12px/400]**.

### 5.2 Eingabefelder (Default-Inputs-Regel `Core:16761–16850`)

Gilt für `.apex-item-text`, `.apex-item-select`, `.apex-item-textarea`, `.apex-item-multi`, `.apex-item-comboselect`, Readonly-Varianten u. a.

| Eigenschaft | Variable | Vita | Vita-Dark |
|---|---|---|---|
| Hintergrund / Text | `--a-field-input-(state-)background-color` / `-text-color` | #f9f9f9 / #202020 | #212325 / #fcfcfc |
| Rahmen | `--a-field-input-border-color`, `-border-width` (Std: 1px), `-border-style` (26.1: var; 24.2: literal solid) | #dfdfdf | #393d40 |
| Radius | `--a-field-input-border-radius` | .125rem | 2px |
| Padding | `--a-field-input-padding-y/-x` (UT-Core `:root` .25rem, `Core:45–46`), Innenmaß = Padding − Rahmen | 3px **[gemessen]** | |
| Schrift | `--a-field-input-font-size` (.75rem), `-line-height` (1rem), mobil < 480px 1rem (`--ut-xs-field-input-*`) | → **Höhe 24px** **[gemessen]** | |
| Hover | `--a-field-input-hover-background-color` (+ `-hover-border-color`, `-hover-text-color`) | white | #151617 |
| Fokus | `--a-field-input-focus-background-color`, **`--a-field-input-focus-border-color` (hart #056AC8)**, Outline über `--ut-focus-outline*` | white, #056AC8, Outline auto 1px **[gemessen]** | #09090a, #056AC8 |
| Fehler | `.apex-page-item-error` → `--a-field-input-state-border-color: var(--ut-palette-danger)` (`Core:17007ff`) | #CB1100 **[gemessen]** | #EE0701 |
| Disabled | `opacity: var(--ut-field-disabled-opacity, var(--a-field-disabled-opacity, .5))` | | |
| Readonly | `.apex-item-wrapper.is-readonly .js-accessible-readonly` → `border-style: var(--a-field-input-state-border-style, dashed)`, keine Hover-Farben | | |
| Platzhalter | `::placeholder { color: var(--a-field-placeholder-text-color, currentColor); opacity: var(--a-field-placeholder-opacity, .6) }` (26.1, `Core:294`) | | |
| Schatten | `--a-field-input-(state-)shadow` (app_ui: none) | none | none |

- Select List: natives `<select>` mit **SVG-Pfeil als Data-URI** `--a-field-select-background-image` (`Std:155`, Füllfarbe **#7A7A7A**, auch in Vita-Dark), Größe `--a-field-select-background-size` (2rem 1rem), Abstand `--a-field-select-arrow-padding` (2rem) **[gemessen]**. Andere Pfeilfarbe = eigenes SVG in der Variable.
- Textarea `min-height: 4rem`; Number Field = `apex-item-text apex-item-number u-textEnd` (rechtsbündig).
- Display Only: `.apex-item-display-only`, Gewicht `--a-field-display-font-weight` (Default bold; `--normalDisplay`/`--boldDisplay`).
- Item-Icons (`apex-item-wrapper--has-icon`): Icon-Spalte `.apex-item-icon`, Maße `--ut-field-input-icon-*` (`Core:16706–16740`).
- Pre/Post-Text als Block (`--preTextBlock`/`--postTextBlock`): Hintergrund = Feldhintergrund, Radius per `--ut-prepost-border-radius` (`Core:15753–15814`).
- Größen: `.t-Form--large|--xlarge` bzw. `.t-Form-fieldContainer--large|--xlarge` – **in Vita.css** (`Vita:2670–2840`), setzt Label-, Feld-, Checkbox-, Switch-, Pill- und Chip-Maße lokal.
- `--stretchInputs` (Form oder Container): `--a-field-input-flex-grow: 1` (`Core:16005–16020`).

### 5.3 Floating Labels `.t-Form-fieldContainer--floatingLabel`

- Setzt lokal größere Felder: Padding .375rem/.5rem, Schrift .875rem, Label .875rem → schwebt auf .6875rem (`Core:16109–16121`) **[gemessen: Feld 48px hoch, Label 14px → 11px bei Fokus]**.
- Container wird Grid (`"pretext field"`), Label absolut über dem Feld; aktiv (`.is-active`, `:focus-within`, `js-show-label`, Wert/Platzhalter vorhanden) rutscht es nach oben (`Core:16210–16214`).
- Fokus-Zustand färbt über den Container: `--a-field-input-state-*` = Fokus-Tokens, Icon-Spalte `--ut-field-fl-input-focus-icon-background-color` (**hart #056AC8** `Vita:1886`).
- Bei Textarea/Select liegt unter dem Label eine **Hintergrund-Plakette** `label::before` (Feldfarbe, Opazität .85, `Core:16596–16624`) – beim Umfärben mitdenken.
- **Pflicht-Markierung**: rotes Dreieck oben links `.t-Form-itemRequired-marker:before` (Border-Trick, 0.25rem, Farbe `--a-form-required-asterisk-text-color`) (`Core:16230–16244`) – typisches APEX-Merkmal.
- Viele Item-Typen (Checkbox, Radio, Switch, File, Star Rating, RTE, Markdown, Color Picker, Map …) bekommen oben `margin-block-start: var(--ut-field-fl-label-offset)` (`Core:16337–16519`) – wer Label-Maße ändert, sollte `--ut-field-fl-label-line-height`/`-font-size` statt fester Werte nutzen.

### 5.4 Checkbox und Radio (`appCore:3100–3260`, Tokens `Vita:56–65`, `Vita:1888–1893`)

- Markup: `input` (unsichtbar) + `label.u-checkbox` / `label.u-radio`; Kästchen = `label:before`, Haken/Punkt = `label:after` (`opacity 0→1`, Vita zusätzlich `scale(0)→scale(1)`, `Vita:2842–2873`).
- Tokens: `--a-checkbox-size` (1rem), `-border-radius` (.125rem; Radio lokal 100 %), `-background-color` (Vita #f9f9f9 / Dark #212325), `-border-color` (rgba(0,0,0,.15) / rgba(255,255,255,.15)), **`-checked-background-color` (hart #056AC8, beide Styles)**, `-checked-text-color` (white), `-icon-character` (`\e007`, `Std:102`), `-icon-font-family` (apex-core-font), `-label-font-size` (.75rem), `-label-spacing-x` (.375rem), Abstand zwischen Optionen `--ut-checkbox-item-spacing` (1rem).
- Radio-Punkt = Hintergrund `--a-checkbox-text-color`, halbe Kästchengröße **[gemessen 8px]**.
- Fokus: `outline: 1px auto var(--a-checkbox-outline-color, -webkit-focus-ring-color)` am `:before`.
- Einzel-Checkbox: `.apex-item-single-checkbox`, gewählte Labels fett (`Core:17325–17347`).

### 5.5 Switch `.a-Switch` (`apex-item-wrapper--yes-no`, `appCore:14586–14700`)

- Markup: `span.a-Switch > input[role=switch] + span.a-Switch-toggle` (Knopf = `.a-Switch-toggle:before`).
- Tokens aus **Theme-Standard** (`Std:272–296`): aus `--a-switch-background-color: #8c8c8c` (**hart, auch in Dark**), an `--a-switch-checked-background-color: var(--a-palette-primary)` (`Std:279`, **folgt Primärfarbe** **[gemessen]**), Knopf `--a-switch-toggle-background-color: #fff`, Radius `--a-switch-border-radius: var(--a-switch-width)` (Pille), Fokus-Schatten `--a-switch-focused-shadow`.
- Vita überschreibt Maße (`Vita:289–297`: Breite 2.75rem, Knopf 1.25rem, Padding .125rem) und schaltet Hover-Abdunkelung ab (`--a-switch-hover-background-color: var(--a-switch-background-color)`); Größen in `--large/--xlarge`.
- Pill-Variante „Pill Button“ des Yes/No-Items: `.apex-button-group` (`Core:17605–17610`) mit Hot-Tokens für die Auswahl.

### 5.6 Auswahllisten: Select One/Many, Combobox (`a-select`, `a-combobox`)

- Web Components `<a-select>`/`<a-combobox>` mit innerem `.apex-item-comboselect` (Input, `.a-Chip-clear`, bei Combobox `.a-Chip-divider`, `.a-Button--comboSelect`) **[DOM 1601]**; Mehrfachauswahl als Chips `.a-Chip` (`--a-chip-*`, `Vita:323–341`).
- Aufklappliste = **jQuery-UI-Dialog** mit `.a-ComboSelect-popup` (Einträge `.a-ComboSelect-item/-label`) **[gemessen]** → Container-Tokens `--jui-dialog-*`; Einträge `--a-combo-select-item-*` (Hooks, u. a. `-selected-background-color: var(--ut-palette-primary-shade)` `Vita:343`).
- Fehler: `.apex-item-wrapper--select-one .apex-item-comboselect:has(.apex-page-item-error)` → Danger-Rahmen (`Core:17699ff`).

### 5.7 Popup LOV (`apex-item-wrapper--popup-lov`)

- `div.apex-item-group.apex-item-group--popup-lov > input.popup_lov.apex-item-text.apex-item-popup-lov + button.a-Button.a-Button--popupLOV` **[DOM]**; Fokus-Ring auf der **Gruppe** (`:focus-within`, `Core:17524–17532`).
- Dialog: `.ui-dialog.ui-dialog-popuplov.ui-dialog--popup` mit `.a-PopupLOV-dialog` (Suchleiste `.a-PopupLOV-searchBar`/`.a-PopupLOV-search`, Ergebnisse `.a-PopupLOV-results.a-TMV` = Grid-View-Tokens `--a-gv-*`) **[gemessen, Screenshot]** `popuplov-Vita-Dark-9042.png`.
- Mehrfachwerte als Chips `--a-popuplov-chip-*` (`Vita:230–238`).

### 5.8 Date Picker (`a-date-picker`, `apex-item-wrapper--date-picker-apex-*`)

- Popup: `<a-date-picker>` mit `input.apex-item-datepicker` + `button.a-Button--calendar`; Kalender in `.ui-dialog.ui-dialog-datepicker.ui-dialog--popup > .ui-dialog-content > .a-DatePicker` **[gemessen]**. Inline: `.a-DatePicker-inline` direkt im Feld.
- Teile: `.a-DatePicker-header` (Monat/Jahr-Selects `.a-DatePicker-month|-year`, Pfeile `.a-DatePicker-nav--prev|--next`), `.a-DatePicker-calendars > .a-DatePicker-calendar` (Tage `td > span`, heute `td.is-current[aria-current=date]`), `.a-DatePicker-footer` (Clear/Today).
- Tokens `--a-datepicker-*` (93 Variablen, `Vita:75–106`): Hintergrund `--ut-component-toolbar-background-color`, Radius `--ut-border-radius` (.25rem), **Header/Titel #f9f9f9 hart** (Dark #060606), Tag-Radius 50 %, Auswahl `--a-palette-primary`, Hover `--ut-component-border-color`; „heute“ Vita = primary-shade/primary **[gemessen, folgt Primärfarbe]**, Vita-Dark eigene `--a-datepicker-calendar-day-current-*` (rgba(255,255,255,.2)) (`Dark:3454–3456`).
- Monats-Selects: eigener Pfeil `\f0dc` in `Font APEX Small` (`Vita:2910–2923`); Nav-Buttons transparent (`Vita:2936`).
- Nativer HTML-Datepicker: `input[type=date]` – Aussehen durch `color-scheme` (`--ut-color-scheme`) gesteuert.
- Legacy jQuery-UI-Datepicker `.ui-datepicker` (`Core:24959–25033`): Fallback-Fokus-Schatten enthält einen Tippfehler (`35 0 0 1px #0076df inset`) – nur relevant für Alt-Items.

### 5.9 File Browse / Drop (`a-file-upload`, `.a-FileDrop`)

- Varianten `a-FileDrop--inline` (Zeile mit Icon, Überschrift, Beschreibung, Aktionen) und `--iconDropzone` (Bild-Upload-Kachel) **[DOM 1601]**.
- 71 Tokens `--a-filedrop-*` (`Vita:133–152`, `Std:141–146`): Rahmen = Feldrahmen, Radius `--a-filedrop-border-radius` (Theme-Roller-Formradius), Zustände hover/focus/dragging/error (`--a-filedrop-dragging-*` → primary-shade/primary), Fortschritt `rgba(0,0,0,.1/.5)` (**hart, auch Dark**).
- „Choose File“-Aktion ist `.a-Button--hot` → **hart blau** bis zur Hot-Überschreibung.

### 5.10 Rich Text Editor (CKEditor 5) – *nur CSS-Analyse, nicht im Testbett*

- UT setzt `--ck-*` **auf `body`** aus unseren Tokens: Toolbar `--a-toolbar-*`, Buttons `--a-button-*`, Dropdowns `--a-menu-*`, Fokus `--a-field-input-focus-border-color` (`Core:25276–25303`). Editierfläche nutzt Feld-Tokens und den globalen Fokus-Ring (`Core:25304–25320`); Dropdown-Panel Menü-Radius/-Schatten.
- Eigene `--ck-*`-Overrides daher auf **`body`** (nicht `:root`) setzen, sonst verdeckt. `--ck-border-radius` setzt UT nicht (CKEditor-Default).
- Inhalts-Stile `.ck-content pre/hr/table …` haben harte Grautöne (`appCore:16744–17140`); Legacy CKEditor 4 `.cke_*` (`Core:25253–25274`).

### 5.11 Markdown Editor, Star Rating, Color Picker, Shuttle, List Manager, Prozentgrafik

| Item | Struktur/Klassen | Tokens / Besonderheiten |
|---|---|---|
| Markdown Editor | `.a-MDEditor` = `.a-Toolbar` + CodeMirror/Textarea + Vorschau | `--a-mdeditor-*` → Feld-Tokens (`Vita:199–202`), Toolbar `--a-toolbar-background-color: var(--ut-region-header-background-color)` (`Vita:302`) |
| Star Rating | `.a-StarRating > .a-StarRating-stars > -stars-bg / -stars-fg > .a-StarRating-star.fa.fa-star` | Vordergrund `--a-starrating-stars-fg-color` (→ primary), Hintergrund `--a-starrating-stars-bg-color` (Vita rgba(0,0,0,.15), Dark rgba(255,255,255,.15)), Glyphe `--a-starrating-icon-character` (`appCore:14457–14565`) |
| Color Picker | `<a-color-picker>` mit Vorschau `.apex-item-color-picker-preview`, `.a-Button--colorPicker`; Popup = jQuery-UI-Dialog mit `.a-ColorPicker` | `--a-color-picker-*`, Presets `--a-color-picker-preset-N` = `--u-color-N` (`Std:65–79`) |
| Shuttle | `.apex-item-group--shuttle table.shuttle` mit zwei `select` + `.a-Button--shuttle` (noUI/small) | Feld-Tokens; Mindesthöhe 8.75rem |
| List Manager | Input + `.a-Button--listManager` + `select.listmanager` | Feld-Tokens |
| Prozentgrafik | `.a-Report-percentChart(-fill/-value)` | `--a-percent-chart-*` → primary-shade/primary (`Vita:247–253`) → folgt Primärfarbe |

### 5.12 Validierung und Hilfe

- **Inline-Fehler** **[gemessen]**: Input erhält `apex-page-item-error` + `aria-invalid`; Platzhalter `span.a-Form-error.u-visible > span.t-Form-error > div#P_X_error`. Schrift `--ut-field-error-font-size` (→ `--ut-field-assistance-font-size`, .6875rem), Farbe `--a-form-error-text-color` (`appCore:5642`, `Std:149` → `--a-palette-danger`). Rahmen danger (s. 5.2).
- **Seitenfehler**: gelbe Warnbox (s. 3.4).
- Popup-LOV/Select-One mit Fehler färben die **Gruppe** (`:has(.apex-page-item-error)`, `Core:17533–17536`).
- **Hilfe-Button** `.t-Form-helpButton` (Klasse im CSS: transparent, muted, `Vita:2266–2274`; in `.apex-item-wrapper--textarea` usw. oben ausgerichtet). Die Item-Hilfe öffnet einen jQuery-UI-Dialog – Klassenname *unverifiziert* (Seite 1903 enthält keine Item-Hilfe).

---

## 6. Menüs, Dialoge, Popups, Meldungen

### 6.1 Popup-Menü `.a-Menu` (Seite 1306)

- DOM (per JS an `body` angehängt, `display:block` inline): `div.a-Menu[role=menu] > div.a-Menu-content > ul > li.a-Menu-item(.is-focused|.is-expanded|.is-disabled) > div.a-Menu-inner > span.a-Menu-labelContainer (span.a-Menu-statusCol, a|button.a-Menu-label) + span.a-Menu-accelContainer (span.a-Menu-subMenuCol)`; Trennlinien `.a-Menu-hSeparator`; optional Callout (`has-callout`, `js-menu-callout`).
- Container (`appCore:12077–12127`): Padding `--a-menu-padding-y/-x` (Vita .5rem / **0**), Schrift `--a-menu-font-size` (.75rem), Radius `--a-menu-border-radius` (.25rem), Rahmen `--a-menu-border-color` (Vita rgba(0,0,0,.1), Dark rgba(255,255,255,.15)), Schatten `--a-menu-shadow` (`Std:205`: `0 12px 24px -12px rgba(0,0,0,.3)`), Mindestbreite Hook `--a-menu-min-width` (nur `.t-NavigationBar-menu` setzt 10rem, `Core:4525–4526`).
- Einträge: Höhe aus Zeilenhöhe + 2× Padding; Hover/Tastatur = `.is-focused` → `--a-menu-focused-background-color` (**hart #056AC8** `Vita:1106`) / `-text-color` (white) **[gemessen]**; Hook `--a-menu-item-border-radius` für abgerundete Einträge.
- Farben: `--a-menu-background-color` (#FFFFFF / Dark #1b1d1e), `-text-color` (#262626 / whitesmoke) – Theme-Roller „NavBarMenu“ (`Vita:1080–1109`).
- **Hebeltest** **[Screenshot]** `lever-menu-Vita-9042.png`: `--a-menu-padding-x: .375rem` + `--a-menu-item-border-radius: .5rem` + helle Fokusfarbe ergibt moderne „eingerückte“ Einträge.
- Mega Menu setzt `--a-menu-focused-background-color: transparent` lokal (`Vita:2966`) → `_docs/ut-shell.md`.

### 6.2 Menüleiste `.a-MenuBar` (Seite 1305)

- `div.a-MenuBar > ul > li.a-MenuBar-item(.a-Menu--split|.a-Menu--current) > button.a-MenuBar-label + span.a-Menu-subMenuCol` (`appCore:11994–12075`).
- Tokens **nur aus Theme-Standard**: `--a-menubar-background-color: #f0f0f0`, Item-Rahmen `rgba(0,0,0,.1)`, Current `#fff`/`#000`, Split-Icon `rgba(0,0,0,.25)` (`Std:193–200`). Im Header überschreibt der Core sie aus `--ut-header-menubar-*` (`Core:4287`).
- **Vita-Dark-Fehler** **[gemessen, Screenshot `menubar-Vita-Dark-9042.png`]**: außerhalb des Headers bleibt der Hintergrund `#f0f0f0`, die Schrift wird aber weiß (vererbt) → unlesbar. Ein dunkler Style muss `--a-menubar-*` setzen.

### 6.3 Die jQuery-UI-Dialog-Familie

Alle folgenden Oberflächen sind `.ui-dialog` (Basis `appCore:15935–16110`) und teilen die `--jui-dialog-*`-Tokens **[gemessen]**:

| Oberfläche | Klassen am `.ui-dialog` | Inhalt |
|---|---|---|
| Page Dialog (Modal) (1910) | `ui-dialog--apex t-Dialog-page--standard` (bzw. `--wizard`) | **iframe** mit eigener APEX-Seite (Dialog-Page-Template `.t-Dialog`) |
| Page Drawer (1917) | `ui-dialog--apex t-Drawer…` | iframe; Drawer-Seitenrichtungen → `_docs/ut-shell.md` |
| Inline Dialog (1911) | `ui-dialog--inline` | `.t-DialogRegion` (Region im DOM der Seite) |
| Inline Popup (1915) | `ui-dialog--inline ui-dialog--popup` | `.t-DialogRegion.js-regionPopup(.js-popup-callout)`, Titelleiste `display:none` |
| Popup LOV | `ui-dialog-popuplov ui-dialog--popup` | `.a-PopupLOV-dialog` |
| Date Picker Popup | `ui-dialog-datepicker ui-dialog--popup` | `.a-DatePicker` |
| Select One/Many | `ui-dialog` (Inhalt `.a-ComboSelect-popup`) | Liste |
| `apex.message.confirm/alert` | `ui-dialog--notification ui-dialog--modern ui-dialog-buttons` | Text + `.ui-dialog-buttonpane` mit `.ui-button` / `.ui-button--hot` |

**Tokens** (`Vita:396–422`, `Std:392–415`, `Core:59–62`):

| Teil | Variable | Vita |
|---|---|---|
| Fläche/Text | `--jui-dialog-background-color` (→ region bg), `-text-color` | white / #262626 (Dark #1b1d1e / whitesmoke) |
| Rahmen | `--jui-dialog-border-width` (0), `-border-color` | 0 |
| Radius | `--jui-dialog-border-radius` (→ `--ut-region-border-radius` → component) | 2px **[gemessen]** |
| Schatten | `--jui-dialog-shadow: var(--ut-shadow-lg), 0 0 0 1px border` | Ring ersetzt den Rahmen |
| Titelleiste | `--jui-dialog-titlebar-padding-y/-x` (.75/1rem), `-background-color` (transparent), `-border-*` | Titel 1rem/1.5rem semibold |
| Schließen-Knopf | `.ui-dialog-titlebar-close` = `.ui-button` 24×24, `--jui-dialog-title-close-border-radius: var(--a-button-border-radius)`, Glyphe `--jui-dialog-title-close-icon` (`\00D7`) | normale Button-Tokens |
| Inhalt | `--jui-dialog-content-padding-y/-x` (UT: 0) | |
| Buttonleiste | `--jui-dialog-buttonpane-*` (Hintergrund `rgba(0,0,0,.025)` `Std`, Rahmen oben) | |
| Overflow | `overflow: var(--jui-dialog-overflow)` – **Hook**; `.ui-dialog--apex` setzt `overflow:hidden` literal (`appCore:4543–4547`) | Page Dialogs werden an den Ecken beschnitten **[gemessen bei 16px]**, Inline Dialogs/Popups nicht |
| Overlay | `.ui-widget-overlay { background: var(--jui-overlay-background-color, rgba(0,0,0,.5)); opacity: var(--jui-overlay-opacity, 1) }` (`appCore:15500–15510`) | `rgba(0,0,0,.25)` (`Std:394`, **auch Vita-Dark**) **[gemessen]** |
| Schatten anderer Widgets | `.ui-widget-shadow { box-shadow: var(--jui-widget-shadow) }` | `0 2px 4px rgba(0,0,0,.15)` |

**Page Dialog**: Chrome (Titelleiste, Rahmen, Radius, Schatten) gehört zur **Elternseite**, der Inhalt ist ein eigenes Dokument im iframe → beide Seiten laden denselben Theme Style; Dialog-Seiten nutzen das Dialog-Page-Template (`.t-Dialog`, `Core:5020–5145`). Lade-Spinner `--ut-dialog-spinner-color` (Hook). Öffnen/Schließen-Animation über `--js-dialog-open-timing`/`-close-timing` (`Core:71–76`).

**Screenshots**: `inline-dialog-Vita-9042.png`, `inline-popup-Vita-9042.png`, `page-dialog-Vita-Dark-9042.png`, `confirm-Vita[-Dark]-9042.png`, `datepicker-popup-Vita-9042.png`, `selectone-popup-Vita-Dark-9042.png`, `dlg-radius-noclip-Vita-9042.png`.

### 6.4 Tooltips

| Art | Selektor | Tokens | Vita = Vita-Dark |
|---|---|---|---|
| jQuery-UI-Tooltip (allgemein) | `.ui-tooltip > .ui-tooltip-content` (`appCore:16537–16550`) | `--jui-tooltip-background-color` (**#fff**), `-text-color` (**#000**), `-border-color` (rgba(0,0,0,.1)), `-shadow`, `-border-radius` (Vita .125rem), `-padding` (.5rem), `-maxwidth` (300px) | **weiß in beiden Styles** **[gemessen, Screenshot `tooltip-Vita-Dark-9042.png`]**; Schriftgröße nicht gesetzt (erbt, gemessen 16px) |
| Grid-/IG-Tooltip | `.a-GV-tooltip.ui-tooltip` (`appCore:7041–7095`) | `--a-tooltip-background-color` (rgba(0,0,0,.9)), `-text-color` (#fff), `-font-size` (.6875rem), Pfeil per `:before`; Fehler/Warnung = palette | dunkel in beiden |
| JET-Chart-Datatip | `.oj-dvt-datatip` (`appCore:12626`) | nutzt `--jui-tooltip-*` | |

Es gibt **keine** Klasse `.a-Tooltip`.

### 6.5 Seitenmeldungen

Siehe [3.4](#34-alert-t-alert-seite-1202-und-seitenmeldungen). Auslösen im Test: `apex.message.showPageSuccess('…')`, `apex.message.showErrors([{type:'error', location:['page','inline'], pageItem:'P1601_TEXT_FIELD', message:'…', unsafe:false}])`, `apex.message.confirm('…', fn)`.

---

## 7. Kleinteile

### 7.1 Badge `.t-Badge` (Seite 3002)

- `span.t-Badge(.t-Badge--success|--warning|--danger|--info)(.t-Badge--subtle)(.t-Badge--circle) > span.t-Badge-icon + span.t-Badge-label + span.t-Badge-value` (`Core:12439–12598`).
- Tokens: `--ut-badge-background-color` (→ `--ut-component-badge-background-color`: Vita rgba(0,0,0,.05), Dark rgba(255,255,255,.1)), `-text-color`, `-border-radius` (.25rem), `-padding-x/-y`, `-height` (1.5rem), `-font-size` (.8125rem), Gewicht semibold.
- Status: `--a-palette-X`/`-contrast` (→ `--ut-palette-X`), `--subtle`: Text `--a-palette-X`, Fläche `-shade`. Größen `--sm/--md/--lg`, `--outline`, `--square`, `--rounded` (26.1, `.375rem`), `--circle`.
- Leere Badges werden versteckt (26.1 zusätzlich `:has(.t-Badge-value:empty)`).
- Es gibt **keine** `.a-Badge`-Komponente; verwandt: Badge List `.t-BadgeList` (Seite 1304, runde Kennzahlen, Farbe über `u-color-N`), Button-Badge `.t-Button-badge`, Nav-Bar-Badges (`--ut-navbar-button-badge-*`).

### 7.2 Avatar `.t-Avatar` (Seite 3001)

- `span.t-Avatar.t-Avatar--(initials|icon|image).t-Avatar--(xxs…xxl).t-Avatar--(square|rounded|circle|noShape)` (`Core:15070–15275`); Liste `.t-Avatars` (Abstände `--spacing*`).
- Tokens: `--ut-avatar-size` (3rem), `-font-size`, `-border-radius` (.25rem; `--circle` 50 %), Farben `--ut-avatar-background-color` (Fallback `--a-palette-primary`) / `-text-color`.
- In der Praxis setzt APEX **`u-color-N`** auf das Avatar-Element → Fläche/Text direkt aus `--u-color-N`/`-contrast` (`Core:18292ff`) **[gemessen: u-color-13 → rgb(90,104,173)]**. Die Akzentpalette ist also der Hebel für Avatar-Farben.
- Es gibt **keine** Klasse `.a-Avatar`.

### 7.3 Links List `.t-LinksList` (Seite 1303)

- `ul.t-LinksList(.t-LinksList--showArrow|--showBadge|--showIcons|--showTopIcons|--actions|--nowrap) > li.t-LinksList-item(.is-current) > a.t-LinksList-link > span.t-LinksList-icon + span.t-LinksList-label + span.t-LinksList-badge` (`Core:6345–6540`).
- Linkfarbe `--ut-linkslist-text-color` → `--ut-link-text-color` **[gemessen]**, Trennlinien `--ut-component-inner-border-*`, Pfeil `--ut-linkslist-arrow-color` (Vita rgba(0,0,0,.2)), Badge component-badge. **Hover-Hintergrund ist ein leerer Hook** (`--ut-linkslist-hover-background-color`) → Vita hat keinen Hover-Effekt außer Farbe; guter Hebel für ein moderneres Listen-Gefühl.

### 7.4 Weitere

- **Kontext-Info, Timeline, Comments, Media List, Metric Cards, Cards, Reports, IG/IR**: nicht Teil dieses Dokuments (Reports/IG siehe andere Analysen).
- **Karten-/Map-Marker**, Diagramme folgen `--ut-palette-primary` bzw. `--u-color-*`.

### 7.5 Icons

- **Font APEX** (`/i/libraries/font-apex/2.5.1/css/font-apex.min.css`, im `<head>` vor UT-Core): Klasse `.fa .fa-<name>`; Körper-Klasse `apex-icons-fontapex` (alternativ `apex-icons-fontawesome`). Glyphen aus `Font APEX Small` bzw. `Font APEX Large` (UT schaltet bei großen Icons um, z. B. `Core:8438`, `8491`). Farbe = `currentColor`, Größe über `font-size`/`--a-icon-size`.
- **UI-Icons** (`.a-Icon.icon-*`, Alert-Glyphen, Checkbox-Haken, Pflicht-Asterisk) kommen aus `apex-core-font` (`--a-icon-font-family`, `Core:28`).
- **Modifier-Overlays** `.fa[class*=fam-]:after` (z. B. `fam-check`, `fam-x`, `fam-25-percent`): kleiner Kreis unten rechts mit **`background-color:#fff`** (in font-apex.css) bzw. in Buttons typabhängig hart (`Vita:2281–2321`) – in dunklen Styles weißer Kreis.
- Die Glyphen-Formen selbst lassen sich per Theme nicht ändern (nur Farbe/Größe/Transform); ein anderer Icon-Look erfordert ein anderes Icon-Set (App-Einstellung), nicht Teil eines Theme Styles.

### 7.6 Fokus-Ringe

- Mechanik und Belege: [2.5](#25-fokus-mechanik-gilt-für-alle-komponenten).
- Empfehlung für einen eigenen Look (unsere Tokens, beide UT-Versionen nutzen dieselben Variablen):

```css
:root {
  --ut-focus-outline-color: var(--my-accent);
  --ut-focus-outline: 2px solid var(--ut-focus-outline-color);  /* Hook, ersetzt "auto 1px" überall */
  --ut-focus-outline-offset: 2px;                                /* Hook; a-select setzt lokal 0 */
}
/* optional: Ring nur bei Tastaturfokus – Barrierefreiheit prüfen */
*:focus:not(:focus-visible) { outline: none; }
/* harte Ausnahme nachziehen */
.apex-button-group input:focus + label,
.t-Form-fieldContainer--radioButtonGroup .apex-item-group--rc input:focus + label { outline: var(--ut-focus-outline); outline-offset: 2px; }
:root { --a-checkbox-outline-color: var(--ut-focus-outline-color); }
```

*unverifiziert*: die Kombination aus `outline-offset: 2px` und Feldgruppen mit `:focus-within` (Popup LOV, Color Picker, RTE) – dort sitzt der Ring um die ganze Gruppe.

---

## 8. Vita vs. Vita-Dark aus Komponentensicht

Vita-Dark.css unterscheidet sich nur in **Werten** (432 Diff-Zeilen `<`/`>`) plus einem zusätzlichen `:root`-Block am Ende (`Dark:3451–3502`); Selektoren und Struktur sind identisch.

| Komponente | Vita | Vita-Dark |
|---|---|---|
| Seite | Body #FDFDFD, Text black | #252729, white |
| Region | bg white, Header white, Text #262626, Header-Linie rgba(0,0,0,.075) | bg **#1b1d1e**, Header **#111213**, Text whitesmoke/#ebebeb, Linie rgba(255,255,255,.075) |
| Komponenten-Rahmen | rgba(0,0,0,.1) | rgba(255,255,255,.15) |
| Texte (component) | #000 / muted rgba(0,0,0,.65) | #fff / rgba(255,255,255,.65) |
| Buttons normal | #f8f8f8 / #393939, Hover white, Active #e6e6e6 | #494a4b / white, Hover #626465, Active #1a1a1a |
| Hot-Button | #056AC8 | **gleich #056AC8** |
| Success/Warning/Danger | #278701 / #FFC628 / #CB1100 | #388729 / #FBCE4A / #EE0701 |
| Info / Primary-Shade | #056AC8 / #e6f0fa | #006BD8 / #010b14 |
| Link | #056AC8 | #349bfa |
| Felder | #f9f9f9, Rahmen #dfdfdf, Text #202020, Hover/Focus white | #212325, #393d40, #fcfcfc, Hover #151617, Focus #09090a |
| Feld-Fokusrahmen, Checkbox checked, Menü-Hover | #056AC8 | **gleich #056AC8** |
| Labels | #262626 | whitesmoke |
| Checkbox | #f9f9f9, Rand rgba(0,0,0,.15) | #212325, rgba(255,255,255,.15) |
| Menü | #FFFFFF / #262626, Rand rgba(0,0,0,.1) | #1b1d1e / whitesmoke, rgba(255,255,255,.15) |
| Datepicker Header | #f9f9f9 | #060606; „heute“ eigene Tokens |
| Wizard | Header #fafafa, Marker/Track #d9d9d9 | #202223, #262626 |
| Chips, Star-BG, Popup-LOV-Chips, Badges | rgba(0,0,0,…) | rgba(255,255,255,…) |
| Radien | `--ut-component-border-radius: 0.125rem` | `2px` (gleich groß) |

**Dunkel-Lücken (in Vita-Dark unverändert hell/hart – im eigenen dunklen Style setzen):**

| Stelle | Wert | Quelle |
|---|---|---|
| Tooltip `.ui-tooltip` | #fff / #000 **[gemessen]** | `Std:410–413` |
| `.a-MenuBar` außerhalb Header | #f0f0f0 + weiße Schrift **[gemessen]** | `Std:193–200` |
| Switch aus | #8c8c8c, Knopf #fff | `Std:276–285` |
| Overlay | rgba(0,0,0,.25) | `Std:394` |
| Seitenmeldung Schließen-Knopf | #000 | `Core:8947` |
| Select-Pfeil | SVG #7A7A7A | `Std:155` |
| `.fa[class*=fam-]:after`, Button-Overlays | #fff | font-apex.css, `Dark:2284–2289` |
| Karussell-Pfeile/-Punkte | rgba(0,0,0,.5/.15/.4) (Fallbacks) | `Core:8617`, `8680` |
| Dialog-Buttonleiste | rgba(0,0,0,.025) | `Std` |
| File-Drop-Fortschritt | rgba(0,0,0,.1/.5) | `Std:145–146` |
| Menü-Scroll-Buttons, disabled-focused | rgba(0,0,0,…) | `Std` |
| IG-Spaltensteuerung u. ä. | #F4F4F4, #707070, #E0E0E0 … | `Std` (Grid-Abschnitt) |

Zusätzlich: `--ut-color-scheme: dark` (steuert `color-scheme` für native Controls, Scrollbars, `input[type=date]`) und `--ut-base-filter: invert(1)` (nur Login-Hintergrund) existieren nur in Vita-Dark. Unser dunkler Style soll deshalb auf **Vita-Dark.css** aufsetzen (vgl. `_docs/ut-tokens.md` §8.5).

---

## 9. Unterschiede UT 24.2 ↔ 26.1 (Komponenten)

Beide Testbetten laufen auf APEX 26.1 – **app_ui-Widgets (Menüs, Dialoge, Switch, Checkbox, Datepicker, Popup LOV, Select One …) sind in beiden identisch**. Unterschiede kommen nur aus `themes/theme_42/<ver>/css/Core.css` und `Vita*.css`:

| Bereich | 24.2 | 26.1 | Konsequenz |
|---|---|---|---|
| Button-Zähler `[data-count]` | fehlt (Attribut ohne Wirkung) **[Screenshot `gal-buttons-Vita-9242.png`]** | Badge per `:after`, `--a-button-count-*` | Styling nur für 26.1 relevant, harmlos in 24.2 |
| Icon-Farbe im Button | – | Hook `--a-button-icon-color` | |
| `.t-InlineActions*`, `.t-Button--noTop/…` | – | vorhanden | |
| Karussell | Header standardmäßig **ausgeblendet** (`.t-Region--carousel:not(.t-Region--hideHeader) > .t-Region-header { display:none }`) | Header sichtbar | Karussell-Layout versionsabhängig |
| Region | – | `--visibleOverflow`, `.a-FlexContainer > .t-Region` | |
| Feldrahmen-Stil | Core: `border-style: solid` literal; Vita `:root` setzt **`--a-field-input-border-style: dashed`** (ungenutzt) | Core: `var(--a-field-input-border-style, solid)`, Vita `solid` | **Wer den Token selbst konsumiert, erbt in 24.2 „dashed“** → im Theme immer explizit `--a-field-input-border-style: solid` setzen |
| Floating Label Hover | `var(--a-field-input-hover-background-color, transparent)` | ohne Fallback | |
| Platzhalter | `::-webkit-input-placeholder { color: inherit }` | `::placeholder` mit `--a-field-placeholder-*` | Platzhalter-Tokens nur 26.1 |
| Einzel-Checkbox | Label-Container sichtbar | `.apex-item-wrapper--single-checkbox .t-Form-labelContainer { display:none }` | |
| Seitenmeldung | – | `.a-Button--notification` zurückgesetzt (`currentColor`, transparent) | |
| Badge | – | `--rounded`, `:has(.t-Badge-value:empty)` | |
| Datepicker „Heute“ | `--a-button-text-color: #0677e1` (hart) | `color: var(--ut-link-text-color)` | |
| Dialog-/Drawer-Regionen | – | `.t-DialogRegion-footer`, Drawer von oben/unten | |
| Tabs Region | – | Icon-Regeln mit `:has()` | |
| Avatare | – | Gruppierung `.t-Avatar-group*` | |

Die **Hook-Listen** der Kern-Komponenten sind bis auf Avatar-Gruppen, Button-Zähler und `--ut-badge-rounded-border-radius` identisch (`diff hooks-24.2.txt hooks-26.1.txt`). Die harten Vita-Blöcke (Hot, Status-Buttons, Checkbox, Feld-Fokus, Menü) sind in beiden Versionen gleich (24.2: `Vita:2083ff`, `1873`, `1880`, `1098`).

---

## 10. Rezept: verifizierte Hebel für einen eigenen Style

Getestet mit `_tmp/research/utc/lever-test.css` (per `addStyleTag` **nach** Vita geladen, also wie unser Bundle) auf 1201/1306/1601 in 9042 sowie Galerien + Formular-Sonde in 9242 (gleiches Ergebnis, `gal-*-9242-lever.png`, `specs/lever-242.json`); Bilder `gal-*-Vita-9042-lever.png`, `lever-forms-Vita-9042.png`, `lever-menu-Vita-9042.png`, `lever-selectone-Vita-9042.png`.

**Hat gewirkt [gemessen]**

```css
:root {
  --ut-palette-primary: #7c3aed; --ut-palette-primary-contrast: #fff; --ut-palette-primary-shade: #f3eefe;
  --ut-link-text-color: #6d28d9;            /* Tabs, RDS, Links, Link-Buttons */
  --ut-focus-outline-color: #7c3aed;
  --ut-component-border-radius: 12px;       /* Region, Tabs-Pill, Dialoge */
  --ut-region-border-color: rgba(15,23,42,.08);       /* Hook */
  --ut-region-box-shadow: 0 1px 2px rgba(15,23,42,.06), 0 12px 24px -16px rgba(15,23,42,.25);
  --ut-region-header-padding-y: 1rem; --ut-region-header-padding-x: 1.25rem;  /* Hooks */
  --ut-region-header-border-color: transparent;       /* Header-Trennlinie weg */
  --a-button-border-radius: 999px; --a-button-padding-x: 1rem;
  --a-button-background-color: #eef0f3; --a-button-border-color: transparent; --a-button-shadow: none;
  --a-button-hover-background-color: #e2e5ea; --a-button-hover-border-color: transparent; --a-button-hover-shadow: none;
  --a-field-input-border-radius: 10px; --a-field-input-background-color: #fff;
  --a-field-input-focus-border-color: #7c3aed;        /* hart in Vita → hier explizit */
  --a-checkbox-checked-background-color: #7c3aed; --a-checkbox-border-radius: 6px;
  --a-menu-focused-background-color: #f3eefe; --a-menu-focused-text-color: #4c1d95;
  --a-menu-padding-x: .375rem; --a-menu-item-border-radius: .5rem;
  --ut-button-region-border-radius: 12px;
  --ut-alert-horizontal-border-radius: 12px; --ut-alert-wizard-border-radius: 12px;
  --jui-dialog-border-radius: 16px;
  --jui-tooltip-background-color: #111827; --jui-tooltip-text-color: #fff;
  --jui-tooltip-border-color: transparent; --jui-tooltip-border-radius: 8px;
}
.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot,
.apex-button-group input:checked + label,
.t-Form-fieldContainer--radioButtonGroup .apex-item-group--rc input:checked + label {
  --a-button-background-color: #7c3aed; --a-button-text-color: #fff;
  --a-button-hover-background-color: #6d28d9; --a-button-active-background-color: #5b21b6;
  --a-button-focus-background-color: var(--a-button-hover-background-color);
}
.t-Wizard { border-radius: 12px; overflow: clip; }
```

Ergebnis: Regionen, Collapsibles, Hero-Icon, Button Container, Alerts, alle Buttons (inkl. Radio-Pills, `a-Button--hot`, Confirm-OK), Felder inkl. Popup-LOV-Buttonecken, Checkbox/Radio, Switch, Datepicker (Auswahl/Heute), Prozentbalken, Map-Marker, Menüs und Tooltips folgen.

**Blieb hart (noch zu überschreiben)** – gleiche Selektoren wie in Vita.css, am besten mit `var(--ut-palette-*)`:

```css
/* Hot-Stile (Vita:2106–2141) – analog für --primary, --success, --warning, --danger */
.t-Button--hot.t-Button--simple, .a-Button--hot.t-Button--simple, .ui-button--hot.t-Button--simple,
.a-CardView-button--hot.t-Button--simple, .apex-button-group input:checked + label.t-Button--simple,
.t-Form-fieldContainer--radioButtonGroup .apex-item-group--rc input:checked + label.t-Button--simple {
  --a-button-border-color: var(--ut-palette-primary); --a-button-background-color: transparent;
  --a-button-text-color: var(--ut-palette-primary-text); --a-button-hover-text-color: var(--ut-palette-primary-contrast);
}
/* …--link: --a-button-text-color; …--noUI: --a-button-text-color UND color (Eigenschaft!) */
.t-Button--hot .fa:after, .t-Button--simple.t-Button--hot:hover .fa:after { background-color: var(--ut-palette-primary); }
:root { --a-button-count-background-color: var(--ut-palette-primary); }   /* 26.1 */
/* --primary (Alt-Blau #9ccefd), Statusbuttons: siehe 4.4 */
```

**Weitere Hebel mit hoher „Nicht-APEX“-Wirkung**

| Ziel | Hebel |
|---|---|
| Größere, luftigere Felder | `--a-field-input-padding-y/-x`, `--a-field-input-font-size`, `--a-field-input-line-height`; bei Floating Labels lokale Werte in `.t-Form-fieldContainer--floatingLabel` (`Core:16109`) mitziehen |
| Labels nicht rechtsbündig | `.t-Form-labelContainer { text-align: start }` (Selektor, kein Token) |
| Pflicht-Kennzeichnung | `.t-Form-fieldContainer.is-required .t-Form-label:before` (Glyphe/Farbe), Floating-Dreieck `.t-Form-itemRequired-marker:before` |
| Fehlerseite nicht gelb | `.t-Alert--page.t-Alert--warning { --ut-alert-type-background-color…; --ut-alert-type-text-color… }`, Schließen-Knopf `.t-Alert--page .t-Button.t-Button--closeAlert` |
| Tabs/RDS moderner | `--ut-tabs-item-active-background-color`, `--ut-tabs-item-hint-highlight-width`, `--ut-tabs-item-hover-background-color` (alles Hooks) |
| Content Blocks & Dialoge rund | `:root { --ut-region-border-radius: … }` (wirkt auf Region, Content Block, `--jui-dialog-border-radius`) |
| Links-Liste mit Hover-Fläche | `--ut-linkslist-hover-background-color` |
| Karussell dunkel/hell | `--ut-carousel-button-*`, `--ut-carousel-nav-*` |
| Einheitlicher Fokus | `--ut-focus-outline`, `--ut-focus-outline-offset` (Hooks) |

**Allgemeine Fallstricke**

1. `:root`-Tokens erreichen keine komponentenlokal gesetzten Variablen (Art B) – Vita-Selektoren **vollständig** übernehmen.
2. Theme-Roller-Ausgabe (`theme_roller_output_file_url`) lädt **nach** unserem Bundle und überschreibt die Theme-Roller-Tokens (Palette, Link, Fokus, Radien Container/Buttons/Formulare, Region-/Menü-/Feldfarben, Tabelle in `Vita.css`-Kommentaren `"var": "$g_…"`).
3. Page-Dialog-Inhalte sind eigene Dokumente – das Theme muss dort ebenfalls greifen (tut es, wenn der Style app-weit gilt); Chrome und Inhalt getrennt testen.
4. CKEditor-Variablen auf `body` setzen, nicht auf `:root`.
5. Radius-Tokens sind verteilt (Abschnitt [2.3](#23-radius-landkarte)); Wizard braucht eine echte Regel.
6. Dunkler Style: Lücken aus [8](#8-vita-vs-vita-dark-aus-komponentensicht) explizit schließen.
7. 24.2: `--a-field-input-border-style` nicht ungeprüft konsumieren; `data-count`/Platzhalter-Tokens wirken dort nicht.

---

## 11. Anhang: Screenshots und Skripte

Alle unter `_tmp/research/utc/` (nicht versioniert). Dateiname `<name>-<Style>-<App>.png`.

| Thema | Dateien |
|---|---|
| Basisseiten (Vita, voll) | `9042-1201-base.png`, `9042-1500-base.png`, `9042-1601-base.png`, `forms-1600-Vita-9042.png` |
| Galerien | `gal-buttons-*`, `gal-regions-*`, `gal-alerts-*` jeweils `Vita-9042`, `Vita-Dark-9042`, `Vita-9242` (Buttons/Regions), `…-lever` (Hebeltest) |
| Formulare | `form-errors-Vita[-Dark]-9042.png`, `floating-idle-Vita-9042.png`, `floating-focus-Vita-9042.png`, `lever-forms-Vita-9042.png` |
| Meldungen | `page-notification-Vita[-Dark]-9042.png`, `page-success-Vita[-Dark]-9042.png` |
| Menüs | `menu-popup-Vita[-Dark]-9042.png`, `menubar-Vita[-Dark]-9042.png`, `lever-menu-Vita-9042.png` |
| Dialoge/Popups | `inline-dialog-*`, `inline-popup-*`, `page-dialog-*`, `confirm-*`, `popuplov-*`, `datepicker-popup-*`, `selectone-popup-*`, `lever-selectone-*`, `dlg-radius-noclip-Vita-9042.png`, `dlg-radius-clip-Vita-9042.png` |
| Tooltip | `tooltip-Vita[-Dark]-9042.png` |
| Regionen einzeln | `tabs-1907-*`, `rds-1923-*`, `carousel-1205-*`, `wizard-1208-*`, `titlebar-1207-*` |
| Kleinteile | `linkslist-1303-*`, `badges-3002-*`, `avatars-3001-*`, `focus-buttons-Vita-9042.png` |

| Skript | Zweck |
|---|---|
| `utc/probe.mjs <spec.json>` | Seite öffnen, Style tauschen, Schritte (`js`, `click`, `focus`, `key`, `hover`, `wait`, `cssFile`, `computed` inkl. `pseudo`, `vars`, `html`, `shot`) |
| `utc/gallery.mjs <buttons\|regions\|alerts> [Vita\|Vita-Dark] [app]` | UT-Markup-Galerie auf Seite 1201; `INJECT=<css>`, `TAG=<suffix>` |
| `utc/dom.mjs '{"<seite>":["<selektor>"]}'` | gekürztes outerHTML + Head-Links |
| `utc/classes.mjs <seiten> <regex>` | vorkommende Klassen je Seite |
| `utc/hooks.mjs [ut-26.1\|ut-24.2]` | konsumierte vs. definierte Variablen je Komponente (`hooks-*.txt`) |
| `utc/specs/*.json` | die verwendeten Sonden (Formulare, Popups, Overlays, Fokus, Hebeltest …) |
| `utc/lever-test.css` | Hebeltest-CSS aus Abschnitt 10 |
