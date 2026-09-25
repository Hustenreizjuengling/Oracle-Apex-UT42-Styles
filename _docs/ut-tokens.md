# Universal Theme – Landkarte der CSS Custom Properties

> UT-Dateiversionen **26.1** (Referenz) und **24.2** (Vergleich), APEX-Runtime 26.1. Stand: 2026-09-23.
> Maschinenlesbar: [`ut-tokens.json`](ut-tokens.json) (alle 1742 definierten Variablen + 1776 Hooks, inkl. Abhängigkeiten).

**Legende der Flags:** ◆ Kern-Hebel · ◇ Feinschliff-Hebel · TR = im Theme Roller editierbar · ★26 = nur in UT 26.1 definiert · ☆26 = wirkt nur mit UT 26.1 (in 24.2 unreferenziert) · L = nur lokal in Komponenten-Selektoren gesetzt (nicht auf :root) · D = nur in Vita-Dark auf :root gesetzt · ∅ = in keiner geladenen CSS-Datei referenziert · H = Hook (nirgends definiert, nur mit Fallback referenziert).

**Zählweise „Refs“:** Anzahl der `var(--name…)`-Vorkommen in app_ui/Core.css + app_ui/Theme-Standard.css + UT Core.css + Vita.css (26.1, Kommentare entfernt). Werte „Vita“/„Vita-Dark“ = :root-Wert nach Kaskade (so wie geschrieben); hinter → der zur Laufzeit per `getComputedStyle(:root)` gemessene, aufgelöste Wert (App 9042).

## Inhalt

1. [Kurzfassung](#1-kurzfassung)
2. [Lade-Reihenfolge und Kaskade](#2-lade-reihenfolge-und-kaskade)
3. [Zahlen](#3-zahlen)
4. [Token-Architektur und Abhängigkeiten](#4-token-architektur-und-abhängigkeiten)
5. [Hebel-Variablen](#5-hebel-variablen)
6. [Accent-/Farbklassen-Systematik](#6-accent-farbklassen-systematik)
7. [Abgleich mit Seite 6307 „CSS Variables“](#7-abgleich-mit-seite-6307-css-variables)
8. [Fallstricke](#8-fallstricke)
9. [Unterschiede UT 24.2 ↔ 26.1](#9-unterschiede-ut-242--261)
10. [Vollständige Tabellen nach Bereich](#10-vollständige-tabellen-nach-bereich)
11. [Hooks (referenziert, nie definiert)](#11-hooks-referenziert-nie-definiert)
12. [Methode und Reproduktion](#12-methode-und-reproduktion)

## 1. Kurzfassung

- **1742 Custom Properties** werden in den fünf Kern-Dateien (app_ui Core/Theme-Standard, UT Core, Vita, Vita-Dark, Iris) definiert; davon 1133 auf `:root` im Vita-Set, 590 nur lokal in Komponenten-Selektoren. Zusätzlich gibt es **1776 Hooks** – Variablen, die nur mit Fallback referenziert, aber nie definiert werden (z. B. `--ut-region-border-color`, `--a-base-font-weight-bold`).
- **Vita.css ist fast nur ein Token-Set:** 796 von 870 Variablen stehen auf `:root`; die Komponenten-CSS liegt in UT Core.css (1.691 verschiedene referenzierte Variablen) und app_ui Core.css (1.765).
- **Drei Namensräume:** `--a-*` = APEX-UI-Kern (Widgets aus app_ui: Buttons, Felder, Menüs, IG/IR, Cards, Date Picker …), `--ut-*` = Universal-Theme-Layout/Komponenten, `--u-color-*` = Akzentpalette. UT Core.css verdrahtet beide Welten auf `:root` (`--a-palette-primary: var(--ut-palette-primary)` usw.).
- **Der größte Hebel** ist die Familie `--ut-component-*` (18 Variablen, offiziell auf Seite 6307 dokumentiert) plus `--ut-palette-*`: sie dienen als Fallback für Regionen, Alerts, Reports, Dialoge, Date Picker, Faceted Search usw.
- **Wichtigster Fallstrick:** Vita ist aus SASS kompiliert – die Primärfarbe `#056AC8` steht in 24 Deklarationen von Vita.css als Hex-Kopie (Header, Menü-Fokus, Checkbox, Feld-Fokus, Cards-Icon, Hot-Button …). Wer nur `--ut-palette-primary` ändert, bekommt ein halb umgefärbtes Theme. Die Button-Varianten (hot/primary/success/warning/danger) sind **nur** über Selektor-Overrides erreichbar.
- **Hell/Dunkel** wird ausschließlich über den Theme Style geschaltet (keine `prefers-color-scheme`-Regel in UT/app_ui). Vita-Dark ändert 147 :root-Werte gegenüber Vita und setzt 31 zusätzliche (Markdown, Prism, Date-Picker „current“, Chat …) sowie `--ut-color-scheme: dark`.
- **24.2 vs. 26.1:** keine Variable existiert nur in 24.2; 21 Variablen sind neu in 26.1 (u. a. `--a-button-count-*`, `--ut-component-pre-background-color`, `--a-combo-select-focus-*`), 9 wirken nur mit 26.1, dazu 118 neue Hooks (Metric Card, Group-Header, `--u-space-*`). Ein Theme, das nur die gemeinsamen Tokens nutzt, funktioniert in beiden Versionen.
- Die ~102 Kern-Hebel (◆) und 79 Feinschliff-Hebel (◇) sind in [Abschnitt 5](#5-hebel-variablen) mit Abhängigkeiten gelistet; [Abschnitt 8](#8-fallstricke) nennt alles, was sich *nicht* über :root-Tokens umstellen lässt.

## 2. Lade-Reihenfolge und Kaskade

Per Harness verifiziert (App 9042, Seite 1101; App 9242 identisch mit Pfad `theme_42/24.2`):

| # | Stylesheet | Rolle für Tokens |
|---|---|---|
| 1 | `/i/app_ui/css/Core.min.css` | app_ui Core.css – Widget-CSS (Buttons, Felder, IG/IR, Menüs, Dialoge, Date Picker …); definiert fast nur lokale Variablen (CKEditor-Farben auf :root); **konsumiert** 1.765 verschiedene Variablen |
| 2 | `/i/app_ui/css/Theme-Standard.min.css` | app_ui Theme-Standard.css – **Default-Werte der `--a-*`-Tokens** auf :root (353), inkl. `--a-palette-color-N = var(--u-color-N, Hex)`; @media für reduced-motion/-transparency |
| 3 | `/i/libraries/font-apex/2.5.1/css/font-apex.min.css` | font-apex – setzt nur `--a-icon-size` pro `.fa`-Größenklasse |
| 4 | `/i/themes/theme_42/26.1/css/Core.min.css` | UT Core.css – Breakpoints `--js-mq-*`, Typo-Skala `--ut-text-*`, Brücke `--a-palette-* → --ut-palette-*`, `--a-base-font-family`; `color-scheme: var(--ut-color-scheme, normal)`; 28 CKEditor-Variablen auf `body` |
| 5 | `/i/themes/theme_42/26.1/css/Vita.min.css` | Vita.css bzw. Vita-Dark.css – **alle Stilwerte** (`--ut-*` + Überschreibungen der `--a-*`) auf :root, Button-Varianten und Card-Stile lokal |
| 6 | `/ords/r/hr_dev/9042/files/static/v2461168005138/themelab/theme.min.css` | eigenes Theme-Bundle (Labor: `themelab/theme.min.css`) – überschreibt :root-Tokens (gleiche Spezifität, später geladen → gewinnt) |

Auf Seiten mit JET-Komponenten (Charts, Gantt) wird zusätzlich **vor** app_ui `/i/libraries/oraclejet/20.0.2/css/libs/oj/20.0.2/redwood/oj-redwood-notag-min.css` geladen; es konsumiert die 33 `--oj-*`-Variablen, die Vita setzt (verifiziert auf Seite 1902).

**Regeln, die sich daraus ergeben**

- Alle Token-Blöcke stehen auf `:root` (Spezifität 0,1,0). Ein später geladenes Bundle mit `:root { … }` gewinnt ohne `!important`.
- Werte, die in einem Komponenten-Selektor gesetzt werden (z. B. `.t-Button--hot { --a-button-background-color: #056AC8 }`), gelten für dieses Element direkt und schlagen jeden :root-Wert (Vererbung verliert gegen direkte Deklaration). Solche Stellen müssen per Selektor überschrieben werden (Liste in Abschnitt 8).
- `body`-Deklarationen (UT Core: `--ck-*`) überdecken :root für alles unterhalb von body → Overrides dort ebenfalls auf `body` setzen.
- Die app_ui-Dateien kommen aus der **APEX-Runtime** (hier 26.1), nicht aus der UT-Version. In App 9242 (UT 24.2) laufen daher app_ui 26.1 + UT Core/Vita 24.2.

## 3. Zahlen

| Datei | Deklarationen `--*` | davon :root (verschieden) | lokal gesetzte Variablen | verschiedene referenzierte Variablen | `var()`-Vorkommen |
|---|---:|---:|---:|---:|---:|
| `app_ui/css/Core.css` | 729 | 15 | 260 | 1765 | 3778 |
| `app_ui/css/Theme-Standard.css` | 369 | 353 | 9 | 99 | 153 |
| `ut-26.1/css/Core.css` | 1625 | 102 | 528 | 1691 | 4324 |
| `ut-26.1/css/Vita.css` | 1171 | 796 | 116 | 145 | 394 |
| `ut-26.1/css/Vita-Dark.css` | 1220 | 827 | 116 | 151 | 413 |
| `ut-26.1/css/Iris.css` | 1205 | 806 | 123 | 156 | 434 |
| `ut-24.2/css/Core.css` | 1600 | 99 | 520 | 1564 | 4114 |
| `ut-24.2/css/Vita.css` | 1161 | 785 | 116 | 144 | 390 |
| `ut-24.2/css/Vita-Dark.css` | 1210 | 816 | 116 | 150 | 409 |

**Nach Präfix** (definiert = in einer der 26.1-Dateien inkl. app_ui gesetzt; Hooks = nur referenziert):

| Präfix | definiert | davon :root (Vita) | Hooks | Herkunft |
|---|---:|---:|---:|---|
| `--a-*` | 895 | 686 | 865 | app_ui (APEX-UI-Kern), von UT/Vita überschrieben |
| `--ut-*` | 533 | 215 | 825 | Universal Theme |
| `--u-*` | 92 | 90 | 16 | UT-Akzentpalette |
| `--jui-*` | 57 | 44 | 36 | jQuery-UI-Widgets (Dialog, Tooltip, Date Picker alt) |
| `--ck-*` | 45 | 15 | 0 | CKEditor 5 |
| `--oj-*` | 33 | 32 | 0 | Oracle JET (Charts) |
| `--fc-*` | 29 | 5 | 0 | FullCalendar |
| `--prism-*` | 22 | 22 | 1 | Prism |
| `--fc3-*` | 0 | 0 | 23 | FullCalendar 3 (Legacy) |
| `--mg-*` | 11 | 2 | 5 | MapLibre |
| `--js-*` | 10 | 10 | 2 | Konstanten für theme42.js |
| `--ojet-*` | 8 | 8 | 0 | Oracle JET (APEX-Wrapper) |
| `--safe-*` | 4 | 4 | 0 | env(safe-area-inset-*) |
| `--fc5-*` | 1 | 0 | 2 | FullCalendar 5 |
| `--t-*` | 2 | 0 | 0 | Legacy (t-Avatar) |
| `--comboselect-*` | 0 | 0 | 1 | Tippfehler/Legacy |

## 4. Token-Architektur und Abhängigkeiten

### 4.1 Drei Ebenen

1. **app_ui-Defaults** (Theme-Standard.css): `--a-*` mit neutralen Werten, z. B. `--a-palette-primary: #0572CE`, `--a-field-input-border-width: 1px`, `--a-switch-checked-background-color: var(--a-palette-primary, #0572CE)`.
2. **UT-Brücke** (UT Core.css :root): `--a-palette-{primary|danger|warning|success|info}[-contrast|-shade] = var(--ut-palette-…)`, `--a-base-link-text-color = var(--ut-link-text-color)`, `--a-base-font-family`, Typo-Skala `--ut-text-*`.
3. **Style-Werte** (Vita.css): setzt `--ut-*` und überschreibt viele `--a-*` (Buttons, Felder, Menüs, Cards, IG, Date Picker, Chips …). Zwei Arten von Werten: (a) **Referenzen** auf Basistokens (`var(--ut-component-border-color)`) – folgen automatisch; (b) **kompilierte Literale** (Hex-Kopien aus SASS) – folgen *nicht*.

### 4.2 Muster „Basis → Variante → Zustand“ (app_ui Core.css, `.a-Button`)

```css
.a-Button, .u-Button {
  background-color: var(--a-button-state-background-color,
                    var(--a-button-type-background-color,
                    var(--a-button-background-color, transparent)));
  border-radius: var(--a-button-border-radius, 2px);
  box-shadow: var(--a-button-state-shadow, var(--a-button-type-shadow, var(--a-button-shadow, none)));
}
.a-Button:hover { --a-button-state-background-color: var(--a-button-hover-background-color); … }
.t-Button--simple { --a-button-type-background-color: transparent; --a-button-type-shadow: none; }   /* Vita.css */
```

Dasselbe Muster (`*-state-*` > `*-type-*` > Basis) nutzen Felder (`--a-field-input-state-*`), Cards (`--a-cv-state-*`, `--a-cv-type-*`), Chips, Filedrop, Alerts (`--ut-alert-type-*`) und Badges. **Konsequenz:** Für Hover/Aktiv/Fokus die Basistokens `--a-button-hover-*`, `--a-button-active-*`, `--a-button-focus-*` setzen – nie die `-state-`-Slots global.

### 4.3 Hook-Muster mit Fallback-Ketten (UT Core.css)

```css
.t-Region {
  border-color: var(--ut-region-border-color, var(--ut-component-border-color));       /* Hook → Basis */
  border-radius: var(--ut-region-border-radius, var(--ut-component-border-radius));
}
.t-Alert { background-color: var(--ut-alert-background-color, var(--ut-component-background-color)); }
```

Viele Komponenten-Variablen sind **nicht definiert** und fallen auf `--ut-component-*` zurück. Ein Theme kann sie gezielt auf :root setzen (z. B. `--ut-region-border-color`), um eine Komponente vom Rest zu entkoppeln. Welche Namen es gibt, steht in [Abschnitt 11](#11-hooks-referenziert-nie-definiert) bzw. im JSON (`hooks`).

### 4.4 Abhängigkeiten der Kern-Tokens

„Direkt abgeleitet“ = :root-Variablen, deren Vita-Wert `var(--X)` enthält. „Fallback für“ = Variablen/Hooks, die `--X` im Fallback nutzen (`var(--Y, var(--X))`). „Reichweite“ = Refs der Variable + Refs aller transitiv abgeleiteten Variablen.

| Token | Refs | Reichweite | direkt abgeleitet (Vita :root) | Fallback für (Auswahl) |
|---|---:|---:|---|---|
| `--ut-palette-primary` | 30 | 128 | `--a-button-focus-border-color`, `--a-chat-user-primary-icon-background-color`, `--a-diagram-navigator-border-color`, `--a-diagram-route-active`, `--a-palette-primary`, `--a-percent-chart-bar-background-color`, `--oj-button-borderless-chrome-bg-color-hover`, `--oj-button-outlined-chrome-bg-color-hover`, `--oj-button-outlined-chrome-border-color-hover`, `--ut-component-icon-background-color`, `--ut-navtabs-item-active-highlight-color` | `--ut-report-pagination-link-hover-background-color`, `--ut-wp-active-background-color` |
| `--ut-palette-primary-contrast` | 10 | 39 | `--a-chat-user-primary-icon-text-color`, `--a-palette-primary-contrast`, `--a-percent-chart-bar-text-color`, `--oj-button-borderless-chrome-text-color-hover`, `--oj-button-outlined-chrome-text-color-hover`, `--ut-component-icon-color` | `--ut-report-pagination-link-hover-text-color` |
| `--ut-palette-primary-shade` | 4 | 26 | `--a-combo-select-item-selected-background-color`, `--a-palette-primary-shade`, `--a-percent-chart-background-color` | `--fc3-highlight-background-color` |
| `--ut-palette-danger` | 20 | 57 | `--a-chat-message-error-icon-color`, `--a-chat-user-secondary-icon-background-color`, `--a-diagram-route-faulted`, `--a-diagram-route-terminated`, `--a-palette-danger` | `--ut-timeline-type-removed-background-color` |
| `--ut-palette-success` | 15 | 23 | `--a-diagram-cell-highlight`, `--a-diagram-route-completed`, `--a-palette-success` | `--ut-timeline-type-is-new-background-color`, `--ut-wp-complete-background-color` |
| `--ut-palette-warning` | 9 | 19 | `--a-diagram-route-suspended`, `--a-palette-warning` | — |
| `--ut-palette-info` | 9 | 14 | `--a-diagram-route-waiting`, `--a-palette-info` | `--ut-timeline-type-updated-background-color` |
| `--ut-link-text-color` | 15 | 21 | `--a-base-link-text-color`, `--oj-link-text-color`, `--ut-tabs-item-active-text-color` | `--ut-tabs-item-text-color`, `--ut-configpanel-attr-value-text-color`, `--ut-linkslist-text-color`, `--ut-wp-link-color` |
| `--ut-focus-outline-color` | 26 | 29 | `--a-chat-transcript-outline-color`, `--a-combo-select-focus-outline-color`, `--oj-core-focus-border-color` | `--ut-focus-outline` |
| `--ut-component-background-color` | 31 | 45 | `--a-datepicker-calendar-background-color`, `--a-datepicker-footer-background-color`, `--a-diagram-background`, `--a-fs-chart-background-color`, `--jui-datepicker-background-color`, `--jui-dialog-background-color`, `--oj-collection-bg-color`, `--oj-collection-free-space-bg-color`, `--oj-collection-header-bg-color` | `--u-color`, `--ut-alert-type-background-color`, `--ut-badgelist-value-background-color`, `--ut-button-region-background-color`, `--ut-cardlist-background-color`, `--ut-login-region-background-color`, `--ut-metric-card-background-color`, `--ut-region-background-color` … (+6) |
| `--ut-component-border-color` | 70 | 124 | `--a-chat-message-input-border-color`, `--a-datepicker-calendar-day-hover-background-color`, `--a-fs-chart-border-color`, `--a-fs-control-seperator-border-color`, `--a-fs-filter-group-border-color`, `--a-gv-border-color`, `--a-menu-sep-border-color`, `--a-percent-chart-bar-border-color`, `--a-percent-chart-border-color`, `--a-report-controls-border-color`, `--a-report-controls-cell-label-border-color`, `--a-resultsitem-border-color` … (+9) | `--ut-badgelist-value-border-color`, `--ut-body-nav-border-color`, `--ut-cardlist-wrap-border-color`, `--ut-tabs-item-hint-highlight-color`, `--ut-wp-marker-color`, `--ut-wp-track-color`, `--fc3-header-border-color`, `--fc3-today-border-color` … (+22) |
| `--ut-component-border-width` | 33 | 76 | `--a-fs-chart-border-width`, `--a-fs-control-seperator-border-width`, `--a-fs-filter-group-border-width`, `--a-report-controls-border-width`, `--a-report-controls-cell-label-border-width`, `--a-toolbar-border-width`, `--jui-dialog-titlebar-border-width`, `--ut-component-inner-border-width` | `--ut-alert-border-width`, `--ut-avp-border-width`, `--ut-button-region-border-width`, `--ut-region-border-width`, `--ut-timeline-border-width`, `--ut-alert-type-border-width`, `--ut-badgelist-item-border-width`, `--ut-badgelist-value-border-width` … (+8) |
| `--ut-component-border-radius` | 18 | 36 | `--a-fs-chart-border-radius`, `--jui-dialog-border-radius` | `--a-field-input-border-radius`, `--ut-alert-border-radius`, `--ut-region-border-radius`, `--fc3-toolbar-border-radius`, `--ut-alert-type-border-radius`, `--ut-cardlist-border-radius` |
| `--ut-component-inner-border-color` | 33 | 38 | `--a-datepicker-footer-border-color`, `--a-toolbar-sep-border-color` | `--ut-report-cell-border-color`, `--a-bar-chart-item-border-color`, `--ut-avp-border-color`, `--ut-cardlist-body-border-border-color`, `--ut-comment-item-border-color`, `--ut-cr-item-border-color`, `--ut-linkslist-item-border-color`, `--ut-linkslist-separator-border-border-color` … (+8) |
| `--ut-component-text-default-color` | 35 | 43 | `--jui-dialog-text-color`, `--oj-core-text-color-primary`, `--ut-component-badge-text-color`, `--ut-tabs-item-text-color` | `--u-color-contrast`, `--ut-alert-type-text-color`, `--ut-button-region-text-color`, `--ut-comment-chat-text-color`, `--ut-region-header-text-color`, `--ut-region-text-color`, `--fc3-day-number-text-color`, `--fc3-header-text-color` … (+11) |
| `--ut-component-text-title-color` | 19 | 22 | `--a-chat-title-color`, `--a-filedrop-heading-text-color`, `--jui-dialog-titlebar-text-color`, `--oj-heading-text-color` | `--ut-breadcrumb-item-active-text-color`, `--ut-hero-region-title-text-color`, `--ut-medialist-title-text-color`, `--fc3-toolbar-title-text-color`, `--ut-avp-label-text-color`, `--ut-badgelist-label-text-color`, `--ut-cardlist-title-text-color`, `--ut-cr-title-text-color` … (+3) |
| `--ut-component-text-muted-color` | 45 | 57 | `--a-chat-item-inline-status-text-color`, `--a-datepicker-calendar-header-text-color`, `--a-datepicker-calendar-week-text-color`, `--a-filedrop-text-color`, `--a-fs-filter-group-label-text-color`, `--a-gv-nodata-message-text-color`, `--a-help-dialog-code-text-color`, `--a-map-legend-title-text-color`, `--a-resultsitem-misc-text-color`, `--a-searchresults-pagination-color`, `--oj-core-text-color-secondary` | `--ut-breadcrumb-item-text-color`, `--ut-hero-region-content-text-color`, `--ut-linkslist-arrow-color`, `--jui-datepicker-header`, `--ut-cardlist-info-color`, `--ut-comment-info-color`, `--ut-contextualinfo-label-text-color`, `--ut-cr-desc-actions-text-color` … (+13) |
| `--ut-component-toolbar-background-color` | 14 | 19 | `--a-datepicker-background-color`, `--a-datepicker-calendar-week-background-color` | `--ut-resultsregion-search-background-color`, `--fc3-header-background-color`, `--fc3-today-highlight-background-color`, `--ut-cr-group-header-background-color`, `--ut-lv-divider-background-color` |
| `--ut-component-icon-background-color` | 9 | 9 | — | `--u-color`, `--ut-treeview-badge-background-color`, `--ut-app-icon-background-color`, `--ut-cardlist-icon-background-color`, `--ut-comment-icon-background-color`, `--ut-hero-region-icon-background-color`, `--ut-medialist-icon-background-color`, `--ut-timeline-icon-background-color` |
| `--ut-component-badge-background-color` | 18 | 18 | — | `--ut-badge-background-color`, `--ut-content-block-shadow-background-color`, `--ut-linkslist-badge-background-color`, `--ut-medialist-badge-background-color`, `--ut-megamenu-badge-background-color` |
| `--ut-shadow-sm` | 11 | 21 | `--a-menu-callout-shadow`, `--oj-core-box-shadow`, `--ut-alert-box-shadow`, `--ut-button-region-box-shadow`, `--ut-cardlist-box-shadow`, `--ut-header-box-shadow`, `--ut-region-box-shadow` | `--ut-wizard-box-shadow` |
| `--ut-shadow-lg` | 5 | 13 | `--jui-dialog-shadow`, `--mg-popup-content-box-shadow`, `--ut-component-box-shadow`, `--ut-login-region-box-shadow` | — |
| `--ut-body-background-color` | 8 | 12 | `--a-chat-background`, `--a-chat-body-background-color`, `--a-chat-client-background-color`, `--a-chat-title-background`, `--a-chat-view-more-button-background-color`, `--a-diagram-element-background-color` | — |
| `--ut-body-text-color` | 9 | 12 | `--a-chat-user-primary-text-color`, `--a-chat-user-secondary-text-color`, `--a-diagram-element-text-color` | — |
| `--ut-body-title-text-color` | 4 | 7 | `--ut-breadcrumb-item-active-text-color`, `--ut-hero-region-title-text-color` | `--ut-body-info-text-color` |
| `--ut-region-background-color` | 5 | 15 | `--a-diagram-background`, `--jui-dialog-background-color` | `--ut-region-header-background-color`, `--ut-wizard-background-color` |
| `--ut-region-header-background-color` | 3 | 20 | `--a-gv-header-background-color`, `--a-toolbar-background-color` | — |
| `--ut-region-border-color` (H) | 10 | 10 | — | `--ut-region-header-border-color`, `--ut-resultsregion-search-border-color`, `--ut-resultsregion-count-border-color` |
| `--ut-region-border-radius` (L) | 8 | 26 | `--a-fs-chart-border-radius`, `--jui-dialog-border-radius` | `--ut-content-block-border-radius` |
| `--a-button-border-color` | 20 | 24 | `--a-fs-search-container-border-color`, `--a-fs-toggle-border-color`, `--a-gv-pagination-button-border-color`, `--jui-dialog-title-close-border-color` | `--a-button-state-border-color`, `--a-button-type-border-color`, `--ut-footer-top-border-color` |
| `--a-button-background-color` | 18 | 19 | `--a-fs-toggle-background-color` | `--a-button-state-background-color`, `--a-button-type-background-color`, `--ut-footer-top-background-color` |
| `--a-button-text-color` | 22 | 26 | `--a-fs-toggle-text-color`, `--a-gv-pagination-button-text-color` | `--a-button-state-text-color`, `--a-button-type-text-color`, `--ut-footer-top-text-color` |
| `--a-button-hover-background-color` | 26 | 35 | `--a-button-focus-background-color`, `--a-gv-pagination-button-hover-background-color` | `--a-button-active-background-color`, `--a-button-state-background-color` |
| `--a-field-input-border-color` | 41 | 47 | `--a-chip-border-color`, `--a-filedrop-border-color`, `--a-mdeditor-border-color`, `--a-popuplov-chip-border-color`, `--a-report-controls-input-border-color`, `--oj-text-field-border-color` | `--a-chip-border-color`, `--a-chip-state-border-color`, `--a-chip-type-border-color`, `--a-combo-select-state-border-color`, `--a-datepicker-footer-border-color`, `--a-datepicker-header-border-color`, `--a-datepicker-monthpicker-select-border-color`, `--a-datepicker-timepicker-select-border-color` … (+8) |
| `--a-field-input-background-color` | 23 | 24 | `--a-mdeditor-background-color`, `--oj-text-field-bg-color` | `--a-datepicker-monthpicker-select-background-color`, `--a-datepicker-timepicker-select-background-color`, `--a-field-input-state-background-color`, `--ut-prepost-background-color` |
| `--a-field-input-focus-border-color` | 15 | 19 | `--a-filedrop-focus-border-color`, `--a-mdeditor-focus-border-color`, `--a-report-controls-input-focus-border-color` | — |
| `--a-menu-background-color` | 13 | 14 | `--a-menu-callout-background-color`, `--oj-popup-bg-color` | — |
| `--a-menu-text-color` | 18 | 30 | `--a-menu-accel-text-color`, `--a-menu-default-text-color` | `--a-combo-select-item-state-text-color`, `--a-menu-default-text-color`, `--a-combo-select-item-text-color`, `--a-combo-select-item-type-text-color`, `--a-combobox-comboselect-item-text-color` |
| `--a-menu-focused-background-color` | 13 | 19 | `--a-iconlist-item-hover-background-color`, `--a-menu-expanded-background-color`, `--a-menu-scroll-button-active-background-color`, `--oj-core-bg-color-hover` | — |
| `--a-base-font-family` | 7 | 7 | — | `--ut-base-font-family` |
| `--a-base-font-weight-bold` (H) | 73 | 73 | — | `--a-field-display-font-weight`, `--a-filedrop-heading-font-weight`, `--a-addresslist-line1-font-weight`, `--a-alert-message-title-font-weight`, `--a-comboselect-group-label-font-weight`, `--a-fs-item-highlight-font-weight`, `--a-gv-header-cell-font-weight`, `--a-md-h4-font-weight` … (+6) |
| `--a-palette-primary` | 55 | 69 | `--a-datepicker-calendar-day-selected-background-color`, `--a-datepicker-calendar-day-selected-border-color`, `--a-dev-toolbar-ui-selector-border-color`, `--a-filedrop-dragging-border-color`, `--a-starrating-stars-fg-color`, `--a-switch-checked-background-color`, `--ut-palette-primary-text` | `--a-cv-focus-border-color`, `--a-datepicker-calendar-day-current-background-color`, `--a-datepicker-calendar-day-current-border-color`, `--a-datepicker-calendar-day-current-text-color`, `--a-datepicker-calendar-day-selected-background-color`, `--a-datepicker-calendar-day-selected-border-color`, `--a-dev-headingoverlay-color`, `--a-dev-landmarkoverlay-color` … (+10) |
| `--a-palette-primary-shade` | 19 | 20 | `--a-filedrop-dragging-background-color` | `--a-datepicker-calendar-day-current-background-color`, `--a-datepicker-calendar-day-current-border-color`, `--a-iconlist-item-selected-background-color`, `--a-cv-selected-background-color`, `--a-gv-header-selected-background-color`, `--a-gv-selected-background-color`, `--ut-comment-item-selected-background-color`, `--ut-cr-item-selected-background-color` … (+3) |

### 4.5 Theme-Roller-Variablen (Vita.css)

Vita.css enthält JSON-Metadaten für den Theme Roller direkt vor den zugehörigen :root-Blöcken. Diese 205 Variablen sind die „offiziellen“ Stellschrauben – ein guter Startpunkt für die Hebel, aber **nicht vollständig** (z. B. fehlen Schatten, Schriften, Button-Varianten als Tokens).

| Theme-Roller-Gruppe / Untergruppe | LESS-Variable(n) | CSS-Variablen |
|---|---|---|
| GLOBAL_COLORS | `$g_Accent-BG`, `$g_Accent-OG` | `--ut-palette-primary`, `--ut-palette-primary-contrast`, `--ut-palette-primary-shade`, `--ut-palette-primary-text` |
| GLOBAL_COLORS | `$g_Link-Base` | `--ut-link-text-color` |
| GLOBAL_COLORS | `$g_Focus` | `--ut-focus-outline-color` |
| CONTAINERS | `$g_Container-BorderRadius` | `--ut-component-border-radius` |
| CONTAINERS / HEADER | `$g_Header-BG`, `$g_Header-FG` | `--ut-header-background-color`, `--ut-header-text-color` |
| CONTAINERS / BODY | `$g_Body-BG`, `$g_Body-Text` | `--ut-body-background-color`, `--ut-body-text-color` |
| CONTAINERS / ACTIONS_COLUMN | `$g_Actions-Col-BG`, `$g_Actions-Col-Text` | `--ut-body-actions-background-color`, `--ut-body-actions-text-color`, `--ut-body-actionstoggle-background-color`, `--ut-body-actionstoggle-hover-background-color` |
| CONTAINERS / TITLE_BAR | `$g_Body-Title-BG`, `$g_Body-Title-FG` | `--ut-body-title-background-color`, `--ut-body-title-text-color`, `--ut-breadcrumb-item-text-color` |
| CONTAINERS / LEFT_COLUMN | `@l_Left-Col-BG`, `@l_Left-Col-Text` | `--ut-body-sidebar-background-color`, `--ut-body-sidebar-text-color` |
| NAVIGATION / BODY | `$g_Nav-BG`, `$g_Nav-FG` | `--ut-body-nav-background-color`, `--ut-body-nav-text-color`, `--ut-body-nav-scrollbar-thumb-background-color`, `--ut-body-nav-scrollbar-track-background-color`, `--ut-navtabs-background-color`, `--ut-navtabs-text-color`, `--ut-navtabs-item-border-color`, `--ut-navtabs-item-active-background-color`, `--ut-navtabs-item-hover-background-color`, `--ut-header-menubar-background-color`, `--ut-header-menubar-item-text-color`, `--ut-header-menubar-item-current-background-color`, `--ut-header-menubar-item-current-text-color`, `--ut-header-menubar-item-hover-background-color`, `--ut-header-menubar-item-hover-text-color`, `--ut-header-menubar-item-border-color`, `--ut-header-menubar-item-split-icon-color`, `--ut-header-menubar-item-split-border-color` |
| NAVIGATION / SELECTED_STATE | `$g_Nav-Active-BG`, `$g_Nav-Active-FG` | `--a-treeview-node-selected-background-color`, `--a-treeview-node-selected-text-color`, `--a-treeview-node-focused-background-color`, `--a-treeview-node-focused-text-color` |
| NAVIGATION / ICON | `$g_Nav-Icon`, `$g_Nav-Icon-Active` | `--a-treeview-node-selected-icon-color`, `--a-treeview-node-icon-color` |
| NAVIGATION / BADGE | `@g_Nav-Badge-BG`, `@g_Nav-Badge-FG` | `--ut-treeview-badge-background-color`, `--ut-treeview-badge-text-color` |
| NAVIGATION / MENU | `$g_NavBarMenu-BG`, `$g_NavBarMenu-FG` | `--a-menu-background-color`, `--a-menu-text-color`, `--a-menu-default-text-color`, `--a-menu-accel-text-color` |
| NAVIGATION / MENU_ITEM_HOVER | `$g_NavBarMenu-Active-BG`, `$g_NavBarMenu-Active-FG` | `--a-menu-focused-background-color`, `--a-menu-focused-text-color`, `--a-menu-focused-accel-text-color` |
| REGIONS / REGION_HEADER | `$g_Region-Header-BG`, `$g_Region-Header-FG` | `--ut-region-header-background-color`, `--ut-region-header-text-color` |
| REGIONS / BODY | `$g_Region-BG`, `$g_Region-FG` | `--ut-region-background-color`, `--ut-region-text-color`, `--ut-component-background-color`, `--ut-wizard-header-background-color`, `--ut-report-cell-border-color`, `--ut-report-cell-hover-background-color` |
| STATES / PRIMARY | `$g_Primary-BG`, `$g_Primary-FG` | `--ut-palette-primary-alt`, `--ut-palette-primary-alt-contrast`, `--ut-palette-primary-alt-shade`, `--ut-palette-primary-alt-text` |
| STATES / SUCCESS | `$g_Success-BG`, `$g_Success-FG` | `--ut-palette-success`, `--ut-palette-success-contrast`, `--ut-palette-success-shade`, `--ut-palette-success-text` |
| STATES / INFO | `$g_Info-BG`, `$g_Info-FG` | `--ut-palette-info`, `--ut-palette-info-contrast`, `--ut-palette-info-shade`, `--ut-palette-info-text` |
| STATES / WARNING | `$g_Warning-BG`, `$g_Warning-FG` | `--ut-palette-warning`, `--ut-palette-warning-contrast`, `--ut-palette-warning-shade`, `--ut-palette-warning-text` |
| STATES / DANGER | `$g_Danger-BG`, `$g_Danger-FG` | `--ut-palette-danger`, `--ut-palette-danger-contrast`, `--ut-palette-danger-shade`, `--ut-palette-danger-text` |
| PALETTE / COLOR_1 … COLOR_15 | `$g_Color-Palette-N`, `-FG` | `--u-color-1` … `--u-color-45` + `-contrast` (90 Variablen; nur 1–15 im UI) |
| BUTTONS | `$g_Button-BorderRadius` | `--a-button-border-radius` |
| BUTTONS / NORMAL | `$g_Button-BG`, `$g_Button-Text` | `--a-button-background-color`, `--a-button-text-color`, `--a-button-count-background-color`, `--a-button-count-text-color` |
| FORMS | `$g_Form-Label` | `--ut-field-label-text-color` |
| FORMS | `$g_Form-BorderRadius` | `--a-field-input-border-radius`, `--a-filedrop-border-radius` |
| FORMS / ITEM | `$g_Form-Item-BG`, `$g_Form-Item-FG` | `--a-field-input-background-color`, `--a-field-input-text-color`, `--a-field-input-border-color`, `--a-field-input-hover-background-color`, `--a-field-input-focus-background-color`, `--a-field-input-focus-border-color`, `--a-datepicker-footer-border-color`, `--ut-field-input-focus-icon-color`, `--ut-field-fl-input-focus-icon-background-color`, `--ut-field-fl-input-focus-icon-color`, `--a-checkbox-background-color`, `--a-checkbox-border-color`, `--a-checkbox-text-color`, `--a-checkbox-checked-background-color`, `--a-checkbox-checked-text-color`, `--a-checkbox-hover-background-color` |
| INTERACTIVE_REPORTS | `$irrBg` | `--a-gv-background-color`, `--a-gv-cell-border-color`, `--a-gv-header-cell-border-color`, `--a-report-controls-cell-label-text-color`, `--a-report-controls-cell-label-background-color` |
| LAYOUT | `$Head-Height` | `--ut-header-height` |
| LAYOUT | `$Nav-Exp` | `--ut-nav-width` |
| LAYOUT | `$Actions-Exp` | `--ut-body-actions-width` |
| LAYOUT | `$Side-Exp` | `--ut-body-sidebar-width` |
| LAYOUT | `@g_Body-Content-Max-Width` | `--ut-body-content-max-width` |

Zusätzlich sind im Theme Roller die Button-Varianten (`$l_Button-Hot-BG`, `-Primary-`, `-Danger-`, `-Warning-`, `-Success-`, `-Simple-`) und `$g_Disabled-BG/FG` definiert – **ohne** zugehörigen :root-Block. Sie werden beim Kompilieren direkt in Selektoren (`.t-Button--hot { --a-button-background-color: #056AC8 }`) geschrieben.

## 5. Hebel-Variablen

**Auswahlkriterien:** (1) Theme-Roller-Variable oder offizielle 6307-Variable, (2) hohe Reichweite (Refs + abgeleitete Tokens), (3) steuert eine sichtbare Fläche/Linie/Schrift konsistent über viele Komponenten, (4) funktioniert in 24.2 **und** 26.1. Hooks (H) und nur lokal gesetzte Variablen (L) sind bewusst enthalten, wo ein :root-Wert die Kette sauber übernimmt.

Ergebnis: **102 Kern-Hebel (◆, `lever: true`)** + 79 Feinschliff-Hebel (◇, `leverTier: 2`).

### Palette & Status

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-palette-primary` | `#056AC8` | `#056AC8` | 30 | Primär-/Akzentfarbe des Styles („Primary Accent“ im Theme Roller). Speist --a-palette-primary und damit app_ui-Widgets (Switch, Date Picker, Star Rating, Filedrop …). ACHTUNG: viele Vita-Werte sind Hex-Kopien (#056AC8) statt var()-Referenzen. *(speist 11 Tokens, Fallback für 2, TR)* |
| ◆ | `--ut-palette-primary-contrast` | `white` | `white` | 10 | Text/Icon-Farbe auf Primärfläche (Hot-Button-Text, Icon-Kacheln). *(speist 6 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-primary-shade` | `#e6f0fa` | `#010b14` | 4 | Sehr heller (Vita) bzw. sehr dunkler (Dark) Primär-Flächenton: Auswahlhintergrund IG/Combobox, Percent-Chart-Hintergrund; über --a-palette-primary-shade auch IG-/Cards-/Icon-List-Auswahl und Date-Picker „heute“. *(speist 3 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-primary-text` | `var(--a-palette-primary)` → `#056ac8` | `var(--a-palette-primary)` → `#056ac8` | 1 | Primärfarbe als lesbare Textfarbe (Vita: var(--a-palette-primary)). *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-success` | `#278701` | `#388729` | 15 | Status „success“ – Grundfarbe *(speist 3 Tokens, Fallback für 2, TR)* |
| ◆ | `--ut-palette-success-contrast` | `#FFF` | `#FFF` | 7 | Status „success“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) *(speist 1 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-success-shade` | `#f4f9f2` | `#0c1e09` | 3 | Status „success“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-success-text` | `#4d7d3a` | `#567d4e` | 1 | Status „success“ – Textvariante (lesbarer Text in Statusfarbe) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-info` | `#056AC8` | `#006BD8` | 9 | Status „info“ – Grundfarbe *(speist 2 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-info-contrast` | `#FFF` | `#FFF` | 4 | Status „info“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) *(speist 1 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-info-shade` | `#f3f8fc` | `#001830` | 3 | Status „info“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-warning` | `#FFC628` | `#FBCE4A` | 9 | Status „warning“ – Grundfarbe *(speist 2 Tokens, TR)* |
| ◆ | `--ut-palette-warning-contrast` | `#000` | `#000` | 3 | Status „warning“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-warning-shade` | `#fff6df` | `#372d10` | 3 | Status „warning“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-warning-text` | `#8d7021` | `#8b7432` | 1 | Status „warning“ – Textvariante (lesbarer Text in Statusfarbe) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-danger` | `#CB1100` | `#EE0701` | 20 | Status „danger“ – Grundfarbe *(speist 5 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-danger-contrast` | `#FFF` | `#FFF` | 7 | Status „danger“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) *(speist 2 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-palette-danger-shade` | `#fbeeed` | `#340200` | 3 | Status „danger“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-danger-text` | `#a64940` | `#b74441` | 1 | Status „danger“ – Textvariante (lesbarer Text in Statusfarbe) *(speist 1 Tokens, TR)* |
| ◆ | `--ut-palette-primary-alt` | `#9ccefd` | `#9ccefd` | 2 | Zweite Akzentfarbe „Primary“ (t-Button--primary, States > Primary im Theme Roller). *(TR)* |
| ◆ | `--ut-palette-primary-alt-contrast` | `#010e1a` | `#010e1a` | 1 | Status „primary-alt“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) *(TR)* |
| ◇ | `--ut-palette-primary-alt-shade` | `#fafdff` | `#080a0d` | 0 | Status „primary-alt“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) *(TR)* |
| ◇ | `--ut-palette-primary-alt-text` | `#4f7598` | `#4f7598` | 4 | Status „primary-alt“ – Textvariante (lesbarer Text in Statusfarbe) *(TR)* |
| ◇ | `--ut-palette-info-text` | `#4375a4` | `#4076ac` | 0 | Status „info“ – Textvariante; in keiner geladenen CSS-Datei referenziert (nur für eigenes CSS nützlich). *(TR)* |
| ◇ | `--ut-palette-generic` | `#f2f2f2` | `#0d0d0d` | 2 | Status „generic“ – Grundfarbe *(Fallback für 1)* |

### Global (Links, Fokus, Farbschema)

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-link-text-color` | `#056AC8` | `#349bfa` | 15 | Linkfarbe (Theme Roller „Link Color“); speist --a-base-link-text-color. *(speist 3 Tokens, Fallback für 4, TR)* |
| ◆ | `--ut-focus-outline-color` | `#056AC8` | `#056AC8` | 26 | Farbe des Fokus-Rings (Theme Roller „Focus Outline“); speist Combobox-/Chat-Fokus. *(speist 3 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-color-scheme` | `light` | `dark` | 1 | Wert für CSS color-scheme auf :root (Core.css: color-scheme: var(--ut-color-scheme, normal)). light/dark steuert native Scrollbars, Formular-Controls, Date-Inputs. |
| ◇ | `--ut-link-text-decoration` | — *(Hook, Fallback `underline`)* | — | 18 | Links: Textdekoration (Text) |

### Typografie

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-base-font-family` | `system-ui, -apple-system, BlinkMacSyste…` | `system-ui, -apple-system, BlinkMacSyste…` | 7 | Hauptschrift der gesamten Oberfläche (UT Core :root; body nutzt var(--ut-base-font-family, var(--a-base-font-family))). *(Fallback für 1)* |
| ◆ | `--a-base-font-family-mono` | `ui-monospace, "Menlo", "Consolas", mono…` | `ui-monospace, "Menlo", "Consolas", mono…` | 12 | Monospace-Schrift (Code, Markdown, Prism). |
| ◆ | `--a-base-font-weight-semibold` | `600` | `600` | 58 | Halbfette Schriftstärke (Überschriften h1–h6, Logo, Login-Titel, aktuelle Side-/Top-Navigation, Badge List, Alert-Titel …). *(speist 3 Tokens, Fallback für 27)* |
| ◆ | `--a-base-font-weight-bold` | — *(Hook, Fallback `700`)* | — | 73 | Hook (nirgends definiert, 73 Referenzen, Fallback 700): fette Schriftstärke. *(Fallback für 14)* |
| ◇ | `--a-base-font-family-serif` | `"Iowan Old Style", "Apple Garamond", Ba…` | `"Iowan Old Style", "Apple Garamond", Ba…` | 2 | Serifenschrift (alternative Überschriften). *(speist 1 Tokens)* |
| ◇ | `--a-base-font-weight-normal` | — *(Hook, Fallback `400`)* | — | 7 | Hook (Fallback 400): normale Schriftstärke. *(Fallback für 3)* |
| ◇ | `--ut-base-font-size` | — *(Hook, Fallback `1rem`)* | — | 1 | Hook: font-size des body; Fallback 1rem. |
| ◇ | `--ut-base-line-height` | — *(Hook, Fallback `1rem`)* | — | 2 | Hook: line-height des body; Fallback 1rem. |

### Generische Komponente

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-component-background-color` | `white` | `#1b1d1e` | 31 | Basis-Hintergrund aller „generischen“ Komponenten (Date Picker, Search, Dialog-Fallback, JET-Collections …). *(speist 9 Tokens, Fallback für 14, TR)* |
| ◆ | `--ut-component-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 70 | Zentrale Randfarbe (Fallback für Region, Alert, Report, Menü-Trenner, Toolbar, Faceted Search …). Größter Einzelhebel für Linien. *(speist 21 Tokens, Fallback für 30)* |
| ◆ | `--ut-component-border-width` | `1px` | `1px` | 33 | Zentrale Randbreite (Fallback für viele *-border-width). *(speist 8 Tokens, Fallback für 16)* |
| ◆ | `--ut-component-border-radius` | `0.125rem` | `2px` | 18 | Zentraler Eckenradius (Theme Roller „Container Border Radius“). In Vita doppelt gesetzt: .25rem, dann 0.125rem (gewinnt). *(speist 2 Tokens, Fallback für 6, TR)* |
| ◆ | `--ut-component-box-shadow` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | 5 | Schatten für schwebende Komponenten (Standard var(--ut-shadow-lg)). *(Fallback für 4)* |
| ◆ | `--ut-component-highlight-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 9 | Hover-/Hervorhebungsfläche (z. B. Tabs-Hover, gestreifte Reports). *(Fallback für 3)* |
| ◆ | `--ut-component-toolbar-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 14 | Hintergrund für Toolbars/Kopfleisten in Komponenten (Date Picker). *(speist 2 Tokens, Fallback für 5)* |
| ◆ | `--ut-component-inner-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 33 | Innere Trennlinien (Listen, Report-Zellen, Toolbar-Trenner). *(speist 2 Tokens, Fallback für 16)* |
| ◆ | `--ut-component-text-default-color` | `#000` | `#fff` | 35 | Standard-Textfarbe in Komponenten. *(speist 4 Tokens, Fallback für 19)* |
| ◆ | `--ut-component-text-title-color` | `#000` | `#fff` | 19 | Titel-Textfarbe in Komponenten (Cards, Dialog-Titel, Filedrop-Heading …). *(speist 4 Tokens, Fallback für 11)* |
| ◆ | `--ut-component-text-subtitle-color` | `rgba(0, 0, 0, 0.85)` | `rgba(255, 255, 255, 0.85)` | 4 | Untertitel-Textfarbe. *(Fallback für 2)* |
| ◆ | `--ut-component-text-muted-color` | `rgba(0, 0, 0, 0.65)` | `rgba(255, 255, 255, 0.65)` | 45 | Gedämpfte Textfarbe (Beschreibungen, Hilfe, Kalender-Kopf …). *(speist 11 Tokens, Fallback für 21)* |
| ◆ | `--ut-component-icon-background-color` | `var(--ut-palette-primary)` → `#056ac8` | `var(--ut-palette-primary)` → `#056ac8` | 9 | Hintergrund von Icon-Kacheln (Hero, App-Icon, Card-List-/Media-List-/Timeline-/Comment-Icons). *(Fallback für 8)* |
| ◆ | `--ut-component-icon-color` | `var(--ut-palette-primary-contrast)` → `#fff` | `var(--ut-palette-primary-contrast)` → `#fff` | 8 | Icon-Farbe auf Icon-Kacheln. *(Fallback für 7)* |
| ◆ | `--ut-component-badge-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 18 | Standard-Badge-Hintergrund (Links List, Content Block Shadow BG …). *(Fallback für 5)* |
| ◆ | `--ut-component-badge-text-color` | `var(--ut-component-text-default-color)` → `#000` | `var(--ut-component-text-default-color)` → `#fff` | 5 | Standard-Badge-Text. *(Fallback für 4)* |
| ◆ | `--ut-component-badge-border-radius` | `.25rem` | `.25rem` | 1 | Standard-Badge-Radius (Seite 6307 dokumentiert 2px, Vita setzt .25rem). *(Fallback für 1)* |
| ◇ | `--ut-component-inner-border-width` | `var(--ut-component-border-width)` → `1px` | `var(--ut-component-border-width)` → `1px` | 18 | Generische Komponente: Randbreite (innen) *(Fallback für 12)* |

### Schatten & Radien

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-shadow-sm` | `0 .125rem .25rem -.125rem rgba(0, 0, 0,…` | `0 .125rem .25rem -.125rem rgba(0, 0, 0,…` | 11 | Kleiner Schatten (Regionen, Header, Buttons-Container, Alerts, Menü-Callout). *(speist 7 Tokens, Fallback für 1)* |
| ◆ | `--ut-shadow-md` | `0 .75rem 1.5rem -.75rem rgba(0, 0, 0, 0…` | `0 .75rem 1.5rem -.75rem rgba(0, 0, 0, 0…` | 2 | Mittlerer Schatten. |
| ◆ | `--ut-shadow-lg` | `0 1.5rem 3rem -1.5rem rgba(0, 0, 0, 0.3)` | `0 1.5rem 3rem -1.5rem rgba(0, 0, 0, 0.3)` | 5 | Großer Schatten (Komponenten-Schatten, Login-Region, Dialoge). *(speist 4 Tokens)* |
| ◇ | `--ut-border-radius` | `var(--ut-border-radius-md)` → `.25rem` | `var(--ut-border-radius-md)` → `.25rem` | 11 | Standardradius-Stufe (= --ut-border-radius-md); Utility-Klassen .rounded*. *(speist 1 Tokens, Fallback für 1)* |
| ◇ | `--ut-border-radius-sm` | `.125rem` | `.125rem` | 5 | Radius-Stufe: sm |
| ◇ | `--ut-border-radius-md` | `.25rem` | `.25rem` | 1 | Radius-Stufe: md *(speist 1 Tokens)* |
| ◇ | `--ut-border-radius-lg` | `.5rem` | `.5rem` | 5 | Radius-Stufe: lg |

### Seite, Spalten, Footer, Login

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-body-background-color` | `#FDFDFD` | `#252729` | 8 | Seitenhintergrund (body/t-Body). Theme Roller „Body > Background“. *(speist 6 Tokens, TR)* |
| ◆ | `--ut-body-text-color` | `black` | `white` | 9 | Standard-Textfarbe der Seite. Theme Roller „Body > Text“. *(speist 3 Tokens, TR)* |
| ◇ | `--ut-body-sidebar-background-color` | `white` | `#313436` | 1 | linke Spalte (t-Body-side): Hintergrundfarbe *(TR)* |
| ◇ | `--ut-body-sidebar-text-color` | `black` | `white` | 1 | linke Spalte (t-Body-side): Textfarbe *(TR)* |
| ◇ | `--ut-body-actions-background-color` | `#f9f9f9` | `#282b2d` | 2 | Actions-Spalte rechts (t-Body-actions): Hintergrundfarbe *(Fallback für 1, TR)* |
| ◇ | `--ut-body-actions-text-color` | `black` | `white` | 2 | Actions-Spalte rechts (t-Body-actions): Textfarbe *(Fallback für 1, TR)* |
| ◇ | `--ut-footer-background-color` | `#f2f2f2` | `#0d0d0d` | 1 | Footer (t-Footer): Hintergrundfarbe |
| ◇ | `--ut-footer-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 | Footer (t-Footer): Randfarbe |
| ◇ | `--ut-login-page-background-color` | `#e6e6e6` | `#1a1a1a` | 1 | Login-Seite: Hintergrundfarbe (page) |
| ◇ | `--ut-login-region-background-color` | `rgba(255, 255, 255, 0.65)` | `rgba(0, 0, 0, 0.65)` | 2 | Login-Seite: Hintergrundfarbe (Region) |

### Header

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-header-background-color` | `#056AC8` | `#056AC8` | 1 | Hintergrund des Headers (t-Header). In Vita = Primärfarbe als Hex-Kopie. *(TR)* |
| ◆ | `--ut-header-text-color` | `white` | `white` | 1 | Text/Icon-Farbe im Header (Logo, Navigation Bar). *(TR)* |
| ◆ | `--ut-header-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 1 | Header (t-Header): Randfarbe |
| ◆ | `--ut-header-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | 1 | Header (t-Header): Schatten |
| ◇ | `--ut-header-height` | `3rem` | `3rem` | 2 | Header-Höhe (Theme Roller Layout, 48–80px). *(Fallback für 1, TR)* |

### Navigation

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-body-nav-background-color` | `#2e3439` | `#2e3439` | 1 | Hintergrund der Side-Navigation (t-Body-nav / t-TreeNav). *(TR)* |
| ◆ | `--ut-body-nav-text-color` | `white` | `white` | 1 | Text-/Icon-Farbe der Side-Navigation. *(TR)* |
| ◆ | `--a-treeview-node-selected-background-color` | `#171a1d` | `#171a1d` | 3 | Side-Nav: Hintergrund des ausgewählten Eintrags (Theme Roller „Navigation > Selected State“). *(TR)* |
| ◆ | `--a-treeview-node-selected-text-color` | `white` | `white` | 6 | Side-Nav: Textfarbe des ausgewählten Eintrags. *(Fallback für 1, TR)* |
| ◆ | `--ut-header-menubar-background-color` | `#2e3439` | `#2e3439` | 1 | Top-Navigation (Menüleiste unter dem Header): Hintergrund. *(TR)* |
| ◆ | `--ut-header-menubar-item-text-color` | `white` | `white` | 1 | Top-Navigation: Textfarbe der Einträge. *(TR)* |
| ◆ | `--ut-header-menubar-item-current-background-color` | `#171a1d` | `#171a1d` | 2 | Top-Navigation: Hintergrund des aktuellen Eintrags. *(speist 1 Tokens, TR)* |
| ◆ | `--ut-header-menubar-item-current-text-color` | `white` | `white` | 2 | Top-Navigation: Textfarbe des aktuellen Eintrags. *(speist 1 Tokens, TR)* |
| ◇ | `--ut-nav-width` | `15rem` | `15rem` | 2 | Breite der aufgeklappten Side-Navigation. *(TR)* |
| ◇ | `--ut-body-nav-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 2 | Side-Navigation (t-Body-nav): Randfarbe |
| ◇ | `--a-treeview-node-hover-background-color` | `rgba(0, 0, 0, .05)` | `rgba(0, 0, 0, .05)` | 1 | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten Hover) |
| ◇ | `--a-treeview-node-focused-background-color` | `#171a1d` | `#171a1d` | 1 | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten fokussiert) *(TR)* |
| ◇ | `--a-treeview-node-focused-text-color` | `white` | `white` | 3 | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Knoten fokussiert) *(TR)* |
| ◇ | `--ut-treeview-badge-background-color` | `#056AC8` | `#056AC8` | 2 | Badge in der Side-Navigation (Hex-Kopie der Primärfarbe). *(Fallback für 1, TR)* |
| ◇ | `--ut-treeview-badge-text-color` | `white` | `white` | 2 | Tree-Navigation (t-TreeNav): Textfarbe (Badge) *(Fallback für 1, TR)* |
| ◇ | `--ut-navtabs-background-color` | `#2e3439` | `#2e3439` | 1 | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe *(TR)* |
| ◇ | `--ut-navtabs-text-color` | `white` | `white` | 1 | Mobile Navigations-Tabs (t-NavTabs): Textfarbe *(TR)* |
| ◇ | `--ut-navtabs-item-active-background-color` | `#171a1d` | `#171a1d` | 2 | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe (Eintrag aktiv) *(speist 1 Tokens, TR)* |

### Title Bar

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-body-title-background-color` | `white` | `#2c2e31` | 3 | Hintergrund der Title Bar / Breadcrumb-Leiste (sticky, mit Backdrop-Filter). *(Fallback für 1, TR)* |
| ◆ | `--ut-body-title-text-color` | `black` | `white` | 4 | Textfarbe der Title Bar; speist Breadcrumb-Aktivfarbe und Hero-Titel. *(speist 2 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-body-title-box-shadow` | `0 1px 0 0 rgba(0, 0, 0, 0.1)` | `0 1px 0 0 rgba(255, 255, 255, 0.15)` | 2 | Title Bar (t-Body-title): Schatten |
| ◆ | `--ut-breadcrumb-item-text-color` | `rgba(0, 0, 0, 0.65)` | `rgba(255, 255, 255, 0.65)` | 1 | Breadcrumb/Title-Bar-Region: Textfarbe (Eintrag) *(TR)* |

### Regionen

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--ut-region-background-color` | `white` | `#1b1d1e` | 5 | Hintergrund von Regionen (t-Region) – und über Fallback von Dialogen (--jui-dialog-background-color). *(speist 2 Tokens, Fallback für 2, TR)* |
| ◆ | `--ut-region-text-color` | `#262626` | `whitesmoke` | 3 | Textfarbe in Regionen; speist --jui-dialog-text-color. *(speist 1 Tokens, Fallback für 1, TR)* |
| ◆ | `--ut-region-header-background-color` | `white` | `#111213` | 3 | Hintergrund des Region-Kopfes; speist --a-gv-header-background-color und --a-toolbar-background-color. *(speist 2 Tokens, TR)* |
| ◆ | `--ut-region-header-text-color` | `#262626` | `#ebebeb` | 1 | Textfarbe des Region-Titels. *(TR)* |
| ◆ | `--ut-region-border-color` | — *(Hook, Fallback `var(--ut-component-border-col…`)* | — | 10 | Hook (nirgends definiert): Randfarbe von t-Region; Fallback var(--ut-component-border-color). Setzbar auf :root. *(Fallback für 3)* |
| ◆ | `--ut-region-border-radius` | — *(nur lokal; Fallback `var(--ut-component-border-rad…`)* | — | 8 | Eckenradius der Regionen; auf :root NICHT gesetzt (nur 0 in Side-/Actions-Spalte) → Fallback var(--ut-component-border-radius). *(speist 2 Tokens, Fallback für 1)* |
| ◆ | `--ut-region-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | 4 | Standard-Region (t-Region): Schatten *(speist 1 Tokens)* |
| ◇ | `--ut-region-border-width` | `1px` | `1px` | 12 | Standard-Region (t-Region): Randbreite *(speist 2 Tokens, Fallback für 3)* |
| ◇ | `--ut-region-header-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 1 | Standard-Region (t-Region): Randfarbe (Kopf) |

### Buttons

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-button-background-color` | `#f8f8f8` | `#494a4b` | 18 | Button-Hintergrund (Normal). Kette: --a-button-state-* > --a-button-type-* > --a-button-*. *(speist 1 Tokens, Fallback für 3, TR)* |
| ◆ | `--a-button-text-color` | `#393939` | `white` | 22 | Button-Textfarbe (Normal). *(speist 2 Tokens, Fallback für 3, TR)* |
| ◆ | `--a-button-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 20 | Button-Randfarbe. *(speist 4 Tokens, Fallback für 3)* |
| ◆ | `--a-button-border-radius` | `0.125rem` | `0.125rem` | 74 | Button-Radius (Theme Roller „Buttons > Border Radius“). *(speist 2 Tokens, Fallback für 1, TR)* |
| ◆ | `--a-button-shadow` | `0 2px 4px -3px rgba(0, 0, 0, 0.1)` | `0 2px 4px -3px rgba(0, 0, 0, 0.1)` | 8 | Button-Schatten (Normal). *(Fallback für 2)* |
| ◆ | `--a-button-hover-background-color` | `white` | `#626465` | 26 | Button-Hintergrund bei Hover (über --a-button-state-background-color). *(speist 2 Tokens, Fallback für 2)* |
| ◆ | `--a-button-active-background-color` | `#e6e6e6` | `#1a1a1a` | 13 | Button-Hintergrund gedrückt/aktiv. |
| ◆ | `--a-button-focus-border-color` | `var(--ut-palette-primary)` → `#056ac8` | `var(--ut-palette-primary)` → `#056ac8` | 8 | Button-Randfarbe bei :focus-visible (Vita: var(--ut-palette-primary)). |
| ◇ | `--a-button-hover-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 14 | Button (a-Button/t-Button): Randfarbe (Hover) *(Fallback für 1)* |
| ◇ | `--a-button-hover-shadow` | `0 2px 4px -2px rgba(0, 0, 0, 0.1)` | `0 2px 4px -2px rgba(0, 0, 0, 0.1)` | 11 | Button (a-Button/t-Button): Schatten (Hover) *(Fallback für 1)* |
| ◇ | `--a-button-active-shadow` | `0 2px 2px -1px rgba(0, 0, 0, 0.15) inset` | `0 2px 2px -1px rgba(0, 0, 0, 0.15) inset` | 10 | Button (a-Button/t-Button): Schatten (aktiv) |
| ◇ | `--a-button-border-width` | — *(nur lokal; Fallback `1px`)* | — | 95 | Button-Randbreite; nicht auf :root gesetzt (Fallback 1px), nur lokal (z. B. .t-Button--headerTree). *(speist 2 Tokens, Fallback für 1)* |
| ◇ | `--a-button-font-weight` | — *(nur lokal; Fallback `400`)* | — | 11 | Button-Schriftstärke; nur lokal gesetzt (.t-Button--hot/.a-Button--hot = bold). |
| ◇ | `--a-button-count-background-color` | `#056AC8` | `#056AC8` | 2 | Button (a-Button/t-Button): Hintergrundfarbe (Zähler) *(Fallback für 2, TR)* |

### Formulare, Checkbox, Switch

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-field-input-background-color` | `#f9f9f9` | `#212325` | 23 | Hintergrund von Eingabefeldern (Theme Roller „Forms > Item“). *(speist 2 Tokens, Fallback für 4, TR)* |
| ◆ | `--a-field-input-text-color` | `#202020` | `#fcfcfc` | 21 | Textfarbe in Eingabefeldern. *(speist 2 Tokens, Fallback für 5, TR)* |
| ◆ | `--a-field-input-border-color` | `#dfdfdf` | `#393d40` | 41 | Randfarbe von Eingabefeldern; speist Filedrop, Markdown-Editor, Chips, Report-Controls. *(speist 6 Tokens, Fallback für 16, TR)* |
| ◆ | `--a-field-input-border-radius` | `0.125rem` | `2px` | 32 | Radius von Eingabefeldern (Theme Roller „Forms > Border Radius“). *(speist 1 Tokens, Fallback für 3, TR)* |
| ◆ | `--a-field-input-focus-border-color` | `#056AC8` | `#056AC8` | 15 | Randfarbe fokussierter Felder (Vita: Hex-Kopie der Primärfarbe). *(speist 3 Tokens, TR)* |
| ◆ | `--a-field-input-focus-background-color` | `white` | `#09090a` | 6 | Hintergrund fokussierter Felder. *(TR)* |
| ◆ | `--ut-field-label-text-color` | `#262626` | `whitesmoke` | 1 | Label-Textfarbe (Theme Roller „Forms > Label“). *(TR)* |
| ◆ | `--a-checkbox-checked-background-color` | `#056AC8` | `#056AC8` | 8 | Hintergrund angehakter Checkbox/Radio (Vita: Hex-Kopie der Primärfarbe). *(Fallback für 1, TR)* |
| ◆ | `--a-checkbox-border-color` | `rgba(0, 0, 0, 0.15)` | `rgba(255, 255, 255, 0.15)` | 5 | Checkbox/Radio (u-checkbox/u-radio): Randfarbe *(TR)* |
| ◇ | `--a-field-input-border-width` | `1px` | `1px` | 97 | Randbreite von Eingabefeldern (Theme-Standard.css: 1px; 97 Referenzen). *(speist 3 Tokens, Fallback für 3)* |
| ◇ | `--a-field-input-hover-background-color` | `white` | `#151617` | 5 | Hintergrund bei Hover über Feld. *(TR)* |
| ◇ | `--a-checkbox-background-color` | `#f9f9f9` | `#212325` | 5 | Checkbox/Radio (u-checkbox/u-radio): Hintergrundfarbe *(TR)* |
| ◇ | `--a-checkbox-checked-text-color` | `white` | `white` | 8 | Checkbox/Radio (u-checkbox/u-radio): Textfarbe (angehakt) *(TR)* |
| ◇ | `--a-switch-background-color` | `#8c8c8c` | `#8c8c8c` | 2 | Switch (a-Switch): Hintergrundfarbe *(speist 1 Tokens)* |
| ◇ | `--a-switch-checked-background-color` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | 3 | Switch „an“ (Theme-Standard: var(--a-palette-primary, #0572CE)). *(speist 2 Tokens)* |
| ◇ | `--a-datepicker-calendar-day-selected-background-color` | `var(--a-palette-primary)` → `#056ac8` | `var(--a-palette-primary)` → `#056ac8` | 1 | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Tag ausgewählt) |

### Menüs, Tooltips, Overlay

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-menu-background-color` | `#FFFFFF` | `#1b1d1e` | 13 | Hintergrund aller a-Menu-Menüs (Actions-Menüs, Navigation-Bar-Menüs, IG-Menüs). *(speist 2 Tokens, TR)* |
| ◆ | `--a-menu-text-color` | `#262626` | `whitesmoke` | 18 | Menü-Textfarbe. *(speist 2 Tokens, Fallback für 5, TR)* |
| ◆ | `--a-menu-focused-background-color` | `#056AC8` | `#056AC8` | 13 | Hover/Fokus-Hintergrund eines Menüeintrags (Vita: Hex-Kopie der Primärfarbe). *(speist 4 Tokens, TR)* |
| ◆ | `--a-menu-focused-text-color` | `white` | `white` | 13 | Hover/Fokus-Textfarbe eines Menüeintrags. *(speist 4 Tokens, TR)* |
| ◇ | `--a-menu-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 12 | Menü (a-Menu): Randfarbe *(speist 1 Tokens)* |
| ◇ | `--a-menu-border-radius` | `.25rem` | `.25rem` | 10 | Menü (a-Menu): Eckenradius *(Fallback für 1)* |
| ◇ | `--a-menu-shadow` | `0 12px 24px -12px rgba(0, 0, 0, .3)` | `0 12px 24px -12px rgba(0, 0, 0, .3)` | 6 | Menü (a-Menu): Schatten |
| ◇ | `--a-tooltip-background-color` | `rgba(0, 0, 0, .9)` | `rgba(0, 0, 0, .9)` | 6 | Tooltip (app_ui): Hintergrundfarbe *(Fallback für 2)* |
| ◇ | `--a-tooltip-text-color` | `#fff` | `#fff` | 2 | Tooltip (app_ui): Textfarbe *(Fallback für 1)* |
| ◇ | `--jui-overlay-background-color` | `rgba(0, 0, 0, .25)` | `rgba(0, 0, 0, .25)` | 2 | Modal-Overlay (jQuery UI): Hintergrundfarbe |

### Reports / IG / IR

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-gv-background-color` | `white` | `#1b1d1e` | 6 | Hintergrund von IG/IR-Tabellen (Theme Roller „Interactive Reports“). *(speist 1 Tokens, TR)* |
| ◆ | `--a-gv-cell-border-color` | `#e6e6e6` | `#323435` | 13 | Grid View (IG/IR-Tabelle): Randfarbe (Zelle) *(Fallback für 1, TR)* |
| ◆ | `--a-gv-header-cell-border-color` | `#e6e6e6` | `#333639` | 8 | Grid View (IG/IR-Tabelle): Randfarbe (Kopf Zelle) *(speist 1 Tokens, Fallback für 2, TR)* |
| ◆ | `--a-gv-header-background-color` | `var(--ut-region-header-background-color)` → `#fff` | `var(--ut-region-header-background-color)` → `#111213` | 6 | Spaltenkopf-Hintergrund IG/IR (Vita: var(--ut-region-header-background-color)). *(Fallback für 2)* |
| ◇ | `--a-gv-row-hover-background-color` | `#f9f9f9` | `#060606` | 4 | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Zeile Hover) *(Fallback für 1)* |
| ◇ | `--a-gv-selected-background-color` | — *(Hook, Fallback `var(--a-palette-primary-shade)`)* | — | 12 | Hook: Hintergrund ausgewählter IG/IR-Zeilen; Fallback var(--a-palette-primary-shade). Auch Fallback für Media List, Timeline, Comments. *(Fallback für 6)* |
| ◇ | `--ut-report-cell-border-color` | `#e6e6e6` | `#333639` | 5 | Classic Report (t-Report): Randfarbe (Zelle) *(Fallback für 3, TR)* |
| ◇ | `--ut-report-header-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 1 | Classic Report (t-Report): Hintergrundfarbe (Kopf) |
| ◇ | `--a-toolbar-background-color` | `var(--ut-region-header-background-color)` → `#fff` | `var(--ut-region-header-background-color)` → `#111213` | 11 | Toolbar (IG/IR): Hintergrundfarbe *(Fallback für 2)* |

### Cards, Tabs, Links

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◆ | `--a-cv-background-color` | `white` | `#1b1d1e` | 3 | Card-Hintergrund (Cards-Region a-CardView). *(speist 2 Tokens, Fallback für 2)* |
| ◆ | `--a-cv-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 7 | Card-Randfarbe. *(speist 2 Tokens, Fallback für 4)* |
| ◆ | `--a-cv-border-radius` | `.1875rem` | `.1875rem` | 3 | Card-Radius (Vita doppelt: .25rem → .1875rem). |
| ◆ | `--a-cv-shadow` | `0 2px 4px -2px rgba(0, 0, 0, 0.075)` | `0 2px 4px -2px rgba(0, 0, 0, 0.075)` | 2 | Card-Schatten (Vita doppelt: var(--ut-shadow-sm) → fixer Wert). *(speist 1 Tokens, Fallback für 2)* |
| ◇ | `--a-cv-hover-shadow` | `0 4px .5rem 0 rgba(0, 0, 0, 0.1)` | `0 4px .5rem 0 rgba(0, 0, 0, 0.1)` | 1 | Cards-Region (a-CardView): Schatten (Hover) |
| ◇ | `--a-cv-icon-background-color` | `#056AC8` | `#056AC8` | 1 | Cards-Region (a-CardView): Hintergrundfarbe (Icon) *(Fallback für 1)* |
| ◇ | `--a-cv-initials-background-color` | `#056AC8` | `#056AC8` | 1 | Cards-Region (a-CardView): Hintergrundfarbe (Initialen) *(Fallback für 1)* |
| ◇ | `--a-cv-focus-border-color` | `#056AC8` | `#056AC8` | 4 | Cards-Region (a-CardView): Randfarbe (Fokus) |
| ◇ | `--ut-tabs-item-active-text-color` | `var(--ut-link-text-color)` → `#056ac8` | `var(--ut-link-text-color)` → `#349bfa` | 2 | Tabs (t-Tabs): Textfarbe (Eintrag aktiv) |

### Akzentpalette

| | Variable | Vita | Vita-Dark | Refs | Wirkung / Hinweis |
|---|---|---|---|---:|---|
| ◇ | `--u-color-1` | `#309FDB` | `#309FDB` | 19 | Akzentfarbe 1 (Klassen .u-color-1, -bg, -text, -border) *(speist 3 Tokens, TR)* |
| ◇ | `--u-color-2` | `#13B6CF` | `#13B6CF` | 17 | Akzentfarbe 2 (Klassen .u-color-2, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-3` | `#2EBFBC` | `#2EBFBC` | 17 | Akzentfarbe 3 (Klassen .u-color-3, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-4` | `#3CAF85` | `#3CAF85` | 17 | Akzentfarbe 4 (Klassen .u-color-4, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-5` | `#81BB5F` | `#81BB5F` | 17 | Akzentfarbe 5 (Klassen .u-color-5, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-6` | `#DDDE53` | `#DDDE53` | 17 | Akzentfarbe 6 (Klassen .u-color-6, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-7` | `#FBCE4A` | `#FBCE4A` | 17 | Akzentfarbe 7 (Klassen .u-color-7, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-8` | `#ED813E` | `#ED813E` | 17 | Akzentfarbe 8 (Klassen .u-color-8, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-9` | `#E95B54` | `#E95B54` | 17 | Akzentfarbe 9 (Klassen .u-color-9, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-10` | `#E85D88` | `#E85D88` | 17 | Akzentfarbe 10 (Klassen .u-color-10, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-11` | `#CA589D` | `#CA589D` | 17 | Akzentfarbe 11 (Klassen .u-color-11, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-12` | `#854E9B` | `#854E9B` | 17 | Akzentfarbe 12 (Klassen .u-color-12, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-13` | `#5A68AD` | `#5A68AD` | 16 | Akzentfarbe 13 (Klassen .u-color-13, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-14` | `#AFBAC5` | `#AFBAC5` | 16 | Akzentfarbe 14 (Klassen .u-color-14, -bg, -text, -border) *(speist 1 Tokens, TR)* |
| ◇ | `--u-color-15` | `#6E8598` | `#6E8598` | 17 | Akzentfarbe 15 (Klassen .u-color-15, -bg, -text, -border) *(speist 2 Tokens, TR)* |

### 5.x Minimal-Skelett eines Styles (nur Tokens)

Nur als Struktur-Beispiel – Werte sind Platzhalter. Die Hex-Kopien aus Abschnitt 8.1 müssen zusätzlich auf dieselben Werte gezogen werden.

```css
:root {
  /* Palette */
  --ut-palette-primary: #…; --ut-palette-primary-contrast: #…; --ut-palette-primary-shade: #…; --ut-palette-primary-text: #…;
  /* success / info / warning / danger analog (+ -contrast, -shade, -text) */
  --ut-link-text-color: var(--ut-palette-primary-text);
  --ut-focus-outline-color: var(--ut-palette-primary);
  --ut-color-scheme: light;                       /* dark im dunklen Style */
  /* Typografie */
  --a-base-font-family: "Meine Schrift", system-ui, sans-serif;
  --a-base-font-weight-semibold: 600; --a-base-font-weight-bold: 700;
  /* Flächen & Linien */
  --ut-body-background-color: #…; --ut-body-text-color: #…;
  --ut-component-background-color: #…; --ut-component-border-color: #…; --ut-component-inner-border-color: #…;
  --ut-component-border-radius: .5rem; --ut-component-box-shadow: var(--ut-shadow-lg);
  --ut-component-text-default-color: #…; --ut-component-text-title-color: #…; --ut-component-text-muted-color: #…;
  --ut-region-background-color: var(--ut-component-background-color);
  --ut-region-header-background-color: var(--ut-component-background-color);
  --ut-region-border-color: var(--ut-component-border-color);   /* Hook */
  --ut-region-border-radius: var(--ut-component-border-radius); /* sonst nur Fallback */
  --ut-shadow-sm: …; --ut-shadow-md: …; --ut-shadow-lg: …;
  /* Shell */
  --ut-header-background-color: #…; --ut-header-text-color: #…; --ut-header-border-color: #…; --ut-header-box-shadow: none;
  --ut-body-nav-background-color: #…; --ut-body-nav-text-color: #…;
  --a-treeview-node-selected-background-color: #…; --a-treeview-node-selected-text-color: #…;
  --ut-body-title-background-color: #…; --ut-body-title-text-color: #…;
  /* Controls */
  --a-button-background-color: #…; --a-button-text-color: #…; --a-button-border-color: #…; --a-button-border-radius: .5rem;
  --a-field-input-background-color: #…; --a-field-input-border-color: #…; --a-field-input-focus-border-color: var(--ut-palette-primary);
  --a-menu-background-color: #…; --a-menu-focused-background-color: var(--ut-palette-primary-shade);
  --a-gv-background-color: var(--ut-component-background-color); --a-cv-background-color: var(--ut-component-background-color);
}
```

### 5.y Checkliste für einen neuen Style

1. **Basis wählen:** heller Style lädt `#THEME_FILES#css/Vita#MIN#.css`, dunkler Style `Vita-Dark#MIN#.css` (nur so sind die 31 Dark-only-Tokens gesetzt).
2. **Kern-Hebel (◆) auf `:root` setzen** – Palette zuerst, dann `--ut-component-*`, Shell (Header/Nav/Title Bar), Regionen, Controls.
3. **Hex-Kopien nachziehen** (Abschnitt 8.1): alle :root-Kopien der Primärfarbe (Header, Menü-Fokus, Feld-Fokus, Checkbox, Cards-Icon/-Initialen/-Fokus, TreeNav-Badge, Button-Zähler) explizit auf `var(--ut-palette-primary)` o. ä. setzen.
4. **Button-Varianten per Selektor** neu deklarieren: `.t-Button--hot` (+ `.a-Button--hot`, `.ui-button--hot`, `.a-CardView-button--hot`, Radio-Group-Buttons), `--primary`, `--success`, `--warning`, `--danger` jeweils inkl. `--simple`/`--link`/`--noUI`-Kombinationen und `.fa:after`.
5. **Hooks für Entkopplung** setzen, wo gewünscht (`--ut-region-border-color`, `--ut-region-border-radius`, `--a-base-font-weight-bold`, `--a-gv-selected-background-color`, `--ut-link-text-decoration` …).
6. **Lokale Kontexte prüfen:** `.t-Button--header`, `.t-CardsRegion--styleA|B|C`, `.t-Form--large|xlarge`, `.t-TreeNav--styleA|B`, `.t-Body-side/.t-Body-actions .t-Region`.
7. **In beiden Testbetten prüfen** (9042 = UT 26.1, 9242 = UT 24.2); ★26/☆26-Tokens nur als Zusatz verwenden.

## 6. Accent-/Farbklassen-Systematik

### 6.1 Variablen

- `--u-color-1` … `--u-color-45` und `--u-color-N-contrast` stehen in **Vita.css** auf :root (Block nach dem Theme-Roller-Kommentar „Palette“). Vita und Vita-Dark haben **identische** Werte (verifiziert: 0 Unterschiede). Im Theme Roller sind nur 1–15 (BG + FG) editierbar; 16–30 sind hellere, 31–45 dunklere Ableitungen von 1–15 (als Hex kompiliert).
- `--u-color` / `--u-color-contrast` = „aktuelle“ Farbe; nicht auf :root definiert, sondern von den Klassen gesetzt (s. u.).
- `--a-palette-color-1…15[-contrast]` (Theme-Standard.css) = `var(--u-color-N, <Hex-Fallback>)` – app_ui-Spiegel, genutzt für die Color-Picker-Presets `--a-color-picker-preset-N`.
- **Charts:** UT Core.css mappt die JET-Kategorien auf die Palette: `.oj-dvt-category1`→`1`, `.oj-dvt-category2`→`4`, `.oj-dvt-category3`→`7`, `.oj-dvt-category4`→`9`, `.oj-dvt-category5`→`12`, `.oj-dvt-category6`→`3`, `.oj-dvt-category7`→`8`, `.oj-dvt-category8`→`10`, `.oj-dvt-category9`→`2`, `.oj-dvt-category10`→`5`, `.oj-dvt-category11`→`11`, `.oj-dvt-category12`→`6`. Serienfarben ändert man also über `--u-color-1/4/7/9/12/3/8/10/2/5/11/6` (verifiziert: Serienfüllungen auf Seite 1902 = #309FDB, #3CAF85, #FBCE4A).
- **Weitere Nutzer** der Palette: Avatare/Badge-Listen/Metric Cards (Klasse `u-color` in Templates), Workflow-Diagramm (`--a-diagram-*` = `var(--u-color-27/31/38/42/44/45)`), Gantt (`--oj-private-gantt-*` = `--u-color-1/15`).

### 6.2 Klassen (UT Core.css, Abschnitt „Pallete Colors“ / „Cycle Colors for lists“)

```css
.u-color-1 { --u-color: var(--u-color-1) !important; --u-color-contrast: var(--u-color-1-contrast) !important;
             background-color: var(--u-color-1); color: var(--u-color-1-contrast); fill: var(--u-color-1); stroke: var(--u-color-1); }
.u-color-1-bg,  .u-color-1-background { background-color: var(--u-color-1); fill: var(--u-color-1); }
.u-color-1-txt, .u-color-1-text       { color: var(--u-color-1); }
.u-color-1-bd,  .u-color-1-border     { border-color: var(--u-color-1); stroke: var(--u-color-1); }
/* Zyklus: .u-colors > :nth-child(45n+N) .u-color|.u-color-var|-bg|-txt|-bd  (auch .a-CardView-items, .a-SearchResults-item) */
.u-colors .u-color { background-color: var(--u-color); color: var(--u-color-contrast); }
.u-color-transparent { --u-color: transparent; --u-color-contrast: transparent; }
```

| Klasse | Wirkung | Token |
|---|---|---|
| `.u-color-N` | --u-color/--u-color-contrast (!important) setzen + background-color/color/fill/stroke | `--u-color-*` |
| `.u-color-N-bg / -background` | background-color + fill | `--u-color-*` |
| `.u-color-N-txt / -text` | color | `--u-color-*` |
| `.u-color-N-bd / -border` | border-color + stroke | `--u-color-*` |
| `.u-colors` | Container: Kinder (auch Cards, Search-Ergebnisse) zyklisch 1–45 per :nth-child(45n+N), wirkt auf .u-color/.u-color-var/-bg/-txt/-bd | `--u-color-*` |
| `.u-color-transparent(-bg/-txt/-bd)` | setzt --u-color/--u-color-contrast auf transparent | `--u-color-*` |
| `.u-success/.u-danger/.u-warning/.u-info/.u-hot` | background/color aus --ut-palette-{success\|danger\|warning\|info\|primary} und -contrast; Varianten -text, -bg, -border | `--ut-palette-*` |
| `.u-normal` | background var(--ut-body-background-color), color var(--ut-body-text-color); ACHTUNG: .u-normal-bg setzt background auf --ut-body-text-color | `--ut-body-*` |

### 6.3 Status-Palette `--ut-palette-*` (Vita / Vita-Dark)

| Status | Grund | -contrast | -shade | -text | app_ui-Spiegel |
|---|---|---|---|---|---|
| primary | `#056ac8` / `#056ac8` | `#fff` / `#fff` | `#e6f0fa` / `#010b14` | `#056ac8` / `#056ac8` | `--a-palette-primary` (+contrast, shade) |
| primary-alt | `#9ccefd` / `#9ccefd` | `#010e1a` / `#010e1a` | `#fafdff` / `#080a0d` | `#4f7598` / `#4f7598` | — |
| success | `#278701` / `#388729` | `#fff` / `#fff` | `#f4f9f2` / `#0c1e09` | `#4d7d3a` / `#567d4e` | `--a-palette-success` (+contrast, shade) |
| info | `#056ac8` / `#006bd8` | `#fff` / `#fff` | `#f3f8fc` / `#001830` | `#4375a4` / `#4076ac` | `--a-palette-info` (+contrast, shade) |
| warning | `#ffc628` / `#fbce4a` | `#000` / `#000` | `#fff6df` / `#372d10` | `#8d7021` / `#8b7432` | `--a-palette-warning` (+contrast, shade) |
| danger | `#cb1100` / `#ee0701` | `#fff` / `#fff` | `#fbeeed` / `#340200` | `#a64940` / `#b74441` | `--a-palette-danger` (+contrast, shade) |
| generic | `#f2f2f2` / `#0d0d0d` | `#000` / `#fff` | `#f9f9f9` / `#060606` | `#000` / `#fff` | — |

Der Status-Name „hot“ in Klassen (`.u-hot`, `.t-Button--hot`) entspricht `primary`; „primary“ in `.t-Button--primary` entspricht `primary-alt`.

### 6.4 Akzentpalette `--u-color-N` (Vita = Vita-Dark)

| N | Farbe | Kontrast | N | Farbe | Kontrast | N | Farbe | Kontrast |
|---:|---|---|---:|---|---|---:|---|---|
| 1 | `#309FDB` | `white` | 16 | `#59b2e2` | `white` | 31 | `#1a8bc9` | `#e6f4fc` |
| 2 | `#13B6CF` | `#e4f9fd` | 17 | `#42c5d9` | `#051517` | 32 | `#02a5be` | `#c1f6fe` |
| 3 | `#2EBFBC` | `#f0fcfb` | 18 | `#58ccc9` | `#091c1c` | 33 | `#18b2ae` | `#d0f9f8` |
| 4 | `#3CAF85` | `#f0faf6` | 19 | `#63bf9d` | `white` | 34 | `#24a475` | `#d2f5e8` |
| 5 | `#81BB5F` | `white` | 20 | `#9ac97f` | `#203316` | 35 | `#6aad42` | `#f6fbf3` |
| 6 | `#DDDE53` | `#2a2a08` | 21 | `#e4e575` | `#4c4d0e` | 36 | `#c9c93a` | `#030301` |
| 7 | `#FBCE4A` | `#443302` | 22 | `#fcd86e` | `#694f02` | 37 | `#d9b13c` | `#120f04` |
| 8 | `#ED813E` | `white` | 23 | `#f19a65` | `white` | 38 | `#d76a27` | `#fffefe` |
| 9 | `#E95B54` | `white` | 24 | `#ed7c76` | `white` | 39 | `#d2423c` | `white` |
| 10 | `#E85D88` | `white` | 25 | `#ed7da0` | `white` | 40 | `#d1436f` | `white` |
| 11 | `#CA589D` | `white` | 26 | `#d579b1` | `white` | 41 | `#ba3d88` | `#fdf9fb` |
| 12 | `#854E9B` | `#f6f0f8` | 27 | `#9d71af` | `white` | 42 | `#773492` | `#e8d5f0` |
| 13 | `#5A68AD` | `white` | 28 | `#7b86bd` | `white` | 43 | `#3c4ea3` | `#e8eaf6` |
| 14 | `#AFBAC5` | `#313b44` | 29 | `#bfc8d1` | `#3d4954` | 44 | `#8c9eb0` | `white` |
| 15 | `#6E8598` | `white` | 30 | `#8b9dad` | `white` | 45 | `#4d7391` | `#e9eff4` |

## 7. Abgleich mit Seite 6307 „CSS Variables“

Die Seite (App 9042, per Harness gelesen) dokumentiert als öffentliche API: `--u-color-1…45` (+`-contrast`), `--ut-palette-{primary|danger|warning|success|info}` (+`-contrast`, `-shade`), die 18 `--ut-component-*`-Variablen und `--ut-shadow-sm|md|lg`. Der Seiteninhalt ist App-Inhalt (kein UT-Dateiinhalt) und damit versionsunabhängig.

| Variable | Beschreibung (6307) | Default laut 6307 | Vita 26.1 (Datei) | Status |
|---|---|---|---|---|
| `--ut-component-background-color` | Component Background Color | `#fff` | `white` | ✓ |
| `--ut-component-border-color` | Component Border Color | `rgba(0,0,0,.1)` | `rgba(0, 0, 0, 0.1)` | ✓ |
| `--ut-component-border-width` | Component Border Width | `1px` | `1px` | ✓ |
| `--ut-component-border-radius` | Component Border Radius | `2px` | `0.125rem` | ✓ |
| `--ut-component-box-shadow` | Component Shadow | `var(--ut-shadow-lg)` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | ✓ |
| `--ut-component-highlight-background-color` | Component Highlight Background Color (example: hover state) | `rgba(0, 0, 0, .025)` | `rgba(0, 0, 0, 0.025)` | ✓ |
| `--ut-component-toolbar-background-color` | Component Toolbar Background Color | `rgba(0, 0, 0, .025)` | `rgba(0, 0, 0, 0.025)` | ✓ |
| `--ut-component-inner-border-width` | Component Inner Border Width | `1px` | `var(--ut-component-border-width)` → `1px` | ✓ |
| `--ut-component-inner-border-color` | Component Inner Border Color | `rgba(0, 0, 0, 0.05)` | `rgba(0, 0, 0, 0.05)` | ✓ |
| `--ut-component-text-default-color` | Component Default Text Color | `#000` | `#000` | ✓ |
| `--ut-component-text-title-color` | Component Default Title Color | `#000` | `#000` | ✓ |
| `--ut-component-text-subtitle-color` | Component Default Subtitle Color | `rgba(0, 0, 0, .85)` | `rgba(0, 0, 0, 0.85)` | ✓ |
| `--ut-component-text-muted-color` | Component Default Muted Color (example: description text) | `rgba(0, 0, 0, .65)` | `rgba(0, 0, 0, 0.65)` | ✓ |
| `--ut-component-icon-background-color` | Component Icon Background Color | `var(--ut-palette-primary)` | `var(--ut-palette-primary)` → `#056ac8` | ✓ |
| `--ut-component-icon-color` | Component Icon Color | `var(--ut-palette-primary-contrast)` | `var(--ut-palette-primary-contrast)` → `#fff` | ✓ |
| `--ut-component-badge-background-color` | Component Badge Background Color | `rgba(0, 0, 0, .05)` | `rgba(0, 0, 0, 0.05)` | ✓ |
| `--ut-component-badge-text-color` | Component Badge Text Color | `var(--ut-component-text-default-color)` | `var(--ut-component-text-default-color)` → `#000` | ✓ |
| `--ut-component-badge-border-radius` | Component Badge Border Radius | `2px` | `.25rem` | **abweichend** |
| `--ut-shadow-sm` | Shadow Small | `0 2px 4px -2px rgba(0, 0, 0, 0.1)` | `0 .125rem .25rem -.125rem rgba(0, 0, 0,…` | ✓ |
| `--ut-shadow-md` | Shadow Medium | `0 12px 24px -12px rgba(0, 0, 0, 0.3)` | `0 .75rem 1.5rem -.75rem rgba(0, 0, 0, 0…` | ✓ |
| `--ut-shadow-lg` | Shadow Large | `0 24px 48px -24px rgba(0, 0, 0, 0.3)` | `0 1.5rem 3rem -1.5rem rgba(0, 0, 0, 0.3)` | ✓ |

**Nicht auf 6307 dokumentiert, aber gleichwertig nutzbar:** `--ut-palette-*-text`, `--ut-palette-primary-alt*`, `--ut-palette-generic*`, `--ut-component-inner-border-width` (dokumentiert), `--ut-component-pre-background-color` (nur 26.1, ohne Referenz), `--ut-border-radius-sm|md|lg`, `--ut-text-*` (Typo-Skala), sowie alle `--a-*`-Tokens.
Abweichung: `--ut-component-badge-border-radius` ist laut Seite 2px, in Vita aber `.25rem` (4px). `--ut-component-border-radius` steht in Vita zweimal (`.25rem` im Basisblock, `0.125rem` im Theme-Roller-Block; letzterer gewinnt = 2px wie dokumentiert).

## 8. Fallstricke

### 8.1 Hex-Kopien der Primärfarbe in Vita.css

Diese Deklarationen enthalten `#056AC8` bzw. die kompilierten Hot-Button-Abstufungen (`#0784f9` hover, `#045daf` active, `#0677e1` Text) **als Literal** und folgen einer Änderung von `--ut-palette-primary` nicht (24 in Vita.css, 22 in Vita-Dark.css):

| Selektor | Deklaration |
|---|---|
| `:root` | `--ut-link-text-color: #056AC8` |
| `:root` | `--ut-focus-outline-color: #056AC8` |
| `:root` | `--ut-header-background-color: #056AC8` |
| `:root` | `--ut-treeview-badge-background-color: #056AC8` |
| `:root` | `--a-menu-focused-background-color: #056AC8` |
| `:root` | `--ut-palette-info: #056AC8` (eigene Statusfarbe, nur zufällig gleich) |
| `:root` | `--a-button-count-background-color: #056AC8` (★26) |
| `:root` | `--a-field-input-focus-border-color: #056AC8` |
| `:root` | `--ut-field-input-focus-icon-color: #056AC8` |
| `:root` | `--ut-field-fl-input-focus-icon-background-color: #056AC8` |
| `:root` | `--a-checkbox-checked-background-color: #056AC8` |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-gr…` | `--a-button-background-color: #056AC8` |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-gr…` | `--a-button-hover-background-color: #0784f9` |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-gr…` | `--a-button-active-background-color: #045daf` |
| `.t-Button--hot.t-Button--simple, .a-Button--hot.t-Button--simple, .ui-button--hot.t-Butto…` | `--a-button-border-color: #056AC8` |
| `.t-Button--hot.t-Button--simple, .a-Button--hot.t-Button--simple, .ui-button--hot.t-Butto…` | `--a-button-text-color: #0677e1` |
| `.t-Button--hot.t-Button--link, .a-Button--hot.t-Button--link, .ui-button--hot.t-Button--l…` | `--a-button-text-color: #0677e1` |
| `.t-Button--hot.t-Button--noUI, .t-Button--hot.a-Button--noUI, .a-Button--hot.t-Button--no…` | `--a-button-text-color: #0677e1` |
| `.t-Button--hot.t-Button--noUI, .t-Button--hot.a-Button--noUI, .a-Button--hot.t-Button--no…` | `color: #0677e1` |
| `.t-Button--hot .fa:after, .t-Button--simple.t-Button--hot:hover .fa:after` | `background-color: #056AC8` |
| `:root` | `--a-cv-focus-border-color: #056AC8` |
| `:root` | `--a-cv-icon-background-color: #056AC8` |
| `:root` | `--a-cv-initials-background-color: #056AC8` |
| `.t-TreeNav--styleB .a-TreeView-node--topLevel .a-TreeView-row.is-current--top, .t-TreeNav…` | `background-color: #056AC8` |

Gleiches gilt für die anderen Statusfarben: `.t-Button--warning` (#FFC628/#ffd45b/#ffbf0f), `.t-Button--success` (#278701/#36ba01/#206e01), `.t-Button--danger`/`.ui-button--danger` (#CB1100/#fe1500/#b20f00), `.t-Button--primary` (#9ccefd …) sowie die `.fa:after`-Hintergründe in Buttons (Vita.css ab Zeile ~2091). **Ein Theme muss diese Selektoren neu deklarieren** (am besten mit `var(--ut-palette-…)`), sonst bleiben Hot-/Status-Buttons blau/grün/rot.

### 8.2 Doppelte :root-Definitionen in Vita.css (letzte gewinnt)

| Variable | 1. Wert | 2. Wert (wirksam) |
|---|---|---|
| `--ut-component-border-radius` | `.25rem` | `0.125rem` |
| `--a-cv-border-radius` | `.25rem` | `.1875rem` |
| `--a-cv-shadow` | `var(--ut-shadow-sm)` | `0 2px 4px -2px rgba(0,0,0,0.075)` |
| `--a-cv-item-width` | `20rem` | `19rem` |
| `--a-button-border-radius` | `.125rem` | `0.125rem` |
| `--a-field-input-border-radius` | `.125rem` | `0.125rem` |
| `--a-filedrop-border-radius` | `.125rem` | `0.125rem` |

Wichtig für `--a-cv-shadow`: der wirksame Wert ist ein Literal – eine Änderung von `--ut-shadow-sm` erreicht Cards **nicht**.

### 8.3 Lokal gesetzte Werte schlagen :root

- 590 Variablen werden nur in Komponenten-Selektoren gesetzt (Flag L). Beispiele: `--a-button-*` in `.t-Button--header`, `.t-Button--simple`, `.t-Button--noUI`, `.t-Form-helpButton`; `--a-cv-*` in `.t-CardsRegion--styleA|B|C`, `.has-media--background`; `--ut-field-*`/`--a-field-*` in `.t-Form--large|xlarge`; `--a-treeview-*` in `.t-TreeNav--styleA|B`; `--ut-region-*` in `.t-Body-side .t-Region`, `.t-Body-actions .t-Region`.
- In diesen Kontexten wirkt ein :root-Override nicht. Abhilfe: gleiche Selektoren im Bundle (gleiche Spezifität, später geladen) oder die dort referenzierten Basistokens ändern.
- `.u-color-N` setzt `--u-color` mit `!important` – nur mit `!important` auf gleichem Element überschreibbar.
- `--ck-*` (CKEditor) setzt UT Core auf `body` (aus `--a-toolbar-*`, `--a-menu-*`, `--a-button-*` abgeleitet) → meist genügt es, die Quelltokens zu ändern.
- Header-Buttons: `.t-Button--header` setzt eigene transparente `--a-button-*` (Hover `rgba(0,0,0,.1)`) – bei hellem Header anpassen.

### 8.4 Wirkungslose oder irreführende Tokens

- **Unreferenziert** (definiert, aber in keiner geladenen CSS-Datei per var() genutzt; Auswahl ohne Drittanbieter): `--a-checkbox-label-spacing-y`, `--a-checkbox-shadow`, `--a-field-input-transition`, `--a-menu-disabled-focused-shadow`, `--a-searchresults-pagination-font-sizez`, `--a-toolbar-small-button-padding-x`, `--a-toolbar-small-button-padding-y`, `--a-treeview-node-hover-text-color`, `--jui-datepicker-border-color`, `--jui-datepicker-overflow`, `--ut-component-pre-background-color`, `--ut-palette-generic-shade`, `--ut-palette-generic-text`, `--ut-palette-info-text`, `--ut-palette-primary-alt-shade`. `--js-mq-*` werden stattdessen von theme42.js gelesen; `--oj-*` von JETs CSS, `--mg-*` vermutlich von der MapLibre-CSS der Map Region (*unverifiziert*); `--a-color-picker-preset-*` vermutlich vom Color-Picker-JS (*unverifiziert*).
- **Tippfehler in Originalnamen** (so verwenden!): `--ut-valiation-icon-background-color`, Hooks `--ut-valiation-*`/`--ut-validaiton-*`, `--a-button-paddiny-y`, `--a-searchresults-pagination-font-sizez`, `--a-fs-control-seperator-*`, Selektor-Kommentar „Pallete Colors“.
- `--a-field-input-border-style`: UT 24.2 Vita setzt `dashed`, referenziert ihn aber nirgends (wirkungslos); UT 26.1 setzt `solid` und nutzt ihn für Read-only-Felder.
- `.u-normal-bg` setzt `background-color: var(--ut-body-text-color)` (nicht body-background).
- `--ut-base-filter` existiert nur in Vita-Dark (`invert(1)`) und wirkt nur auf das Login-Hintergrundbild.

### 8.5 Dunkel-Modus

- Kein `prefers-color-scheme` in UT/app_ui – ein dunkler Style ist eine eigene CSS-Datei (Basis Vita-Dark.css). Unser dunkler Style sollte deshalb **auf Vita-Dark aufsetzen** (sonst fehlen die 31 nur in Vita-Dark gesetzten Tokens: `--a-md-*`, `--prism-*`, `--a-datepicker-calendar-day-current-*`, `--a-chat-*`, `--a-filedrop-icon-action-background-color`, `--ut-base-filter`).
- `--ut-color-scheme` muss im dunklen Style `dark` sein (native Scrollbars, Date-/Select-Controls).
- Vita-Dark behält `--ut-palette-primary: #056AC8` und den Header `#056AC8`; nur `-shade`, `-text`, Status-Grundfarben (danger #EE0701, success #388729, info #006BD8, warning #FBCE4A) und alle Flächen ändern sich.
- Einige Werte setzt Vita-Dark **nicht** um, sie kommen unverändert aus Theme-Standard.css bzw. sind mit Vita identisch: `--a-tooltip-background-color: rgba(0,0,0,.9)`, `--a-switch-background-color: #8c8c8c`, `--a-treeview-node-hover-background-color: rgba(0,0,0,.05)`, `--ojet-tooltip-*-text-color` (schwarz, während `--oj-popup-bg-color` = Menü-Hintergrund im Dunkelmodus dunkel ist – Lesbarkeit *unverifiziert*). Ein eigener dunkler Style sollte sie explizit setzen.

### 8.6 Weitere

- Theme-Roller-Output (`theme_roller_output_file_url`) wird **nach** unserem Bundle geladen und überschreibt dessen :root-Tokens, sobald jemand den Theme Roller auf den Style anwendet.
- Fallback-Einheiten mischen px (app_ui: `var(--a-button-padding-y, 8px)`) und rem (UT). Eigene Tokens konsequent in rem angeben.
- Hooks ohne Definition liefern in `getComputedStyle(:root)` einen Leerstring – Tests, die Tokens auslesen, müssen den Fallback berücksichtigen.
- `--js-sticky-top` und `--js-page-title-height` schreibt theme42.js zur Laufzeit auf :root (inline) – nie im Theme setzen.

## 9. Unterschiede UT 24.2 ↔ 26.1

- **Nur in 26.1 definiert (21):** `--a-button-count-background-color`, `--a-button-count-text-color`, `--a-combo-select-focus-outline`, `--a-combo-select-focus-outline-color`, `--a-combo-select-outline-offset`, `--a-datepicker-footer-border-color`, `--a-diagram-element-container-button-background-color`, `--a-diagram-element-container-children-container-background-color`, `--a-diagram-element-container-icon-background-color`, `--a-diagram-element-subcontainer-body-background-color`, `--a-diagram-element-subcontainer-header-text-color`, `--a-kb-shortcut-background-color`, `--a-kb-shortcut-border-color`, `--ut-avatar-list-gap-spacing`, `--ut-component-pre-background-color`, `--ut-dialog-pullout-block-size`, `--ut-inline-actions-gap`, `--ut-media-list-group-header-padding-x`, `--ut-metric-card-background-color`, `--ut-metric-card-color`, `--ut-timeline-group-header-padding-x`.
- **Wirkt nur mit 26.1** (in 24.2-CSS unreferenziert, 9): `--a-button-count-background-color`, `--a-button-count-text-color`, `--a-field-input-border-style`, `--ut-avatar-list-gap-spacing`, `--ut-dialog-pullout-block-size`, `--ut-inline-actions-gap`, `--ut-media-list-group-header-padding-x`, `--ut-metric-card-background-color`, `--ut-timeline-group-header-padding-x`.
- **Nur in 24.2 definiert oder wirksam:** keine.
- **Wertunterschiede auf :root** Vita 24.2→26.1: `--a-field-input-border-style` (`dashed` → `solid`); Vita-Dark: `--a-field-input-border-style` (`dashed` → `solid`). UT Core :root: neu `--a-combo-select-focus-outline`, `--a-combo-select-focus-outline-color`, `--a-combo-select-outline-offset`.
- **Neue Hooks in 26.1 (118):** Group-Header für Avatar/Comments/Media List/Metric Card/Timeline (`--ut-*-group-header-*`, `--ut-*-group-title-*`, `--ut-*-group-icon-size`), Metric Card (`--ut-metric-card-*`, 40+), Listen-Einträge (`--ut-*-item-border-*`), Abstandsskala `--u-space-0…10` für `.u-gap-*`, Button-Zähler (`--a-button-*-count-*`), `--ut-dialog-pullout-max-block-size`, `--ut-contextualinfo-*`, `--ut-no-script-padding-*`.
- Laufzeit-Stichprobe (App 9242, UT 24.2): 1137 berechnete :root-Werte vs. 1150 in 9042 (26.1); die Werte der gemeinsamen Hebel sind identisch (0 Abweichungen unter den Kern-Hebeln).
- **Iris** (Iris.css) gibt es nur in 26.1: gleiche Token-Struktur wie Vita, zusätzlich auf :root u. a. `--a-base-font-family` („Oracle Sans“), `--ut-badge-border-radius`, `--ut-logo-font-weight`, `--ut-tabs-item-hint-highlight-width` – nützlich als Beispiel, welche Hooks Oracle selbst für einen „anderen Look“ setzt.
- **Empfehlung:** Nur Tokens verwenden, die in beiden Versionen existieren (alle ◆-Hebel erfüllen das). 26.1-only-Tokens (★26/☆26) dürfen zusätzlich gesetzt werden – in 24.2 sind sie harmlos wirkungslos.

## 10. Vollständige Tabellen nach Bereich

Spalten: Vita / Vita-Dark = :root-Wert (→ aufgelöst); bei Flag L steht stattdessen der wichtigste Fallback bzw. Selektor in der Bedeutung. Lange Werte sind gekürzt (vollständig im JSON).

### 10.1 Palette/Farbskala (Status-Palette --ut-palette-*, --a-palette-*) (43)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-palette-danger` | `var(--ut-palette-danger)` → `#cb1100` | `var(--ut-palette-danger)` → `#ee0701` | 25 |  | app_ui-Spiegel: Status „danger“ – Grundfarbe |
| `--a-palette-danger-contrast` | `var(--ut-palette-danger-contrast)` → `#fff` | = Vita | 6 |  | app_ui-Spiegel: Status „danger“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--a-palette-danger-shade` | `var(--ut-palette-danger-shade)` → `#fbeeed` | `var(--ut-palette-danger-shade)` → `#340200` | 4 |  | app_ui-Spiegel: Status „danger“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--a-palette-info` | `var(--ut-palette-info)` → `#056ac8` | `var(--ut-palette-info)` → `#006bd8` | 5 |  | app_ui-Spiegel: Status „info“ – Grundfarbe |
| `--a-palette-info-contrast` | `var(--ut-palette-info-contrast)` → `#fff` | = Vita | 1 |  | app_ui-Spiegel: Status „info“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--a-palette-info-shade` | `var(--ut-palette-info-shade)` → `#f3f8fc` | `var(--ut-palette-info-shade)` → `#001830` | 3 |  | app_ui-Spiegel: Status „info“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--a-palette-primary` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 55 |  | app_ui-Spiegel: Status „primary“ – Grundfarbe |
| `--a-palette-primary-contrast` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 16 |  | app_ui-Spiegel: Status „primary“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--a-palette-primary-shade` | `var(--ut-palette-primary-shade)` → `#e6f0fa` | `var(--ut-palette-primary-shade)` → `#010b14` | 19 |  | app_ui-Spiegel: Status „primary“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--a-palette-success` | `var(--ut-palette-success)` → `#278701` | `var(--ut-palette-success)` → `#388729` | 7 |  | app_ui-Spiegel: Status „success“ – Grundfarbe |
| `--a-palette-success-contrast` | `var(--ut-palette-success-contrast)` → `#fff` | = Vita | 1 |  | app_ui-Spiegel: Status „success“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--a-palette-success-shade` | `var(--ut-palette-success-shade)` → `#f4f9f2` | `var(--ut-palette-success-shade)` → `#0c1e09` | 3 |  | app_ui-Spiegel: Status „success“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--a-palette-warning` | `var(--ut-palette-warning)` → `#ffc628` | `var(--ut-palette-warning)` → `#fbce4a` | 10 |  | app_ui-Spiegel: Status „warning“ – Grundfarbe |
| `--a-palette-warning-contrast` | `var(--ut-palette-warning-contrast)` → `#000` | = Vita | 2 |  | app_ui-Spiegel: Status „warning“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--a-palette-warning-shade` | `var(--ut-palette-warning-shade)` → `#fff6df` | `var(--ut-palette-warning-shade)` → `#372d10` | 3 |  | app_ui-Spiegel: Status „warning“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-danger` | `#CB1100` | `#EE0701` | 20 | ◆ TR | Status „danger“ – Grundfarbe |
| `--ut-palette-danger-contrast` | `#FFF` | = Vita | 7 | ◆ TR | Status „danger“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-danger-shade` | `#fbeeed` | `#340200` | 3 | ◆ TR | Status „danger“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-danger-text` | `#a64940` | `#b74441` | 1 | ◆ TR | Status „danger“ – Textvariante (lesbarer Text in Statusfarbe) |
| `--ut-palette-generic` | `#f2f2f2` | `#0d0d0d` | 2 | ◇ | Status „generic“ – Grundfarbe |
| `--ut-palette-generic-contrast` | `#000` | `#fff` | 2 |  | Status „generic“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-generic-shade` | `#f9f9f9` | `#060606` | 0 | ∅ | Status „generic“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-generic-text` | `#000` | `#fff` | 0 | ∅ | Status „generic“ – Textvariante (lesbarer Text in Statusfarbe) |
| `--ut-palette-info` | `#056AC8` | `#006BD8` | 9 | ◆ TR | Status „info“ – Grundfarbe |
| `--ut-palette-info-contrast` | `#FFF` | = Vita | 4 | ◆ TR | Status „info“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-info-shade` | `#f3f8fc` | `#001830` | 3 | ◆ TR | Status „info“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-info-text` | `#4375a4` | `#4076ac` | 0 | ◇ TR ∅ | Status „info“ – Textvariante; in keiner geladenen CSS-Datei referenziert (nur für eigenes CSS nützlich). |
| `--ut-palette-primary` | `#056AC8` | = Vita | 30 | ◆ TR | Primär-/Akzentfarbe des Styles („Primary Accent“ im Theme Roller). Speist --a-palette-primary und damit app_ui-Widgets (Switch, Date Picker, Star Rating, Filedrop …). ACHTUNG: viele Vita-Werte sind Hex-Kopien (#056AC8) statt var()-Referenzen. |
| `--ut-palette-primary-alt` | `#9ccefd` | = Vita | 2 | ◆ TR | Zweite Akzentfarbe „Primary“ (t-Button--primary, States > Primary im Theme Roller). |
| `--ut-palette-primary-alt-contrast` | `#010e1a` | = Vita | 1 | ◆ TR | Status „primary-alt“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-primary-alt-shade` | `#fafdff` | `#080a0d` | 0 | ◇ TR ∅ | Status „primary-alt“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-primary-alt-text` | `#4f7598` | = Vita | 4 | ◇ TR | Status „primary-alt“ – Textvariante (lesbarer Text in Statusfarbe) |
| `--ut-palette-primary-contrast` | `white` | = Vita | 10 | ◆ TR | Text/Icon-Farbe auf Primärfläche (Hot-Button-Text, Icon-Kacheln). |
| `--ut-palette-primary-shade` | `#e6f0fa` | `#010b14` | 4 | ◆ TR | Sehr heller (Vita) bzw. sehr dunkler (Dark) Primär-Flächenton: Auswahlhintergrund IG/Combobox, Percent-Chart-Hintergrund; über --a-palette-primary-shade auch IG-/Cards-/Icon-List-Auswahl und Date-Picker „heute“. |
| `--ut-palette-primary-text` | `var(--a-palette-primary)` → `#056ac8` | = Vita | 1 | ◆ TR | Primärfarbe als lesbare Textfarbe (Vita: var(--a-palette-primary)). |
| `--ut-palette-success` | `#278701` | `#388729` | 15 | ◆ TR | Status „success“ – Grundfarbe |
| `--ut-palette-success-contrast` | `#FFF` | = Vita | 7 | ◆ TR | Status „success“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-success-shade` | `#f4f9f2` | `#0c1e09` | 3 | ◆ TR | Status „success“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-success-text` | `#4d7d3a` | `#567d4e` | 1 | ◆ TR | Status „success“ – Textvariante (lesbarer Text in Statusfarbe) |
| `--ut-palette-warning` | `#FFC628` | `#FBCE4A` | 9 | ◆ TR | Status „warning“ – Grundfarbe |
| `--ut-palette-warning-contrast` | `#000` | = Vita | 3 | ◆ TR | Status „warning“ – Kontrastfarbe (Text/Icon auf der Grundfarbe) |
| `--ut-palette-warning-shade` | `#fff6df` | `#372d10` | 3 | ◆ TR | Status „warning“ – Tönung (Flächenton, z. B. Alert-/Auswahlhintergrund) |
| `--ut-palette-warning-text` | `#8d7021` | `#8b7432` | 1 | ◆ TR | Status „warning“ – Textvariante (lesbarer Text in Statusfarbe) |

### 10.2 Status-/Accent-Farben (--u-color-*, --a-palette-color-*) (122)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-palette-color-1` | `var(--u-color-1, #309FDB)` → `#309fdb` | = Vita | 1 |  | Spiegel von --u-color-1 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-1-contrast` | `var(--u-color-1-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-1-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-2` | `var(--u-color-2, #13B6CF)` → `#13b6cf` | = Vita | 1 |  | Spiegel von --u-color-2 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-2-contrast` | `var(--u-color-2-contrast, #fff)` → `#e4f9fd` | = Vita | 0 | ∅ | Spiegel von --u-color-2-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-3` | `var(--u-color-3, #2EBFBC)` → `#2ebfbc` | = Vita | 1 |  | Spiegel von --u-color-3 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-3-contrast` | `var(--u-color-3-contrast, #fff)` → `#f0fcfb` | = Vita | 0 | ∅ | Spiegel von --u-color-3-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-4` | `var(--u-color-4, #3CAF85)` → `#3caf85` | = Vita | 1 |  | Spiegel von --u-color-4 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-4-contrast` | `var(--u-color-4-contrast, #fff)` → `#f0faf6` | = Vita | 0 | ∅ | Spiegel von --u-color-4-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-5` | `var(--u-color-5, #81BB5F)` → `#81bb5f` | = Vita | 1 |  | Spiegel von --u-color-5 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-5-contrast` | `var(--u-color-5-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-5-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-6` | `var(--u-color-6, #DDDE53)` → `#ddde53` | = Vita | 1 |  | Spiegel von --u-color-6 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-6-contrast` | `var(--u-color-6-contrast, #000)` → `#2a2a08` | = Vita | 0 | ∅ | Spiegel von --u-color-6-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-7` | `var(--u-color-7, #FBCE4A)` → `#fbce4a` | = Vita | 1 |  | Spiegel von --u-color-7 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-7-contrast` | `var(--u-color-7-contrast, #000)` → `#443302` | = Vita | 0 | ∅ | Spiegel von --u-color-7-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-8` | `var(--u-color-8, #ED813E)` → `#ed813e` | = Vita | 1 |  | Spiegel von --u-color-8 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-8-contrast` | `var(--u-color-8-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-8-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-9` | `var(--u-color-9, #E95B54)` → `#e95b54` | = Vita | 1 |  | Spiegel von --u-color-9 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-9-contrast` | `var(--u-color-9-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-9-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-10` | `var(--u-color-10, #E85D88)` → `#e85d88` | = Vita | 1 |  | Spiegel von --u-color-10 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-10-contrast` | `var(--u-color-10-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-10-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-11` | `var(--u-color-11, #CA589D)` → `#ca589d` | = Vita | 1 |  | Spiegel von --u-color-11 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-11-contrast` | `var(--u-color-11-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-11-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-12` | `var(--u-color-12, #854E9B)` → `#854e9b` | = Vita | 1 |  | Spiegel von --u-color-12 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-12-contrast` | `var(--u-color-12-contrast, #fff)` → `#f6f0f8` | = Vita | 0 | ∅ | Spiegel von --u-color-12-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-13` | `var(--u-color-13, #5A68AD)` → `#5a68ad` | = Vita | 1 |  | Spiegel von --u-color-13 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-13-contrast` | `var(--u-color-13-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-13-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-14` | `var(--u-color-14, #AFBAC5)` → `#afbac5` | = Vita | 1 |  | Spiegel von --u-color-14 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-14-contrast` | `var(--u-color-14-contrast, #fff)` → `#313b44` | = Vita | 0 | ∅ | Spiegel von --u-color-14-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-15` | `var(--u-color-15, #6E8598)` → `#6e8598` | = Vita | 1 |  | Spiegel von --u-color-15 (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--a-palette-color-15-contrast` | `var(--u-color-15-contrast, #fff)` → `#fff` | = Vita | 0 | ∅ | Spiegel von --u-color-15-contrast (app_ui, Theme-Standard.css; genutzt für Color-Picker-Presets) |
| `--u-color` | — | — | 14 | L | Aktuelle Akzentfarbe (wird von .u-color-N bzw. .u-colors gesetzt) — lokal in `.u-color-1` …; Fallback `var(--ut-cardlist-icon-background-color…` |
| `--u-color-1` | `#309FDB` | = Vita | 19 | ◇ TR | Akzentfarbe 1 (Klassen .u-color-1, -bg, -text, -border) |
| `--u-color-1-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 1 (.u-color-1) |
| `--u-color-2` | `#13B6CF` | = Vita | 17 | ◇ TR | Akzentfarbe 2 (Klassen .u-color-2, -bg, -text, -border) |
| `--u-color-2-contrast` | `#e4f9fd` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 2 (.u-color-2) |
| `--u-color-3` | `#2EBFBC` | = Vita | 17 | ◇ TR | Akzentfarbe 3 (Klassen .u-color-3, -bg, -text, -border) |
| `--u-color-3-contrast` | `#f0fcfb` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 3 (.u-color-3) |
| `--u-color-4` | `#3CAF85` | = Vita | 17 | ◇ TR | Akzentfarbe 4 (Klassen .u-color-4, -bg, -text, -border) |
| `--u-color-4-contrast` | `#f0faf6` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 4 (.u-color-4) |
| `--u-color-5` | `#81BB5F` | = Vita | 17 | ◇ TR | Akzentfarbe 5 (Klassen .u-color-5, -bg, -text, -border) |
| `--u-color-5-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 5 (.u-color-5) |
| `--u-color-6` | `#DDDE53` | = Vita | 17 | ◇ TR | Akzentfarbe 6 (Klassen .u-color-6, -bg, -text, -border) |
| `--u-color-6-contrast` | `#2a2a08` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 6 (.u-color-6) |
| `--u-color-7` | `#FBCE4A` | = Vita | 17 | ◇ TR | Akzentfarbe 7 (Klassen .u-color-7, -bg, -text, -border) |
| `--u-color-7-contrast` | `#443302` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 7 (.u-color-7) |
| `--u-color-8` | `#ED813E` | = Vita | 17 | ◇ TR | Akzentfarbe 8 (Klassen .u-color-8, -bg, -text, -border) |
| `--u-color-8-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 8 (.u-color-8) |
| `--u-color-9` | `#E95B54` | = Vita | 17 | ◇ TR | Akzentfarbe 9 (Klassen .u-color-9, -bg, -text, -border) |
| `--u-color-9-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 9 (.u-color-9) |
| `--u-color-10` | `#E85D88` | = Vita | 17 | ◇ TR | Akzentfarbe 10 (Klassen .u-color-10, -bg, -text, -border) |
| `--u-color-10-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 10 (.u-color-10) |
| `--u-color-11` | `#CA589D` | = Vita | 17 | ◇ TR | Akzentfarbe 11 (Klassen .u-color-11, -bg, -text, -border) |
| `--u-color-11-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 11 (.u-color-11) |
| `--u-color-12` | `#854E9B` | = Vita | 17 | ◇ TR | Akzentfarbe 12 (Klassen .u-color-12, -bg, -text, -border) |
| `--u-color-12-contrast` | `#f6f0f8` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 12 (.u-color-12) |
| `--u-color-13` | `#5A68AD` | = Vita | 16 | ◇ TR | Akzentfarbe 13 (Klassen .u-color-13, -bg, -text, -border) |
| `--u-color-13-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 13 (.u-color-13) |
| `--u-color-14` | `#AFBAC5` | = Vita | 16 | ◇ TR | Akzentfarbe 14 (Klassen .u-color-14, -bg, -text, -border) |
| `--u-color-14-contrast` | `#313b44` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 14 (.u-color-14) |
| `--u-color-15` | `#6E8598` | = Vita | 17 | ◇ TR | Akzentfarbe 15 (Klassen .u-color-15, -bg, -text, -border) |
| `--u-color-15-contrast` | `white` | = Vita | 5 | TR | Kontrastfarbe (Text) zu Akzentfarbe 15 (.u-color-15) |
| `--u-color-16` | `#59b2e2` | = Vita | 13 | TR | Akzentfarbe 16 (Klassen .u-color-16, -bg, -text, -border) |
| `--u-color-16-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 16 (.u-color-16) |
| `--u-color-17` | `#42c5d9` | = Vita | 13 | TR | Akzentfarbe 17 (Klassen .u-color-17, -bg, -text, -border) |
| `--u-color-17-contrast` | `#051517` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 17 (.u-color-17) |
| `--u-color-18` | `#58ccc9` | = Vita | 13 | TR | Akzentfarbe 18 (Klassen .u-color-18, -bg, -text, -border) |
| `--u-color-18-contrast` | `#091c1c` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 18 (.u-color-18) |
| `--u-color-19` | `#63bf9d` | = Vita | 13 | TR | Akzentfarbe 19 (Klassen .u-color-19, -bg, -text, -border) |
| `--u-color-19-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 19 (.u-color-19) |
| `--u-color-20` | `#9ac97f` | = Vita | 14 | TR | Akzentfarbe 20 (Klassen .u-color-20, -bg, -text, -border) |
| `--u-color-20-contrast` | `#203316` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 20 (.u-color-20) |
| `--u-color-21` | `#e4e575` | = Vita | 13 | TR | Akzentfarbe 21 (Klassen .u-color-21, -bg, -text, -border) |
| `--u-color-21-contrast` | `#4c4d0e` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 21 (.u-color-21) |
| `--u-color-22` | `#fcd86e` | = Vita | 13 | TR | Akzentfarbe 22 (Klassen .u-color-22, -bg, -text, -border) |
| `--u-color-22-contrast` | `#694f02` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 22 (.u-color-22) |
| `--u-color-23` | `#f19a65` | = Vita | 13 | TR | Akzentfarbe 23 (Klassen .u-color-23, -bg, -text, -border) |
| `--u-color-23-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 23 (.u-color-23) |
| `--u-color-24` | `#ed7c76` | = Vita | 13 | TR | Akzentfarbe 24 (Klassen .u-color-24, -bg, -text, -border) |
| `--u-color-24-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 24 (.u-color-24) |
| `--u-color-25` | `#ed7da0` | = Vita | 13 | TR | Akzentfarbe 25 (Klassen .u-color-25, -bg, -text, -border) |
| `--u-color-25-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 25 (.u-color-25) |
| `--u-color-26` | `#d579b1` | = Vita | 13 | TR | Akzentfarbe 26 (Klassen .u-color-26, -bg, -text, -border) |
| `--u-color-26-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 26 (.u-color-26) |
| `--u-color-27` | `#9d71af` | = Vita | 14 | TR | Akzentfarbe 27 (Klassen .u-color-27, -bg, -text, -border) |
| `--u-color-27-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 27 (.u-color-27) |
| `--u-color-28` | `#7b86bd` | = Vita | 13 | TR | Akzentfarbe 28 (Klassen .u-color-28, -bg, -text, -border) |
| `--u-color-28-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 28 (.u-color-28) |
| `--u-color-29` | `#bfc8d1` | = Vita | 14 | TR | Akzentfarbe 29 (Klassen .u-color-29, -bg, -text, -border) |
| `--u-color-29-contrast` | `#3d4954` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 29 (.u-color-29) |
| `--u-color-30` | `#8b9dad` | = Vita | 13 | TR | Akzentfarbe 30 (Klassen .u-color-30, -bg, -text, -border) |
| `--u-color-30-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 30 (.u-color-30) |
| `--u-color-31` | `#1a8bc9` | = Vita | 14 | TR | Akzentfarbe 31 (Klassen .u-color-31, -bg, -text, -border) |
| `--u-color-31-contrast` | `#e6f4fc` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 31 (.u-color-31) |
| `--u-color-32` | `#02a5be` | = Vita | 13 | TR | Akzentfarbe 32 (Klassen .u-color-32, -bg, -text, -border) |
| `--u-color-32-contrast` | `#c1f6fe` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 32 (.u-color-32) |
| `--u-color-33` | `#18b2ae` | = Vita | 13 | TR | Akzentfarbe 33 (Klassen .u-color-33, -bg, -text, -border) |
| `--u-color-33-contrast` | `#d0f9f8` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 33 (.u-color-33) |
| `--u-color-34` | `#24a475` | = Vita | 13 | TR | Akzentfarbe 34 (Klassen .u-color-34, -bg, -text, -border) |
| `--u-color-34-contrast` | `#d2f5e8` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 34 (.u-color-34) |
| `--u-color-35` | `#6aad42` | = Vita | 13 | TR | Akzentfarbe 35 (Klassen .u-color-35, -bg, -text, -border) |
| `--u-color-35-contrast` | `#f6fbf3` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 35 (.u-color-35) |
| `--u-color-36` | `#c9c93a` | = Vita | 13 | TR | Akzentfarbe 36 (Klassen .u-color-36, -bg, -text, -border) |
| `--u-color-36-contrast` | `#030301` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 36 (.u-color-36) |
| `--u-color-37` | `#d9b13c` | = Vita | 13 | TR | Akzentfarbe 37 (Klassen .u-color-37, -bg, -text, -border) |
| `--u-color-37-contrast` | `#120f04` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 37 (.u-color-37) |
| `--u-color-38` | `#d76a27` | = Vita | 14 | TR | Akzentfarbe 38 (Klassen .u-color-38, -bg, -text, -border) |
| `--u-color-38-contrast` | `#fffefe` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 38 (.u-color-38) |
| `--u-color-39` | `#d2423c` | = Vita | 13 | TR | Akzentfarbe 39 (Klassen .u-color-39, -bg, -text, -border) |
| `--u-color-39-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 39 (.u-color-39) |
| `--u-color-40` | `#d1436f` | = Vita | 13 | TR | Akzentfarbe 40 (Klassen .u-color-40, -bg, -text, -border) |
| `--u-color-40-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 40 (.u-color-40) |
| `--u-color-41` | `#ba3d88` | = Vita | 13 | TR | Akzentfarbe 41 (Klassen .u-color-41, -bg, -text, -border) |
| `--u-color-41-contrast` | `#fdf9fb` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 41 (.u-color-41) |
| `--u-color-42` | `#773492` | = Vita | 14 | TR | Akzentfarbe 42 (Klassen .u-color-42, -bg, -text, -border) |
| `--u-color-42-contrast` | `#e8d5f0` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 42 (.u-color-42) |
| `--u-color-43` | `#3c4ea3` | = Vita | 13 | TR | Akzentfarbe 43 (Klassen .u-color-43, -bg, -text, -border) |
| `--u-color-43-contrast` | `#e8eaf6` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 43 (.u-color-43) |
| `--u-color-44` | `#8c9eb0` | = Vita | 14 | TR | Akzentfarbe 44 (Klassen .u-color-44, -bg, -text, -border) |
| `--u-color-44-contrast` | `white` | = Vita | 3 | TR | Kontrastfarbe (Text) zu Akzentfarbe 44 (.u-color-44) |
| `--u-color-45` | `#4d7391` | = Vita | 14 | TR | Akzentfarbe 45 (Klassen .u-color-45, -bg, -text, -border) |
| `--u-color-45-contrast` | `#e9eff4` | = Vita | 4 | TR | Kontrastfarbe (Text) zu Akzentfarbe 45 (.u-color-45) |
| `--u-color-contrast` | — | — | 8 | L | Aktuelle Akzent-Kontrastfarbe (wird von .u-color-N bzw. .u-colors gesetzt) — lokal in `.u-color-1` …; Fallback `var(--a-cv-icon-text-color)` |

### 10.3 Basis-Typografie (55)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-base-font-family` | `system-ui, -apple-system, BlinkMacSystemFont,…` | = Vita | 7 | ◆ | Hauptschrift der gesamten Oberfläche (UT Core :root; body nutzt var(--ut-base-font-family, var(--a-base-font-family))). |
| `--a-base-font-family-mono` | `ui-monospace, "Menlo", "Consolas", mono-space…` | = Vita | 12 | ◆ | Monospace-Schrift (Code, Markdown, Prism). |
| `--a-base-font-family-serif` | `"Iowan Old Style", "Apple Garamond", Baskervi…` | = Vita | 2 | ◇ | Serifenschrift (alternative Überschriften). |
| `--a-base-font-weight-semibold` | `600` | = Vita | 58 | ◆ | Halbfette Schriftstärke (Überschriften h1–h6, Logo, Login-Titel, aktuelle Side-/Top-Navigation, Badge List, Alert-Titel …). |
| `--a-icon-font-family` | `"apex-core-font"` | = Vita | 17 |  | Icons: Schriftfamilie |
| `--ut-alternate-heading-font-family` | `var(--a-base-font-family-serif)` → `"Iowan Old Style","Apple Garamond…` | = Vita | 3 |  | Alternative Überschriften: Schriftfamilie |
| `--ut-alternate-heading-font-weight` | `var(--a-base-font-weight-normal)` | = Vita | 3 |  | Alternative Überschriften: Schriftstärke |
| `--ut-text-body-2xs-font-size` | `.625rem` | = Vita | 1 |  | Typo-Skala body-2xs: Schriftgröße (Klassen .u-text-body-2xs o. ä.) |
| `--ut-text-body-2xs-line-height` | `.75rem` | = Vita | 1 |  | Typo-Skala body-2xs: Zeilenhöhe (Klassen .u-text-body-2xs o. ä.) |
| `--ut-text-body-lg-font-size` | `1.125rem` | = Vita | 1 |  | Typo-Skala body-lg: Schriftgröße (Klassen .u-text-body-lg o. ä.) |
| `--ut-text-body-lg-line-height` | `1.5rem` | = Vita | 1 |  | Typo-Skala body-lg: Zeilenhöhe (Klassen .u-text-body-lg o. ä.) |
| `--ut-text-body-md-font-size` | `1rem` | = Vita | 1 |  | Typo-Skala body-md: Schriftgröße (Klassen .u-text-body-md o. ä.) |
| `--ut-text-body-md-line-height` | `1.25rem` | = Vita | 1 |  | Typo-Skala body-md: Zeilenhöhe (Klassen .u-text-body-md o. ä.) |
| `--ut-text-body-sm-font-size` | `.875rem` | = Vita | 1 |  | Typo-Skala body-sm: Schriftgröße (Klassen .u-text-body-sm o. ä.) |
| `--ut-text-body-sm-line-height` | `1rem` | = Vita | 1 |  | Typo-Skala body-sm: Zeilenhöhe (Klassen .u-text-body-sm o. ä.) |
| `--ut-text-body-xl-font-size` | `1.25rem` | = Vita | 1 |  | Typo-Skala body-xl: Schriftgröße (Klassen .u-text-body-xl o. ä.) |
| `--ut-text-body-xl-line-height` | `1.5rem` | = Vita | 1 |  | Typo-Skala body-xl: Zeilenhöhe (Klassen .u-text-body-xl o. ä.) |
| `--ut-text-body-xs-font-size` | `.75rem` | = Vita | 1 |  | Typo-Skala body-xs: Schriftgröße (Klassen .u-text-body-xs o. ä.) |
| `--ut-text-body-xs-line-height` | `1rem` | = Vita | 1 |  | Typo-Skala body-xs: Zeilenhöhe (Klassen .u-text-body-xs o. ä.) |
| `--ut-text-heading-2xl-font-size` | `2.5rem` | = Vita | 1 |  | Typo-Skala heading-2xl: Schriftgröße (Klassen .u-text-heading-2xl o. ä.) |
| `--ut-text-heading-2xl-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-2xl: Schriftstärke (Klassen .u-text-heading-2xl o. ä.) |
| `--ut-text-heading-2xl-line-height` | `3.25rem` | = Vita | 1 |  | Typo-Skala heading-2xl: Zeilenhöhe (Klassen .u-text-heading-2xl o. ä.) |
| `--ut-text-heading-lg-font-size` | `2rem` | = Vita | 1 |  | Typo-Skala heading-lg: Schriftgröße (Klassen .u-text-heading-lg o. ä.) |
| `--ut-text-heading-lg-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-lg: Schriftstärke (Klassen .u-text-heading-lg o. ä.) |
| `--ut-text-heading-lg-line-height` | `2.5rem` | = Vita | 1 |  | Typo-Skala heading-lg: Zeilenhöhe (Klassen .u-text-heading-lg o. ä.) |
| `--ut-text-heading-md-font-size` | `1.75rem` | = Vita | 1 |  | Typo-Skala heading-md: Schriftgröße (Klassen .u-text-heading-md o. ä.) |
| `--ut-text-heading-md-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-md: Schriftstärke (Klassen .u-text-heading-md o. ä.) |
| `--ut-text-heading-md-line-height` | `2.25rem` | = Vita | 1 |  | Typo-Skala heading-md: Zeilenhöhe (Klassen .u-text-heading-md o. ä.) |
| `--ut-text-heading-sm-font-size` | `1.5rem` | = Vita | 1 |  | Typo-Skala heading-sm: Schriftgröße (Klassen .u-text-heading-sm o. ä.) |
| `--ut-text-heading-sm-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-sm: Schriftstärke (Klassen .u-text-heading-sm o. ä.) |
| `--ut-text-heading-sm-line-height` | `2rem` | = Vita | 1 |  | Typo-Skala heading-sm: Zeilenhöhe (Klassen .u-text-heading-sm o. ä.) |
| `--ut-text-heading-xl-font-size` | `2.25rem` | = Vita | 1 |  | Typo-Skala heading-xl: Schriftgröße (Klassen .u-text-heading-xl o. ä.) |
| `--ut-text-heading-xl-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-xl: Schriftstärke (Klassen .u-text-heading-xl o. ä.) |
| `--ut-text-heading-xl-line-height` | `2.75rem` | = Vita | 1 |  | Typo-Skala heading-xl: Zeilenhöhe (Klassen .u-text-heading-xl o. ä.) |
| `--ut-text-heading-xs-font-size` | `1.25rem` | = Vita | 1 |  | Typo-Skala heading-xs: Schriftgröße (Klassen .u-text-heading-xs o. ä.) |
| `--ut-text-heading-xs-font-weight` | `var(--a-base-font-weight-heavy, 900)` → `900` | = Vita | 1 |  | Typo-Skala heading-xs: Schriftstärke (Klassen .u-text-heading-xs o. ä.) |
| `--ut-text-heading-xs-line-height` | `1.75rem` | = Vita | 1 |  | Typo-Skala heading-xs: Zeilenhöhe (Klassen .u-text-heading-xs o. ä.) |
| `--ut-text-subheading-2xl-font-size` | `2.25rem` | = Vita | 1 |  | Typo-Skala subheading-2xl: Schriftgröße (Klassen .u-text-subheading-2xl o. ä.) |
| `--ut-text-subheading-2xl-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-2xl: Schriftstärke (Klassen .u-text-subheading-2xl o. ä.) |
| `--ut-text-subheading-2xl-line-height` | `3rem` | = Vita | 1 |  | Typo-Skala subheading-2xl: Zeilenhöhe (Klassen .u-text-subheading-2xl o. ä.) |
| `--ut-text-subheading-lg-font-size` | `1.75rem` | = Vita | 1 |  | Typo-Skala subheading-lg: Schriftgröße (Klassen .u-text-subheading-lg o. ä.) |
| `--ut-text-subheading-lg-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-lg: Schriftstärke (Klassen .u-text-subheading-lg o. ä.) |
| `--ut-text-subheading-lg-line-height` | `2.25rem` | = Vita | 1 |  | Typo-Skala subheading-lg: Zeilenhöhe (Klassen .u-text-subheading-lg o. ä.) |
| `--ut-text-subheading-md-font-size` | `1.5rem` | = Vita | 1 |  | Typo-Skala subheading-md: Schriftgröße (Klassen .u-text-subheading-md o. ä.) |
| `--ut-text-subheading-md-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-md: Schriftstärke (Klassen .u-text-subheading-md o. ä.) |
| `--ut-text-subheading-md-line-height` | `2rem` | = Vita | 1 |  | Typo-Skala subheading-md: Zeilenhöhe (Klassen .u-text-subheading-md o. ä.) |
| `--ut-text-subheading-sm-font-size` | `1.25rem` | = Vita | 1 |  | Typo-Skala subheading-sm: Schriftgröße (Klassen .u-text-subheading-sm o. ä.) |
| `--ut-text-subheading-sm-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-sm: Schriftstärke (Klassen .u-text-subheading-sm o. ä.) |
| `--ut-text-subheading-sm-line-height` | `1.75rem` | = Vita | 1 |  | Typo-Skala subheading-sm: Zeilenhöhe (Klassen .u-text-subheading-sm o. ä.) |
| `--ut-text-subheading-xl-font-size` | `2rem` | = Vita | 1 |  | Typo-Skala subheading-xl: Schriftgröße (Klassen .u-text-subheading-xl o. ä.) |
| `--ut-text-subheading-xl-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-xl: Schriftstärke (Klassen .u-text-subheading-xl o. ä.) |
| `--ut-text-subheading-xl-line-height` | `2.5rem` | = Vita | 1 |  | Typo-Skala subheading-xl: Zeilenhöhe (Klassen .u-text-subheading-xl o. ä.) |
| `--ut-text-subheading-xs-font-size` | `1rem` | = Vita | 2 |  | Typo-Skala subheading-xs: Schriftgröße (Klassen .u-text-subheading-xs o. ä.) |
| `--ut-text-subheading-xs-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 1 |  | Typo-Skala subheading-xs: Schriftstärke (Klassen .u-text-subheading-xs o. ä.) |
| `--ut-text-subheading-xs-line-height` | `1.25rem` | = Vita | 1 |  | Typo-Skala subheading-xs: Zeilenhöhe (Klassen .u-text-subheading-xs o. ä.) |

### 10.4 Generische Komponente (--ut-component-*) (19)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-component-background-color` | `white` | `#1b1d1e` | 31 | ◆ TR | Basis-Hintergrund aller „generischen“ Komponenten (Date Picker, Search, Dialog-Fallback, JET-Collections …). |
| `--ut-component-badge-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 18 | ◆ | Standard-Badge-Hintergrund (Links List, Content Block Shadow BG …). |
| `--ut-component-badge-border-radius` | `.25rem` | = Vita | 1 | ◆ | Standard-Badge-Radius (Seite 6307 dokumentiert 2px, Vita setzt .25rem). |
| `--ut-component-badge-text-color` | `var(--ut-component-text-default-color)` → `#000` | `var(--ut-component-text-default-color)` → `#fff` | 5 | ◆ | Standard-Badge-Text. |
| `--ut-component-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 70 | ◆ | Zentrale Randfarbe (Fallback für Region, Alert, Report, Menü-Trenner, Toolbar, Faceted Search …). Größter Einzelhebel für Linien. |
| `--ut-component-border-radius` | `0.125rem` | `2px` | 18 | ◆ TR | Zentraler Eckenradius (Theme Roller „Container Border Radius“). In Vita doppelt gesetzt: .25rem, dann 0.125rem (gewinnt). |
| `--ut-component-border-width` | `1px` | = Vita | 33 | ◆ | Zentrale Randbreite (Fallback für viele *-border-width). |
| `--ut-component-box-shadow` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | = Vita | 5 | ◆ | Schatten für schwebende Komponenten (Standard var(--ut-shadow-lg)). |
| `--ut-component-highlight-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 9 | ◆ | Hover-/Hervorhebungsfläche (z. B. Tabs-Hover, gestreifte Reports). |
| `--ut-component-icon-background-color` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 9 | ◆ | Hintergrund von Icon-Kacheln (Hero, App-Icon, Card-List-/Media-List-/Timeline-/Comment-Icons). |
| `--ut-component-icon-color` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 8 | ◆ | Icon-Farbe auf Icon-Kacheln. |
| `--ut-component-inner-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 33 | ◆ | Innere Trennlinien (Listen, Report-Zellen, Toolbar-Trenner). |
| `--ut-component-inner-border-width` | `var(--ut-component-border-width)` → `1px` | = Vita | 18 | ◇ | Generische Komponente: Randbreite (innen) |
| `--ut-component-pre-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 0 | ★26 ∅ | Nur 26.1 definiert, aber in keiner geladenen CSS-Datei referenziert (wirkungslos). |
| `--ut-component-text-default-color` | `#000` | `#fff` | 35 | ◆ | Standard-Textfarbe in Komponenten. |
| `--ut-component-text-muted-color` | `rgba(0, 0, 0, 0.65)` | `rgba(255, 255, 255, 0.65)` | 45 | ◆ | Gedämpfte Textfarbe (Beschreibungen, Hilfe, Kalender-Kopf …). |
| `--ut-component-text-subtitle-color` | `rgba(0, 0, 0, 0.85)` | `rgba(255, 255, 255, 0.85)` | 4 | ◆ | Untertitel-Textfarbe. |
| `--ut-component-text-title-color` | `#000` | `#fff` | 19 | ◆ | Titel-Textfarbe in Komponenten (Cards, Dialog-Titel, Filedrop-Heading …). |
| `--ut-component-toolbar-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 14 | ◆ | Hintergrund für Toolbars/Kopfleisten in Komponenten (Date Picker). |

### 10.5 Body/Seite (Hintergrund, Links, Fokus, Spalten, Footer, Login) (38)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-base-link-text-color` | `var(--ut-link-text-color)` → `#056ac8` | `var(--ut-link-text-color)` → `#349bfa` | 4 |  | Basis (app_ui): Textfarbe (Link) |
| `--safe-area-inset-bottom` | `env(safe-area-inset-bottom)` | = Vita | 1 |  | Safe Area (Notch): inset bottom |
| `--safe-area-inset-left` | `env(safe-area-inset-left)` | = Vita | 0 | ∅ | Safe Area (Notch): inset left |
| `--safe-area-inset-right` | `env(safe-area-inset-right)` | = Vita | 0 | ∅ | Safe Area (Notch): inset right |
| `--safe-area-inset-top` | `env(safe-area-inset-top)` | = Vita | 0 | ∅ | Safe Area (Notch): inset top |
| `--ut-base-filter` | — | `invert(1)` | 1 | D | Nur Vita-Dark: filter für das Login-Hintergrundbild (.t-Login-bgImg) = invert(1). |
| `--ut-body-actions-background-color` | `#f9f9f9` | `#282b2d` | 2 | ◇ TR | Actions-Spalte rechts (t-Body-actions): Hintergrundfarbe |
| `--ut-body-actions-text-color` | `black` | `white` | 2 | ◇ TR | Actions-Spalte rechts (t-Body-actions): Textfarbe |
| `--ut-body-actions-width` | `12.5rem` | = Vita | 1 | TR | Actions-Spalte rechts (t-Body-actions): Breite |
| `--ut-body-actionstoggle-background-color` | `#f9f9f9` | `#282b2d` | 1 | TR | Actions-Toggle-Button: Hintergrundfarbe |
| `--ut-body-actionstoggle-hover-background-color` | `#e0e0e0` | `#414448` | 1 | TR | Actions-Toggle-Button: Hintergrundfarbe (Hover) |
| `--ut-body-actionstoggle-padding-x` | — | — | 2 | L | Actions-Toggle-Button: Innenabstand horizontal — lokal in `.t-Body-actionsToggle.is-active, .t-Body-actionsToggle:hove…`; Fallback `0.25rem` |
| `--ut-body-background-color` | `#FDFDFD` | `#252729` | 8 | ◆ TR | Seitenhintergrund (body/t-Body). Theme Roller „Body > Background“. |
| `--ut-body-content-max-width` | `100%` | = Vita | 1 | TR | Inhaltsbereich (t-Body-content): Maximalbreite |
| `--ut-body-content-padding-x` | — | — | 2 | L | Inhaltsbereich (t-Body-content): Innenabstand horizontal — lokal in `@media (max-width: 639px) » .t-Body-contentInner` …; Fallback `1rem` |
| `--ut-body-content-padding-y` | — | — | 2 | L | Inhaltsbereich (t-Body-content): Innenabstand vertikal — lokal in `@media (max-width: 639px) » .t-Body-contentInner` …; Fallback `1rem` |
| `--ut-body-sidebar-background-color` | `white` | `#313436` | 1 | ◇ TR | linke Spalte (t-Body-side): Hintergrundfarbe |
| `--ut-body-sidebar-text-color` | `black` | `white` | 1 | ◇ TR | linke Spalte (t-Body-side): Textfarbe |
| `--ut-body-sidebar-width` | `15rem` | = Vita | 1 | TR | linke Spalte (t-Body-side): Breite |
| `--ut-body-text-color` | `black` | `white` | 9 | ◆ TR | Standard-Textfarbe der Seite. Theme Roller „Body > Text“. |
| `--ut-color-scheme` | `light` | `dark` | 1 | ◆ | Wert für CSS color-scheme auf :root (Core.css: color-scheme: var(--ut-color-scheme, normal)). light/dark steuert native Scrollbars, Formular-Controls, Date-Inputs. |
| `--ut-focus-outline` | — | — | 23 | L | Fokus-Outline: Outline — lokal in `.apex-item-multi .apex-item-popup-lov`; Fallback `auto 1px var(--ut-focus-outline-color, …` |
| `--ut-focus-outline-color` | `#056AC8` | = Vita | 26 | ◆ TR | Farbe des Fokus-Rings (Theme Roller „Focus Outline“); speist Combobox-/Chat-Fokus. |
| `--ut-focus-outline-offset` | — | — | 21 | L | Fokus-Outline: Outline-Abstand — lokal in `a-select`; Fallback `2px` |
| `--ut-footer-background-color` | `#f2f2f2` | `#0d0d0d` | 1 | ◇ | Footer (t-Footer): Hintergrundfarbe |
| `--ut-footer-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 | ◇ | Footer (t-Footer): Randfarbe |
| `--ut-footer-item-spacing` | `.75rem` | = Vita | 1 |  | Footer (t-Footer): Abstand (Eintrag) |
| `--ut-footer-top-margin` | — | — | 1 | L | Footer (t-Footer): Außenabstand (top) — lokal in `@media (max-width: 639px) » .t-Footer-top`; Fallback `0` |
| `--ut-footer-top-opacity` | — | — | 1 | L | Footer (t-Footer): Deckkraft (top) — lokal in `.t-Footer-topButton:hover, .t-Footer-topButton:focus`; Fallback `0.75` |
| `--ut-layout-transition` | `.1s` | = Vita | 13 |  | Layout: Übergang |
| `--ut-link-text-color` | `#056AC8` | `#349bfa` | 15 | ◆ TR | Linkfarbe (Theme Roller „Link Color“); speist --a-base-link-text-color. |
| `--ut-login-logo-font-size` | — | — | 1 | L | Login-Seite: Schriftgröße (logo) — lokal in `.apex-icons-fontawesome .t-Login-logo`; Fallback `2rem` |
| `--ut-login-page-background-color` | `#e6e6e6` | `#1a1a1a` | 1 | ◇ | Login-Seite: Hintergrundfarbe (page) |
| `--ut-login-region-background-color` | `rgba(255, 255, 255, 0.65)` | `rgba(0, 0, 0, 0.65)` | 2 | ◇ | Login-Seite: Hintergrundfarbe (Region) |
| `--ut-login-region-box-shadow` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | = Vita | 2 |  | Login-Seite: Schatten (Region) |
| `--ut-login-region-filter` | `blur(4px)` | = Vita | 1 |  | Login-Seite: Filter (Region) |
| `--ut-xs-body-content-padding-x` | — | — | 1 | L | Mobile (<480px): Innenabstand horizontal (Inhalt Inhalt) — lokal in `.t-PageBody--noContentPadding`; Fallback `.5rem` |
| `--ut-xs-body-content-padding-y` | — | — | 1 | L | Mobile (<480px): Innenabstand vertikal (Inhalt Inhalt) — lokal in `.t-PageBody--noContentPadding`; Fallback `.5rem` |

### 10.6 Header (9)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-header-background-color` | `#056AC8` | = Vita | 1 | ◆ TR | Hintergrund des Headers (t-Header). In Vita = Primärfarbe als Hex-Kopie. |
| `--ut-header-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 1 | ◆ | Header (t-Header): Randfarbe |
| `--ut-header-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 | ◆ | Header (t-Header): Schatten |
| `--ut-header-height` | `3rem` | = Vita | 2 | ◇ TR | Header-Höhe (Theme Roller Layout, 48–80px). |
| `--ut-header-text-color` | `white` | = Vita | 1 | ◆ TR | Text/Icon-Farbe im Header (Logo, Navigation Bar). |
| `--ut-logo-font-weight` | — | — | 1 | L | Logo im Header: Schriftstärke — Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--ut-logo-img-spacing` | — | — | 1 | L | Logo im Header: Abstand (img) — Fallback `0.25rem` |
| `--ut-navbar-button-badge-background-color` | `rgba(0, 0, 0, 0.3)` | = Vita | 1 |  | Navigation Bar (Header-Buttons): Hintergrundfarbe (Button Badge) |
| `--ut-navbar-button-badge-border-radius` | `16px` | = Vita | 1 |  | Navigation Bar (Header-Buttons): Eckenradius (Button Badge) |

### 10.7 Navigation (Side/Top/Tree/NavTabs) (109)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-menubar-background-color` | `#f0f0f0` | = Vita | 3 |  | Menüleiste (a-MenuBar, Top-Nav): Hintergrundfarbe |
| `--a-menubar-item-background-color` | `transparent` | = Vita | 2 |  | Menüleiste (a-MenuBar, Top-Nav): Hintergrundfarbe (Eintrag) |
| `--a-menubar-item-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 3 |  | Menüleiste (a-MenuBar, Top-Nav): Randfarbe (Eintrag) |
| `--a-menubar-item-border-width` | — | — | 7 | L | Menüleiste (a-MenuBar, Top-Nav): Randbreite (Eintrag) — lokal in `.t-Header-nav`; Fallback `1px` |
| `--a-menubar-item-current-background-color` | `#fff` | = Vita | 2 |  | Menüleiste (a-MenuBar, Top-Nav): Hintergrundfarbe (Eintrag aktuell) |
| `--a-menubar-item-current-text-color` | `#000` | = Vita | 2 |  | Menüleiste (a-MenuBar, Top-Nav): Textfarbe (Eintrag aktuell) |
| `--a-menubar-item-focused-background-color` | — | — | 1 | L | Menüleiste (a-MenuBar, Top-Nav): Hintergrundfarbe (Eintrag fokussiert) — lokal in `.t-Header-nav` |
| `--a-menubar-item-focused-text-color` | — | — | 1 | L | Menüleiste (a-MenuBar, Top-Nav): Textfarbe (Eintrag fokussiert) — lokal in `.t-Header-nav` |
| `--a-menubar-item-font-size` | — | — | 2 | L | Menüleiste (a-MenuBar, Top-Nav): Schriftgröße (Eintrag) — lokal in `.t-Header-nav`; Fallback `inherit` |
| `--a-menubar-item-font-weight` | — | — | 2 | L | Menüleiste (a-MenuBar, Top-Nav): Schriftstärke (Eintrag) — lokal in `.t-MenuBar:not(.a-MenuBar).js-tabLike li[data-current=true]` …; Fallback `normal` |
| `--a-menubar-item-line-height` | — | — | 4 | L | Menüleiste (a-MenuBar, Top-Nav): Zeilenhöhe (Eintrag) — lokal in `.t-Header-nav`; Fallback `inherit` |
| `--a-menubar-item-padding-x` | `.5rem` | = Vita | 4 |  | Menüleiste (a-MenuBar, Top-Nav): Innenabstand horizontal (Eintrag) |
| `--a-menubar-item-padding-y` | `.5rem` | = Vita | 5 |  | Menüleiste (a-MenuBar, Top-Nav): Innenabstand vertikal (Eintrag) |
| `--a-menubar-item-split-border-color` | `rgba(0, 0, 0, .025)` | = Vita | 2 |  | Menüleiste (a-MenuBar, Top-Nav): Randfarbe (Eintrag Split) |
| `--a-menubar-item-split-border-width` | — | — | 2 | L | Menüleiste (a-MenuBar, Top-Nav): Randbreite (Eintrag Split) — lokal in `.t-Header-nav`; Fallback `var(--a-menubar-item-border-width, 1px)` |
| `--a-menubar-item-split-icon-color` | `rgba(0, 0, 0, .25)` | = Vita | 1 |  | Menüleiste (a-MenuBar, Top-Nav): Farbe (Eintrag Split Icon) |
| `--a-menubar-item-split-icon-size` | `1rem` | = Vita | 3 |  | Menüleiste (a-MenuBar, Top-Nav): Größe (Eintrag Split Icon) |
| `--a-menubar-item-split-icon-spacing` | `.5rem` | = Vita | 3 |  | Menüleiste (a-MenuBar, Top-Nav): Abstand (Eintrag Split Icon) |
| `--a-menubar-item-text-color` | `inherit` | = Vita | 2 |  | Menüleiste (a-MenuBar, Top-Nav): Textfarbe (Eintrag) |
| `--a-treeview-disabled-background-color` | `rgba(0, 0, 0, .1)` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (deaktiviert) |
| `--a-treeview-drag-helper-backdrop-filter` | `blur(2px)` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Backdrop-Filter (Drag Helfer) |
| `--a-treeview-drag-helper-background-color` | `rgba(229, 238, 251, .6)` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Drag Helfer) |
| `--a-treeview-drag-helper-border-color` | `#9EA9B7` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Randfarbe (Drag Helfer) |
| `--a-treeview-drag-helper-border-radius` | `.125rem` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Eckenradius (Drag Helfer) |
| `--a-treeview-drag-helper-shadow` | `none` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Schatten (Drag Helfer) |
| `--a-treeview-node-active-background-color` | `#FFFFA3` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten aktiv) |
| `--a-treeview-node-active-text-color` | `#000` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Knoten aktiv) |
| `--a-treeview-node-cursor` | — | — | 2 | L | TreeView-Widget (a-TreeView, auch Side-Nav): Cursor (Knoten) — lokal in `.t-TreeNav` …; Fallback `default` |
| `--a-treeview-node-focused-background-color` | `#171a1d` | = Vita | 1 | ◇ TR | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten fokussiert) |
| `--a-treeview-node-focused-shadow` | `inset 0 0 0 1px rgba(57, 155, 234, .5)` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Schatten (Knoten fokussiert) |
| `--a-treeview-node-focused-text-color` | `white` | = Vita | 3 | ◇ TR | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Knoten fokussiert) |
| `--a-treeview-node-font-size` | `.75rem` | = Vita | 2 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Schriftgröße (Knoten) |
| `--a-treeview-node-font-weight` | — | — | 1 | L | TreeView-Widget (a-TreeView, auch Side-Nav): Schriftstärke (Knoten) — lokal in `.t-TreeNav .is-current, .t-TreeNav .is-current--top` |
| `--a-treeview-node-hover-background-color` | `rgba(0, 0, 0, .05)` | = Vita | 1 | ◇ | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten Hover) |
| `--a-treeview-node-hover-text-color` | `inherit` | = Vita | 0 | ∅ | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Knoten Hover) |
| `--a-treeview-node-icon-color` | `inherit` | = Vita | 1 | TR | TreeView-Widget (a-TreeView, auch Side-Nav): Farbe (Knoten Icon) |
| `--a-treeview-node-icon-size` | `1rem` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Größe (Knoten Icon) |
| `--a-treeview-node-indent` | `calc(var(--a-treeview-toggle-size, 16px) + va…` → `calc(1rem + .25rem)` | = Vita | 3 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Einrückung (Knoten) |
| `--a-treeview-node-line-height` | `1rem` | = Vita | 6 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Zeilenhöhe (Knoten) |
| `--a-treeview-node-padding-x` | `.25rem` | = Vita | 9 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Innenabstand horizontal (Knoten) |
| `--a-treeview-node-padding-y` | `.25rem` | = Vita | 10 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Innenabstand vertikal (Knoten) |
| `--a-treeview-node-placeholder-background-color` | `#FFFFA3` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten Platzhalter) |
| `--a-treeview-node-placeholder-border-radius` | `.125rem` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Eckenradius (Knoten Platzhalter) |
| `--a-treeview-node-placeholder-fill-background-color` | `rgba(0, 0, 0, .15)` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Hintergrundfarbe (Knoten Platzhalter fill) |
| `--a-treeview-node-selected-background-color` | `#171a1d` | = Vita | 3 | ◆ TR | Side-Nav: Hintergrund des ausgewählten Eintrags (Theme Roller „Navigation > Selected State“). |
| `--a-treeview-node-selected-icon-color` | `white` | = Vita | 1 | TR | TreeView-Widget (a-TreeView, auch Side-Nav): Farbe (Knoten ausgewählt Icon) |
| `--a-treeview-node-selected-text-color` | `white` | = Vita | 6 | ◆ TR | Side-Nav: Textfarbe des ausgewählten Eintrags. |
| `--a-treeview-node-text-color` | `inherit` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Knoten) |
| `--a-treeview-toggle-cursor` | `pointer` | = Vita | 1 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Cursor (Toggle) |
| `--a-treeview-toggle-size` | `1rem` | = Vita | 6 |  | TreeView-Widget (a-TreeView, auch Side-Nav): Größe (Toggle) |
| `--a-treeview-toggle-text-color` | — | — | 1 | L | TreeView-Widget (a-TreeView, auch Side-Nav): Textfarbe (Toggle) — lokal in `.a-TreeView-row.is-focused + .a-TreeView-toggle, .a-TreeVie…`; Fallback `inherit` |
| `--ut-body-nav-background-color` | `#2e3439` | = Vita | 1 | ◆ TR | Hintergrund der Side-Navigation (t-Body-nav / t-TreeNav). |
| `--ut-body-nav-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 2 | ◇ | Side-Navigation (t-Body-nav): Randfarbe |
| `--ut-body-nav-scrollbar-thumb-background-color` | `rgba(255, 255, 255, 0.2)` | = Vita | 1 | TR | Side-Navigation (t-Body-nav): Hintergrundfarbe (Scrollbar Thumb) |
| `--ut-body-nav-scrollbar-track-background-color` | `#2e3439` | = Vita | 1 | TR | Side-Navigation (t-Body-nav): Hintergrundfarbe (Scrollbar Track) |
| `--ut-body-nav-text-color` | `white` | = Vita | 1 | ◆ TR | Text-/Icon-Farbe der Side-Navigation. |
| `--ut-header-menubar-background-color` | `#2e3439` | = Vita | 1 | ◆ TR | Top-Navigation (Menüleiste unter dem Header): Hintergrund. |
| `--ut-header-menubar-item-border-color` | `rgba(255, 255, 255, 0.1)` | `rgba(0, 0, 0, 0.1)` | 1 | TR | Top-Navigation-Menüleiste (t-Header-nav): Randfarbe (Eintrag) |
| `--ut-header-menubar-item-current-background-color` | `#171a1d` | = Vita | 2 | ◆ TR | Top-Navigation: Hintergrund des aktuellen Eintrags. |
| `--ut-header-menubar-item-current-text-color` | `white` | = Vita | 2 | ◆ TR | Top-Navigation: Textfarbe des aktuellen Eintrags. |
| `--ut-header-menubar-item-hover-background-color` | `var(--ut-header-menubar-item-current-backgrou…` → `#171a1d` | = Vita | 1 | TR | Top-Navigation-Menüleiste (t-Header-nav): Hintergrundfarbe (Eintrag Hover) |
| `--ut-header-menubar-item-hover-text-color` | `var(--ut-header-menubar-item-current-text-col…` → `#fff` | = Vita | 1 | TR | Top-Navigation-Menüleiste (t-Header-nav): Textfarbe (Eintrag Hover) |
| `--ut-header-menubar-item-split-border-color` | `rgba(255, 255, 255, 0.1)` | `rgba(0, 0, 0, 0.1)` | 1 | TR | Top-Navigation-Menüleiste (t-Header-nav): Randfarbe (Eintrag Split) |
| `--ut-header-menubar-item-split-icon-color` | `white` | = Vita | 1 | TR | Top-Navigation-Menüleiste (t-Header-nav): Farbe (Eintrag Split Icon) |
| `--ut-header-menubar-item-text-color` | `white` | = Vita | 1 | ◆ TR | Top-Navigation: Textfarbe der Einträge. |
| `--ut-megamenu-desc-margin` | — | — | 1 | L | Mega Menu: Außenabstand (Beschreibung) — lokal in `.t-MegaMenu-list--sub`; Fallback `0` |
| `--ut-megamenu-icon-offset` | — | — | 3 | L | Mega Menu: Versatz (Icon) — lokal in `.t-MegaMenu-item` …; Fallback `1.5rem` |
| `--ut-megamenu-icon-opacity` | — | — | 1 | L | Mega Menu: Deckkraft (Icon) — lokal in `.t-MegaMenu-list--sub .t-Icon` |
| `--ut-megamenu-icon-size` | — | — | 2 | L | Mega Menu: Größe (Icon) — lokal in `.t-MegaMenu-list--top > .t-MegaMenu-item > .t-MegaMenu-item…`; Fallback `1rem` |
| `--ut-megamenu-item-padding-y` | — | — | 2 | L | Mega Menu: Innenabstand vertikal (Eintrag) — lokal in `.t-MegaMenu-list--sub`; Fallback `0` |
| `--ut-megamenu-label-font-size` | — | — | 1 | L | Mega Menu: Schriftgröße (Label) — lokal in `.t-MegaMenu-list--sub`; Fallback `0.875rem` |
| `--ut-megamenu-label-font-weight` | — | — | 1 | L | Mega Menu: Schriftstärke (Label) — lokal in `.t-MegaMenu-item--top > .t-MegaMenu-itemBody .t-MegaMenu-la…` …; Fallback `400` |
| `--ut-nav-collapsed-icon-width` | — | — | 1 | L | Side-Navigation: Breite (eingeklappt Icon) — lokal in `@media (max-width: 479px) » .apex-side-nav.js-navCollapsed-…`; Fallback `52px` |
| `--ut-nav-collapsed-width` | — | — | 2 | L | Side-Navigation: Breite (eingeklappt) — lokal in `@media (max-width: 479px) » .apex-side-nav.js-navCollapsed` …; Fallback `auto` |
| `--ut-nav-initial-width` | — | — | 1 | L | Side-Navigation: Breite (initial) — lokal in `.js-navExpanded`; Fallback `0` |
| `--ut-nav-width` | `15rem` | = Vita | 2 | ◇ TR | Breite der aufgeklappten Side-Navigation. |
| `--ut-navtabs-background-color` | `#2e3439` | = Vita | 1 | ◇ TR | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe |
| `--ut-navtabs-icon-padding` | — | — | 1 | L | Mobile Navigations-Tabs (t-NavTabs): Innenabstand (Icon) — lokal in `@media (max-width: 767px) » .t-NavTabs-link`; Fallback `0.25rem` |
| `--ut-navtabs-item-active-background-color` | `#171a1d` | = Vita | 2 | ◇ TR | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe (Eintrag aktiv) |
| `--ut-navtabs-item-active-highlight-color` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 1 |  | Mobile Navigations-Tabs (t-NavTabs): Farbe (Eintrag aktiv Hervorhebung) |
| `--ut-navtabs-item-background-color` | — | — | 1 | L | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe (Eintrag) — lokal in `.t-NavTabs-item.is-active .t-NavTabs-link` … |
| `--ut-navtabs-item-border-color` | `rgba(255, 255, 255, 0.1)` | `rgba(0, 0, 0, 0.1)` | 2 | TR | Mobile Navigations-Tabs (t-NavTabs): Randfarbe (Eintrag) |
| `--ut-navtabs-item-border-width` | `1px` | = Vita | 2 |  | Mobile Navigations-Tabs (t-NavTabs): Randbreite (Eintrag) |
| `--ut-navtabs-item-font-weight` | — | — | 1 | L | Mobile Navigations-Tabs (t-NavTabs): Schriftstärke (Eintrag) — lokal in `.t-NavTabs-item.is-active .t-NavTabs-link` |
| `--ut-navtabs-item-highlight-color` | `transparent` | = Vita | 1 |  | Mobile Navigations-Tabs (t-NavTabs): Farbe (Eintrag Hervorhebung) |
| `--ut-navtabs-item-highlight-width` | `0rem` | = Vita | 1 |  | Mobile Navigations-Tabs (t-NavTabs): Breite (Eintrag Hervorhebung) |
| `--ut-navtabs-item-hover-background-color` | `var(--ut-navtabs-item-active-background-color)` → `#171a1d` | = Vita | 1 | TR | Mobile Navigations-Tabs (t-NavTabs): Hintergrundfarbe (Eintrag Hover) |
| `--ut-navtabs-item-padding-x` | — | — | 2 | L | Mobile Navigations-Tabs (t-NavTabs): Innenabstand horizontal (Eintrag) — lokal in `@media (max-width: 767px) » .t-NavTabs-link` …; Fallback `0.25rem` |
| `--ut-navtabs-item-padding-y` | — | — | 2 | L | Mobile Navigations-Tabs (t-NavTabs): Innenabstand vertikal (Eintrag) — lokal in `@media (max-width: 767px) » .t-NavTabs-link`; Fallback `0.5rem` |
| `--ut-navtabs-item-text-color` | — | — | 1 | L | Mobile Navigations-Tabs (t-NavTabs): Textfarbe (Eintrag) — lokal in `.t-NavTabs-item.is-active .t-NavTabs-link` …; Fallback `currentColor` |
| `--ut-navtabs-text-color` | `white` | = Vita | 1 | ◇ TR | Mobile Navigations-Tabs (t-NavTabs): Textfarbe |
| `--ut-treeview-badge-background-color` | `#056AC8` | = Vita | 2 | ◇ TR | Badge in der Side-Navigation (Hex-Kopie der Primärfarbe). |
| `--ut-treeview-badge-border-radius` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Eckenradius (Badge) — lokal in `.apex-side-nav.js-navCollapsed .t-TreeNav .a-TreeView-badge` …; Fallback `0.25rem` |
| `--ut-treeview-badge-font-size` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Schriftgröße (Badge) — lokal in `.apex-side-nav.js-navCollapsed .t-TreeNav .a-TreeView-badge`; Fallback `0.6875rem` |
| `--ut-treeview-badge-font-weight` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Schriftstärke (Badge) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB` |
| `--ut-treeview-badge-line-height` | — | — | 2 | L | Tree-Navigation (t-TreeNav): Zeilenhöhe (Badge) — lokal in `.apex-side-nav.js-navCollapsed .t-TreeNav .a-TreeView-badge`; Fallback `1.25rem` |
| `--ut-treeview-badge-padding-x` | — | — | 3 | L | Tree-Navigation (t-TreeNav): Innenabstand horizontal (Badge) — lokal in `.apex-side-nav.js-navCollapsed .t-TreeNav .a-TreeView-badge`; Fallback `0.375rem` |
| `--ut-treeview-badge-text-color` | `white` | = Vita | 2 | ◇ TR | Tree-Navigation (t-TreeNav): Textfarbe (Badge) |
| `--ut-treeview-icon-container-height` | — | — | 4 | L | Tree-Navigation (t-TreeNav): Höhe (Icon Container) — lokal in `.t-TreeNav .a-TreeView-node--topLevel > .a-TreeView-content` …; Fallback `1rem` |
| `--ut-treeview-icon-container-width` | — | — | 3 | L | Tree-Navigation (t-TreeNav): Breite (Icon Container) — lokal in `.t-TreeNav .a-TreeView-node--topLevel` …; Fallback `auto` |
| `--ut-treeview-icon-opacity` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Deckkraft (Icon) — lokal in `.a-TreeView-content.is-selected > .fa` |
| `--ut-treeview-icon-size` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Größe (Icon) — lokal in `.t-TreeNav .a-TreeView-node--topLevel > ul` …; Fallback `1rem` |
| `--ut-treeview-leaf-node-indent` | — | — | 2 | L | Tree-Navigation (t-TreeNav): Einrückung (Blatt Knoten) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB`; Fallback `var(--ut-treeview-node-indent-placehold…` |
| `--ut-treeview-node-icon-container-width` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Breite (Knoten Icon Container) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB`; Fallback `auto` |
| `--ut-treeview-node-icon-size` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Größe (Knoten Icon) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB` |
| `--ut-treeview-node-indent` | — | — | 1 | L | Tree-Navigation (t-TreeNav): Einrückung (Knoten) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB`; Fallback `1rem` |
| `--ut-treeview-node-indent-placeholder` | — | — | 2 | L | Tree-Navigation (t-TreeNav): Knoten indent Platzhalter — lokal in `.t-TreeNav .a-TreeView-node--topLevel > ul` |
| `--ut-treeview-toplevel-icon-container-width` | — | — | 2 | L | Tree-Navigation (t-TreeNav): Breite (oberste Ebene Icon Container) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB`; Fallback `1.5rem` |
| `--ut-treeview-toplevel-leaf-padding-y` | — | — | 2 | L | Tree-Navigation (t-TreeNav): Innenabstand vertikal (oberste Ebene Blatt) — lokal in `.t-TreeNav--styleA, .t-TreeNav--styleB`; Fallback `0.5rem` |

### 10.8 Title Bar/Breadcrumb/Hero (24)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-body-title-backdrop-filter` | `saturate(180%) blur(8px)` | = Vita | 1 |  | Title Bar (t-Body-title): Backdrop-Filter |
| `--ut-body-title-background-color` | `white` | `#2c2e31` | 3 | ◆ TR | Hintergrund der Title Bar / Breadcrumb-Leiste (sticky, mit Backdrop-Filter). |
| `--ut-body-title-border-width` | `0px` | = Vita | 1 |  | Title Bar (t-Body-title): Randbreite |
| `--ut-body-title-box-shadow` | `0 1px 0 0 rgba(0, 0, 0, 0.1)` | `0 1px 0 0 rgba(255, 255, 255, 0.15)` | 2 | ◆ | Title Bar (t-Body-title): Schatten |
| `--ut-body-title-text-color` | `black` | `white` | 4 | ◆ TR | Textfarbe der Title Bar; speist Breadcrumb-Aktivfarbe und Hero-Titel. |
| `--ut-breadcrumb-item-active-text-color` | `var(--ut-body-title-text-color)` → `#000` | `var(--ut-body-title-text-color)` → `#fff` | 1 |  | Breadcrumb/Title-Bar-Region: Textfarbe (Eintrag aktiv) |
| `--ut-breadcrumb-item-text-color` | `rgba(0, 0, 0, 0.65)` | `rgba(255, 255, 255, 0.65)` | 1 | ◆ TR | Breadcrumb/Title-Bar-Region: Textfarbe (Eintrag) |
| `--ut-breadcrumb-padding-x` | — | — | 5 | L | Breadcrumb/Title-Bar-Region: Innenabstand horizontal — lokal in `@media (max-width: 639px) » .t-BreadcrumbRegion`; Fallback `1rem` |
| `--ut-breadcrumb-padding-y` | — | — | 7 | L | Breadcrumb/Title-Bar-Region: Innenabstand vertikal — lokal in `@media (max-width: 639px) » .t-BreadcrumbRegion` …; Fallback `0.5rem` |
| `--ut-breadcrumb-region-spacing` | `.5rem` | = Vita | 2 |  | Breadcrumb/Title-Bar-Region: Abstand (Region) |
| `--ut-breadcrumb-title-font-weight` | — | — | 1 | L | Breadcrumb/Title-Bar-Region: Schriftstärke (Titel) — Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--ut-hero-region-content-text-color` | — | — | 1 | L | Hero Region: Textfarbe (Inhalt) — lokal in `.t-Body-title .t-HeroRegion-col--content`; Fallback `var(--ut-component-text-muted-color)` |
| `--ut-hero-region-font-size` | — | — | 1 | L | Hero Region: Schriftgröße — lokal in `@media (max-width: 639px) » .t-HeroRegion-col--content`; Fallback `1rem` |
| `--ut-hero-region-icon-border-radius` | — | — | 1 | L | Hero Region: Eckenradius (Icon) — lokal in `.t-HeroRegion--iconsSquare` …; Fallback `12.5%` |
| `--ut-hero-region-icon-container-size` | — | — | 3 | L | Hero Region: Größe (Icon Container) — lokal in `@media (max-width: 639px) » .t-HeroRegion-icon` …; Fallback `4rem` |
| `--ut-hero-region-icon-size` | — | — | 1 | L | Hero Region: Größe (Icon) — lokal in `@media (max-width: 639px) » .t-HeroRegion-icon` …; Fallback `2rem` |
| `--ut-hero-region-icon-spacing` | — | — | 1 | L | Hero Region: Abstand (Icon) — lokal in `@media (max-width: 639px) » .t-HeroRegion-icon`; Fallback `1rem` |
| `--ut-hero-region-line-height` | — | — | 1 | L | Hero Region: Zeilenhöhe — lokal in `@media (max-width: 639px) » .t-HeroRegion-col--content`; Fallback `1.5rem` |
| `--ut-hero-region-padding-x` | — | — | 1 | L | Hero Region: Innenabstand horizontal — lokal in `@media (max-width: 639px) » .t-HeroRegion` …; Fallback `1rem` |
| `--ut-hero-region-padding-y` | — | — | 3 | L | Hero Region: Innenabstand vertikal — lokal in `@media (max-width: 639px) » .t-HeroRegion` …; Fallback `1rem` |
| `--ut-hero-region-spacing` | — | — | 2 | L | Hero Region: Abstand — lokal in `@media (max-width: 639px) » .t-HeroRegion-bottom`; Fallback `var(--ut-hero-region-padding-y, 1rem)` |
| `--ut-hero-region-title-font-family` | — | — | 1 | L | Hero Region: Schriftfamilie (Titel) — lokal in `.t-HeroRegion--headingFontAlt` |
| `--ut-hero-region-title-font-weight` | — | — | 1 | L | Hero Region: Schriftstärke (Titel) — lokal in `.t-HeroRegion--headingFontAlt`; Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--ut-hero-region-title-text-color` | `var(--ut-body-title-text-color)` → `#000` | `var(--ut-body-title-text-color)` → `#fff` | 2 |  | Hero Region: Textfarbe (Titel) |

### 10.9 Regions (39)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-button-region-background-color` | — | — | 1 | L | Button Container (t-ButtonRegion): Hintergrundfarbe — lokal in `.t-ButtonRegion--noUI` …; Fallback `var(--ut-component-background-color)` |
| `--ut-button-region-border-radius` | — | — | 1 | L | Button Container (t-ButtonRegion): Eckenradius — lokal in `@media (max-width: 639px) » .t-ButtonRegion--stickToBottom` … |
| `--ut-button-region-border-width` | — | — | 3 | L | Button Container (t-ButtonRegion): Randbreite — lokal in `.t-ButtonRegion--noUI` …; Fallback `1px` |
| `--ut-button-region-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 |  | Button Container (t-ButtonRegion): Schatten |
| `--ut-button-region-margin` | — | — | 1 | L | Button Container (t-ButtonRegion): Außenabstand — lokal in `.t-Alert .t-ButtonRegion` …; Fallback `0.75rem` |
| `--ut-button-region-padding` | — | — | 7 | L | Button Container (t-ButtonRegion): Innenabstand — lokal in `.js-rightCollapsed .t-Body-actions .t-ButtonRegion` …; Fallback `1rem` |
| `--ut-button-region-text-color` | — | — | 1 | L | Button Container (t-ButtonRegion): Textfarbe — lokal in `.t-ButtonRegion--noUI`; Fallback `var(--ut-component-text-default-color)` |
| `--ut-content-block-background-color` | — | — | 1 | L | Content Block: Hintergrundfarbe — lokal in `.t-ContentBlock--shadowBG` … |
| `--ut-content-block-border-width` | — | — | 1 | L | Content Block: Randbreite — lokal in `.t-ContentBlock--shadowBG` …; Fallback `0` |
| `--ut-content-block-box-shadow` | — | — | 1 | L | Content Block: Schatten — lokal in `.t-ContentBlock--shadowBG` … |
| `--ut-content-block-header-font-size` | — | — | 1 | L | Content Block: Schriftgröße (Kopf) — lokal in `.t-ContentBlock--h1` … |
| `--ut-content-block-header-font-weight` | — | — | 1 | L | Content Block: Schriftstärke (Kopf) — Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--ut-content-block-header-item-spacing` | — | — | 3 | L | Content Block: Abstand (Kopf Eintrag) — lokal in `.t-ContentBlock-title:last-child`; Fallback `0.75rem` |
| `--ut-content-block-header-margin` | — | — | 1 | L | Content Block: Außenabstand (Kopf) — lokal in `.t-ContentBlock--h1` … |
| `--ut-content-block-margin` | — | — | 1 | L | Content Block: Außenabstand — lokal in `@media (max-width: 639px) » .t-ContentBlock`; Fallback `2rem` |
| `--ut-content-block-padding-x` | — | — | 2 | L | Content Block: Innenabstand horizontal — lokal in `.t-ContentBlock--padded` |
| `--ut-content-block-padding-y` | — | — | 2 | L | Content Block: Innenabstand vertikal — lokal in `.t-ContentBlock--padded` |
| `--ut-irr-region-box-shadow` | — | — | 1 | L | IR-Region-Container: Schatten — lokal in `.t-Region .t-IRR-region` |
| `--ut-irr-region-margin` | — | — | 1 | L | IR-Region-Container: Außenabstand — lokal in `.t-Region .t-IRR-region`; Fallback `1rem` |
| `--ut-region-background-color` | `white` | `#1b1d1e` | 5 | ◆ TR | Hintergrund von Regionen (t-Region) – und über Fallback von Dialogen (--jui-dialog-background-color). |
| `--ut-region-body-padding-x` | `1rem` | = Vita | 2 |  | Standard-Region (t-Region): Innenabstand horizontal (Inhalt) |
| `--ut-region-body-padding-y` | `1rem` | = Vita | 6 |  | Standard-Region (t-Region): Innenabstand vertikal (Inhalt) |
| `--ut-region-border-radius` | — | — | 8 | ◆ L | Eckenradius der Regionen; auf :root NICHT gesetzt (nur 0 in Side-/Actions-Spalte) → Fallback var(--ut-component-border-radius). — lokal in `.t-Body-side .t-Region, .t-Body-actions .t-Region`; Fallback `var(--ut-component-border-radius)` |
| `--ut-region-border-width` | `1px` | = Vita | 12 | ◇ | Standard-Region (t-Region): Randbreite |
| `--ut-region-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 4 | ◆ | Standard-Region (t-Region): Schatten |
| `--ut-region-buttons-padding-x` | `.75rem` | = Vita | 2 |  | Standard-Region (t-Region): Innenabstand horizontal (buttons) |
| `--ut-region-buttons-padding-y` | `.5rem` | = Vita | 2 |  | Standard-Region (t-Region): Innenabstand vertikal (buttons) |
| `--ut-region-font-size` | `.875rem` | = Vita | 1 |  | Standard-Region (t-Region): Schriftgröße |
| `--ut-region-header-background-color` | `white` | `#111213` | 3 | ◆ TR | Hintergrund des Region-Kopfes; speist --a-gv-header-background-color und --a-toolbar-background-color. |
| `--ut-region-header-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 1 | ◇ | Standard-Region (t-Region): Randfarbe (Kopf) |
| `--ut-region-header-border-width` | — | — | 1 | L | Standard-Region (t-Region): Randbreite (Kopf) — lokal in `.t-Region--hideShow.is-collapsed` …; Fallback `var(--ut-region-border-width, 1px)` |
| `--ut-region-header-font-size` | — | — | 1 | L | Standard-Region (t-Region): Schriftgröße (Kopf) — lokal in `.t-Body-actions .t-Region`; Fallback `1rem` |
| `--ut-region-header-line-height` | — | — | 1 | L | Standard-Region (t-Region): Zeilenhöhe (Kopf) — lokal in `.t-Body-actions .t-Region`; Fallback `1.5rem` |
| `--ut-region-header-padding-x` | — | — | 5 | L | Standard-Region (t-Region): Innenabstand horizontal (Kopf) — lokal in `.t-Region--noUI > .t-Region-header`; Fallback `0.75rem` |
| `--ut-region-header-text-color` | `#262626` | `#ebebeb` | 1 | ◆ TR | Textfarbe des Region-Titels. |
| `--ut-region-hideshow-header-padding-x` | — | — | 2 | L | Standard-Region (t-Region): Innenabstand horizontal (hideshow Kopf) — lokal in `.t-Region--controlsPosEnd .t-Region-headerItems--title`; Fallback `0.5rem` |
| `--ut-region-line-height` | `1.25rem` | = Vita | 3 |  | Standard-Region (t-Region): Zeilenhöhe |
| `--ut-region-margin` | `1rem` | = Vita | 1 |  | Standard-Region (t-Region): Außenabstand |
| `--ut-region-text-color` | `#262626` | `whitesmoke` | 3 | ◆ TR | Textfarbe in Regionen; speist --jui-dialog-text-color. |

### 10.10 Buttons (45)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-button-active-background-color` | `#e6e6e6` | `#1a1a1a` | 13 | ◆ | Button-Hintergrund gedrückt/aktiv. |
| `--a-button-active-border-color` | — | — | 11 | L | Button (a-Button/t-Button): Randfarbe (aktiv) — lokal in `.t-Button--header`; Fallback `var(--a-button-hover-border-color)` |
| `--a-button-active-shadow` | `0 2px 2px -1px rgba(0, 0, 0, 0.15) inset` | = Vita | 10 | ◇ | Button (a-Button/t-Button): Schatten (aktiv) |
| `--a-button-active-text-color` | — | — | 10 | L | Button (a-Button/t-Button): Textfarbe (aktiv) — lokal in `.a-FS-clearAll, .a-FS-clearButton, .a-FS-toggleOverflow` …; Fallback `var(--a-button-hover-text-color)` |
| `--a-button-background-color` | `#f8f8f8` | `#494a4b` | 18 | ◆ TR | Button-Hintergrund (Normal). Kette: --a-button-state-* > --a-button-type-* > --a-button-*. |
| `--a-button-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 20 | ◆ | Button-Randfarbe. |
| `--a-button-border-radius` | `0.125rem` | = Vita | 74 | ◆ TR | Button-Radius (Theme Roller „Buttons > Border Radius“). |
| `--a-button-border-width` | — | — | 95 | ◇ L | Button-Randbreite; nicht auf :root gesetzt (Fallback 1px), nur lokal (z. B. .t-Button--headerTree). — lokal in `.a-FS-clearAll, .a-FS-clearButton, .a-FS-toggleOverflow` …; Fallback `1px` |
| `--a-button-box-shadow` | — | — | 1 | L | Button (a-Button/t-Button): Schatten — lokal in `.t-Button--hot.t-Button--link, .a-Button--hot.t-Button--lin…` … |
| `--a-button-count-background-color` | `#056AC8` | = Vita | 2 | ◇ TR ★26 | Button (a-Button/t-Button): Hintergrundfarbe (Zähler) |
| `--a-button-count-text-color` | `white` | = Vita | 2 | TR ★26 | Button (a-Button/t-Button): Textfarbe (Zähler) |
| `--a-button-focus-background-color` | `var(--a-button-hover-background-color)` → `#fff` | `var(--a-button-hover-background-color)` → `#626465` | 8 |  | Button (a-Button/t-Button): Hintergrundfarbe (Fokus) |
| `--a-button-focus-border-color` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 8 | ◆ | Button-Randfarbe bei :focus-visible (Vita: var(--ut-palette-primary)). |
| `--a-button-focus-text-color` | — | — | 8 | L | Button (a-Button/t-Button): Textfarbe (Fokus) — lokal in `.a-FS-clearAll, .a-FS-clearButton, .a-FS-toggleOverflow` … |
| `--a-button-font-size` | `.75rem` | = Vita | 12 |  | Button (a-Button/t-Button): Schriftgröße |
| `--a-button-font-weight` | — | — | 11 | ◇ L | Button-Schriftstärke; nur lokal gesetzt (.t-Button--hot/.a-Button--hot = bold). — lokal in `.a-Button--hot` …; Fallback `400` |
| `--a-button-gap-x` | `.25rem` | = Vita | 13 |  | Button (a-Button/t-Button): Lücke horizontal |
| `--a-button-hover-background-color` | `white` | `#626465` | 26 | ◆ | Button-Hintergrund bei Hover (über --a-button-state-background-color). |
| `--a-button-hover-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 14 | ◇ | Button (a-Button/t-Button): Randfarbe (Hover) |
| `--a-button-hover-shadow` | `0 2px 4px -2px rgba(0, 0, 0, 0.1)` | = Vita | 11 | ◇ | Button (a-Button/t-Button): Schatten (Hover) |
| `--a-button-hover-text-color` | — | — | 25 | L | Button (a-Button/t-Button): Textfarbe (Hover) — lokal in `.a-FS-clearAll, .a-FS-clearButton, .a-FS-toggleOverflow` … |
| `--a-button-icon-size` | `1rem` | = Vita | 11 |  | Button (a-Button/t-Button): Größe (Icon) |
| `--a-button-icon-spacing` | `.375rem` | = Vita | 10 |  | Button (a-Button/t-Button): Abstand (Icon) |
| `--a-button-line-height` | `1rem` | = Vita | 12 |  | Button (a-Button/t-Button): Zeilenhöhe |
| `--a-button-padding` | — | — | 4 | L | Button (a-Button/t-Button): Innenabstand — lokal in `.apex-item-group--color-picker .a-Button--colorPickerOnly` …; Fallback `8px` |
| `--a-button-padding-x` | `.75rem` | = Vita | 31 |  | Button (a-Button/t-Button): Innenabstand horizontal |
| `--a-button-padding-y` | `.5rem` | = Vita | 29 |  | Button (a-Button/t-Button): Innenabstand vertikal |
| `--a-button-shadow` | `0 2px 4px -3px rgba(0, 0, 0, 0.1)` | = Vita | 8 | ◆ | Button-Schatten (Normal). |
| `--a-button-state-background-color` | — | — | 12 | L | Zustands-Slot: wird von :hover/:active/:focus-visible gesetzt und hat Vorrang vor type/base. — lokal in `.a-Button:hover, .u-Button:hover` …; Fallback `var(--a-button-type-background-color, v…` |
| `--a-button-state-border-color` | — | — | 9 | L | Button (a-Button/t-Button): Randfarbe (Zustands-Slot) — lokal in `.a-Button:hover, .u-Button:hover` …; Fallback `var(--a-button-type-border-color, var(-…` |
| `--a-button-state-shadow` | — | — | 8 | L | Button (a-Button/t-Button): Schatten (Zustands-Slot) — lokal in `.a-Button:hover, .u-Button:hover` …; Fallback `var(--a-button-type-shadow, var(--a-but…` |
| `--a-button-state-text-color` | — | — | 8 | L | Button (a-Button/t-Button): Textfarbe (Zustands-Slot) — lokal in `.a-Button:hover, .u-Button:hover` …; Fallback `var(--a-button-type-text-color, var(--a…` |
| `--a-button-text-color` | `#393939` | `white` | 22 | ◆ TR | Button-Textfarbe (Normal). |
| `--a-button-text-shadow` | — | — | 8 | L | Button (a-Button/t-Button): Schatten (Text) — lokal in `.a-Button--noUI, .a-Button--noUI:hover, .a-Button--noUI:act…`; Fallback `none` |
| `--a-button-type-background-color` | — | — | 9 | L | Varianten-Slot: gesetzt von .t-Button--simple/--noUI etc.; Vorrang vor Basiswert. — lokal in `.t-Button--simple` …; Fallback `var(--a-button-background-color, transp…` |
| `--a-button-type-border-color` | — | — | 9 | L | Button (a-Button/t-Button): Randfarbe (Varianten-Slot) — lokal in `.t-Button--noUI, .t-Button--noUI:hover, .t-Button--noUI:act…` …; Fallback `var(--a-button-border-color)` |
| `--a-button-type-shadow` | — | — | 8 | L | Button (a-Button/t-Button): Schatten (Varianten-Slot) — lokal in `.t-Button--simple` …; Fallback `var(--a-button-shadow, none)` |
| `--a-button-type-text-color` | — | — | 8 | L | Button (a-Button/t-Button): Textfarbe (Varianten-Slot) — lokal in `.t-Button--noUI, .t-Button--noUI:hover, .t-Button--noUI:act…`; Fallback `var(--a-button-text-color, inherit)` |
| `--a-button-zindex` | — | — | 4 | L | Button (a-Button/t-Button): z-index — lokal in `.a-Button:hover` … |
| `--ut-pillbutton-checkbox-line-height` | — | — | 1 | L | Pill Button/Radio-Group-Button: Zeilenhöhe (checkbox) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `var(--a-checkbox-size, 1rem)` |
| `--ut-pillbutton-checkbox-offset` | — | — | 4 | L | Pill Button/Radio-Group-Button: Versatz (checkbox) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `0.25rem` |
| `--ut-pillbutton-font-size` | — | — | 1 | L | Pill Button/Radio-Group-Button: Schriftgröße — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `0.75rem` |
| `--ut-pillbutton-line-height` | — | — | 1 | L | Pill Button/Radio-Group-Button: Zeilenhöhe — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `1rem` |
| `--ut-pillbutton-padding-x` | — | — | 2 | L | Pill Button/Radio-Group-Button: Innenabstand horizontal — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `0.5rem` |
| `--ut-pillbutton-padding-y` | — | — | 2 | L | Pill Button/Radio-Group-Button: Innenabstand vertikal — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `0.25rem` |

### 10.11 Formularfelder/Labels (251)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-chip-active-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (aktiv) |
| `--a-chip-applied-background-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 2 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (angewendet) |
| `--a-chip-applied-hover-background-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 2 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (angewendet Hover) |
| `--a-chip-applied-is-active-remove-active-background-color` | `rgba(255, 255, 255, .2)` | = Vita | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (angewendet is aktiv Entfernen aktiv) |
| `--a-chip-applied-is-active-remove-hover-background-color` | `rgba(255, 255, 255, .1)` | = Vita | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (angewendet is aktiv Entfernen Hover) |
| `--a-chip-border-color` | `var(--a-field-input-border-color)` → `#dfdfdf` | `var(--a-field-input-border-color)` → `#393d40` | 2 |  | Chip (Smart Filter/Combobox): Randfarbe |
| `--a-chip-border-radius` | `.125rem` | = Vita | 3 |  | Chip (Smart Filter/Combobox): Eckenradius |
| `--a-chip-border-width` | `var(--a-field-input-border-width)` → `1px` | = Vita | 5 |  | Chip (Smart Filter/Combobox): Randbreite |
| `--a-chip-font-size` | `.75rem` | = Vita | 1 |  | Chip (Smart Filter/Combobox): Schriftgröße |
| `--a-chip-hover-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (Hover) |
| `--a-chip-input-font-size` | `.75rem` | = Vita | 1 |  | Chip (Smart Filter/Combobox): Schriftgröße (Eingabe) |
| `--a-chip-input-line-height` | `1rem` | = Vita | 2 |  | Chip (Smart Filter/Combobox): Zeilenhöhe (Eingabe) |
| `--a-chip-label-spacing` | `.25rem` | = Vita | 7 |  | Chip (Smart Filter/Combobox): Abstand (Label) |
| `--a-chip-line-height` | `1rem` | = Vita | 1 |  | Chip (Smart Filter/Combobox): Zeilenhöhe |
| `--a-chip-padding-x` | `.25rem` | = Vita | 9 |  | Chip (Smart Filter/Combobox): Innenabstand horizontal |
| `--a-chip-padding-y` | `.125rem` | = Vita | 3 |  | Chip (Smart Filter/Combobox): Innenabstand vertikal |
| `--a-chip-remove-active-background-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (Entfernen aktiv) |
| `--a-chip-remove-active-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Entfernen aktiv) — lokal in `.a-Chip--applied.is-active` |
| `--a-chip-remove-background-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Hintergrundfarbe (Entfernen) — lokal in `.a-Chip--applied.is-active`; Fallback `transparent` |
| `--a-chip-remove-hover-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 |  | Chip (Smart Filter/Combobox): Hintergrundfarbe (Entfernen Hover) |
| `--a-chip-remove-hover-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Entfernen Hover) — lokal in `.a-Chip--applied.is-active` |
| `--a-chip-remove-padding` | — | — | 1 | L | Chip (Smart Filter/Combobox): Innenabstand (Entfernen) — lokal in `a-combobox` …; Fallback `2px` |
| `--a-chip-remove-state-background-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Hintergrundfarbe (Entfernen Zustands-Slot) — lokal in `.a-Chip-remove:hover` …; Fallback `var(--a-chip-remove-background-color, t…` |
| `--a-chip-remove-state-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Entfernen Zustands-Slot) — lokal in `.a-Chip-remove:hover` …; Fallback `var(--a-chip-remove-text-color, inherit)` |
| `--a-chip-remove-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Entfernen) — lokal in `.a-Chip--applied.is-active`; Fallback `inherit` |
| `--a-chip-spacing` | `.25rem` | = Vita | 9 |  | Chip (Smart Filter/Combobox): Abstand |
| `--a-chip-state-background-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Hintergrundfarbe (Zustands-Slot) — lokal in `.a-Chip:hover` …; Fallback `var(--a-chip-type-background-color, var…` |
| `--a-chip-state-border-color` | — | — | 2 | L | Chip (Smart Filter/Combobox): Randfarbe (Zustands-Slot) — lokal in `.a-Chip:hover` …; Fallback `var(--a-chip-type-border-color, var(--a…` |
| `--a-chip-state-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Zustands-Slot) — lokal in `.a-Chip:hover` …; Fallback `var(--a-chip-type-text-color, var(--a-c…` |
| `--a-chip-type-background-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Hintergrundfarbe (Varianten-Slot) — lokal in `.a-Chip--applied`; Fallback `var(--a-chip-background-color, transpar…` |
| `--a-chip-type-border-color` | — | — | 2 | L | Chip (Smart Filter/Combobox): Randfarbe (Varianten-Slot) — lokal in `.a-Chip--applied`; Fallback `var(--a-chip-border-color, var(--a-fiel…` |
| `--a-chip-type-text-color` | — | — | 1 | L | Chip (Smart Filter/Combobox): Textfarbe (Varianten-Slot) — lokal in `.a-Chip--applied`; Fallback `var(--a-chip-text-color, inherit)` |
| `--a-color-picker-color-only-height` | — | — | 1 | L | Color Picker: Höhe (color only) — lokal in `.apex-item-group--color-picker .a-Button--colorPickerOnly` …; Fallback `12px` |
| `--a-color-picker-color-only-width` | — | — | 1 | L | Color Picker: Breite (color only) — lokal in `.apex-item-group--color-picker .a-Button--colorPickerOnly` …; Fallback `32px` |
| `--a-color-picker-inline-border-width` | — | — | 1 | L | Color Picker: Randbreite (inline) — lokal in `.t-Form-fieldContainer--floatingLabel.apex-item-wrapper--co…`; Fallback `1px` |
| `--a-color-picker-inline-padding` | — | — | 1 | L | Color Picker: Innenabstand (inline) — lokal in `.t-Form-fieldContainer--floatingLabel.apex-item-wrapper--co…`; Fallback `8px` |
| `--a-color-picker-preset-1` | `var(--a-palette-color-1)` → `#309fdb` | = Vita | 0 | ∅ | Color Picker: preset 1 |
| `--a-color-picker-preset-2` | `var(--a-palette-color-2)` → `#13b6cf` | = Vita | 0 | ∅ | Color Picker: preset 2 |
| `--a-color-picker-preset-3` | `var(--a-palette-color-3)` → `#2ebfbc` | = Vita | 0 | ∅ | Color Picker: preset 3 |
| `--a-color-picker-preset-4` | `var(--a-palette-color-4)` → `#3caf85` | = Vita | 0 | ∅ | Color Picker: preset 4 |
| `--a-color-picker-preset-5` | `var(--a-palette-color-5)` → `#81bb5f` | = Vita | 0 | ∅ | Color Picker: preset 5 |
| `--a-color-picker-preset-6` | `var(--a-palette-color-6)` → `#ddde53` | = Vita | 0 | ∅ | Color Picker: preset 6 |
| `--a-color-picker-preset-7` | `var(--a-palette-color-7)` → `#fbce4a` | = Vita | 0 | ∅ | Color Picker: preset 7 |
| `--a-color-picker-preset-8` | `var(--a-palette-color-8)` → `#ed813e` | = Vita | 0 | ∅ | Color Picker: preset 8 |
| `--a-color-picker-preset-9` | `var(--a-palette-color-9)` → `#e95b54` | = Vita | 0 | ∅ | Color Picker: preset 9 |
| `--a-color-picker-preset-10` | `var(--a-palette-color-10)` → `#e85d88` | = Vita | 0 | ∅ | Color Picker: preset 10 |
| `--a-color-picker-preset-11` | `var(--a-palette-color-11)` → `#ca589d` | = Vita | 0 | ∅ | Color Picker: preset 11 |
| `--a-color-picker-preset-12` | `var(--a-palette-color-12)` → `#854e9b` | = Vita | 0 | ∅ | Color Picker: preset 12 |
| `--a-color-picker-preset-13` | `var(--a-palette-color-13)` → `#5a68ad` | = Vita | 0 | ∅ | Color Picker: preset 13 |
| `--a-color-picker-preset-14` | `var(--a-palette-color-14)` → `#afbac5` | = Vita | 0 | ∅ | Color Picker: preset 14 |
| `--a-color-picker-preset-15` | `var(--a-palette-color-15)` → `#6e8598` | = Vita | 0 | ∅ | Color Picker: preset 15 |
| `--a-combo-box-padding-x` | `.5rem` | = Vita | 1 |  | Combobox: Innenabstand horizontal (box) |
| `--a-combo-box-padding-y` | `.25rem` | = Vita | 1 |  | Combobox: Innenabstand vertikal (box) |
| `--a-combo-chip-label-spacing-x` | `0px` | = Vita | 2 |  | Combobox: Abstand horizontal (Chip Label) |
| `--a-combo-select-focus-outline` | `var(--ut-focus-outline)` | = Vita | 1 | ★26 | Combobox/Select-Many-Liste: Outline (Fokus) |
| `--a-combo-select-focus-outline-color` | `var(--ut-focus-outline-color)` → `#056ac8` | = Vita | 1 | ★26 | Combobox/Select-Many-Liste: Outline-Farbe (Fokus) |
| `--a-combo-select-icon-size` | `1rem` | = Vita | 1 |  | Combobox/Select-Many-Liste: Größe (Icon) |
| `--a-combo-select-item-hover-background-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Hintergrundfarbe (Eintrag Hover) — lokal in `.a-ComboSelect-item--no-results:hover`; Fallback `rgba(100, 100, 100, .1)` |
| `--a-combo-select-item-hover-text-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Textfarbe (Eintrag Hover) — lokal in `.a-ComboSelect-item--no-results:hover` |
| `--a-combo-select-item-selected-background-color` | `var(--ut-palette-primary-shade)` → `#e6f0fa` | `var(--ut-palette-primary-shade)` → `#010b14` | 1 |  | Combobox/Select-Many-Liste: Hintergrundfarbe (Eintrag ausgewählt) |
| `--a-combo-select-item-state-background-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Hintergrundfarbe (Eintrag Zustands-Slot) — lokal in `.a-ComboSelect-item:hover` …; Fallback `var(--a-combo-select-item-type-backgrou…` |
| `--a-combo-select-item-state-border-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Randfarbe (Eintrag Zustands-Slot) — lokal in `.a-ComboSelect-item.is-selected`; Fallback `var(--a-combo-select-item-type-border-c…` |
| `--a-combo-select-item-state-text-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Textfarbe (Eintrag Zustands-Slot) — lokal in `.a-ComboSelect-item:hover` …; Fallback `var(--a-combo-select-item-type-text-col…` |
| `--a-combo-select-outline-offset` | `0px` | = Vita | 1 | ★26 | Combobox/Select-Many-Liste: Outline-Abstand |
| `--a-combo-select-state-border-color` | — | — | 1 | L | Combobox/Select-Many-Liste: Randfarbe (Zustands-Slot) — lokal in `.apex-item-comboselect.has-focus, .apex-item-comboselect:fo…`; Fallback `var(--a-combo-select-border-color, var(…` |
| `--a-combobox-chip-font-size` | `.75rem` | = Vita | 4 |  | Combobox: Schriftgröße (Chip) |
| `--a-combobox-chip-line-height` | `.75rem` | = Vita | 2 |  | Combobox: Zeilenhöhe (Chip) |
| `--a-combobox-chips-gap` | `.125rem` | = Vita | 2 |  | Combobox: Lücke (gap) (chips) |
| `--a-combobox-gap` | `.25rem` | = Vita | 2 |  | Combobox: Lücke (gap) |
| `--a-comboselect-counter-margin-x` | — | — | 1 | L | Select Many (Zähler): Außenabstand horizontal (Zähler) — lokal in `a-select`; Fallback `2px` |
| `--a-comboselect-counter-size` | — | — | 3 | L | Select Many (Zähler): Größe (Zähler) — lokal in `.t-Form-fieldContainer--floatingLabel.apex-item-wrapper--se…`; Fallback `auto` |
| `--a-comboselect-counter-state-background-color` | — | — | 1 | L | Select Many (Zähler): Hintergrundfarbe (Zähler Zustands-Slot) — lokal in `a-select .a-ComboSelect-counter:hover` …; Fallback `var(--a-comboselect-counter-type-backgr…` |
| `--a-comboselect-counter-state-text-color` | — | — | 1 | L | Select Many (Zähler): Textfarbe (Zähler Zustands-Slot) — lokal in `a-select .a-ComboSelect-counter:hover` …; Fallback `var(--a-comboselect-counter-type-text-c…` |
| `--a-datepicker-background-color` | `var(--ut-component-toolbar-background-color)` → `rgba(0,0,0,.025)` | `var(--ut-component-toolbar-background-color)` → `hsla(0,0%,100%,.025)` | 4 |  | Date Picker (a-DatePicker): Hintergrundfarbe |
| `--a-datepicker-border-radius` | `var(--ut-border-radius)` → `.25rem` | = Vita | 1 |  | Date Picker (a-DatePicker): Eckenradius |
| `--a-datepicker-calendar-background-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender) |
| `--a-datepicker-calendar-day-background-color` | — | — | 1 | L | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Tag) — lokal in `.a-DatePicker-calendar td.is-current` … |
| `--a-datepicker-calendar-day-border-color` | — | — | 1 | L | Date Picker (a-DatePicker): Randfarbe (Kalender Tag) — lokal in `.a-DatePicker-calendar td.is-current` …; Fallback `transparent` |
| `--a-datepicker-calendar-day-border-radius` | `50%` | = Vita | 1 |  | Date Picker (a-DatePicker): Eckenradius (Kalender Tag) |
| `--a-datepicker-calendar-day-border-width` | `1px` | = Vita | 1 |  | Date Picker (a-DatePicker): Randbreite (Kalender Tag) |
| `--a-datepicker-calendar-day-current-background-color` | — | `rgba(255, 255, 255, .2)` | 2 | D | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Tag aktuell) |
| `--a-datepicker-calendar-day-current-border-color` | — | `rgba(255, 255, 255, .2)` | 2 | D | Date Picker (a-DatePicker): Randfarbe (Kalender Tag aktuell) |
| `--a-datepicker-calendar-day-current-text-color` | — | `var(--a-palette-primary-contrast)` → `#fff` | 2 | D | Date Picker (a-DatePicker): Textfarbe (Kalender Tag aktuell) |
| `--a-datepicker-calendar-day-font-size` | `.875rem` | = Vita | 3 |  | Date Picker (a-DatePicker): Schriftgröße (Kalender Tag) |
| `--a-datepicker-calendar-day-font-weight` | — | — | 1 | L | Date Picker (a-DatePicker): Schriftstärke (Kalender Tag) — lokal in `.a-DatePicker-calendar td.is-disabled`; Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--a-datepicker-calendar-day-hover-background-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Tag Hover) |
| `--a-datepicker-calendar-day-opacity` | — | — | 1 | L | Date Picker (a-DatePicker): Deckkraft (Kalender Tag) — lokal in `.a-DatePicker-calendar td.is-disabled` |
| `--a-datepicker-calendar-day-pointer` | — | — | 1 | L | Date Picker (a-DatePicker): Kalender Tag pointer — lokal in `.a-DatePicker-calendar td.is-disabled`; Fallback `pointer` |
| `--a-datepicker-calendar-day-selected-background-color` | `var(--a-palette-primary)` → `#056ac8` | = Vita | 1 | ◇ | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Tag ausgewählt) |
| `--a-datepicker-calendar-day-selected-border-color` | `var(--a-palette-primary)` → `#056ac8` | = Vita | 1 |  | Date Picker (a-DatePicker): Randfarbe (Kalender Tag ausgewählt) |
| `--a-datepicker-calendar-day-selected-text-color` | `var(--a-palette-primary-contrast)` → `#fff` | = Vita | 1 |  | Date Picker (a-DatePicker): Textfarbe (Kalender Tag ausgewählt) |
| `--a-datepicker-calendar-day-spacing` | `.5rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Abstand (Kalender Tag) |
| `--a-datepicker-calendar-day-text-color` | — | — | 1 | L | Date Picker (a-DatePicker): Textfarbe (Kalender Tag) — lokal in `.a-DatePicker-calendar td.is-current` … |
| `--a-datepicker-calendar-header-background-color` | `#f9f9f9` | `#060606` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Kopf) |
| `--a-datepicker-calendar-header-padding-x` | `var(--a-datepicker-calendar-day-spacing)` → `.5rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Innenabstand horizontal (Kalender Kopf) |
| `--a-datepicker-calendar-header-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Date Picker (a-DatePicker): Textfarbe (Kalender Kopf) |
| `--a-datepicker-calendar-title-background-color` | `#f9f9f9` | `#060606` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Titel) |
| `--a-datepicker-calendar-title-padding-x` | `.5rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Innenabstand horizontal (Kalender Titel) |
| `--a-datepicker-calendar-title-padding-y` | `.5rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Innenabstand vertikal (Kalender Titel) |
| `--a-datepicker-calendar-week-background-color` | `var(--ut-component-toolbar-background-color)` → `rgba(0,0,0,.025)` | `var(--ut-component-toolbar-background-color)` → `hsla(0,0%,100%,.025)` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kalender Woche) |
| `--a-datepicker-calendar-week-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Date Picker (a-DatePicker): Textfarbe (Kalender Woche) |
| `--a-datepicker-calendars-spacing` | `0px` | = Vita | 1 |  | Date Picker (a-DatePicker): Abstand (calendars) |
| `--a-datepicker-footer-background-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Fuß) |
| `--a-datepicker-footer-border-color` | `var(--ut-component-inner-border-color)` → `rgba(0,0,0,.05)` | `var(--ut-component-inner-border-color)` → `hsla(0,0%,100%,.1)` | 1 | TR ★26 | Date Picker (a-DatePicker): Randfarbe (Fuß) |
| `--a-datepicker-header-background-color` | `#f9f9f9` | `#060606` | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Kopf) |
| `--a-datepicker-header-border-color` | `transparent` | = Vita | 1 |  | Date Picker (a-DatePicker): Randfarbe (Kopf) |
| `--a-datepicker-monthpicker-select-background-color` | `transparent` | = Vita | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Monatsauswahl Auswahl) |
| `--a-datepicker-monthpicker-select-border-color` | `transparent` | = Vita | 1 |  | Date Picker (a-DatePicker): Randfarbe (Monatsauswahl Auswahl) |
| `--a-datepicker-monthpicker-select-font-size` | `1rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Schriftgröße (Monatsauswahl Auswahl) |
| `--a-datepicker-monthpicker-select-font-weight` | `var(--a-base-font-weight-semibold, 500)` → `600` | = Vita | 1 |  | Date Picker (a-DatePicker): Schriftstärke (Monatsauswahl Auswahl) |
| `--a-datepicker-timepicker-select-background-color` | `transparent` | = Vita | 1 |  | Date Picker (a-DatePicker): Hintergrundfarbe (Zeitauswahl Auswahl) |
| `--a-datepicker-timepicker-select-border-color` | `transparent` | = Vita | 1 |  | Date Picker (a-DatePicker): Randfarbe (Zeitauswahl Auswahl) |
| `--a-datepicker-timepicker-select-font-size` | `.875rem` | = Vita | 2 |  | Date Picker (a-DatePicker): Schriftgröße (Zeitauswahl Auswahl) |
| `--a-field-display-font-weight` | — | — | 2 | L | Eingabefeld (apex-item-*): Schriftstärke (display) — lokal in `.t-Form-fieldContainer--boldDisplay` …; Fallback `var(--a-field-input-font-weight, 400)` |
| `--a-field-input-background-color` | `#f9f9f9` | `#212325` | 23 | ◆ TR | Hintergrund von Eingabefeldern (Theme Roller „Forms > Item“). |
| `--a-field-input-border-color` | `#dfdfdf` | `#393d40` | 41 | ◆ TR | Randfarbe von Eingabefeldern; speist Filedrop, Markdown-Editor, Chips, Report-Controls. |
| `--a-field-input-border-radius` | `0.125rem` | `2px` | 32 | ◆ TR | Radius von Eingabefeldern (Theme Roller „Forms > Border Radius“). |
| `--a-field-input-border-style` | `solid` | = Vita | 1 | ☆26 | Randstil der Read-only-Felder. 24.2-Vita: dashed (aber unbenutzt), 26.1: solid und in Core.css referenziert. |
| `--a-field-input-border-width` | `1px` | = Vita | 97 | ◇ | Randbreite von Eingabefeldern (Theme-Standard.css: 1px; 97 Referenzen). |
| `--a-field-input-flex-grow` | — | — | 20 | L | Eingabefeld (apex-item-*): Eingabe flex grow — lokal in `.a-FS-body` … |
| `--a-field-input-focus-background-color` | `white` | `#09090a` | 6 | ◆ TR | Hintergrund fokussierter Felder. |
| `--a-field-input-focus-border-color` | `#056AC8` | = Vita | 15 | ◆ TR | Randfarbe fokussierter Felder (Vita: Hex-Kopie der Primärfarbe). |
| `--a-field-input-font-size` | — | — | 16 | L | Eingabefeld (apex-item-*): Schriftgröße (Eingabe) — lokal in `.t-Login-body` …; Fallback `12px` |
| `--a-field-input-hover-background-color` | `white` | `#151617` | 5 | ◇ TR | Hintergrund bei Hover über Feld. |
| `--a-field-input-line-height` | — | — | 17 | L | Eingabefeld (apex-item-*): Zeilenhöhe (Eingabe) — lokal in `@media (max-width: 479px) » .t-Form-fieldContainer` …; Fallback `16px` |
| `--a-field-input-padding-x` | `.25rem` | = Vita | 54 |  | Eingabefeld (apex-item-*): Innenabstand horizontal (Eingabe) |
| `--a-field-input-padding-y` | `.25rem` | = Vita | 39 |  | Eingabefeld (apex-item-*): Innenabstand vertikal (Eingabe) |
| `--a-field-input-shadow` | — | — | 8 | L | Eingabefeld (apex-item-*): Schatten (Eingabe) — lokal in `.apex-item-multi .apex-item-popup-lov`; Fallback `none` |
| `--a-field-input-state-background-color` | — | — | 10 | L | Eingabefeld (apex-item-*): Hintergrundfarbe (Eingabe Zustands-Slot) — lokal in `.a-MDEditor .a-MDEditor-live:hover` …; Fallback `var(--a-field-input-background-color)` |
| `--a-field-input-state-border-color` | — | — | 9 | L | Eingabefeld (apex-item-*): Randfarbe (Eingabe Zustands-Slot) — lokal in `.a-MDEditor .a-MDEditor-live:hover` …; Fallback `var(--a-field-input-border-color)` |
| `--a-field-input-state-text-color` | — | — | 7 | L | Eingabefeld (apex-item-*): Textfarbe (Eingabe Zustands-Slot) — lokal in `.a-MDEditor .a-MDEditor-live:hover` …; Fallback `var(--a-field-input-text-color)` |
| `--a-field-input-text-color` | `#202020` | `#fcfcfc` | 21 | ◆ TR | Textfarbe in Eingabefeldern. |
| `--a-field-input-transition` | `background-color .2s ease, border-color .2s e…` | = Vita | 0 | ∅ | Eingabefeld (apex-item-*): Übergang (Eingabe) |
| `--a-field-input-width` | — | — | 2 | L | Eingabefeld (apex-item-*): Breite (Eingabe) — lokal in `.t-Form-fieldContainer--floatingLabel` |
| `--a-field-select-arrow-padding` | `2rem` | = Vita | 6 |  | Eingabefeld (apex-item-*): Innenabstand (Auswahl Pfeil) |
| `--a-field-select-background-image` | `url(data:image/svg+xml;base64,PD94bWwgdmVyc2l…` | = Vita | 4 |  | Eingabefeld (apex-item-*): Auswahl background Bild |
| `--a-field-select-background-size` | `2rem 1rem` | = Vita | 4 |  | Eingabefeld (apex-item-*): Größe (Auswahl background) |
| `--a-filedrop-border-color` | `var(--a-field-input-border-color)` → `#dfdfdf` | `var(--a-field-input-border-color)` → `#393d40` | 1 |  | File Upload (Dropzone): Randfarbe |
| `--a-filedrop-border-radius` | `0.125rem` | `2px` | 2 | TR | File Upload (Dropzone): Eckenradius |
| `--a-filedrop-count-badge-font-size` | `.625rem` | = Vita | 1 |  | File Upload (Dropzone): Schriftgröße (Zähler Badge) |
| `--a-filedrop-count-badge-line-height` | `.875rem` | = Vita | 1 |  | File Upload (Dropzone): Zeilenhöhe (Zähler Badge) |
| `--a-filedrop-cursor` | — | — | 2 | L | File Upload (Dropzone): Cursor — lokal in `.is-dragging` …; Fallback `pointer` |
| `--a-filedrop-dragging-background-color` | `var(--a-palette-primary-shade, #ecf4fb)` → `#e6f0fa` | `var(--a-palette-primary-shade, #ecf4fb)` → `#010b14` | 1 |  | File Upload (Dropzone): Hintergrundfarbe (beim Ziehen) |
| `--a-filedrop-dragging-border-color` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | = Vita | 1 |  | File Upload (Dropzone): Randfarbe (beim Ziehen) |
| `--a-filedrop-error-border-color` | `var(--a-palette-danger)` → `#cb1100` | `var(--a-palette-danger)` → `#ee0701` | 1 |  | File Upload (Dropzone): Randfarbe (Fehler) |
| `--a-filedrop-focus-border-color` | `var(--a-field-input-focus-border-color)` → `#056ac8` | = Vita | 1 |  | File Upload (Dropzone): Randfarbe (Fokus) |
| `--a-filedrop-font-size` | `.875rem` | = Vita | 1 |  | File Upload (Dropzone): Schriftgröße |
| `--a-filedrop-heading-font-size` | `1.25rem` | = Vita | 1 |  | File Upload (Dropzone): Schriftgröße (Überschrift) |
| `--a-filedrop-heading-font-weight` | — | — | 1 | L | File Upload (Dropzone): Schriftstärke (Überschrift) — lokal in `.a-FileDrop--inline`; Fallback `var(--a-base-font-weight-bold, 700)` |
| `--a-filedrop-heading-line-height` | `1.75rem` | = Vita | 1 |  | File Upload (Dropzone): Zeilenhöhe (Überschrift) |
| `--a-filedrop-heading-text-color` | `var(--ut-component-text-title-color)` → `#000` | `var(--ut-component-text-title-color)` → `#fff` | 1 |  | File Upload (Dropzone): Textfarbe (Überschrift) |
| `--a-filedrop-icon-action-background-color` | — | `rgba(0, 0, 0, 1)` | 1 | D | File Upload (Dropzone): Hintergrundfarbe (Icon action) |
| `--a-filedrop-icon-character` | — | — | 1 | L | File Upload (Dropzone): Icon-Zeichen (Icon) — lokal in `a-file-upload[upload-type=IMAGE]` …; Fallback `'\e032'` |
| `--a-filedrop-icon-color` | — | — | 1 | L | File Upload (Dropzone): Farbe (Icon) — lokal in `.a-FileDrop-icon[style*="background-image:"]` |
| `--a-filedrop-icon-size` | `2rem` | = Vita | 2 |  | File Upload (Dropzone): Größe (Icon) |
| `--a-filedrop-icon-spacing` | `.25rem` | = Vita | 1 |  | File Upload (Dropzone): Abstand (Icon) |
| `--a-filedrop-item-spacing` | `.25rem` | = Vita | 1 |  | File Upload (Dropzone): Abstand (Eintrag) |
| `--a-filedrop-line-height` | `1rem` | = Vita | 1 |  | File Upload (Dropzone): Zeilenhöhe |
| `--a-filedrop-padding-x` | `1rem` | = Vita | 1 |  | File Upload (Dropzone): Innenabstand horizontal |
| `--a-filedrop-padding-y` | `1rem` | = Vita | 2 |  | File Upload (Dropzone): Innenabstand vertikal |
| `--a-filedrop-progress-background-color` | `rgba(0, 0, 0, .1)` | = Vita | 1 |  | File Upload (Dropzone): Hintergrundfarbe (Fortschritt) |
| `--a-filedrop-progress-bar-background-color` | `rgba(0, 0, 0, .5)` | = Vita | 1 |  | File Upload (Dropzone): Hintergrundfarbe (Fortschritt bar) |
| `--a-filedrop-progress-bar-width` | `3rem` | = Vita | 2 |  | File Upload (Dropzone): Breite (Fortschritt bar) |
| `--a-filedrop-progress-border-radius` | `.375rem` | = Vita | 2 |  | File Upload (Dropzone): Eckenradius (Fortschritt) |
| `--a-filedrop-progress-height` | `.75rem` | = Vita | 2 |  | File Upload (Dropzone): Höhe (Fortschritt) |
| `--a-filedrop-progress-width` | `15rem` | = Vita | 2 |  | File Upload (Dropzone): Breite (Fortschritt) |
| `--a-filedrop-state-background-color` | — | — | 1 | L | File Upload (Dropzone): Hintergrundfarbe (Zustands-Slot) — lokal in `.a-FileDrop:hover` …; Fallback `var(--a-filedrop-type-background-color,…` |
| `--a-filedrop-state-border-color` | — | — | 2 | L | File Upload (Dropzone): Randfarbe (Zustands-Slot) — lokal in `.a-FileDrop:hover` …; Fallback `var(--a-filedrop-type-border-color, var…` |
| `--a-filedrop-state-shadow` | — | — | 1 | L | File Upload (Dropzone): Schatten (Zustands-Slot) — lokal in `.a-FileDrop:hover` …; Fallback `var(--a-filedrop-type-shadow, var(--a-f…` |
| `--a-filedrop-state-text-color` | — | — | 1 | L | File Upload (Dropzone): Textfarbe (Zustands-Slot) — lokal in `.a-FileDrop:hover` …; Fallback `var(--a-filedrop-type-text-color, var(-…` |
| `--a-filedrop-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | File Upload (Dropzone): Textfarbe |
| `--a-form-error-text-color` | `var(--a-palette-danger)` → `#cb1100` | `var(--a-palette-danger)` → `#ee0701` | 1 |  | Formular-Layout (a-Form/u-Form): Textfarbe (Fehler) |
| `--a-form-input-container-width` | — | — | 1 | L | Formular-Layout (a-Form/u-Form): Breite (Eingabe Container) — lokal in `.u-Form--labelsAbove`; Fallback `70%` |
| `--a-form-label-container-width` | — | — | 1 | L | Formular-Layout (a-Form/u-Form): Breite (Label Container) — lokal in `.u-Form--labelsAbove`; Fallback `30%` |
| `--a-form-required-asterisk-text-color` | `var(--a-palette-danger)` → `#cb1100` | `var(--a-palette-danger)` → `#ee0701` | 8 |  | Formular-Layout (a-Form/u-Form): Textfarbe (required asterisk) |
| `--a-item-icon-offset` | — | — | 5 | L | Item-Icon: Versatz (Icon) — lokal in `a-color-picker, .apex-item-group--color-picker` …; Fallback `0px` |
| `--a-mdeditor-background-color` | `var(--a-field-input-background-color)` → `#f9f9f9` | `var(--a-field-input-background-color)` → `#212325` | 1 |  | Markdown Editor: Hintergrundfarbe |
| `--a-mdeditor-border-color` | `var(--a-field-input-border-color)` → `#dfdfdf` | `var(--a-field-input-border-color)` → `#393d40` | 1 |  | Markdown Editor: Randfarbe |
| `--a-mdeditor-border-width` | `var(--a-field-input-border-width)` → `1px` | = Vita | 6 |  | Markdown Editor: Randbreite |
| `--a-mdeditor-focus-border-color` | `var(--a-field-input-focus-border-color)` → `#056ac8` | = Vita | 1 |  | Markdown Editor: Randfarbe (Fokus) |
| `--a-popuplov-chip-background-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 1 |  | Popup LOV: Hintergrundfarbe (Chip) |
| `--a-popuplov-chip-border-color` | `var(--a-chip-state-border-color, var(--a-chip…` → `#dfdfdf` | `var(--a-chip-state-border-color, var(--a-chip…` → `#393d40` | 1 |  | Popup LOV: Randfarbe (Chip) |
| `--a-popuplov-chip-border-width` | `1px` | = Vita | 1 |  | Popup LOV: Randbreite (Chip) |
| `--a-popuplov-chip-font-size` | — | — | 1 | L | Popup LOV: Schriftgröße (Chip) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `12px` |
| `--a-popuplov-chip-font-weight` | `var(--a-chip-value-font-weight, var(--a-base-…` → `600` | = Vita | 1 |  | Popup LOV: Schriftstärke (Chip) |
| `--a-popuplov-chip-line-height` | `.75rem` | = Vita | 2 |  | Popup LOV: Zeilenhöhe (Chip) |
| `--a-popuplov-chip-margin-x` | — | — | 1 | L | Popup LOV: Außenabstand horizontal (Chip) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `1px` |
| `--a-popuplov-chip-margin-y` | — | — | 1 | L | Popup LOV: Außenabstand vertikal (Chip) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `1px` |
| `--a-popuplov-chip-padding-x` | `.25rem` | = Vita | 1 |  | Popup LOV: Innenabstand horizontal (Chip) |
| `--a-popuplov-chip-padding-y` | — | — | 3 | L | Popup LOV: Innenabstand vertikal (Chip) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `1px` |
| `--a-popuplov-chip-remove-font-size` | `.75rem` | = Vita | 3 |  | Popup LOV: Schriftgröße (Chip Entfernen) |
| `--a-popuplov-dialog-background-color` | `var(--jui-dialog-background-color)` → `#fff` | `var(--jui-dialog-background-color)` → `#1b1d1e` | 2 |  | Popup LOV: Hintergrundfarbe (Dialog) |
| `--a-popuplov-search-bar-padding-x` | `var(--a-popuplov-search-bar-padding-y)` → `.5rem` | = Vita | 4 |  | Popup LOV: Innenabstand horizontal (Suche bar) |
| `--a-popuplov-search-bar-padding-y` | `.5rem` | = Vita | 4 |  | Popup LOV: Innenabstand vertikal (Suche bar) |
| `--a-popuplov-search-icon-left` | — | — | 2 | L | Popup LOV: Suche Icon left — lokal in `.a-PopupLOV--incremental .a-Icon`; Fallback `32px` |
| `--a-popuplov-search-icon-margin-inline-start` | — | — | 0 | L ∅ | Popup LOV: Suche Icon margin inline start — lokal in `.a-PopupLOV--incremental .a-Icon` |
| `--a-popuplov-search-input-padding-inline-start` | — | — | 0 | L ∅ | Popup LOV: Suche Eingabe padding inline start — lokal in `.a-PopupLOV--incremental .a-PopupLOV-search` |
| `--a-qrcode-size` | `8rem` | = Vita | 1 |  | QR Code: Größe |
| `--a-qrcode-size-lg` | `32rem` | = Vita | 1 |  | QR Code: size lg |
| `--a-qrcode-size-md` | `16rem` | = Vita | 1 |  | QR Code: size md |
| `--a-qrcode-size-sm` | `8rem` | = Vita | 1 |  | QR Code: size sm |
| `--a-starrating-icon-character` | `"\e0f8"` | = Vita | 1 |  | Star Rating: Icon-Zeichen (Icon) |
| `--a-starrating-stars-bg-color` | `rgba(0, 0, 0, 0.15)` | `rgba(255, 255, 255, 0.15)` | 1 |  | Star Rating: Hintergrundfarbe (stars) |
| `--a-starrating-stars-fg-color` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | = Vita | 1 |  | Star Rating: Farbe (stars fg) |
| `--a-starrating-stars-padding-x` | — | — | 1 | L | Star Rating: Innenabstand horizontal (stars) — lokal in `.a-GV-cell .a-StarRating-stars` …; Fallback `4px` |
| `--a-starrating-stars-padding-y` | `.25rem` | = Vita | 1 |  | Star Rating: Innenabstand vertikal (stars) |
| `--a-starrating-value-spacing` | `.5rem` | = Vita | 1 |  | Star Rating: Abstand (Wert) |
| `--jui-datepicker-background-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 1 |  | jQuery-UI Date Picker (Legacy): Hintergrundfarbe |
| `--jui-datepicker-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 0 | ∅ | jQuery-UI Date Picker (Legacy): Randfarbe |
| `--jui-datepicker-border-radius` | `.5rem` | = Vita | 1 |  | jQuery-UI Date Picker (Legacy): Eckenradius |
| `--jui-datepicker-date-background-color` | — | — | 1 | L | jQuery-UI Date Picker (Legacy): Hintergrundfarbe (Datum) — lokal in `.ui-datepicker .ui-state-hover` …; Fallback `transparent` |
| `--jui-datepicker-date-border-radius` | — | — | 1 | L | jQuery-UI Date Picker (Legacy): Eckenradius (Datum) — lokal in `.ui-datepicker .ui-datepicker-current, .ui-datepicker .ui-d…`; Fallback `1.5rem` |
| `--jui-datepicker-date-color` | — | — | 1 | L | jQuery-UI Date Picker (Legacy): Farbe (Datum) — lokal in `.ui-datepicker .ui-state-hover` …; Fallback `inherit` |
| `--jui-datepicker-date-margin` | — | — | 1 | L | jQuery-UI Date Picker (Legacy): Außenabstand (Datum) — lokal in `.ui-datepicker .ui-datepicker-current, .ui-datepicker .ui-d…`; Fallback `0.125rem` |
| `--jui-datepicker-date-size` | — | — | 3 | L | jQuery-UI Date Picker (Legacy): Größe (Datum) — lokal in `.ui-datepicker .ui-datepicker-current, .ui-datepicker .ui-d…`; Fallback `2rem` |
| `--jui-datepicker-overflow` | `hidden` | = Vita | 0 | ∅ | jQuery-UI Date Picker (Legacy): Overflow |
| `--jui-datepicker-padding` | `.5rem` | = Vita | 3 |  | jQuery-UI Date Picker (Legacy): Innenabstand |
| `--jui-datepicker-shadow` | `0 4px 16px rgba(0, 0, 0, .15)` | = Vita | 1 |  | jQuery-UI Date Picker (Legacy): Schatten |
| `--jui-datepicker-width` | `17.5rem` | = Vita | 1 |  | jQuery-UI Date Picker (Legacy): Breite |
| `--ut-field-fl-input-focus-icon-background-color` | `#056AC8` | = Vita | 2 | TR | Formularfeld/Label (t-Form-*): Hintergrundfarbe (Floating Label Eingabe Fokus Icon) |
| `--ut-field-fl-input-focus-icon-color` | `white` | = Vita | 1 | TR | Formularfeld/Label (t-Form-*): Farbe (Floating Label Eingabe Fokus Icon) |
| `--ut-field-fl-label-font-size` | — | — | 2 | L | Formularfeld/Label (t-Form-*): Schriftgröße (Floating Label Label) — lokal in `.t-Form-fieldContainer--floatingLabel` …; Fallback `0.875rem` |
| `--ut-field-fl-label-line-height` | — | — | 8 | L | Formularfeld/Label (t-Form-*): Zeilenhöhe (Floating Label Label) — lokal in `.t-Form-fieldContainer--floatingLabel` …; Fallback `1.25rem` |
| `--ut-field-fl-label-offset` | — | — | 11 | L | Formularfeld/Label (t-Form-*): Versatz (Floating Label Label) — lokal in `.t-Form-fieldContainer--floatingLabel` …; Fallback `calc(var(--a-field-input-padding-y, 0.2…` |
| `--ut-field-input-focus-icon-color` | `#056AC8` | = Vita | 1 | TR | Formularfeld/Label (t-Form-*): Farbe (Eingabe Fokus Icon) |
| `--ut-field-input-icon-background-color` | — | — | 1 | L | Formularfeld/Label (t-Form-*): Hintergrundfarbe (Eingabe Icon) — lokal in `.t-Form-fieldContainer--floatingLabel.is-active, .t-Form-fi…` |
| `--ut-field-input-icon-border` | — | — | 2 | L | Formularfeld/Label (t-Form-*): Eingabe Icon border — lokal in `.t-Form-fieldContainer--floatingLabel.is-active, .t-Form-fi…` …; Fallback `inset calc(var(--a-field-input-border-w…` |
| `--ut-field-input-icon-color` | — | — | 4 | L | Formularfeld/Label (t-Form-*): Farbe (Eingabe Icon) — lokal in `.apex-item-wrapper--combobox-many .apex-item-has-icon .apex…` …; Fallback `var(--a-field-input-text-color)` |
| `--ut-field-input-icon-offset` | — | — | 14 | L | Formularfeld/Label (t-Form-*): Versatz (Eingabe Icon) — lokal in `.a-FS-search, .a-FS-filter` …; Fallback `1.5rem` |
| `--ut-field-input-icon-padding-x` | — | — | 15 | L | Formularfeld/Label (t-Form-*): Innenabstand horizontal (Eingabe Icon) — lokal in `.t-Login-region` …; Fallback `.25rem` |
| `--ut-field-input-icon-padding-y` | — | — | 8 | L | Formularfeld/Label (t-Form-*): Innenabstand vertikal (Eingabe Icon) — lokal in `.t-Login-region` …; Fallback `var(--a-field-input-icon-padding-y, 4px)` |
| `--ut-field-input-min-height` | — | — | 3 | L | Formularfeld/Label (t-Form-*): Mindesthöhe (Eingabe) — lokal in `.t-Form-fieldContainer--floatingLabel.apex-item-wrapper--co…` …; Fallback `0` |
| `--ut-field-input-padding-x-offset` | — | — | 7 | L | Formularfeld/Label (t-Form-*): Versatz (Eingabe padding x) — lokal in `.a-FS-search, .a-FS-filter` …; Fallback `calc(var(--a-field-input-padding-x, 0.2…` |
| `--ut-field-label-font-size` | — | — | 1 | L | Formularfeld/Label (t-Form-*): Schriftgröße (Label) — lokal in `.t-Form-fieldContainer--floatingLabel` …; Fallback `0.75rem` |
| `--ut-field-label-line-height` | — | — | 3 | L | Formularfeld/Label (t-Form-*): Zeilenhöhe (Label) — lokal in `.t-Form-fieldContainer--floatingLabel`; Fallback `1rem` |
| `--ut-field-label-offset` | — | — | 1 | L | Formularfeld/Label (t-Form-*): Versatz (Label) — lokal in `.t-Form-fieldContainer--floatingLabel`; Fallback `2.75rem` |
| `--ut-field-label-padding-x-offset` | — | — | 3 | L | Formularfeld/Label (t-Form-*): Versatz (Label padding x) — lokal in `.t-Form-fieldContainer--floatingLabel.apex-item-wrapper--ha…` …; Fallback `var(--a-field-input-padding-x, 0.25rem)` |
| `--ut-field-label-padding-y` | — | — | 3 | L | Formularfeld/Label (t-Form-*): Innenabstand vertikal (Label) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` …; Fallback `0.25rem` |
| `--ut-field-label-text-color` | `#262626` | `whitesmoke` | 1 | ◆ TR | Label-Textfarbe (Theme Roller „Forms > Label“). |
| `--ut-field-padding-x` | — | — | 8 | L | Formularfeld/Label (t-Form-*): Innenabstand horizontal — lokal in `.t-Login-region` …; Fallback `0.5rem` |
| `--ut-field-padding-y` | — | — | 11 | L | Formularfeld/Label (t-Form-*): Innenabstand vertikal — lokal in `.t-Login-region` …; Fallback `0.5rem` |
| `--ut-file-icon-background-color` | — | — | 1 | L | Datei-Icon: Hintergrundfarbe (Icon) — lokal in `.u-file-icon.fa-file-powerpoint-o` … |
| `--ut-popuplov-item-background-color` | — | — | 1 | L | Popup LOV (UT): Hintergrundfarbe (Eintrag) — lokal in `.t-PopupLOV-links a:hover` |
| `--ut-popuplov-item-border-width` | — | — | 1 | L | Popup LOV (UT): Randbreite (Eintrag) — lokal in `.t-PopupLOV-links a:last-child`; Fallback `var(--ut-component-inner-border-width, …` |
| `--ut-popuplov-item-text-color` | — | — | 1 | L | Popup LOV (UT): Textfarbe (Eintrag) — lokal in `.t-PopupLOV-links a:hover` |
| `--ut-prepost-background-color` | — | — | 2 | L | Pre-/Post-Text am Feld: Hintergrundfarbe — lokal in `.apex-item-wrapper--checkbox, .apex-item-wrapper--radiogrou…`; Fallback `var(--a-field-input-background-color)` |
| `--ut-prepost-border-color` | — | — | 2 | L | Pre-/Post-Text am Feld: Randfarbe — lokal in `.apex-item-wrapper--checkbox, .apex-item-wrapper--radiogrou…`; Fallback `var(--a-field-input-state-border-color,…` |
| `--ut-prepost-border-radius` | — | — | 16 | L | Pre-/Post-Text am Feld: Eckenradius — lokal in `.t-Form-fieldContainer--preTextBlock` … |
| `--ut-valiation-icon-background-color` | — | — | 1 | L | Validierung (Tippfehler im Originalnamen): Hintergrundfarbe (Icon) — lokal in `.t-Validation.is-invalid` … |
| `--ut-xs-field-input-font-size` | `1rem` | = Vita | 5 |  | Mobile (<480px): Schriftgröße (field Eingabe) |
| `--ut-xs-field-input-line-height` | `1.25rem` | = Vita | 5 |  | Mobile (<480px): Zeilenhöhe (field Eingabe) |

### 10.12 Checkbox/Radio/Switch (51)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-checkbox-active-background-color` | `rgba(0, 0, 0, .05)` | = Vita | 2 |  | Checkbox/Radio (u-checkbox/u-radio): Hintergrundfarbe (aktiv) |
| `--a-checkbox-background-color` | `#f9f9f9` | `#212325` | 5 | ◇ TR | Checkbox/Radio (u-checkbox/u-radio): Hintergrundfarbe |
| `--a-checkbox-border-color` | `rgba(0, 0, 0, 0.15)` | `rgba(255, 255, 255, 0.15)` | 5 | ◆ TR | Checkbox/Radio (u-checkbox/u-radio): Randfarbe |
| `--a-checkbox-border-radius` | `.125rem` | = Vita | 7 |  | Checkbox/Radio (u-checkbox/u-radio): Eckenradius |
| `--a-checkbox-border-width` | — | — | 24 | L | Checkbox/Radio (u-checkbox/u-radio): Randbreite — lokal in `.u-selector`; Fallback `1px` |
| `--a-checkbox-checked-background-color` | `#056AC8` | = Vita | 8 | ◆ TR | Hintergrund angehakter Checkbox/Radio (Vita: Hex-Kopie der Primärfarbe). |
| `--a-checkbox-checked-text-color` | `white` | = Vita | 8 | ◇ TR | Checkbox/Radio (u-checkbox/u-radio): Textfarbe (angehakt) |
| `--a-checkbox-hover-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 2 | TR | Checkbox/Radio (u-checkbox/u-radio): Hintergrundfarbe (Hover) |
| `--a-checkbox-hover-opacity` | — | — | 2 | L | Checkbox/Radio (u-checkbox/u-radio): Deckkraft (Hover) — lokal in `.u-selector` …; Fallback `0.15` |
| `--a-checkbox-hover-text-color` | — | — | 2 | L | Checkbox/Radio (u-checkbox/u-radio): Textfarbe (Hover) — lokal in `.is-disabled .u-selector, .is-disabled .a-IRR-controlsCheck…` … |
| `--a-checkbox-icon-character` | `"\e007"` | = Vita | 5 |  | Checkbox/Radio (u-checkbox/u-radio): Icon-Zeichen (Icon) |
| `--a-checkbox-icon-size` | `.75rem` | = Vita | 7 |  | Checkbox/Radio (u-checkbox/u-radio): Größe (Icon) |
| `--a-checkbox-indeterminate-height` | `.125rem` | = Vita | 6 |  | Checkbox/Radio (u-checkbox/u-radio): Höhe (unbestimmt) |
| `--a-checkbox-indeterminate-width` | `.625rem` | = Vita | 6 |  | Checkbox/Radio (u-checkbox/u-radio): Breite (unbestimmt) |
| `--a-checkbox-label-font-size` | `.75rem` | = Vita | 2 |  | Checkbox/Radio (u-checkbox/u-radio): Schriftgröße (Label) |
| `--a-checkbox-label-line-height` | — | — | 0 | L ∅ | Checkbox/Radio (u-checkbox/u-radio): Zeilenhöhe (Label) — lokal in `.t-Form--large, .t-Form-fieldContainer--large` … |
| `--a-checkbox-label-spacing-x` | `.375rem` | = Vita | 11 |  | Checkbox/Radio (u-checkbox/u-radio): Abstand horizontal (Label) |
| `--a-checkbox-label-spacing-y` | `.125rem` | = Vita | 0 | ∅ | Checkbox/Radio (u-checkbox/u-radio): Abstand vertikal (Label) |
| `--a-checkbox-shadow` | `0 1px 2px rgba(0, 0, 0, .075) inset` | = Vita | 0 | ∅ | Checkbox/Radio (u-checkbox/u-radio): Schatten |
| `--a-checkbox-size` | `1rem` | = Vita | 57 |  | Checkbox/Radio (u-checkbox/u-radio): Größe |
| `--a-checkbox-text-color` | `white` | = Vita | 9 | TR | Checkbox/Radio (u-checkbox/u-radio): Textfarbe |
| `--a-cr-checkbox-background-color` | `#f9f9f9` | `#212325` | 2 |  | Content-Row-Auswahl-Checkbox: Hintergrundfarbe |
| `--a-cr-checkbox-text-color` | `var(--a-palette-primary-contrast)` → `#fff` | = Vita | 2 |  | Content-Row-Auswahl-Checkbox: Textfarbe |
| `--a-switch-active-background-color` | `var(--a-switch-hover-background-color)` → `#8c8c8c` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (aktiv) |
| `--a-switch-background-color` | `#8c8c8c` | = Vita | 2 | ◇ | Switch (a-Switch): Hintergrundfarbe |
| `--a-switch-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 1 |  | Switch (a-Switch): Randfarbe |
| `--a-switch-border-radius` | `var(--a-switch-width, 44px)` → `2.75rem` | = Vita | 1 |  | Switch (a-Switch): Eckenradius |
| `--a-switch-checked-active-background-color` | `var(--a-switch-checked-hover-background-color)` → `#056ac8` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (angehakt aktiv) |
| `--a-switch-checked-background-color` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | = Vita | 3 | ◇ | Switch „an“ (Theme-Standard: var(--a-palette-primary, #0572CE)). |
| `--a-switch-checked-hover-background-color` | `var(--a-switch-checked-background-color)` → `#056ac8` | = Vita | 3 |  | Switch (a-Switch): Hintergrundfarbe (angehakt Hover) |
| `--a-switch-cursor` | `pointer` | = Vita | 3 |  | Switch (a-Switch): Cursor |
| `--a-switch-focused-shadow` | `var(--a-switch-checked-background-color) 0 0 …` → `#056ac8 0 0 0 1px,inset #fff 0 0 …` | = Vita | 1 |  | Switch (a-Switch): Schatten (fokussiert) |
| `--a-switch-hover-background-color` | `var(--a-switch-background-color)` → `#8c8c8c` | = Vita | 3 |  | Switch (a-Switch): Hintergrundfarbe (Hover) |
| `--a-switch-padding-x` | `.125rem` | = Vita | 3 |  | Switch (a-Switch): Innenabstand horizontal |
| `--a-switch-padding-y` | `.125rem` | = Vita | 2 |  | Switch (a-Switch): Innenabstand vertikal |
| `--a-switch-shadow` | `inset rgba(0, 0, 0, .1) 0 0 0 1px` | = Vita | 1 |  | Switch (a-Switch): Schatten |
| `--a-switch-toggle-active-background-color` | `var(--a-switch-toggle-background-color)` → `#fff` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle aktiv) |
| `--a-switch-toggle-background-color` | `#fff` | = Vita | 6 |  | Switch (a-Switch): Hintergrundfarbe (Toggle) |
| `--a-switch-toggle-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 1 |  | Switch (a-Switch): Randfarbe (Toggle) |
| `--a-switch-toggle-checked-active-background-color` | `var(--a-switch-toggle-background-color)` → `#fff` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle angehakt aktiv) |
| `--a-switch-toggle-checked-background-color` | `var(--a-switch-toggle-background-color)` → `#fff` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle angehakt) |
| `--a-switch-toggle-checked-hover-background-color` | `var(--a-switch-toggle-background-color)` → `#fff` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle angehakt Hover) |
| `--a-switch-toggle-height` | `1.25rem` | = Vita | 2 |  | Switch (a-Switch): Höhe (Toggle) |
| `--a-switch-toggle-hover-background-color` | `var(--a-switch-toggle-background-color)` → `#fff` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle Hover) |
| `--a-switch-toggle-indeterminate-background-color` | `rgba(255, 255, 255, .5)` | = Vita | 1 |  | Switch (a-Switch): Hintergrundfarbe (Toggle unbestimmt) |
| `--a-switch-toggle-indeterminate-shadow` | `inset #fff 0 0 0 1px` | = Vita | 1 |  | Switch (a-Switch): Schatten (Toggle unbestimmt) |
| `--a-switch-toggle-shadow` | `none` | = Vita | 1 |  | Switch (a-Switch): Schatten (Toggle) |
| `--a-switch-toggle-width` | `1.25rem` | = Vita | 4 |  | Switch (a-Switch): Breite (Toggle) |
| `--a-switch-toggled-offset` | — | — | 5 | L | Switch (a-Switch): Versatz (toggled) — lokal in `.a-Switch` |
| `--a-switch-width` | `2.75rem` | = Vita | 3 |  | Switch (a-Switch): Breite |
| `--ut-checkbox-item-spacing` | `1rem` | = Vita | 1 |  | Checkbox-Gruppe: Abstand (Eintrag) |

### 10.13 Menüs (57)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-iconlist-item-background-color` | — | — | 2 | L | Icon List: Hintergrundfarbe (Eintrag) — lokal in `.a-IconList-item:hover` … |
| `--a-iconlist-item-border-radius` | — | — | 1 | L | Icon List: Eckenradius (Eintrag) — lokal in `.a-AddressList` …; Fallback `3px` |
| `--a-iconlist-item-hover-background-color` | `var(--a-menu-focused-background-color)` → `#056ac8` | = Vita | 4 |  | Icon List: Hintergrundfarbe (Eintrag Hover) |
| `--a-iconlist-item-hover-text-color` | `var(--a-menu-focused-text-color)` → `#fff` | = Vita | 4 |  | Icon List: Textfarbe (Eintrag Hover) |
| `--a-iconlist-item-margin` | — | — | 1 | L | Icon List: Außenabstand (Eintrag) — lokal in `.a-AddressList`; Fallback `4px` |
| `--a-iconlist-item-padding-x` | — | — | 3 | L | Icon List: Innenabstand horizontal (Eintrag) — lokal in `.a-AddressList` …; Fallback `8px` |
| `--a-iconlist-item-padding-y` | — | — | 3 | L | Icon List: Innenabstand vertikal (Eintrag) — lokal in `.a-PopupLOV-results`; Fallback `8px` |
| `--a-iconlist-item-selected-background-color` | — | — | 3 | L | Icon List: Hintergrundfarbe (Eintrag ausgewählt) — lokal in `.a-IRR-dialog--download, .a-IRR-dialog--subscription` …; Fallback `var(--a-palette-primary-shade, #ecf3ff)` |
| `--a-iconlist-item-selected-text-color` | — | — | 2 | L | Icon List: Textfarbe (Eintrag ausgewählt) — lokal in `.a-IRR-dialog--download, .a-IRR-dialog--subscription` … |
| `--a-iconlist-item-text-color` | — | — | 2 | L | Icon List: Textfarbe (Eintrag) — lokal in `.a-IconList-item:hover` … |
| `--a-menu-accel-font-size` | — | — | 1 | L | Menü (a-Menu): Schriftgröße (Tastenkürzel) — lokal in `.a-DevToolbar-menu.a-Menu`; Fallback `var(--a-menu-font-size, 12px)` |
| `--a-menu-accel-text-color` | `var(--a-menu-text-color)` → `#262626` | `var(--a-menu-text-color)` → `#f5f5f5` | 4 | TR | Menü (a-Menu): Textfarbe (Tastenkürzel) |
| `--a-menu-background-color` | `#FFFFFF` | `#1b1d1e` | 13 | ◆ TR | Hintergrund aller a-Menu-Menüs (Actions-Menüs, Navigation-Bar-Menüs, IG-Menüs). |
| `--a-menu-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 12 | ◇ | Menü (a-Menu): Randfarbe |
| `--a-menu-border-radius` | `.25rem` | = Vita | 10 | ◇ | Menü (a-Menu): Eckenradius |
| `--a-menu-border-width` | — | — | 43 | L | Menü (a-Menu): Randbreite — lokal in `.a-DevToolbar-menu.a-Menu`; Fallback `1px` |
| `--a-menu-callout-background-clip` | `content-box` | = Vita | 1 |  | Menü (a-Menu): Callout background clip |
| `--a-menu-callout-background-color` | `var(--a-menu-background-color)` → `#fff` | `var(--a-menu-background-color)` → `#1b1d1e` | 1 |  | Menü (a-Menu): Hintergrundfarbe (Callout) |
| `--a-menu-callout-border-color` | `var(--a-menu-border-color)` → `rgba(0,0,0,.1)` | `var(--a-menu-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Menü (a-Menu): Randfarbe (Callout) |
| `--a-menu-callout-border-radius` | `0rem` | = Vita | 4 |  | Menü (a-Menu): Eckenradius (Callout) |
| `--a-menu-callout-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 |  | Menü (a-Menu): Schatten (Callout) |
| `--a-menu-callout-size` | `.75rem` | = Vita | 24 |  | Menü (a-Menu): Größe (Callout) |
| `--a-menu-default-accel-text-color` | `var(--a-menu-accel-text-color)` → `#262626` | `var(--a-menu-accel-text-color)` → `#f5f5f5` | 1 |  | Menü (a-Menu): Textfarbe (Standard Tastenkürzel) |
| `--a-menu-default-background-color` | `transparent` | = Vita | 6 |  | Menü (a-Menu): Hintergrundfarbe (Standard) |
| `--a-menu-default-color` | — | — | 0 | L ∅ | Menü (a-Menu): Farbe (Standard) — lokal in `.a-DevToolbar-menu.a-Menu` |
| `--a-menu-default-text-color` | `var(--a-menu-text-color)` → `#262626` | `var(--a-menu-text-color)` → `#f5f5f5` | 7 | TR | Menü (a-Menu): Textfarbe (Standard) |
| `--a-menu-disabled-focused-background-color` | `rgba(0, 0, 0, .025)` | = Vita | 1 |  | Menü (a-Menu): Hintergrundfarbe (deaktiviert fokussiert) |
| `--a-menu-disabled-focused-shadow` | `0 -1px 0 0 rgba(0, 0, 0, .05) inset, 0 1px 0 …` | = Vita | 0 | ∅ | Menü (a-Menu): Schatten (deaktiviert fokussiert) |
| `--a-menu-disabled-focused-text-color` | `inherit` | = Vita | 2 |  | Menü (a-Menu): Textfarbe (deaktiviert fokussiert) |
| `--a-menu-expanded-accel-text-color` | `var(--a-menu-focused-accel-text-color)` → `#fff` | = Vita | 1 |  | Menü (a-Menu): Textfarbe (aufgeklappt Tastenkürzel) |
| `--a-menu-expanded-background-color` | `var(--a-menu-focused-background-color)` → `#056ac8` | = Vita | 1 |  | Menü (a-Menu): Hintergrundfarbe (aufgeklappt) |
| `--a-menu-expanded-text-color` | `var(--a-menu-focused-text-color)` → `#fff` | = Vita | 1 |  | Menü (a-Menu): Textfarbe (aufgeklappt) |
| `--a-menu-focused-accel-text-color` | `var(--a-menu-focused-text-color)` → `#fff` | = Vita | 2 | TR | Menü (a-Menu): Textfarbe (fokussiert Tastenkürzel) |
| `--a-menu-focused-background-color` | `#056AC8` | = Vita | 13 | ◆ TR | Hover/Fokus-Hintergrund eines Menüeintrags (Vita: Hex-Kopie der Primärfarbe). |
| `--a-menu-focused-text-color` | `white` | = Vita | 13 | ◆ TR | Hover/Fokus-Textfarbe eines Menüeintrags. |
| `--a-menu-font-size` | `.75rem` | = Vita | 9 |  | Menü (a-Menu): Schriftgröße |
| `--a-menu-font-weight` | — | — | 7 | L | Menü (a-Menu): Schriftstärke — lokal in `.a-DevToolbar-menu.a-Menu`; Fallback `normal` |
| `--a-menu-icon-size` | `1rem` | = Vita | 13 |  | Menü (a-Menu): Größe (Icon) |
| `--a-menu-icon-spacing-x` | `.5rem` | = Vita | 13 |  | Menü (a-Menu): Abstand horizontal (Icon) |
| `--a-menu-icon-spacing-y` | `.5rem` | = Vita | 6 |  | Menü (a-Menu): Abstand vertikal (Icon) |
| `--a-menu-item-generic-padding-x` | `.5rem` | = Vita | 7 |  | Menü (a-Menu): Innenabstand horizontal (Eintrag generic) |
| `--a-menu-item-generic-padding-y` | `.5rem` | = Vita | 7 |  | Menü (a-Menu): Innenabstand vertikal (Eintrag generic) |
| `--a-menu-item-height` | — | — | 1 | L | Menü (a-Menu): Höhe (Eintrag) — lokal in `.a-DevToolbar-menu.a-Menu`; Fallback `calc(var(--a-menu-line-height, 16px) + …` |
| `--a-menu-line-height` | `1rem` | = Vita | 10 |  | Menü (a-Menu): Zeilenhöhe |
| `--a-menu-min-width` | — | — | 1 | L | Menü (a-Menu): Mindestbreite — lokal in `.t-NavigationBar-menu` |
| `--a-menu-padding-x` | `0rem` | = Vita | 12 |  | Menü (a-Menu): Innenabstand horizontal |
| `--a-menu-padding-y` | `.5rem` | = Vita | 19 |  | Menü (a-Menu): Innenabstand vertikal |
| `--a-menu-scroll-button-active-background-color` | `var(--a-menu-focused-background-color)` → `#056ac8` | = Vita | 1 |  | Menü (a-Menu): Hintergrundfarbe (Scroll Button aktiv) |
| `--a-menu-scroll-button-active-text-color` | `var(--a-menu-focused-text-color)` → `#fff` | = Vita | 1 |  | Menü (a-Menu): Textfarbe (Scroll Button aktiv) |
| `--a-menu-scroll-button-background-color` | `rgba(0, 0, 0, .05)` | = Vita | 1 |  | Menü (a-Menu): Hintergrundfarbe (Scroll Button) |
| `--a-menu-scroll-button-text-color` | `inherit` | = Vita | 1 |  | Menü (a-Menu): Textfarbe (Scroll Button) |
| `--a-menu-scroll-down-shadow` | `0 -2px 6px rgba(0, 0, 0, .15)` | = Vita | 1 |  | Menü (a-Menu): Schatten (Scroll unten) |
| `--a-menu-scroll-up-shadow` | `0 2px 6px rgba(0, 0, 0, .15)` | = Vita | 1 |  | Menü (a-Menu): Schatten (Scroll oben) |
| `--a-menu-sep-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 5 |  | Menü (a-Menu): Randfarbe (Trenner) |
| `--a-menu-sep-spacing-y` | `.25rem` | = Vita | 3 |  | Menü (a-Menu): Abstand vertikal (Trenner) |
| `--a-menu-shadow` | `0 12px 24px -12px rgba(0, 0, 0, .3)` | = Vita | 6 | ◇ | Menü (a-Menu): Schatten |
| `--a-menu-text-color` | `#262626` | `whitesmoke` | 18 | ◆ TR | Menü-Textfarbe. |

### 10.14 Dialoge/Popups/Tooltips (66)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-help-dialog-code-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Hilfe-Dialog: Textfarbe (Dialog code) |
| `--a-kb-shortcut-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 | ★26 | Tastenkürzel-Anzeige: Hintergrundfarbe (shortcut) |
| `--a-kb-shortcut-border-color` | `rgba(0, 0, 0, 0.075)` | `rgba(255, 255, 255, 0.075)` | 1 | ★26 | Tastenkürzel-Anzeige: Randfarbe (shortcut) |
| `--a-overlay-background-color` | `rgba(0, 0, 0, .15)` | = Vita | 1 |  | Overlay (u-Overlay): Hintergrundfarbe |
| `--a-spinner-border-color` | `rgba(255, 255, 255, .25)` | = Vita | 1 |  | Lade-Spinner: Randfarbe |
| `--a-spinner-border-width` | `.25rem` | = Vita | 1 |  | Lade-Spinner: Randbreite |
| `--a-spinner-cell-refresh-background-color` | `rgba(0, 0, 0, .2)` | = Vita | 1 |  | Lade-Spinner: Hintergrundfarbe (Zelle refresh) |
| `--a-spinner-color` | `#fff` | = Vita | 2 |  | Lade-Spinner: Farbe |
| `--a-spinner-container-backdrop-filter` | `blur(2px)` | = Vita | 1 |  | Lade-Spinner: Backdrop-Filter (Container) |
| `--a-spinner-container-background-color` | `rgba(0, 0, 0, .5)` | = Vita | 1 |  | Lade-Spinner: Hintergrundfarbe (Container) |
| `--a-spinner-container-padding` | `.5rem` | = Vita | 9 |  | Lade-Spinner: Innenabstand (Container) |
| `--a-spinner-container-shadow` | `none` | = Vita | 1 |  | Lade-Spinner: Schatten (Container) |
| `--a-spinner-size` | `2rem` | = Vita | 12 |  | Lade-Spinner: Größe |
| `--a-tooltip-backdrop-filter` | `blur(4px)` | = Vita | 1 |  | Tooltip (app_ui): Backdrop-Filter |
| `--a-tooltip-background-color` | `rgba(0, 0, 0, .9)` | = Vita | 6 | ◇ | Tooltip (app_ui): Hintergrundfarbe |
| `--a-tooltip-font-size` | `.6875rem` | = Vita | 2 |  | Tooltip (app_ui): Schriftgröße |
| `--a-tooltip-text-color` | `#fff` | = Vita | 2 | ◇ | Tooltip (app_ui): Textfarbe |
| `--jui-dialog-background-color` | `var(--ut-region-background-color, var(--ut-co…` → `#fff` | `var(--ut-region-background-color, var(--ut-co…` → `#1b1d1e` | 3 |  | Dialog-Hintergrund = var(--ut-region-background-color, var(--ut-component-background-color)). |
| `--jui-dialog-border-color` | `var(--ut-region-border-color, var(--ut-compon…` → `rgba(0,0,0,.1)` | `var(--ut-region-border-color, var(--ut-compon…` → `hsla(0,0%,100%,.15)` | 4 |  | Dialog (jQuery UI .ui-dialog): Randfarbe |
| `--jui-dialog-border-radius` | `var(--ut-region-border-radius, var(--ut-compo…` → `0.125rem` | `var(--ut-region-border-radius, var(--ut-compo…` → `2px` | 17 |  | Dialog-Radius = var(--ut-region-border-radius, var(--ut-component-border-radius)). |
| `--jui-dialog-border-width` | `0` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Randbreite |
| `--jui-dialog-buttonpane-background-color` | `rgba(0, 0, 0, .025)` | = Vita | 4 |  | Dialog (jQuery UI .ui-dialog): Hintergrundfarbe (Button-Leiste) |
| `--jui-dialog-buttonpane-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 4 |  | Dialog (jQuery UI .ui-dialog): Randfarbe (Button-Leiste) |
| `--jui-dialog-buttonpane-border-width` | — | — | 4 | L | Dialog (jQuery UI .ui-dialog): Randbreite (Button-Leiste) — lokal in `.t-Dialog-page--wizard`; Fallback `1px` |
| `--jui-dialog-buttonpane-content-padding-x` | `1rem` | = Vita | 4 |  | Dialog (jQuery UI .ui-dialog): Innenabstand horizontal (Button-Leiste Inhalt) |
| `--jui-dialog-buttonpane-content-padding-y` | `.75rem` | = Vita | 4 |  | Dialog (jQuery UI .ui-dialog): Innenabstand vertikal (Button-Leiste Inhalt) |
| `--jui-dialog-content-padding-x` | `0rem` | = Vita | 4 |  | Dialog (jQuery UI .ui-dialog): Innenabstand horizontal (Inhalt) |
| `--jui-dialog-content-padding-y` | `0rem` | = Vita | 5 |  | Dialog (jQuery UI .ui-dialog): Innenabstand vertikal (Inhalt) |
| `--jui-dialog-font-size` | `.75rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Schriftgröße |
| `--jui-dialog-overflow` | — | — | 1 | L | Dialog (jQuery UI .ui-dialog): Overflow — lokal in `.ui-dialog--chat-client` |
| `--jui-dialog-shadow` | `var(--ut-shadow-lg), 0 0 0 1px var(--ut-regio…` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | `var(--ut-shadow-lg), 0 0 0 1px var(--ut-regio…` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | 1 |  | Dialog (jQuery UI .ui-dialog): Schatten |
| `--jui-dialog-text-color` | `var(--ut-region-text-color, var(--ut-componen…` → `#262626` | `var(--ut-region-text-color, var(--ut-componen…` → `#f5f5f5` | 1 |  | Dialog (jQuery UI .ui-dialog): Textfarbe |
| `--jui-dialog-title-close-border-color` | `var(--a-button-border-color)` → `rgba(0,0,0,.075)` | `var(--a-button-border-color)` → `hsla(0,0%,100%,.075)` | 1 |  | Dialog (jQuery UI .ui-dialog): Randfarbe (Titel Schließen) |
| `--jui-dialog-title-close-border-radius` | `var(--a-button-border-radius, .125rem)` → `0.125rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Eckenradius (Titel Schließen) |
| `--jui-dialog-title-close-height` | `1.5rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Höhe (Titel Schließen) |
| `--jui-dialog-title-close-icon` | `"\00D7"` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Icon (Titel Schließen) |
| `--jui-dialog-title-close-icon-font-family` | — | — | 1 | L | Dialog (jQuery UI .ui-dialog): Schriftfamilie (Titel Schließen Icon) — lokal in `.ui-dialog-titlebar-close .ui-icon-closethick::before` |
| `--jui-dialog-title-close-icon-size` | `1rem` | = Vita | 5 |  | Dialog (jQuery UI .ui-dialog): Größe (Titel Schließen Icon) |
| `--jui-dialog-title-close-padding-x` | `.5rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Innenabstand horizontal (Titel Schließen) |
| `--jui-dialog-title-close-padding-y` | `.5rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Innenabstand vertikal (Titel Schließen) |
| `--jui-dialog-title-close-width` | `1.5rem` | = Vita | 1 |  | Dialog (jQuery UI .ui-dialog): Breite (Titel Schließen) |
| `--jui-dialog-title-font-size` | `1rem` | = Vita | 3 |  | Dialog (jQuery UI .ui-dialog): Schriftgröße (Titel) |
| `--jui-dialog-title-font-weight` | — | — | 3 | L | Dialog (jQuery UI .ui-dialog): Schriftstärke (Titel) — lokal in `.t-Dialog-page--wizard`; Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--jui-dialog-title-line-height` | `1.5rem` | = Vita | 3 |  | Dialog (jQuery UI .ui-dialog): Zeilenhöhe (Titel) |
| `--jui-dialog-title-restore-icon` | — | — | 1 | L | Dialog (jQuery UI .ui-dialog): Icon (Titel restore) — lokal in `.ui-dialog-titlebar-restore .icon-restore-alt::before`; Fallback `'\e821'` |
| `--jui-dialog-title-restore-icon-font-family` | — | — | 1 | L | Dialog (jQuery UI .ui-dialog): Schriftfamilie (Titel restore Icon) — lokal in `.ui-dialog-titlebar-restore .icon-restore-alt::before` |
| `--jui-dialog-titlebar-background-color` | `transparent` | = Vita | 2 |  | Dialog (jQuery UI .ui-dialog): Hintergrundfarbe (Titelleiste) |
| `--jui-dialog-titlebar-border-color` | `var(--ut-region-border-color, var(--ut-compon…` → `rgba(0,0,0,.1)` | `var(--ut-region-border-color, var(--ut-compon…` → `hsla(0,0%,100%,.15)` | 2 |  | Dialog (jQuery UI .ui-dialog): Randfarbe (Titelleiste) |
| `--jui-dialog-titlebar-border-width` | `var(--ut-region-border-width, var(--ut-compon…` → `1px` | = Vita | 2 |  | Dialog (jQuery UI .ui-dialog): Randbreite (Titelleiste) |
| `--jui-dialog-titlebar-padding-x` | `1rem` | = Vita | 6 |  | Dialog (jQuery UI .ui-dialog): Innenabstand horizontal (Titelleiste) |
| `--jui-dialog-titlebar-padding-y` | `.75rem` | = Vita | 4 |  | Dialog (jQuery UI .ui-dialog): Innenabstand vertikal (Titelleiste) |
| `--jui-dialog-titlebar-text-color` | `var(--ut-component-text-title-color)` → `#000` | `var(--ut-component-text-title-color)` → `#fff` | 2 |  | Dialog (jQuery UI .ui-dialog): Textfarbe (Titelleiste) |
| `--jui-icon-background-image` | — | — | 1 | L | jQuery-UI-Icon: background Bild — lokal in `.ui-dialog-titlebar-restore .ui-icon` … |
| `--jui-icon-size` | — | — | 3 | L | jQuery-UI-Icon: Größe — lokal in `.ui-dialog-titlebar-restore .ui-icon` …; Fallback `16px` |
| `--jui-overlay-background-color` | `rgba(0, 0, 0, .25)` | = Vita | 2 | ◇ | Modal-Overlay (jQuery UI): Hintergrundfarbe |
| `--jui-tooltip-background-color` | `#fff` | = Vita | 6 |  | Tooltip (jQuery UI): Hintergrundfarbe |
| `--jui-tooltip-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 2 |  | Tooltip (jQuery UI): Randfarbe |
| `--jui-tooltip-border-radius` | `.125rem` | = Vita | 1 |  | Tooltip (jQuery UI): Eckenradius |
| `--jui-tooltip-padding` | `.5rem` | = Vita | 6 |  | Tooltip (jQuery UI): Innenabstand |
| `--jui-tooltip-shadow` | `0 4px 16px rgba(0, 0, 0, .15)` | = Vita | 3 |  | Tooltip (jQuery UI): Schatten |
| `--jui-tooltip-text-color` | `#000` | = Vita | 5 |  | Tooltip (jQuery UI): Textfarbe |
| `--jui-widget-shadow` | `0 2px 4px rgba(0, 0, 0, .15)` | = Vita | 1 |  | jQuery-UI-Widget: Schatten |
| `--ut-dialog-content-font-size` | — | — | 0 | L ∅ | Dialog/Drawer (UT): Schriftgröße (Inhalt) — lokal in `.t-Dialog-page--wizard` |
| `--ut-dialog-padding-x` | — | — | 4 | L | Dialog/Drawer (UT): Innenabstand horizontal — lokal in `.t-Dialog--noPadding, .t-PageBody--noContentPadding` …; Fallback `1rem` |
| `--ut-dialog-padding-y` | — | — | 4 | L | Dialog/Drawer (UT): Innenabstand vertikal — lokal in `.t-Dialog--noPadding, .t-PageBody--noContentPadding` …; Fallback `1rem` |
| `--ut-dialog-pullout-block-size` | — | — | 1 | ★26 L | Dialog/Drawer (UT): Größe (pullout block) — lokal in `.t-Drawer--sm.ui-dialog.t-Drawer--pullOutBottom, .t-Drawer-…` …; Fallback `25rem` |

### 10.15 Reports/IR/IG/Faceted Search (159)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-bar-chart-bar-border-radius` | — | — | 2 | L | Balkendiagramm (a-BarChart): Eckenradius (bar) — lokal in `.a-BarChart--classic` … |
| `--a-bar-chart-bar-height` | — | — | 2 | L | Balkendiagramm (a-BarChart): Höhe (bar) — lokal in `.a-BarChart--classic` …; Fallback `0.5rem` |
| `--a-bar-chart-bar-margin` | — | — | 1 | L | Balkendiagramm (a-BarChart): Außenabstand (bar) — lokal in `.a-BarChart--classic` … |
| `--a-bar-chart-bar-opacity` | — | — | 1 | L | Balkendiagramm (a-BarChart): Deckkraft (bar) — lokal in `.a-BarChart--classic` … |
| `--a-fs-chart-background-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 1 |  | Faceted Search: Hintergrundfarbe (chart) |
| `--a-fs-chart-border-color` | `var(--ut-region-border-color, var(--ut-compon…` → `rgba(0,0,0,.1)` | `var(--ut-region-border-color, var(--ut-compon…` → `hsla(0,0%,100%,.15)` | 1 |  | Faceted Search: Randfarbe (chart) |
| `--a-fs-chart-border-radius` | `var(--ut-region-border-radius, var(--ut-compo…` → `0.125rem` | `var(--ut-region-border-radius, var(--ut-compo…` → `2px` | 1 |  | Faceted Search: Eckenradius (chart) |
| `--a-fs-chart-border-width` | `var(--ut-region-border-width, var(--ut-compon…` → `1px` | = Vita | 1 |  | Faceted Search: Randbreite (chart) |
| `--a-fs-chart-padding-x` | `1rem` | = Vita | 2 |  | Faceted Search: Innenabstand horizontal (chart) |
| `--a-fs-chart-padding-y` | `1rem` | = Vita | 2 |  | Faceted Search: Innenabstand vertikal (chart) |
| `--a-fs-chart-shadow` | `var(--ut-region-box-shadow)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 |  | Faceted Search: Schatten (chart) |
| `--a-fs-control-actions-padding-x` | `0rem` | = Vita | 2 |  | Faceted Search: Innenabstand horizontal (Control Aktionen) |
| `--a-fs-control-actions-padding-y` | `.75rem` | = Vita | 1 |  | Faceted Search: Innenabstand vertikal (Control Aktionen) |
| `--a-fs-control-body-padding-x` | `.75rem` | = Vita | 6 |  | Faceted Search: Innenabstand horizontal (Control Inhalt) |
| `--a-fs-control-body-padding-y` | `.75rem` | = Vita | 6 |  | Faceted Search: Innenabstand vertikal (Control Inhalt) |
| `--a-fs-control-header-font-size` | `1rem` | = Vita | 1 |  | Faceted Search: Schriftgröße (Control Kopf) |
| `--a-fs-control-header-line-height` | `1.25rem` | = Vita | 1 |  | Faceted Search: Zeilenhöhe (Control Kopf) |
| `--a-fs-control-header-padding-x` | `.75rem` | = Vita | 2 |  | Faceted Search: Innenabstand horizontal (Control Kopf) |
| `--a-fs-control-header-padding-y` | `.75rem` | = Vita | 2 |  | Faceted Search: Innenabstand vertikal (Control Kopf) |
| `--a-fs-control-inline-size` | — | — | 1 | L | Faceted Search: Größe (Control inline) — lokal in `.a-FS-range--number .apex-item-text`; Fallback `100%` |
| `--a-fs-control-input-max-width` | — | — | 1 | L | Faceted Search: Maximalbreite (Control Eingabe) — lokal in `.a-FS-range .apex-item-text` … |
| `--a-fs-control-item-spacing` | `.75rem` | = Vita | 2 |  | Faceted Search: Abstand (Control Eintrag) |
| `--a-fs-control-seperator-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 5 |  | Faceted Search: Randfarbe (Control seperator) |
| `--a-fs-control-seperator-border-width` | `var(--ut-component-border-width, 1px)` → `1px` | = Vita | 5 |  | Faceted Search: Randbreite (Control seperator) |
| `--a-fs-filter-group-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 2 |  | Faceted Search: Randfarbe (filter Gruppe) |
| `--a-fs-filter-group-border-width` | `var(--ut-component-border-width, 1px)` → `1px` | = Vita | 2 |  | Faceted Search: Randbreite (filter Gruppe) |
| `--a-fs-filter-group-label-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Faceted Search: Textfarbe (filter Gruppe Label) |
| `--a-fs-item-sub-group-spacing` | `.5rem` | = Vita | 1 |  | Faceted Search: Abstand (Eintrag sub Gruppe) |
| `--a-fs-search-container-border-color` | `var(--a-button-border-color)` → `rgba(0,0,0,.075)` | `var(--a-button-border-color)` → `hsla(0,0%,100%,.075)` | 1 |  | Faceted Search: Randfarbe (Suche Container) |
| `--a-fs-search-container-border-width` | `var(--a-button-border-width)` | = Vita | 1 |  | Faceted Search: Randbreite (Suche Container) |
| `--a-fs-toggle-background-color` | `var(--a-button-background-color)` → `#f8f8f8` | `var(--a-button-background-color)` → `#494a4b` | 1 |  | Faceted Search: Hintergrundfarbe (Toggle) |
| `--a-fs-toggle-border-color` | `var(--a-button-border-color)` → `rgba(0,0,0,.075)` | `var(--a-button-border-color)` → `hsla(0,0%,100%,.075)` | 1 |  | Faceted Search: Randfarbe (Toggle) |
| `--a-fs-toggle-border-radius` | `var(--a-button-border-radius)` → `0.125rem` | = Vita | 1 |  | Faceted Search: Eckenradius (Toggle) |
| `--a-fs-toggle-border-width` | `var(--a-button-border-width)` | = Vita | 5 |  | Faceted Search: Randbreite (Toggle) |
| `--a-fs-toggle-shadow` | — | — | 0 | L ∅ | Faceted Search: Schatten (Toggle) — lokal in `.a-FS-toggle:hover` … |
| `--a-fs-toggle-text-color` | `var(--a-button-text-color)` → `#393939` | `var(--a-button-text-color)` → `#fff` | 1 |  | Faceted Search: Textfarbe (Toggle) |
| `--a-gv-background-color` | `white` | `#1b1d1e` | 6 | ◆ TR | Hintergrund von IG/IR-Tabellen (Theme Roller „Interactive Reports“). |
| `--a-gv-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 5 |  | Grid View (IG/IR-Tabelle): Randfarbe |
| `--a-gv-border-radius` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Eckenradius — lokal in `.a-IRR` … |
| `--a-gv-border-width` | — | — | 3 | L | Grid View (IG/IR-Tabelle): Randbreite — lokal in `.t-IRR-region--noBorders`; Fallback `1px` |
| `--a-gv-cell-border-color` | `#e6e6e6` | `#323435` | 13 | ◆ TR | Grid View (IG/IR-Tabelle): Randfarbe (Zelle) |
| `--a-gv-cell-height` | `2rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Höhe (Zelle) |
| `--a-gv-cell-padding-x` | `.5rem` | = Vita | 9 |  | Grid View (IG/IR-Tabelle): Innenabstand horizontal (Zelle) |
| `--a-gv-cell-padding-y` | `.25rem` | = Vita | 6 |  | Grid View (IG/IR-Tabelle): Innenabstand vertikal (Zelle) |
| `--a-gv-deleted-background-color` | `#f2f2f2` | `#0d0d0d` | 1 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (gelöscht) |
| `--a-gv-font-size` | `.75rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Schriftgröße |
| `--a-gv-footer-background-color` | `var(--a-gv-background-color)` → `#fff` | `var(--a-gv-background-color)` → `#1b1d1e` | 2 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Fuß) |
| `--a-gv-footer-border-color` | `var(--a-gv-header-cell-border-color)` → `#e6e6e6` | `var(--a-gv-header-cell-border-color)` → `#333639` | 1 |  | Grid View (IG/IR-Tabelle): Randfarbe (Fuß) |
| `--a-gv-footer-padding-x` | `.75rem` | = Vita | 11 |  | Grid View (IG/IR-Tabelle): Innenabstand horizontal (Fuß) |
| `--a-gv-footer-padding-y` | `.5rem` | = Vita | 12 |  | Grid View (IG/IR-Tabelle): Innenabstand vertikal (Fuß) |
| `--a-gv-grandtotal-background-color` | `#e6e6e6` | `#1a1a1a` | 2 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Gesamtsumme) |
| `--a-gv-header-background-color` | `var(--ut-region-header-background-color)` → `#fff` | `var(--ut-region-header-background-color)` → `#111213` | 6 | ◆ | Spaltenkopf-Hintergrund IG/IR (Vita: var(--ut-region-header-background-color)). |
| `--a-gv-header-cell-border-color` | `#e6e6e6` | `#333639` | 8 | ◆ TR | Grid View (IG/IR-Tabelle): Randfarbe (Kopf Zelle) |
| `--a-gv-header-cell-height` | `2.5rem` | = Vita | 4 |  | Grid View (IG/IR-Tabelle): Höhe (Kopf Zelle) |
| `--a-gv-header-cell-padding-x` | `.5rem` | = Vita | 6 |  | Grid View (IG/IR-Tabelle): Innenabstand horizontal (Kopf Zelle) |
| `--a-gv-header-cell-padding-y` | `.25rem` | = Vita | 6 |  | Grid View (IG/IR-Tabelle): Innenabstand vertikal (Kopf Zelle) |
| `--a-gv-header-drag-helper-backdrop-filter` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Backdrop-Filter (Kopf Drag Helfer) — lokal in `.a-GV-header-dragHelper.ui-draggable-dragging` |
| `--a-gv-header-drag-helper-background-color` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Kopf Drag Helfer) — lokal in `.a-GV-header-dragHelper.ui-draggable-dragging` |
| `--a-gv-header-drag-helper-border-color` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Randfarbe (Kopf Drag Helfer) — lokal in `.a-GV-header-dragHelper.ui-draggable-dragging` |
| `--a-gv-header-drag-helper-border-radius` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Eckenradius (Kopf Drag Helfer) — lokal in `.a-GV-header-dragHelper.ui-draggable-dragging` |
| `--a-gv-header-drag-helper-shadow` | — | — | 1 | L | Grid View (IG/IR-Tabelle): Schatten (Kopf Drag Helfer) — lokal in `.a-GV-header-dragHelper.ui-draggable-dragging` |
| `--a-gv-inserted-background-color` | `var(--a-palette-success-shade)` → `#f4f9f2` | `var(--a-palette-success-shade)` → `#0c1e09` | 1 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (eingefügt) |
| `--a-gv-line-height` | `1rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Zeilenhöhe |
| `--a-gv-nodata-message-font-size` | `.75rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Schriftgröße (Keine-Daten Nachricht) |
| `--a-gv-nodata-message-icon-color` | `#d0d0d0` | = Vita | 2 |  | Grid View (IG/IR-Tabelle): Farbe (Keine-Daten Nachricht Icon) |
| `--a-gv-nodata-message-icon-size` | `2rem` | = Vita | 2 |  | Grid View (IG/IR-Tabelle): Größe (Keine-Daten Nachricht Icon) |
| `--a-gv-nodata-message-icon-spacing` | `.75rem` | = Vita | 2 |  | Grid View (IG/IR-Tabelle): Abstand (Keine-Daten Nachricht Icon) |
| `--a-gv-nodata-message-padding-x` | `1rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Innenabstand horizontal (Keine-Daten Nachricht) |
| `--a-gv-nodata-message-padding-y` | `1rem` | = Vita | 3 |  | Grid View (IG/IR-Tabelle): Innenabstand vertikal (Keine-Daten Nachricht) |
| `--a-gv-nodata-message-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 3 |  | Grid View (IG/IR-Tabelle): Textfarbe (Keine-Daten Nachricht) |
| `--a-gv-pagination-button-background-color` | `transparent` | = Vita | 1 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Paginierung Button) |
| `--a-gv-pagination-button-border-color` | `var(--a-button-border-color)` → `rgba(0,0,0,.075)` | `var(--a-button-border-color)` → `hsla(0,0%,100%,.075)` | 1 |  | Grid View (IG/IR-Tabelle): Randfarbe (Paginierung Button) |
| `--a-gv-pagination-button-gap-x` | `.25rem` | = Vita | 5 |  | Grid View (IG/IR-Tabelle): Lücke horizontal (Paginierung Button) |
| `--a-gv-pagination-button-hover-background-color` | `var(--a-button-hover-background-color)` → `#fff` | `var(--a-button-hover-background-color)` → `#626465` | 1 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Paginierung Button Hover) |
| `--a-gv-pagination-button-hover-text-color` | `var(--a-button-hover-text-color)` | = Vita | 1 |  | Grid View (IG/IR-Tabelle): Textfarbe (Paginierung Button Hover) |
| `--a-gv-pagination-button-padding-x` | `.25rem` | = Vita | 2 |  | Grid View (IG/IR-Tabelle): Innenabstand horizontal (Paginierung Button) |
| `--a-gv-pagination-button-padding-y` | `.25rem` | = Vita | 2 |  | Grid View (IG/IR-Tabelle): Innenabstand vertikal (Paginierung Button) |
| `--a-gv-pagination-button-text-color` | `var(--a-button-text-color)` → `#393939` | `var(--a-button-text-color)` → `#fff` | 3 |  | Grid View (IG/IR-Tabelle): Textfarbe (Paginierung Button) |
| `--a-gv-row-hover-background-color` | `#f9f9f9` | `#060606` | 4 | ◇ | Grid View (IG/IR-Tabelle): Hintergrundfarbe (Zeile Hover) |
| `--a-gv-text-color` | — | — | 4 | L | Grid View (IG/IR-Tabelle): Textfarbe — lokal in `.a-GV-table tr.is-selected` |
| `--a-gv-updated-background-color` | `var(--a-palette-info-shade)` → `#f3f8fc` | `var(--a-palette-info-shade)` → `#001830` | 1 |  | Grid View (IG/IR-Tabelle): Hintergrundfarbe (geändert) |
| `--a-percent-chart-background-color` | `var(--ut-palette-primary-shade)` → `#e6f0fa` | `var(--ut-palette-primary-shade)` → `#010b14` | 1 |  | Prozent-Balken (Report-Spalte): Hintergrundfarbe |
| `--a-percent-chart-bar-background-color` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 9 |  | Prozent-Balken (Report-Spalte): Hintergrundfarbe (bar) |
| `--a-percent-chart-bar-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Prozent-Balken (Report-Spalte): Randfarbe (bar) |
| `--a-percent-chart-bar-text-color` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 1 |  | Prozent-Balken (Report-Spalte): Textfarbe (bar) |
| `--a-percent-chart-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Prozent-Balken (Report-Spalte): Randfarbe |
| `--a-percent-chart-border-radius` | `.125rem` | = Vita | 1 |  | Prozent-Balken (Report-Spalte): Eckenradius |
| `--a-percent-chart-height` | `1rem` | = Vita | 3 |  | Prozent-Balken (Report-Spalte): Höhe |
| `--a-report-controls-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Report Controls (IR/IG-Dialoge): Randfarbe |
| `--a-report-controls-border-width` | `var(--ut-component-border-width)` → `1px` | = Vita | 1 |  | Report Controls (IR/IG-Dialoge): Randbreite |
| `--a-report-controls-cell-border-radius` | `.125rem` | = Vita | 16 |  | Report Controls (IR/IG-Dialoge): Eckenradius (Zelle) |
| `--a-report-controls-cell-label-background-color` | `white` | `#1b1d1e` | 2 | TR | Report Controls (IR/IG-Dialoge): Hintergrundfarbe (Zelle Label) |
| `--a-report-controls-cell-label-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 2 |  | Report Controls (IR/IG-Dialoge): Randfarbe (Zelle Label) |
| `--a-report-controls-cell-label-border-width` | `var(--ut-component-border-width)` → `1px` | = Vita | 6 |  | Report Controls (IR/IG-Dialoge): Randbreite (Zelle Label) |
| `--a-report-controls-cell-label-font-size` | `.75rem` | = Vita | 3 |  | Report Controls (IR/IG-Dialoge): Schriftgröße (Zelle Label) |
| `--a-report-controls-cell-label-hover-background-color` | — | — | 2 | L | Report Controls (IR/IG-Dialoge): Hintergrundfarbe (Zelle Label Hover) — lokal in `.a-IG-reportSummary-item.is-error, .a-IG-controls-item.is-e…` … |
| `--a-report-controls-cell-label-icon-background-color` | `#f0f0f0` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Hintergrundfarbe (Zelle Label Icon) |
| `--a-report-controls-cell-label-icon-text-color` | `#fff` | = Vita | 3 |  | Report Controls (IR/IG-Dialoge): Textfarbe (Zelle Label Icon) |
| `--a-report-controls-cell-label-line-height` | `1rem` | = Vita | 3 |  | Report Controls (IR/IG-Dialoge): Zeilenhöhe (Zelle Label) |
| `--a-report-controls-cell-label-text-color` | `#262626` | `whitesmoke` | 2 | TR | Report Controls (IR/IG-Dialoge): Textfarbe (Zelle Label) |
| `--a-report-controls-cell-label-width` | `18.75rem` | = Vita | 1 |  | Report Controls (IR/IG-Dialoge): Breite (Zelle Label) |
| `--a-report-controls-cell-spacing` | `.5rem` | = Vita | 6 |  | Report Controls (IR/IG-Dialoge): Abstand (Zelle) |
| `--a-report-controls-input-border-color` | `var(--a-field-input-border-color)` → `#dfdfdf` | `var(--a-field-input-border-color)` → `#393d40` | 1 |  | Report Controls (IR/IG-Dialoge): Randfarbe (Eingabe) |
| `--a-report-controls-input-border-radius` | `var(--a-field-input-border-radius)` → `0.125rem` | `var(--a-field-input-border-radius)` → `2px` | 1 |  | Report Controls (IR/IG-Dialoge): Eckenradius (Eingabe) |
| `--a-report-controls-input-border-width` | `var(--a-field-input-border-width)` → `1px` | = Vita | 14 |  | Report Controls (IR/IG-Dialoge): Randbreite (Eingabe) |
| `--a-report-controls-input-focus-border-color` | `var(--a-field-input-focus-border-color)` → `#056ac8` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Randfarbe (Eingabe Fokus) |
| `--a-report-controls-input-font-size` | `.75rem` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Schriftgröße (Eingabe) |
| `--a-report-controls-input-line-height` | `1rem` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Zeilenhöhe (Eingabe) |
| `--a-report-controls-input-padding-x` | `.5rem` | = Vita | 6 |  | Report Controls (IR/IG-Dialoge): Innenabstand horizontal (Eingabe) |
| `--a-report-controls-input-padding-y` | `.5rem` | = Vita | 9 |  | Report Controls (IR/IG-Dialoge): Innenabstand vertikal (Eingabe) |
| `--a-report-controls-item-spacing` | `.25rem` | = Vita | 10 |  | Report Controls (IR/IG-Dialoge): Abstand (Eintrag) |
| `--a-report-controls-padding-x` | `.5rem` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Innenabstand horizontal |
| `--a-report-controls-padding-y` | `.5rem` | = Vita | 2 |  | Report Controls (IR/IG-Dialoge): Innenabstand vertikal |
| `--a-rv-body-padding-x` | `0rem` | = Vita | 1 |  | Record View (IG Single Row View): Innenabstand horizontal (Inhalt) |
| `--a-rv-body-padding-y` | `.25rem` | = Vita | 1 |  | Record View (IG Single Row View): Innenabstand vertikal (Inhalt) |
| `--a-rv-font-size` | `.75rem` | = Vita | 1 |  | Record View (IG Single Row View): Schriftgröße |
| `--a-rv-line-height` | `1rem` | = Vita | 1 |  | Record View (IG Single Row View): Zeilenhöhe |
| `--a-splitter-bar-active-background-color` | `var(--a-splitter-bar-hover-background-color)` → `#fff` | = Vita | 1 |  | Splitter: Hintergrundfarbe (bar aktiv) |
| `--a-splitter-bar-background-color` | `#EAEAEA` | = Vita | 2 |  | Splitter: Hintergrundfarbe (bar) |
| `--a-splitter-bar-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 3 |  | Splitter: Randfarbe (bar) |
| `--a-splitter-bar-focus-background-color` | `#399BEA` | = Vita | 5 |  | Splitter: Hintergrundfarbe (bar Fokus) |
| `--a-splitter-bar-focus-border-color` | `var(--a-splitter-bar-focus-background-color)` → `#399bea` | = Vita | 2 |  | Splitter: Randfarbe (bar Fokus) |
| `--a-splitter-bar-hover-background-color` | `#fff` | = Vita | 3 |  | Splitter: Hintergrundfarbe (bar Hover) |
| `--a-splitter-bar-width` | `.5rem` | = Vita | 2 |  | Splitter: Breite (bar) |
| `--a-splitter-thumb-arrow-color` | `#000` | = Vita | 4 |  | Splitter: Farbe (Thumb Pfeil) |
| `--a-splitter-thumb-background-color` | `var(--a-splitter-bar-background-color)` → `#eaeaea` | = Vita | 1 |  | Splitter: Hintergrundfarbe (Thumb) |
| `--a-splitter-thumb-border-color` | `var(--a-splitter-bar-border-color)` → `rgba(0,0,0,.1)` | = Vita | 1 |  | Splitter: Randfarbe (Thumb) |
| `--a-splitter-thumb-border-radius` | `0rem` | = Vita | 1 |  | Splitter: Eckenradius (Thumb) |
| `--a-splitter-thumb-focus-arrow-color` | `#fff` | = Vita | 2 |  | Splitter: Farbe (Thumb Fokus Pfeil) |
| `--a-splitter-thumb-focus-background-color` | `var(--a-splitter-bar-focus-background-color)` → `#399bea` | = Vita | 4 |  | Splitter: Hintergrundfarbe (Thumb Fokus) |
| `--a-splitter-thumb-focus-border-color` | `var(--a-splitter-bar-focus-background-color)` → `#399bea` | = Vita | 3 |  | Splitter: Randfarbe (Thumb Fokus) |
| `--a-splitter-thumb-focus-hover-background-color` | `var(--a-splitter-thumb-focus-background-color)` → `#399bea` | = Vita | 1 |  | Splitter: Hintergrundfarbe (Thumb Fokus Hover) |
| `--a-splitter-thumb-height` | `3rem` | = Vita | 2 |  | Splitter: Höhe (Thumb) |
| `--a-splitter-thumb-hover-background-color` | `var(--a-splitter-bar-hover-background-color)` → `#fff` | = Vita | 1 |  | Splitter: Hintergrundfarbe (Thumb Hover) |
| `--a-splitter-thumb-hover-border-color` | `var(--a-splitter-bar-focus-background-color)` → `#399bea` | = Vita | 1 |  | Splitter: Randfarbe (Thumb Hover) |
| `--a-splitter-thumb-width` | `.5rem` | = Vita | 2 |  | Splitter: Breite (Thumb) |
| `--a-toolbar-background-color` | `var(--ut-region-header-background-color)` → `#fff` | `var(--ut-region-header-background-color)` → `#111213` | 11 | ◇ | Toolbar (IG/IR): Hintergrundfarbe |
| `--a-toolbar-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 11 |  | Toolbar (IG/IR): Randfarbe |
| `--a-toolbar-border-width` | `var(--ut-component-border-width, 1px)` → `1px` | = Vita | 8 |  | Toolbar (IG/IR): Randbreite |
| `--a-toolbar-item-spacing` | `.5rem` | = Vita | 33 |  | Toolbar (IG/IR): Abstand (Eintrag) |
| `--a-toolbar-sep-border-color` | `var(--ut-component-inner-border-color)` → `rgba(0,0,0,.05)` | `var(--ut-component-inner-border-color)` → `hsla(0,0%,100%,.1)` | 4 |  | Toolbar (IG/IR): Randfarbe (Trenner) |
| `--a-toolbar-small-button-padding-x` | `.5rem` | = Vita | 0 | ∅ | Toolbar (IG/IR): Innenabstand horizontal (small Button) |
| `--a-toolbar-small-button-padding-y` | `.25rem` | = Vita | 0 | ∅ | Toolbar (IG/IR): Innenabstand vertikal (small Button) |
| `--ut-fs-total-font-size` | — | — | 1 | L | Faceted Search (UT): Schriftgröße (total) — lokal in `.a-FS`; Fallback `1.125rem` |
| `--ut-orderby-justify-content` | — | — | 1 | L | Order-By-Auswahl: justify Inhalt — lokal in `.t-Region-orderBy--start` … |
| `--ut-report-border-style` | — | — | 1 | L | Classic Report (t-Report): Randstil — lokal in `.t-Region--noPadding .t-Report--horizontalBorders, .t-Repor…`; Fallback `solid` |
| `--ut-report-border-width` | — | — | 1 | L | Classic Report (t-Report): Randbreite — lokal in `.t-Report--noBorders` …; Fallback `var(--ut-report-cell-border-width, 1px)` |
| `--ut-report-cell-alt-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 |  | Classic Report (t-Report): Hintergrundfarbe (Zelle alternierend) |
| `--ut-report-cell-background-color` | — | — | 2 | L | Classic Report (t-Report): Hintergrundfarbe (Zelle) — lokal in `.t-Report--staticRowColors .t-Report-report tr:nth-child(od…` …; Fallback `transparent` |
| `--ut-report-cell-border-color` | `#e6e6e6` | `#333639` | 5 | ◇ TR | Classic Report (t-Report): Randfarbe (Zelle) |
| `--ut-report-cell-border-width` | — | — | 6 | L | Classic Report (t-Report): Randbreite (Zelle) — lokal in `.t-Report--noBorders`; Fallback `1px` |
| `--ut-report-cell-hover-background-color` | `#fafafa` | `#202223` | 1 | TR | Classic Report (t-Report): Hintergrundfarbe (Zelle Hover) |
| `--ut-report-header-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 1 | ◇ | Classic Report (t-Report): Hintergrundfarbe (Kopf) |
| `--ut-report-header-cell-border-width` | — | — | 2 | L | Classic Report (t-Report): Randbreite (Kopf Zelle) — lokal in `.t-Report--noBorders`; Fallback `var(--ut-report-cell-border-width, 1px)` |
| `--ut-report-links-border-width` | — | — | 1 | L | Classic Report (t-Report): Randbreite (links) — lokal in `.t-Report--noBorders`; Fallback `var(--ut-report-cell-border-width, 1px)` |
| `--ut-report-pagination-link-background-color` | — | — | 1 | L | Classic Report (t-Report): Hintergrundfarbe (Paginierung Link) — lokal in `.t-Report-paginationText b, .t-Report-paginationText strong…` |
| `--ut-report-pagination-link-text-color` | — | — | 1 | L | Classic Report (t-Report): Textfarbe (Paginierung Link) — lokal in `.t-Report-paginationText b, .t-Report-paginationText strong…` |
| `--ut-smart-filter-max-width` | `30rem` | = Vita | 2 |  | Smart Filters: Maximalbreite |
| `--ut-table-border-width` | — | — | 1 | L | Tabelle: Randbreite — lokal in `.u-Table--withBorder > .u-Table-fit:first-child, .u-Table--…`; Fallback `1px` |

### 10.16 Cards (--a-cv-*, Card List, Metric Card) (98)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-cv-actions-background-color` | — | — | 1 | L | Cards-Region (a-CardView): Hintergrundfarbe (Aktionen) — lokal in `.t-CardsRegion--styleA` … |
| `--a-cv-actions-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 |  | Cards-Region (a-CardView): Randfarbe (Aktionen) |
| `--a-cv-actions-border-width` | `1px` | = Vita | 1 |  | Cards-Region (a-CardView): Randbreite (Aktionen) |
| `--a-cv-actions-padding-x` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Innenabstand horizontal (Aktionen) |
| `--a-cv-actions-padding-y` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Innenabstand vertikal (Aktionen) |
| `--a-cv-active-background-color` | `var(--a-cv-background-color)` → `#fff` | `var(--a-cv-background-color)` → `#1b1d1e` | 1 |  | Cards-Region (a-CardView): Hintergrundfarbe (aktiv) |
| `--a-cv-active-border-color` | `var(--a-cv-border-color)` → `rgba(0,0,0,.1)` | `var(--a-cv-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Cards-Region (a-CardView): Randfarbe (aktiv) |
| `--a-cv-active-shadow` | `var(--a-cv-shadow)` → `0 2px 4px -2px rgba(0,0,0,.075)` | = Vita | 1 |  | Cards-Region (a-CardView): Schatten (aktiv) |
| `--a-cv-active-text-color` | `var(--a-cv-text-color)` | = Vita | 1 |  | Cards-Region (a-CardView): Textfarbe (aktiv) |
| `--a-cv-background-color` | `white` | `#1b1d1e` | 3 | ◆ | Card-Hintergrund (Cards-Region a-CardView). |
| `--a-cv-badge-background-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 1 |  | Cards-Region (a-CardView): Hintergrundfarbe (Badge) |
| `--a-cv-badge-border-radius` | — | — | 1 | L | Cards-Region (a-CardView): Eckenradius (Badge) — lokal in `.t-CardsRegion--styleA` …; Fallback `4px` |
| `--a-cv-badge-font-size` | `.75rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Badge) |
| `--a-cv-badge-padding` | — | — | 1 | L | Cards-Region (a-CardView): Innenabstand (Badge) — lokal in `.t-CardsRegion--styleA` …; Fallback `4px` |
| `--a-cv-body-padding-x` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Innenabstand horizontal (Inhalt) |
| `--a-cv-body-padding-y` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Innenabstand vertikal (Inhalt) |
| `--a-cv-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 7 | ◆ | Card-Randfarbe. |
| `--a-cv-border-radius` | `.1875rem` | = Vita | 3 | ◆ | Card-Radius (Vita doppelt: .25rem → .1875rem). |
| `--a-cv-border-width` | `1px` | = Vita | 3 |  | Cards-Region (a-CardView): Randbreite |
| `--a-cv-focus-border-color` | `#056AC8` | = Vita | 4 | ◇ | Cards-Region (a-CardView): Randfarbe (Fokus) |
| `--a-cv-focus-outline` | `none` | = Vita | 1 |  | Cards-Region (a-CardView): Outline (Fokus) |
| `--a-cv-grid-gap` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Lücke (gap) (Raster) |
| `--a-cv-header-background-color` | — | — | 1 | L | Cards-Region (a-CardView): Hintergrundfarbe (Kopf) — lokal in `.t-CardsRegion--styleA` … |
| `--a-cv-header-border-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 1 |  | Cards-Region (a-CardView): Randfarbe (Kopf) |
| `--a-cv-header-border-width` | `1px` | = Vita | 1 |  | Cards-Region (a-CardView): Randbreite (Kopf) |
| `--a-cv-header-item-spacing-x` | `.75rem` | = Vita | 10 |  | Cards-Region (a-CardView): Abstand horizontal (Kopf Eintrag) |
| `--a-cv-header-padding-x` | `1rem` | = Vita | 4 |  | Cards-Region (a-CardView): Innenabstand horizontal (Kopf) |
| `--a-cv-header-padding-y` | `1rem` | = Vita | 3 |  | Cards-Region (a-CardView): Innenabstand vertikal (Kopf) |
| `--a-cv-hover-background-color` | `var(--a-cv-background-color)` → `#fff` | `var(--a-cv-background-color)` → `#1b1d1e` | 1 |  | Cards-Region (a-CardView): Hintergrundfarbe (Hover) |
| `--a-cv-hover-border-color` | `var(--a-cv-border-color)` → `rgba(0,0,0,.1)` | `var(--a-cv-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | Cards-Region (a-CardView): Randfarbe (Hover) |
| `--a-cv-hover-shadow` | `0 4px .5rem 0 rgba(0, 0, 0, 0.1)` | = Vita | 1 | ◇ | Cards-Region (a-CardView): Schatten (Hover) |
| `--a-cv-hover-text-color` | `var(--a-cv-text-color)` | = Vita | 1 |  | Cards-Region (a-CardView): Textfarbe (Hover) |
| `--a-cv-icon-background-color` | `#056AC8` | = Vita | 1 | ◇ | Cards-Region (a-CardView): Hintergrundfarbe (Icon) |
| `--a-cv-icon-border-radius` | `100%` | = Vita | 10 |  | Cards-Region (a-CardView): Eckenradius (Icon) |
| `--a-cv-icon-container-size` | `2rem` | = Vita | 15 |  | Cards-Region (a-CardView): Größe (Icon Container) |
| `--a-cv-icon-image-border-radius` | — | — | 1 | L | Cards-Region (a-CardView): Eckenradius (Icon Bild) — lokal in `.t-CardsRegion--styleA` …; Fallback `var(--a-cv-icon-border-radius, 100%)` |
| `--a-cv-icon-image-size` | — | — | 3 | L | Cards-Region (a-CardView): Größe (Icon Bild) — lokal in `.t-CardsRegion--styleA` …; Fallback `var(--a-cv-icon-container-size, 32px)` |
| `--a-cv-icon-padding` | `.5rem` | = Vita | 1 |  | Cards-Region (a-CardView): Innenabstand (Icon) |
| `--a-cv-icon-size` | `1rem` | = Vita | 2 |  | Cards-Region (a-CardView): Größe (Icon) |
| `--a-cv-icon-spacer` | `calc(var(--a-cv-icon-container-size, 1rem) + …` → `calc(2rem + .75rem)` | = Vita | 4 |  | Cards-Region (a-CardView): Icon spacer |
| `--a-cv-icon-text-color` | `white` | = Vita | 1 |  | Cards-Region (a-CardView): Textfarbe (Icon) |
| `--a-cv-initials-background-color` | `#056AC8` | = Vita | 1 | ◇ | Cards-Region (a-CardView): Hintergrundfarbe (Initialen) |
| `--a-cv-initials-border-radius` | — | — | 1 | L | Cards-Region (a-CardView): Eckenradius (Initialen) — lokal in `.t-CardsRegion--styleA` …; Fallback `100%` |
| `--a-cv-initials-font-size` | `.875rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Initialen) |
| `--a-cv-initials-font-weight` | `700` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftstärke (Initialen) |
| `--a-cv-initials-size` | `2rem` | = Vita | 2 |  | Cards-Region (a-CardView): Größe (Initialen) |
| `--a-cv-initials-text-color` | `white` | = Vita | 1 |  | Cards-Region (a-CardView): Textfarbe (Initialen) |
| `--a-cv-item-width` | `19rem` | = Vita | 2 |  | Cards-Region (a-CardView): Breite (Eintrag) |
| `--a-cv-maincontent-font-size` | `.875rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Hauptinhalt) |
| `--a-cv-maincontent-line-height` | `1.25rem` | = Vita | 2 |  | Cards-Region (a-CardView): Zeilenhöhe (Hauptinhalt) |
| `--a-cv-media-background-color` | — | — | 1 | L | Cards-Region (a-CardView): Hintergrundfarbe (Medien) — lokal in `.t-CardsRegion--styleA` … |
| `--a-cv-media-border-radius` | — | — | 1 | L | Cards-Region (a-CardView): Eckenradius (Medien) — lokal in `.t-CardsRegion--styleA .has-media--body, .t-CardsRegion--st…` |
| `--a-cv-media-overlay-color` | — | — | 1 | L | Cards-Region (a-CardView): Farbe (Medien Overlay) — lokal in `.t-CardsRegion--styleA` … |
| `--a-cv-media-padding-x` | `1rem` | = Vita | 5 |  | Cards-Region (a-CardView): Innenabstand horizontal (Medien) |
| `--a-cv-media-padding-y` | `1rem` | = Vita | 5 |  | Cards-Region (a-CardView): Innenabstand vertikal (Medien) |
| `--a-cv-order-media` | — | — | 1 | L | Cards-Region (a-CardView): order Medien — lokal in `.a-CardView-media--first`; Fallback `2` |
| `--a-cv-overflow` | — | — | 1 | L | Cards-Region (a-CardView): Overflow — lokal in `.t-CardsRegion--styleA` … |
| `--a-cv-shadow` | `0 2px 4px -2px rgba(0, 0, 0, 0.075)` | = Vita | 2 | ◆ | Card-Schatten (Vita doppelt: var(--ut-shadow-sm) → fixer Wert). |
| `--a-cv-state-background-color` | — | — | 1 | L | Cards-Region (a-CardView): Hintergrundfarbe (Zustands-Slot) — lokal in `.a-CardView.has-actions--full:hover` …; Fallback `var(--a-cv-type-background-color, var(-…` |
| `--a-cv-state-border-color` | — | — | 1 | L | Cards-Region (a-CardView): Randfarbe (Zustands-Slot) — lokal in `.a-CardView.has-actions--full:hover` …; Fallback `var(--a-cv-type-border-color, var(--a-c…` |
| `--a-cv-state-shadow` | — | — | 1 | L | Cards-Region (a-CardView): Schatten (Zustands-Slot) — lokal in `.a-CardView.has-actions--full:hover` …; Fallback `var(--a-cv-type-shadow, var(--a-cv-shad…` |
| `--a-cv-state-text-color` | — | — | 1 | L | Cards-Region (a-CardView): Textfarbe (Zustands-Slot) — lokal in `.a-CardView.has-actions--full:hover` …; Fallback `var(--a-cv-type-text-color, var(--a-cv-…` |
| `--a-cv-subcontent-font-size` | `.6875rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Nebeninhalt) |
| `--a-cv-subcontent-line-height` | `1rem` | = Vita | 1 |  | Cards-Region (a-CardView): Zeilenhöhe (Nebeninhalt) |
| `--a-cv-subcontent-text-color` | `#666666` | `#b6b6b6` | 1 |  | Cards-Region (a-CardView): Textfarbe (Nebeninhalt) |
| `--a-cv-subtitle-font-size` | `.75rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Untertitel) |
| `--a-cv-subtitle-font-weight` | `400` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftstärke (Untertitel) |
| `--a-cv-subtitle-line-height` | `1rem` | = Vita | 1 |  | Cards-Region (a-CardView): Zeilenhöhe (Untertitel) |
| `--a-cv-subtitle-text-color` | `#666666` | `#b6b6b6` | 1 |  | Cards-Region (a-CardView): Textfarbe (Untertitel) |
| `--a-cv-text-color` | — | — | 3 | L | Cards-Region (a-CardView): Textfarbe — lokal in `.has-media--background`; Fallback `inherit` |
| `--a-cv-title-font-size` | `1rem` | = Vita | 1 |  | Cards-Region (a-CardView): Schriftgröße (Titel) |
| `--a-cv-title-line-height` | `1.25rem` | = Vita | 1 |  | Cards-Region (a-CardView): Zeilenhöhe (Titel) |
| `--ut-cardlist-background-color` | — | — | 1 | L | Card List (Legacy t-Cards): Hintergrundfarbe — lokal in `.t-Cards--sampleAppsFooter`; Fallback `var(--ut-component-background-color)` |
| `--ut-cardlist-body-padding-x` | — | — | 2 | L | Card List (Legacy t-Cards): Innenabstand horizontal (Inhalt) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-body-padding-y` | — | — | 2 | L | Card List (Legacy t-Cards): Innenabstand vertikal (Inhalt) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 |  | Card List (Legacy t-Cards): Schatten |
| `--ut-cardlist-desc-font-size` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftgröße (Beschreibung) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-desc-line-height` | — | — | 2 | L | Card List (Legacy t-Cards): Zeilenhöhe (Beschreibung) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-desc-lines` | — | — | 1 | L | Card List (Legacy t-Cards): Beschreibung lines — lokal in `.t-Cards--desc-2ln` … |
| `--ut-cardlist-icon-border-radius` | — | — | 2 | L | Card List (Legacy t-Cards): Eckenradius (Icon) — lokal in `.t-Cards--iconsSquare, .t-Cards.Square` …; Fallback `100%` |
| `--ut-cardlist-icon-container-size` | — | — | 2 | L | Card List (Legacy t-Cards): Größe (Icon Container) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-icon-size` | — | — | 1 | L | Card List (Legacy t-Cards): Größe (Icon) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-info-margin-y` | — | — | 1 | L | Card List (Legacy t-Cards): Außenabstand vertikal (info) — lokal in `.t-Card-desc:empty + .t-Card-info`; Fallback `0.75rem` |
| `--ut-cardlist-initials-font-size` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftgröße (Initialen) — lokal in `.t-Cards--basic` …; Fallback `1.25rem` |
| `--ut-cardlist-initials-font-weight` | — | — | 0 | L ∅ | Card List (Legacy t-Cards): Schriftstärke (Initialen) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-item-max-width` | — | — | 1 | L | Card List (Legacy t-Cards): Maximalbreite (Eintrag) — lokal in `.t-Cards--float` |
| `--ut-cardlist-subtitle-font-size` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftgröße (Untertitel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-subtitle-font-weight` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftstärke (Untertitel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-subtitle-line-height` | — | — | 1 | L | Card List (Legacy t-Cards): Zeilenhöhe (Untertitel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-subtitle-margin-y` | — | — | 1 | L | Card List (Legacy t-Cards): Außenabstand vertikal (Untertitel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-title-font-size` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftgröße (Titel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-title-font-weight` | — | — | 1 | L | Card List (Legacy t-Cards): Schriftstärke (Titel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-title-line-height` | — | — | 1 | L | Card List (Legacy t-Cards): Zeilenhöhe (Titel) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-titlewrap-padding-x` | — | — | 4 | L | Card List (Legacy t-Cards): Innenabstand horizontal (titlewrap) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-titlewrap-padding-y` | — | — | 7 | L | Card List (Legacy t-Cards): Innenabstand vertikal (titlewrap) — lokal in `.t-Cards--basic` … |
| `--ut-cardlist-wrap-border-color` | — | — | 1 | L | Card List (Legacy t-Cards): Randfarbe (Wrapper) — lokal in `.t-Cards--sampleAppsFooter`; Fallback `var(--ut-component-border-color)` |
| `--ut-metric-card-background-color` | — | — | 1 | ★26 L | Metric Card: Hintergrundfarbe — lokal in `.t-MetricCards-item.is-selected`; Fallback `var(--ut-component-background-color)` |
| `--ut-metric-card-color` | — | — | 0 | ★26 L ∅ | Metric Card: Farbe — lokal in `.t-MetricCards-item.is-selected` |

### 10.17 Badges/Avatare (34)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--t-avatar-font-size` | — | — | 0 | L ∅ | Avatar (Legacy-Name): Schriftgröße — lokal in `.t-Avatar--placeholder` |
| `--t-avatar-text-color` | — | — | 0 | L ∅ | Avatar (Legacy-Name): Textfarbe — lokal in `.t-Avatar--placeholder` |
| `--ut-avatar-background-color` | — | — | 3 | L | Avatar (t-Avatar): Hintergrundfarbe — lokal in `.t-MetricCard-avatar--subtle` …; Fallback `var(--a-palette-primary)` |
| `--ut-avatar-border-radius` | — | — | 1 | L | Avatar (t-Avatar): Eckenradius — lokal in `.t-MediaList` …; Fallback `0.25rem` |
| `--ut-avatar-clip-path` | — | — | 4 | L | Avatar (t-Avatar): clip path — lokal in `.t-Avatar` … |
| `--ut-avatar-font-size` | — | — | 1 | L | Avatar (t-Avatar): Schriftgröße — lokal in `.t-MediaList` …; Fallback `1.25rem` |
| `--ut-avatar-font-weight` | — | — | 1 | L | Avatar (t-Avatar): Schriftstärke — lokal in `.t-MediaList` …; Fallback `400` |
| `--ut-avatar-icon-font-size` | — | — | 22 | L | Avatar (t-Avatar): Schriftgröße (Icon) — lokal in `.t-MediaList` …; Fallback `1.5rem` |
| `--ut-avatar-list-gap` | — | — | 4 | L | Avatar (t-Avatar): Lücke (gap) (Liste) — lokal in `.t-Avatars--spacingNone, .t-Avatar-groupItems--spacingNone`; Fallback `.25rem` |
| `--ut-avatar-list-gap-spacing` | — | — | 1 | ★26 L | Avatar (t-Avatar): Abstand (Liste gap) — lokal in `.t-Avatars--spacingSm, .t-Avatar-groupItems--spacingSm` …; Fallback `var(--ut-avatar-list-gap, 0.25rem)` |
| `--ut-avatar-size` | — | — | 12 | L | Avatar (t-Avatar): Größe — lokal in `.t-MediaList` …; Fallback `3rem` |
| `--ut-avatar-text-color` | — | — | 3 | L | Avatar (t-Avatar): Textfarbe — lokal in `.t-MetricCard-avatar--subtle` …; Fallback `var(--a-palette-primary-contrast)` |
| `--ut-badge-background-color` | — | — | 3 | L | Badge (t-Badge): Hintergrundfarbe — lokal in `.t-Timeline` …; Fallback `var(--ut-component-badge-background-col…` |
| `--ut-badge-border-radius` | — | — | 1 | L | Badge (t-Badge): Eckenradius — lokal in `.t-Timeline` …; Fallback `0.25rem` |
| `--ut-badge-border-width` | — | — | 3 | L | Badge (t-Badge): Randbreite — lokal in `.t-Badge--outline`; Fallback `0px` |
| `--ut-badge-font-size` | — | — | 1 | L | Badge (t-Badge): Schriftgröße — lokal in `.t-Timeline` …; Fallback `0.8125rem` |
| `--ut-badge-font-weight` | — | — | 1 | L | Badge (t-Badge): Schriftstärke — lokal in `.t-Timeline` …; Fallback `var(--a-base-font-weight-semibold, 500)` |
| `--ut-badge-height` | — | — | 3 | L | Badge (t-Badge): Höhe — lokal in `.t-Timeline` …; Fallback `1.5rem` |
| `--ut-badge-icon-size` | — | — | 1 | L | Badge (t-Badge): Größe (Icon) — lokal in `.t-Badge--sm` …; Fallback `1rem` |
| `--ut-badge-line-height` | — | — | 1 | L | Badge (t-Badge): Zeilenhöhe — lokal in `.t-Timeline--compact` …; Fallback `1rem` |
| `--ut-badge-max-width` | — | — | 1 | L | Badge (t-Badge): Maximalbreite — lokal in `td .t-Badge`; Fallback `100%` |
| `--ut-badge-padding-x` | — | — | 1 | L | Badge (t-Badge): Innenabstand horizontal — lokal in `.t-Timeline` …; Fallback `0.5rem` |
| `--ut-badge-padding-y` | — | — | 1 | L | Badge (t-Badge): Innenabstand vertikal — lokal in `.t-Timeline` …; Fallback `0.25rem` |
| `--ut-badge-text-color` | — | — | 1 | L | Badge (t-Badge): Textfarbe — lokal in `.t-Timeline` …; Fallback `var(--ut-component-badge-text-color)` |
| `--ut-badgelist-label-font-size` | — | — | 1 | L | Badge List (t-BadgeList): Schriftgröße (Label) — lokal in `.t-BadgeList--dash` … |
| `--ut-badgelist-label-line-height` | — | — | 1 | L | Badge List (t-BadgeList): Zeilenhöhe (Label) — lokal in `.t-BadgeList--dash`; Fallback `1.5` |
| `--ut-badgelist-value-background-color` | — | — | 2 | L | Badge List (t-BadgeList): Hintergrundfarbe (Wert) — lokal in `.t-BadgeList--circular a.t-BadgeList-wrap:hover`; Fallback `var(--ut-component-background-color)` |
| `--ut-badgelist-value-border-color` | — | — | 1 | L | Badge List (t-BadgeList): Randfarbe (Wert) — lokal in `.t-BadgeList--circular a.t-BadgeList-wrap:hover`; Fallback `var(--ut-component-border-color)` |
| `--ut-badgelist-value-font-size` | — | — | 1 | L | Badge List (t-BadgeList): Schriftgröße (Wert) — lokal in `.t-BadgeList--dash` … |
| `--ut-badgelist-value-line-height` | — | — | 1 | L | Badge List (t-BadgeList): Zeilenhöhe (Wert) — lokal in `.t-BadgeList--dash` … |
| `--ut-badgelist-value-size` | — | — | 2 | L | Badge List (t-BadgeList): Größe (Wert) — lokal in `.t-BadgeList--dash` … |
| `--ut-badgelist-value-text-color` | — | — | 2 | L | Badge List (t-BadgeList): Textfarbe (Wert) — lokal in `.t-BadgeList--circular a.t-BadgeList-wrap:hover` |
| `--ut-circle-avatar-mask-position` | — | — | 2 | L | Kreis-Avatar-Maske: mask position — lokal in `.u-RTL .t-Avatar` …; Fallback `-2px 100%, 100%` |
| `--ut-stack-avatar-offset` | — | — | 1 | L | Avatar-Stapel: Versatz — lokal in `.t-Avatar--xxs` …; Fallback `2` |

### 10.18 Alerts/Notifications (19)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-alert-danger-icon` | `"\e242"` | = Vita | 2 |  | Alert-/Bestätigungsdialog (apex.message): Icon (danger) |
| `--a-alert-info-icon` | `"\e1ac"` | = Vita | 2 |  | Alert-/Bestätigungsdialog (apex.message): Icon (info) |
| `--a-alert-message-icon` | — | — | 1 | L | Alert-/Bestätigungsdialog (apex.message): Icon (Nachricht) — lokal in `.ui-dialog--danger` … |
| `--a-alert-message-icon-color` | — | — | 1 | L | Alert-/Bestätigungsdialog (apex.message): Farbe (Nachricht Icon) — lokal in `.ui-dialog--danger` … |
| `--a-alert-success-icon` | `"\e1ab"` | = Vita | 2 |  | Alert-/Bestätigungsdialog (apex.message): Icon (success) |
| `--a-alert-warning-icon` | `"\e017"` | = Vita | 2 |  | Alert-/Bestätigungsdialog (apex.message): Icon (warning) |
| `--ut-alert-border-radius` | — | — | 5 | L | Alert (t-Alert): Eckenradius — lokal in `.t-Alert--horizontal` …; Fallback `var(--ut-component-border-radius)` |
| `--ut-alert-border-width` | — | — | 1 | L | Alert (t-Alert): Randbreite — lokal in `.t-Alert--page`; Fallback `var(--ut-component-border-width)` |
| `--ut-alert-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 1 |  | Alert (t-Alert): Schatten |
| `--ut-alert-icon-background-color` | — | — | 1 | L | Alert (t-Alert): Hintergrundfarbe (Icon) — lokal in `.t-Alert--page` … |
| `--ut-alert-icon-padding` | — | — | 2 | L | Alert (t-Alert): Innenabstand (Icon) — lokal in `.t-Alert--horizontal` … |
| `--ut-alert-icon-size` | — | — | 3 | L | Alert (t-Alert): Größe (Icon) — lokal in `.t-Alert--horizontal` … |
| `--ut-alert-icon-text-color` | — | — | 1 | L | Alert (t-Alert): Textfarbe (Icon) — lokal in `.t-Alert--warning, .t-Alert--yellow` … |
| `--ut-alert-title-font-size` | — | — | 1 | L | Alert (t-Alert): Schriftgröße (Titel) — lokal in `.t-Alert--horizontal .t-Alert-title` … |
| `--ut-alert-title-font-weight` | `var(--a-base-font-weight-semibold, 500)` → `600` | = Vita | 1 |  | Alert (t-Alert): Schriftstärke (Titel) |
| `--ut-alert-title-line-height` | — | — | 1 | L | Alert (t-Alert): Zeilenhöhe (Titel) — lokal in `.t-Alert--horizontal .t-Alert-title` … |
| `--ut-alert-type-background-color` | — | — | 1 | L | Alert (t-Alert): Hintergrundfarbe (Varianten-Slot) — lokal in `.t-Alert--colorBG.t-Alert--warning, .t-Alert--colorBG.t-Ale…` …; Fallback `var(--ut-alert-background-color, var(--…` |
| `--ut-alert-type-text-color` | — | — | 1 | L | Alert (t-Alert): Textfarbe (Varianten-Slot) — lokal in `.t-Alert--page.t-Alert--success` …; Fallback `var(--ut-alert-text-color, var(--ut-com…` |
| `--ut-notification-item-font-size` | — | — | 1 | L | Seiten-Benachrichtigung: Schriftgröße (Eintrag) — lokal in `@media (max-width: 479px) » .t-Alert--page .a-Notification-…`; Fallback `0.875rem` |

### 10.19 Tabs (16)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-tabs-border-color` | — | — | 2 | L | Tabs (t-Tabs): Randfarbe — lokal in `.t-Tabs--pill`; Fallback `rgba(0, 0, 0, 0.1)` |
| `--ut-tabs-border-radius` | — | — | 5 | L | Tabs (t-Tabs): Eckenradius — lokal in `.t-Tabs--pill`; Fallback `0.125rem` |
| `--ut-tabs-border-width` | — | — | 2 | L | Tabs (t-Tabs): Randbreite — lokal in `.t-Tabs--pill`; Fallback `0` |
| `--ut-tabs-box-shadow` | — | — | 1 | L | Tabs (t-Tabs): Schatten — lokal in `.t-Tabs--pill` |
| `--ut-tabs-item-active-font-weight` | `var(--a-base-font-weight-bold, 700)` → `700` | = Vita | 2 |  | Tabs (t-Tabs): Schriftstärke (Eintrag aktiv) |
| `--ut-tabs-item-active-highlight-width` | — | — | 0 | L ∅ | Tabs (t-Tabs): Breite (Eintrag aktiv Hervorhebung) — lokal in `.vertical-rds .apex-rds, .t-Body-side .apex-rds` |
| `--ut-tabs-item-active-text-color` | `var(--ut-link-text-color)` → `#056ac8` | `var(--ut-link-text-color)` → `#349bfa` | 2 | ◇ | Tabs (t-Tabs): Textfarbe (Eintrag aktiv) |
| `--ut-tabs-item-background-color` | — | — | 1 | L | Tabs (t-Tabs): Hintergrundfarbe (Eintrag) — lokal in `.t-Tabs-item:hover` … |
| `--ut-tabs-item-font-size` | — | — | 2 | L | Tabs (t-Tabs): Schriftgröße (Eintrag) — lokal in `.t-Tabs--large` …; Fallback `0.875rem` |
| `--ut-tabs-item-font-weight` | — | — | 2 | L | Tabs (t-Tabs): Schriftstärke (Eintrag) — lokal in `.t-Tabs-item.is-active` … |
| `--ut-tabs-item-highlight-color` | — | — | 2 | L | Tabs (t-Tabs): Farbe (Eintrag Hervorhebung) — lokal in `.t-Tabs-item.is-active` … |
| `--ut-tabs-item-hint-highlight-color` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` | 1 |  | Tabs (t-Tabs): Farbe (Eintrag hint Hervorhebung) |
| `--ut-tabs-item-hint-highlight-width` | — | — | 3 | L | Tabs (t-Tabs): Breite (Eintrag hint Hervorhebung) — Fallback `0.125rem` |
| `--ut-tabs-item-padding-x` | — | — | 13 | L | Tabs (t-Tabs): Innenabstand horizontal (Eintrag) — lokal in `.t-Tabs--large` …; Fallback `0.5rem` |
| `--ut-tabs-item-padding-y` | — | — | 5 | L | Tabs (t-Tabs): Innenabstand vertikal (Eintrag) — lokal in `.t-Tabs--large` …; Fallback `0.75rem` |
| `--ut-tabs-item-text-color` | `var(--ut-component-text-default-color)` → `#000` | `var(--ut-component-text-default-color)` → `#fff` | 2 |  | Tabs (t-Tabs): Textfarbe (Eintrag) |

### 10.20 Schatten/Radien/Abstände (9)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--ut-border-radius` | `var(--ut-border-radius-md)` → `.25rem` | = Vita | 11 | ◇ | Standardradius-Stufe (= --ut-border-radius-md); Utility-Klassen .rounded*. |
| `--ut-border-radius-lg` | `.5rem` | = Vita | 5 | ◇ | Radius-Stufe: lg |
| `--ut-border-radius-md` | `.25rem` | = Vita | 1 | ◇ | Radius-Stufe: md |
| `--ut-border-radius-sm` | `.125rem` | = Vita | 5 | ◇ | Radius-Stufe: sm |
| `--ut-grid-gutter-width` | — | — | 10 | L | Grid-Layout: Breite (gutter) — lokal in `.no-gutters` …; Fallback `0.5rem` |
| `--ut-inline-actions-gap` | — | — | 1 | ★26 L | Inline-Actions: Lücke (gap) — lokal in `.t-InlineActions--gapNone` …; Fallback `0.25rem` |
| `--ut-shadow-lg` | `0 1.5rem 3rem -1.5rem rgba(0, 0, 0, 0.3)` | = Vita | 5 | ◆ | Großer Schatten (Komponenten-Schatten, Login-Region, Dialoge). |
| `--ut-shadow-md` | `0 .75rem 1.5rem -.75rem rgba(0, 0, 0, 0.3)` | = Vita | 2 | ◆ | Mittlerer Schatten. |
| `--ut-shadow-sm` | `0 .125rem .25rem -.125rem rgba(0, 0, 0, 0.1)` | = Vita | 11 | ◆ | Kleiner Schatten (Regionen, Header, Buttons-Container, Alerts, Menü-Callout). |

### 10.21 Charts (Oracle JET) (41)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--oj-button-borderless-chrome-bg-color-hover` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „button-borderless-chrome-bg-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-button-borderless-chrome-text-color-hover` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 0 |  | Oracle-JET-Redwood-Token „button-borderless-chrome-text-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-button-outlined-chrome-bg-color-hover` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „button-outlined-chrome-bg-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-button-outlined-chrome-border-color-hover` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „button-outlined-chrome-border-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-button-outlined-chrome-text-color-hover` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 0 |  | Oracle-JET-Redwood-Token „button-outlined-chrome-text-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-collection-bg-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 0 |  | Oracle-JET-Redwood-Token „collection-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-collection-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 0 |  | Oracle-JET-Redwood-Token „collection-border-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-collection-free-space-bg-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 0 |  | Oracle-JET-Redwood-Token „collection-free-space-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-collection-header-bg-color` | `var(--ut-component-background-color)` → `#fff` | `var(--ut-component-background-color)` → `#1b1d1e` | 0 |  | Oracle-JET-Redwood-Token „collection-header-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-color-spectrum-border-color` | `#cccccc` | `#333333` | 0 |  | Oracle-JET-Redwood-Token „color-spectrum-border-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-bg-color-hover` | `var(--a-menu-focused-background-color)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-bg-color-hover“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-box-shadow` | `var(--ut-shadow-sm)` → `0 .125rem .25rem -.125rem rgba(0,…` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-box-shadow“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-divider-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 0 |  | Oracle-JET-Redwood-Token „core-divider-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-divider-margin` | `0.5rem` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-divider-margin“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-focus-border-color` | `var(--ut-focus-outline-color)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-focus-border-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-icon-size-lg` | `1.5rem` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-icon-size-lg“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-icon-size-sm` | `1rem` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-icon-size-sm“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-brand` | `var(--ut-palette-primary-text)` → `#056ac8` | = Vita | 0 |  | Oracle-JET-Redwood-Token „core-text-color-brand“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-danger` | `var(--ut-palette-danger-text)` → `#a64940` | `var(--ut-palette-danger-text)` → `#b74441` | 0 |  | Oracle-JET-Redwood-Token „core-text-color-danger“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-disabled` | — | — | 0 | L | Oracle-JET-Redwood-Token „core-text-color-disabled“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) — lokal in `.oj-dvt-datatip` |
| `--oj-core-text-color-primary` | `var(--ut-component-text-default-color)` → `#000` | `var(--ut-component-text-default-color)` → `#fff` | 0 |  | Oracle-JET-Redwood-Token „core-text-color-primary“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-secondary` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 0 |  | Oracle-JET-Redwood-Token „core-text-color-secondary“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-success` | `var(--ut-palette-success-text)` → `#4d7d3a` | `var(--ut-palette-success-text)` → `#567d4e` | 0 |  | Oracle-JET-Redwood-Token „core-text-color-success“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-core-text-color-warning` | `var(--ut-palette-warning-text)` → `#8d7021` | `var(--ut-palette-warning-text)` → `#8b7432` | 0 |  | Oracle-JET-Redwood-Token „core-text-color-warning“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-heading-text-color` | `var(--ut-component-text-title-color)` → `#000` | `var(--ut-component-text-title-color)` → `#fff` | 0 |  | Oracle-JET-Redwood-Token „heading-text-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-link-text-color` | `var(--ut-link-text-color)` → `#056ac8` | `var(--ut-link-text-color)` → `#349bfa` | 0 |  | Oracle-JET-Redwood-Token „link-text-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-popup-bg-color` | `var(--a-menu-background-color)` → `#fff` | `var(--a-menu-background-color)` → `#1b1d1e` | 0 |  | Oracle-JET-Redwood-Token „popup-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-private-gantt-milestone-bg-color` | `var(--u-color-15)` → `#6e8598` | = Vita | 0 |  | Oracle-JET-Redwood-Token „private-gantt-milestone-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-private-gantt-task-bg-color` | `var(--u-color-1)` → `#309fdb` | = Vita | 1 |  | Gantt-Balkenfarbe (Fallback in .oj-gantt-task-bar). |
| `--oj-private-gantt-task-progress-bg-color` | `var(--u-color-1)` → `#309fdb` | = Vita | 0 |  | Oracle-JET-Redwood-Token „private-gantt-task-progress-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-text-field-bg-color` | `var(--a-field-input-background-color)` → `#f9f9f9` | `var(--a-field-input-background-color)` → `#212325` | 0 |  | Oracle-JET-Redwood-Token „text-field-bg-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-text-field-border-color` | `var(--a-field-input-border-color)` → `#dfdfdf` | `var(--a-field-input-border-color)` → `#393d40` | 0 |  | Oracle-JET-Redwood-Token „text-field-border-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--oj-text-field-text-color` | `var(--a-field-input-text-color)` → `#202020` | `var(--a-field-input-text-color)` → `#fcfcfc` | 0 |  | Oracle-JET-Redwood-Token „text-field-text-color“ – wird von JETs oj-redwood-notag-min.css konsumiert (nur auf Seiten mit JET-Komponenten geladen) |
| `--ojet-font-size` | `.875rem` | = Vita | 12 |  | Oracle JET (Schrift/Tooltip): Schriftgröße |
| `--ojet-large-font-size` | `1.125rem` | = Vita | 0 |  | Oracle JET (Schrift/Tooltip): Schriftgröße (large) |
| `--ojet-larger-font-size` | `1.25rem` | = Vita | 0 |  | Oracle JET (Schrift/Tooltip): Schriftgröße (larger) |
| `--ojet-medium-font-size` | `1rem` | = Vita | 2 |  | Oracle JET (Schrift/Tooltip): Schriftgröße (medium) |
| `--ojet-small-font-size` | `.75rem` | = Vita | 14 |  | Oracle JET (Schrift/Tooltip): Schriftgröße (small) |
| `--ojet-tooltip-disabled-text-color` | `rgba(0, 0, 0, .4)` | = Vita | 1 |  | Oracle JET (Schrift/Tooltip): Textfarbe (tooltip deaktiviert) |
| `--ojet-tooltip-primary-text-color` | `rgba(0, 0, 0, 1)` | = Vita | 1 |  | Oracle JET (Schrift/Tooltip): Textfarbe (tooltip primär) |
| `--ojet-tooltip-secondary-text-color` | `rgba(0, 0, 0, .65)` | = Vita | 1 |  | Oracle JET (Schrift/Tooltip): Textfarbe (tooltip sekundär) |

### 10.22 Weitere UT-Komponenten (Listen, Timeline, Wizard, Kalender, Suche …) (157)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-resultsitem-attributes-font-size` | `.8125rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (attributes) |
| `--a-resultsitem-attributes-gap` | `1rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Lücke (gap) (attributes) |
| `--a-resultsitem-attributes-line-height` | `1rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Zeilenhöhe (attributes) |
| `--a-resultsitem-background-color` | `#fff` | `#000` | 2 |  | Search-Ergebnis-Eintrag: Hintergrundfarbe |
| `--a-resultsitem-badge-background-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 1 |  | Search-Ergebnis-Eintrag: Hintergrundfarbe (Badge) |
| `--a-resultsitem-badge-border-radius` | `.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Eckenradius (Badge) |
| `--a-resultsitem-badge-font-size` | `.75rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (Badge) |
| `--a-resultsitem-badge-padding` | `.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Innenabstand (Badge) |
| `--a-resultsitem-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 5 |  | Search-Ergebnis-Eintrag: Randfarbe |
| `--a-resultsitem-border-radius` | `.25rem` | = Vita | 6 |  | Search-Ergebnis-Eintrag: Eckenradius |
| `--a-resultsitem-border-width` | `1px` | = Vita | 4 |  | Search-Ergebnis-Eintrag: Randbreite |
| `--a-resultsitem-content-gap` | `.25rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Lücke (gap) (Inhalt) |
| `--a-resultsitem-description-font-size` | `.875rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (description) |
| `--a-resultsitem-description-line-height` | `1.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Zeilenhöhe (description) |
| `--a-resultsitem-font-size` | `.875rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße |
| `--a-resultsitem-header-gap` | `.5rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Lücke (gap) (Kopf) |
| `--a-resultsitem-header-spacing` | `.25rem` | = Vita | 3 |  | Search-Ergebnis-Eintrag: Abstand (Kopf) |
| `--a-resultsitem-icon-padding` | `.5rem` | = Vita | 3 |  | Search-Ergebnis-Eintrag: Innenabstand (Icon) |
| `--a-resultsitem-image-size` | — | — | 2 | L | Search-Ergebnis-Eintrag: Größe (Bild) — lokal in `.t-ResultsRegion--iconSm` … |
| `--a-resultsitem-initials-font-size` | `.875rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (Initialen) |
| `--a-resultsitem-initials-size` | `2rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Größe (Initialen) |
| `--a-resultsitem-item-gap` | `1rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Lücke (gap) (Eintrag) |
| `--a-resultsitem-line-height` | `1.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Zeilenhöhe |
| `--a-resultsitem-misc-font-size` | `.8125rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (misc) |
| `--a-resultsitem-misc-line-height` | `1rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Zeilenhöhe (misc) |
| `--a-resultsitem-misc-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Search-Ergebnis-Eintrag: Textfarbe (misc) |
| `--a-resultsitem-padding-x` | `1rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Innenabstand horizontal |
| `--a-resultsitem-padding-y` | `1rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Innenabstand vertikal |
| `--a-resultsitem-subtitle-font-size` | `.9375rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (Untertitel) |
| `--a-resultsitem-subtitle-line-height` | `1.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Zeilenhöhe (Untertitel) |
| `--a-resultsitem-subtitle-spacing` | `var(--a-resultsitem-header-spacing, .25rem)` → `.25rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Abstand (Untertitel) |
| `--a-resultsitem-title-font-size` | `1rem` | = Vita | 1 |  | Search-Ergebnis-Eintrag: Schriftgröße (Titel) |
| `--a-resultsitem-title-line-height` | `1.25rem` | = Vita | 2 |  | Search-Ergebnis-Eintrag: Zeilenhöhe (Titel) |
| `--a-searchresults-gap` | `1rem` | = Vita | 2 |  | Search-Ergebnisse: Lücke (gap) |
| `--a-searchresults-pagination-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Search-Ergebnisse: Farbe (Paginierung) |
| `--a-searchresults-pagination-font-sizez` | `.875rem` | = Vita | 0 | ∅ | Tippfehler im Originalnamen („sizez“); definiert, aber unreferenziert. |
| `--a-searchresults-pagination-gap` | `1rem` | = Vita | 1 |  | Search-Ergebnisse: Lücke (gap) (Paginierung) |
| `--a-searchresults-pagination-line-height` | `1.25rem` | = Vita | 1 |  | Search-Ergebnisse: Zeilenhöhe (Paginierung) |
| `--a-searchresults-pagination-spacing` | `1rem` | = Vita | 1 |  | Search-Ergebnisse: Abstand (Paginierung) |
| `--ut-avp-border-width` | — | — | 3 | L | Attribute Value Pairs: Randbreite — lokal in `.t-AVPList-item:last-of-type, .t-AVPList-item .t-AVPList-la…` …; Fallback `var(--ut-component-inner-border-width)` |
| `--ut-avp-label-width` | — | — | 4 | L | Attribute Value Pairs: Breite (Label) — lokal in `.t-AVPList--fixedLabelSmall` …; Fallback `30%` |
| `--ut-avp-padding-x` | — | — | 2 | L | Attribute Value Pairs: Innenabstand horizontal — lokal in `.t-Body-info .t-AVPList-label, .t-Body-info .t-AVPList-value`; Fallback `0.75rem` |
| `--ut-carousel-nav-background-color` | — | — | 1 | L | Carousel: Hintergrundfarbe (Navigation) — lokal in `.a-Tabs-selected .a-Region-carouselLink`; Fallback `rgba(0, 0, 0, 0.15)` |
| `--ut-ccalendar-border-width` | — | — | 4 | L | Classic Calendar: Randbreite — lokal in `.t-ClassicCalendar-listTitle:first-child`; Fallback `1px` |
| `--ut-ccalendar-date-background-color` | — | — | 1 | L | Classic Calendar: Hintergrundfarbe (Datum) — lokal in `.t-ClassicCalendar-day.is-today` |
| `--ut-ccalendar-date-font-size` | — | — | 1 | L | Classic Calendar: Schriftgröße (Datum) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `0.6875rem` |
| `--ut-ccalendar-date-font-weight` | — | — | 1 | L | Classic Calendar: Schriftstärke (Datum) — lokal in `.t-ClassicCalendar-day.is-today` |
| `--ut-ccalendar-date-height` | — | — | 2 | L | Classic Calendar: Höhe (Datum) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `1.25rem` |
| `--ut-ccalendar-date-margin` | — | — | 1 | L | Classic Calendar: Außenabstand (Datum) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `0.25rem` |
| `--ut-ccalendar-date-text-color` | — | — | 1 | L | Classic Calendar: Textfarbe (Datum) — lokal in `.t-ClassicCalendar-day.is-today` |
| `--ut-ccalendar-date-width` | — | — | 1 | L | Classic Calendar: Breite (Datum) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `1.25rem` |
| `--ut-ccalendar-day-background-color` | — | — | 1 | L | Classic Calendar: Hintergrundfarbe (Tag) — lokal in `.t-ClassicCalendar--weekly .t-ClassicCalendar-day.is-today,…` |
| `--ut-ccalendar-day-font-size` | — | — | 1 | L | Classic Calendar: Schriftgröße (Tag) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `0.75rem` |
| `--ut-ccalendar-day-height` | — | — | 1 | L | Classic Calendar: Höhe (Tag) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar` …; Fallback `4.5rem` |
| `--ut-ccalendar-day-text-color` | — | — | 1 | L | Classic Calendar: Textfarbe (Tag) — lokal in `.t-ClassicCalendar--weekly .t-ClassicCalendar-day.is-today,…` |
| `--ut-ccalendar-event-margin` | — | — | 2 | L | Classic Calendar: Außenabstand (Termin) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `0.25rem` |
| `--ut-ccalendar-event-padding` | — | — | 2 | L | Classic Calendar: Innenabstand (Termin) — lokal in `@media (max-width: 639px) » .t-ClassicCalendar`; Fallback `0.125rem 0.5rem` |
| `--ut-ccalendar-list-date-font-weight` | — | — | 1 | L | Classic Calendar: Schriftstärke (Liste Datum) — lokal in `.t-ClassicCalendar-listTitle.is-today` |
| `--ut-comment-chat-active-background-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 1 |  | Comments: Hintergrundfarbe (chat aktiv) |
| `--ut-comment-chat-background-color` | `rgba(0, 0, 0, 0.05)` | `rgba(255, 255, 255, 0.1)` | 5 |  | Comments: Hintergrundfarbe (chat) |
| `--ut-comment-chat-border-radius` | — | — | 1 | L | Comments: Eckenradius (chat) — lokal in `.t-Comments--chat` |
| `--ut-comment-chat-padding-x` | — | — | 2 | L | Comments: Innenabstand horizontal (chat) — lokal in `.t-Comments--chat` |
| `--ut-comment-chat-padding-y` | — | — | 4 | L | Comments: Innenabstand vertikal (chat) — lokal in `.t-Comments--chat`; Fallback `0.375rem` |
| `--ut-comment-chat-text-color` | — | — | 1 | L | Comments: Textfarbe (chat) — lokal in `.t-Comments--chat .t-Comments-item.is-active`; Fallback `var(--ut-component-text-default-color)` |
| `--ut-comment-icon-border-radius` | — | — | 1 | L | Comments: Eckenradius (Icon) — lokal in `.t-Comments--iconsSquare` …; Fallback `100%` |
| `--ut-comment-info-margin-x` | — | — | 3 | L | Comments: Außenabstand horizontal (info) — lokal in `.t-Comments-date:last-child`; Fallback `0.5rem` |
| `--ut-comment-item-background-color` | — | — | 1 | L | Comments: Hintergrundfarbe (Eintrag) — lokal in `.t-Comments-item.is-selected` … |
| `--ut-comment-item-margin-bottom` | — | — | 1 | L | Comments: Eintrag margin bottom — lokal in `.t-Comments-item:last-child`; Fallback `1rem` |
| `--ut-comment-item-text-color` | — | — | 0 | L ∅ | Comments: Textfarbe (Eintrag) — lokal in `.t-Comments-item.is-selected` |
| `--ut-completeness-fill-background-color` | — | — | 1 | L | Completeness Indicator: Hintergrundfarbe (fill) — lokal in `.t-Completeness.is-danger` …; Fallback `rgba(0, 0, 0, 0.2)` |
| `--ut-completeness-label-background-color` | — | — | 1 | L | Completeness Indicator: Hintergrundfarbe (Label) — lokal in `a.t-Completeness:hover .t-Completeness-label`; Fallback `rgba(255, 255, 255, 0.75)` |
| `--ut-completeness-labelwrap-background-color` | — | — | 1 | L | Completeness Indicator: Hintergrundfarbe (labelwrap) — lokal in `a.t-Completeness:hover .t-Completeness-labelWrap` |
| `--ut-configpanel-attr-background-color` | — | — | 1 | L | Configuration Panel: Hintergrundfarbe (attr) — lokal in `.t-ConfigPanel-attrLink:hover` |
| `--ut-configpanel-attr-border-width` | — | — | 1 | L | Configuration Panel: Randbreite (attr) — lokal in `.t-ConfigPanel-attr:last-child`; Fallback `1px` |
| `--ut-configpanel-icon-background-color` | — | — | 1 | L | Configuration Panel: Hintergrundfarbe (Icon) — lokal in `.t-ConfigPanel-icon.is-enabled` … |
| `--ut-configpanel-icon-text-color` | — | — | 1 | L | Configuration Panel: Textfarbe (Icon) — lokal in `.t-ConfigPanel-icon.is-enabled` … |
| `--ut-contextualinfo-label-font-size` | — | — | 1 | L | Contextual Info: Schriftgröße (Label) — lokal in `.t-ContextualInfo-label--stacked`; Fallback `0.875rem` |
| `--ut-contextualinfo-label-line-height` | — | — | 1 | L | Contextual Info: Zeilenhöhe (Label) — lokal in `.t-ContextualInfo-label--stacked`; Fallback `1rem` |
| `--ut-contextualinfo-margin-x` | — | — | 1 | L | Contextual Info: Außenabstand horizontal — lokal in `.t-ContextualInfo-label--stacked`; Fallback `1rem` |
| `--ut-contextualinfo-margin-y` | — | — | 1 | L | Contextual Info: Außenabstand vertikal — lokal in `.t-ContextualInfo-label--stacked`; Fallback `1rem` |
| `--ut-contextualinfo-value-font-size` | — | — | 1 | L | Contextual Info: Schriftgröße (Wert) — lokal in `.t-ContextualInfo-label--stacked`; Fallback `0.875rem` |
| `--ut-contextualinfo-value-line-height` | — | — | 1 | L | Contextual Info: Zeilenhöhe (Wert) — lokal in `.t-ContextualInfo-label--stacked`; Fallback `1rem` |
| `--ut-cr-desc-margin-y` | — | — | 1 | L | Content Row: Außenabstand vertikal (Beschreibung) — lokal in `.t-ContentRow--hideTitle`; Fallback `0.25rem` |
| `--ut-cr-icon-spacing` | — | — | 6 | L | Content Row: Abstand (Icon) — lokal in `.t-ContentRow--styleCompact`; Fallback `0.75rem` |
| `--ut-cr-img-max-width` | — | — | 1 | L | Content Row: Maximalbreite (img) — lokal in `.t-ContentRow--styleCompact`; Fallback `2.5rem` |
| `--ut-cr-item-background-color` | — | — | 1 | L | Content Row: Hintergrundfarbe (Eintrag) — lokal in `.t-ContentRow-item.is-selected` |
| `--ut-cr-item-border-width` | — | — | 2 | L | Content Row: Randbreite (Eintrag) — lokal in `.t-ContentRow--hideBorders` …; Fallback `var(--ut-component-inner-border-width)` |
| `--ut-cr-item-text-color` | — | — | 1 | L | Content Row: Textfarbe (Eintrag) — lokal in `.t-ContentRow-item.is-selected` |
| `--ut-cr-selection-spacing` | — | — | 1 | L | Content Row: Abstand (selection) — lokal in `.t-ContentRow--styleCompact`; Fallback `var(--ut-cr-wrap-padding-x, 1rem)` |
| `--ut-cr-title-font-size` | — | — | 1 | L | Content Row: Schriftgröße (Titel) — lokal in `.t-ContentRow--styleCompact`; Fallback `1rem` |
| `--ut-cr-wrap-padding-x` | — | — | 5 | L | Content Row: Innenabstand horizontal (Wrapper) — lokal in `@media (max-width: 991px) » .t-ContentRow-wrap` …; Fallback `1rem` |
| `--ut-cr-wrap-padding-y` | — | — | 2 | L | Content Row: Innenabstand vertikal (Wrapper) — lokal in `@media (max-width: 991px) » .t-ContentRow-wrap` …; Fallback `1rem` |
| `--ut-fc4-event-font-size` | `.75rem` | = Vita | 1 |  | FullCalendar-Termine: Schriftgröße (Termin) |
| `--ut-fc4-event-line-height` | `.875rem` | = Vita | 1 |  | FullCalendar-Termine: Zeilenhöhe (Termin) |
| `--ut-fc4-event-padding` | `.25rem` | = Vita | 1 |  | FullCalendar-Termine: Innenabstand (Termin) |
| `--ut-linkslist-arrow-color` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` | 1 |  | Links List: Farbe (Pfeil) |
| `--ut-linkslist-background-color` | — | — | 1 | L | Links List: Hintergrundfarbe — lokal in `.t-LinksList-link:hover` |
| `--ut-linkslist-item-border-width` | — | — | 2 | L | Links List: Randbreite (Eintrag) — lokal in `.t-LinksList-item:last-child` …; Fallback `var(--ut-component-inner-border-width)` |
| `--ut-linkslist-label-font-weight` | — | — | 1 | L | Links List: Schriftstärke (Label) — lokal in `.t-LinksList-item.is-current > a` |
| `--ut-linkslist-link-padding-y` | — | — | 2 | L | Links List: Innenabstand vertikal (Link) — lokal in `.t-LinksList--actions`; Fallback `0.5rem` |
| `--ut-linkslist-spacing` | — | — | 3 | L | Links List: Abstand — lokal in `.t-LinksList--actions`; Fallback `calc(var(--ut-linkslist-link-padding-x,…` |
| `--ut-media-list-group-header-padding-x` | — | — | 1 | ★26 L | Media List: Innenabstand horizontal (Gruppe Kopf) — lokal in `@media (min-width: 640px) » .t-MediaList-groupHeader`; Fallback `0.5rem` |
| `--ut-medialist-body-padding-x` | — | — | 0 | L ∅ | Media List: Innenabstand horizontal (Inhalt) — lokal in `@media (min-width: 640px) » .t-MediaList-body` |
| `--ut-medialist-body-padding-y` | — | — | 0 | L ∅ | Media List: Innenabstand vertikal (Inhalt) — lokal in `@media (min-width: 640px) » .t-MediaList-body` |
| `--ut-medialist-desc-font-size` | — | — | 1 | L | Media List: Schriftgröße (Beschreibung) — lokal in `.t-MediaList--large`; Fallback `0.75rem` |
| `--ut-medialist-desc-line-height` | — | — | 1 | L | Media List: Zeilenhöhe (Beschreibung) — lokal in `.t-MediaList--large`; Fallback `1rem` |
| `--ut-medialist-icon-border-radius` | — | — | 1 | L | Media List: Eckenradius (Icon) — lokal in `.t-MediaList--iconsSquare` …; Fallback `100%` |
| `--ut-medialist-icon-container-size` | — | — | 2 | L | Media List: Größe (Icon Container) — lokal in `.t-MediaList--large`; Fallback `2rem` |
| `--ut-medialist-icon-size` | — | — | 1 | L | Media List: Größe (Icon) — lokal in `.t-MediaList--large`; Fallback `1rem` |
| `--ut-medialist-item-background-color` | — | — | 2 | L | Media List: Hintergrundfarbe (Eintrag) — lokal in `.t-MediaList-item.is-selected` … |
| `--ut-medialist-item-grid-gap` | — | — | 2 | L | Media List: Lücke (gap) (Eintrag Raster) — lokal in `@media (min-width: 640px) » .t-MediaList-itemWrap`; Fallback `0.5rem` |
| `--ut-medialist-item-text-color` | — | — | 0 | L ∅ | Media List: Textfarbe (Eintrag) — lokal in `.t-MediaList-item.is-selected` |
| `--ut-medialist-selection-spacing` | — | — | 1 | L | Media List: Abstand (selection) — lokal in `.t-MediaList-itemWrap`; Fallback `var(--ut-medialist-wrap-padding-x, 1rem)` |
| `--ut-medialist-title-font-size` | — | — | 1 | L | Media List: Schriftgröße (Titel) — lokal in `.t-MediaList--large`; Fallback `0.875rem` |
| `--ut-medialist-title-line-height` | — | — | 1 | L | Media List: Zeilenhöhe (Titel) — lokal in `.t-MediaList--large`; Fallback `1.25rem` |
| `--ut-medialist-title-text-color` | — | — | 1 | L | Media List: Textfarbe (Titel) — lokal in `a.t-MediaList-itemWrap`; Fallback `var(--ut-component-text-title-color)` |
| `--ut-minical-date-border-radius` | — | — | 1 | L | Mini Calendar: Eckenradius (Datum) — lokal in `.a-MiniCal-day.is-today, .a-MiniCal-day.is-active` |
| `--ut-minical-date-font-weight` | — | — | 1 | L | Mini Calendar: Schriftstärke (Datum) — lokal in `.a-MiniCal-day.is-today, .a-MiniCal-day.is-active` |
| `--ut-minical-date-opacity` | — | — | 1 | L | Mini Calendar: Deckkraft (Datum) — lokal in `.a-MiniCal-day.is-today, .a-MiniCal-day.is-active` … |
| `--ut-resultsregion-background-color` | `#fff` | `#000` | 1 |  | Search Region: Hintergrundfarbe |
| `--ut-resultsregion-border-color` | `var(--ut-region-border-color)` | = Vita | 1 |  | Search Region: Randfarbe |
| `--ut-resultsregion-search-background-color` | `rgba(0, 0, 0, 0.025)` | `rgba(255, 255, 255, 0.025)` | 1 |  | Search Region: Hintergrundfarbe (Suche) |
| `--ut-resultsregion-search-border-color` | `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.15)` | 3 |  | Search Region: Randfarbe (Suche) |
| `--ut-statuslist-marker-border-radius` | — | — | 3 | L | Status List: Eckenradius (Marker) — lokal in `.t-StatusList--dates` …; Fallback `0.125rem` |
| `--ut-statuslist-marker-border-width` | — | — | 1 | L | Status List: Randbreite (Marker) — lokal in `.t-StatusList--bullets .t-StatusList-item.is-complete, .t-S…`; Fallback `1px` |
| `--ut-statuslist-marker-font-size` | — | — | 1 | L | Status List: Schriftgröße (Marker) — lokal in `.t-StatusList--dates` … |
| `--ut-statuslist-marker-line-height` | — | — | 1 | L | Status List: Zeilenhöhe (Marker) — lokal in `.t-StatusList--bullets` |
| `--ut-statuslist-marker-margin-x` | — | — | 4 | L | Status List: Außenabstand horizontal (Marker) — lokal in `.t-StatusList--dates` …; Fallback `0.25rem` |
| `--ut-statuslist-marker-margin-y` | — | — | 2 | L | Status List: Außenabstand vertikal (Marker) — lokal in `.t-StatusList--dates` … |
| `--ut-statuslist-marker-size` | — | — | 5 | L | Status List: Größe (Marker) — lokal in `.t-StatusList--dates` …; Fallback `1.5rem` |
| `--ut-tagcloud-item-font-size` | — | — | 1 | L | Tag Cloud: Schriftgröße (Eintrag) — lokal in `.a-TagCloud-link--size1` …; Fallback `inherit` |
| `--ut-timeline-avatar-font-size` | — | — | 1 | L | Timeline: Schriftgröße (avatar) — lokal in `@media (max-width: 479px) » .t-Timeline-avatar`; Fallback `0.875rem` |
| `--ut-timeline-avatar-size` | — | — | 3 | L | Timeline: Größe (avatar) — lokal in `@media (max-width: 479px) » .t-Timeline-avatar`; Fallback `2.5rem` |
| `--ut-timeline-background-color` | — | — | 1 | L | Timeline: Hintergrundfarbe — lokal in `a.t-Timeline-wrap:hover, a.t-Timeline-wrap:focus` |
| `--ut-timeline-border-width` | — | — | 2 | L | Timeline: Randbreite — lokal in `.t-Timeline-item:last-child`; Fallback `var(--ut-component-inner-border-width)` |
| `--ut-timeline-box-shadow` | — | — | 1 | L | Timeline: Schatten — lokal in `a.t-Timeline-wrap:hover, a.t-Timeline-wrap:focus` |
| `--ut-timeline-desc-margin` | — | — | 1 | L | Timeline: Außenabstand (Beschreibung) — lokal in `.t-Timeline-desc:last-child`; Fallback `0 0 0.125rem` |
| `--ut-timeline-grid-gap` | — | — | 5 | L | Timeline: Lücke (gap) (Raster) — lokal in `@media (min-width: 480px) » .t-Timeline-wrap` …; Fallback `0.5rem` |
| `--ut-timeline-group-header-padding-x` | — | — | 1 | ★26 L | Timeline: Innenabstand horizontal (Gruppe Kopf) — lokal in `@media (min-width: 480px) » .t-Timeline-groupHeader`; Fallback `0.5rem` |
| `--ut-timeline-item-background-color` | — | — | 1 | L | Timeline: Hintergrundfarbe (Eintrag) — lokal in `.t-Timeline-item.is-selected` |
| `--ut-timeline-item-text-color` | — | — | 0 | L ∅ | Timeline: Textfarbe (Eintrag) — lokal in `.t-Timeline-item.is-selected` |
| `--ut-timeline-selection-spacing` | — | — | 1 | L | Timeline: Abstand (selection) — lokal in `.t-Timeline-wrap`; Fallback `var(--ut-timeline-wrap-padding-x, 1rem)` |
| `--ut-timeline-title-margin` | — | — | 1 | L | Timeline: Außenabstand (Titel) — lokal in `@media (min-width: 480px) » .t-Timeline--compact`; Fallback `0.125rem 0 0` |
| `--ut-timeline-type-background-color` | — | — | 2 | L | Timeline: Hintergrundfarbe (Varianten-Slot) — lokal in `.t-Timeline-type.is-updated` …; Fallback `var(--ut-palette-generic)` |
| `--ut-timeline-type-font-size` | — | — | 2 | L | Timeline: Schriftgröße (Varianten-Slot) — lokal in `@media (min-width: 480px) » .t-Timeline-typename` …; Fallback `0.625rem` |
| `--ut-timeline-type-font-weight` | — | — | 2 | L | Timeline: Schriftstärke (Varianten-Slot) — lokal in `@media (min-width: 768px) » .t-Timeline-typename` …; Fallback `normal` |
| `--ut-timeline-type-min-height` | — | — | 2 | L | Timeline: Mindesthöhe (Varianten-Slot) — lokal in `@media (min-width: 768px) » .t-Timeline-type` …; Fallback `0` |
| `--ut-timeline-type-padding-x` | — | — | 4 | L | Timeline: Innenabstand horizontal (Varianten-Slot) — lokal in `@media (min-width: 480px) » .t-Timeline-type` …; Fallback `0.5rem` |
| `--ut-timeline-type-padding-y` | — | — | 3 | L | Timeline: Innenabstand vertikal (Varianten-Slot) — lokal in `@media (min-width: 768px) » .t-Timeline-type` …; Fallback `0.125rem` |
| `--ut-timeline-type-text-color` | — | — | 2 | L | Timeline: Textfarbe (Varianten-Slot) — lokal in `.t-Timeline-type.is-updated` …; Fallback `var(--ut-palette-generic-contrast)` |
| `--ut-timeline-typewrap-width` | — | — | 1 | L | Timeline: Breite (typewrap) — lokal in `@media (min-width: 768px) » .t-Timeline-typeWrap` |
| `--ut-timeline-z-index` | — | — | 1 | L | Timeline: z-index — lokal in `a.t-Timeline-wrap:hover, a.t-Timeline-wrap:focus` |
| `--ut-wizard-header-background-color` | `#fafafa` | `#202223` | 1 | TR | Wizard: Hintergrundfarbe (Kopf) |
| `--ut-wp-marker-color` | `#d9d9d9` | `#262626` | 1 |  | Wizard-Fortschritt: Farbe (Marker) |
| `--ut-wp-marker-padding` | — | — | 1 | L | Wizard-Fortschritt: Innenabstand (Marker) — lokal in `.t-WizardSteps-step.is-active .t-WizardSteps-marker, .t-Wiz…` |
| `--ut-wp-marker-size` | — | — | 3 | L | Wizard-Fortschritt: Größe (Marker) — lokal in `.t-WizardSteps-step.is-active .t-WizardSteps-marker, .t-Wiz…`; Fallback `0.75rem` |
| `--ut-wp-track-color` | `#d9d9d9` | `#262626` | 1 |  | Wizard-Fortschritt: Farbe (Track) |

### 10.23 Drittanbieter & Spezial-Widgets (CKEditor, FullCalendar, Prism, Map, Diagramm, Chat, Dev-Toolbar) (265)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-chat-actions-state-background-color` | — | `rgb(73, 74, 75)` | 1 | D | AI-Chat-Widget: Hintergrundfarbe (Aktionen Zustands-Slot) |
| `--a-chat-background` | `var(--ut-body-background-color)` → `#fdfdfd` | `var(--ut-body-background-color)` → `#252729` | 0 | ∅ | AI-Chat-Widget: Hintergrund |
| `--a-chat-body-background-color` | `var(--ut-body-background-color)` → `#fdfdfd` | `var(--ut-body-background-color)` → `#252729` | 2 |  | AI-Chat-Widget: Hintergrundfarbe (Inhalt) |
| `--a-chat-client-background-color` | `var(--ut-body-background-color)` → `#fdfdfd` | `var(--ut-body-background-color)` → `#252729` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (client) |
| `--a-chat-header-padding-x` | — | — | 1 | L | AI-Chat-Widget: Innenabstand horizontal (Kopf) — lokal in `.a-IRR-container, .ui-dialog--chat-client-ai`; Fallback `12px` |
| `--a-chat-input-button-background-color` | — | — | 1 | L | AI-Chat-Widget: Hintergrundfarbe (Eingabe Button) — lokal in `.a-ChatInput-button--cancel`; Fallback `transparent` |
| `--a-chat-input-button-focus-background-color` | `#e6e6e6` | `var(--a-button-hover-background-color)` → `#626465` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Eingabe Button Fokus) |
| `--a-chat-input-button-hover-background-color` | `#e6e6e6` | `var(--a-button-hover-background-color)` → `#626465` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Eingabe Button Hover) |
| `--a-chat-input-button-state-background-color` | — | — | 1 | L | AI-Chat-Widget: Hintergrundfarbe (Eingabe Button Zustands-Slot) — lokal in `.a-ChatInput-button:focus-visible` …; Fallback `var(--a-chat-input-button-background-co…` |
| `--a-chat-input-cancel-button-background-color` | — | `rgba(255, 255, 255, .25)` | 1 | D | AI-Chat-Widget: Hintergrundfarbe (Eingabe cancel Button) |
| `--a-chat-input-cancel-button-hover-background-color` | — | `var(--a-button-hover-background-color)` → `#626465` | 0 | D ∅ | AI-Chat-Widget: Hintergrundfarbe (Eingabe cancel Button Hover) |
| `--a-chat-item-alert-message-background-color` | `#f0f0f0` | `rgba(255, 255, 255, .08)` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Eintrag alert Nachricht) |
| `--a-chat-item-alert-message-icon` | — | — | 1 | L | AI-Chat-Widget: Icon (Eintrag alert Nachricht) — lokal in `.a-ChatItemAlert--danger` … |
| `--a-chat-item-alert-message-icon-color` | — | — | 1 | L | AI-Chat-Widget: Farbe (Eintrag alert Nachricht Icon) — lokal in `.a-ChatItemAlert--danger` … |
| `--a-chat-item-alert-message-margin-x` | — | — | 1 | L | AI-Chat-Widget: Außenabstand horizontal (Eintrag alert Nachricht) — lokal in `@container chatClient (inline-size < 600px) » .a-ChatItemAl…`; Fallback `40px` |
| `--a-chat-item-body-opacity` | — | — | 1 | L | AI-Chat-Widget: Deckkraft (Eintrag Inhalt) — lokal in `.a-ChatItem-row--canceled, .a-ChatItem-row--error`; Fallback `1` |
| `--a-chat-item-inline-status-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | AI-Chat-Widget: Textfarbe (Eintrag inline status) |
| `--a-chat-item-row-margin-y` | — | — | 1 | L | AI-Chat-Widget: Außenabstand vertikal (Eintrag Zeile) — lokal in `.a-ChatItem-row--inbound:has(+ .a-ChatItem-row--inbound)` …; Fallback `8px` |
| `--a-chat-message-action-button-background-color` | `#fff` | `#626364` | 0 | ∅ | AI-Chat-Widget: Hintergrundfarbe (Nachricht action Button) |
| `--a-chat-message-action-button-state-background-color` | `#f9f9f9` | `#494a4b` | 0 | ∅ | AI-Chat-Widget: Hintergrundfarbe (Nachricht action Button Zustands-Slot) |
| `--a-chat-message-border-color` | — | — | 0 | L ∅ | AI-Chat-Widget: Randfarbe (Nachricht) |
| `--a-chat-message-bubble-border-radius` | — | — | 3 | L | AI-Chat-Widget: Eckenradius (Nachricht Sprechblase) — lokal in `.a-IRR-container .a-ChatItem-row--inbound .a-ChatItem-bubbl…`; Fallback `8px` |
| `--a-chat-message-bubble-padding-x` | — | — | 2 | L | AI-Chat-Widget: Innenabstand horizontal (Nachricht Sprechblase) — lokal in `.a-IRR-container .a-ChatItem-row--inbound, .ui-dialog--chat…`; Fallback `12px` |
| `--a-chat-message-bubble-padding-y` | — | — | 1 | L | AI-Chat-Widget: Innenabstand vertikal (Nachricht Sprechblase) — lokal in `.a-IRR-container .a-ChatItem-row--inbound, .ui-dialog--chat…`; Fallback `6px` |
| `--a-chat-message-error-icon-color` | `var(--ut-palette-danger)` → `#cb1100` | `var(--ut-palette-danger)` → `#ee0701` | 0 | ∅ | AI-Chat-Widget: Farbe (Nachricht Fehler Icon) |
| `--a-chat-message-flex-direction` | — | — | 1 | L | AI-Chat-Widget: Nachricht flex direction — lokal in `.a-ChatItem-row--error .a-ChatItem-message`; Fallback `column` |
| `--a-chat-message-input-background-color` | `transparent` | = Vita | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Nachricht Eingabe) |
| `--a-chat-message-input-border-color` | `var(--ut-component-border-color)` → `rgba(0,0,0,.1)` | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 |  | AI-Chat-Widget: Randfarbe (Nachricht Eingabe) |
| `--a-chat-message-input-border-width` | `1px` | = Vita | 1 |  | AI-Chat-Widget: Randbreite (Nachricht Eingabe) |
| `--a-chat-message-input-field-font-size` | — | — | 1 | L | AI-Chat-Widget: Schriftgröße (Nachricht Eingabe field) — lokal in `@media (max-width: 479px) » .a-ChatInput-textWrap`; Fallback `14px` |
| `--a-chat-message-input-padding-x` | — | — | 1 | L | AI-Chat-Widget: Innenabstand horizontal (Nachricht Eingabe) — lokal in `.a-IRR-container, .ui-dialog--chat-client-ai` …; Fallback `16px` |
| `--a-chat-message-input-text-color` | `var(--a-field-input-text-color)` → `#202020` | `var(--a-field-input-text-color)` → `#fcfcfc` | 0 | ∅ | AI-Chat-Widget: Textfarbe (Nachricht Eingabe) |
| `--a-chat-message-pre-border-color` | — | `rgba(255, 255, 255, .2)` | 2 | D | AI-Chat-Widget: Randfarbe (Nachricht pre) |
| `--a-chat-message-pre-button-background-color` | — | — | 1 | L | AI-Chat-Widget: Hintergrundfarbe (Nachricht pre Button) — lokal in `.a-ChatItem-preHeader .a-ChatItem-button:hover`; Fallback `transparent` |
| `--a-chat-message-pre-button-state-background-color` | — | — | 1 | L | AI-Chat-Widget: Hintergrundfarbe (Nachricht pre Button Zustands-Slot) — lokal in `.a-ChatItem-preHeader .a-ChatItem-button` |
| `--a-chat-message-visual-line-height` | — | — | 1 | L | AI-Chat-Widget: Zeilenhöhe (Nachricht visual) — lokal in `.a-ChatItem-visual:has(.a-ChatItem-avatar img)`; Fallback `16px` |
| `--a-chat-message-visual-padding-x` | — | — | 1 | L | AI-Chat-Widget: Innenabstand horizontal (Nachricht visual) — lokal in `.a-ChatItem-visual:has(.a-ChatItem-avatar img)`; Fallback `8px` |
| `--a-chat-message-visual-padding-y` | — | — | 1 | L | AI-Chat-Widget: Innenabstand vertikal (Nachricht visual) — lokal in `.a-ChatItem-visual:has(.a-ChatItem-avatar img)`; Fallback `8px` |
| `--a-chat-title-background` | `var(--ut-body-background-color)` → `#fdfdfd` | `var(--ut-body-background-color)` → `#252729` | 0 | ∅ | AI-Chat-Widget: Hintergrund (Titel) |
| `--a-chat-title-color` | `var(--ut-component-text-title-color)` → `#000` | `var(--ut-component-text-title-color)` → `#fff` | 0 | ∅ | AI-Chat-Widget: Farbe (Titel) |
| `--a-chat-transcript-outline-color` | `var(--ut-focus-outline-color, -webkit-focus-r…` → `#056ac8` | = Vita | 2 |  | AI-Chat-Widget: Outline-Farbe (transcript) |
| `--a-chat-transcript-padding-x` | — | — | 1 | L | AI-Chat-Widget: Innenabstand horizontal (transcript) — lokal in `.a-IRR-container, .ui-dialog--chat-client-ai` …; Fallback `16px` |
| `--a-chat-user-primary-icon-background-color` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Benutzer primär Icon) |
| `--a-chat-user-primary-icon-text-color` | `var(--ut-palette-primary-contrast)` → `#fff` | = Vita | 1 |  | AI-Chat-Widget: Textfarbe (Benutzer primär Icon) |
| `--a-chat-user-primary-message-background-color` | `rgba(0, 0, 0, .15)` | `rgba(255, 255, 255, .25)` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Benutzer primär Nachricht) |
| `--a-chat-user-primary-text-color` | `var(--ut-body-text-color)` → `#000` | `var(--ut-body-text-color)` → `#fff` | 2 |  | AI-Chat-Widget: Textfarbe (Benutzer primär) |
| `--a-chat-user-secondary-icon-background-color` | `var(--ut-palette-danger)` → `#cb1100` | `var(--ut-palette-danger)` → `#ee0701` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Benutzer sekundär Icon) |
| `--a-chat-user-secondary-icon-text-color` | `var(--ut-palette-danger-contrast)` → `#fff` | = Vita | 1 |  | AI-Chat-Widget: Textfarbe (Benutzer sekundär Icon) |
| `--a-chat-user-secondary-message-background-color` | `rgba(0, 0, 0, .05)` | `rgba(255, 255, 255, .08)` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (Benutzer sekundär Nachricht) |
| `--a-chat-user-secondary-message-text-color` | `#000` | = Vita | 0 | ∅ | AI-Chat-Widget: Textfarbe (Benutzer sekundär Nachricht) |
| `--a-chat-user-secondary-text-color` | `var(--ut-body-text-color)` → `#000` | `var(--ut-body-text-color)` → `#fff` | 1 |  | AI-Chat-Widget: Textfarbe (Benutzer sekundär) |
| `--a-chat-view-more-button-background-color` | `var(--ut-body-background-color)` → `#fdfdfd` | `rgb(73, 74, 75)` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (view more Button) |
| `--a-chat-view-more-button-border-color` | `rgba(0, 0, 0, .5)` | `rgba(255, 255, 255, .25)` | 1 |  | AI-Chat-Widget: Randfarbe (view more Button) |
| `--a-chat-view-more-button-focus-background-color` | `#e6e6e6` | `var(--a-button-hover-background-color)` → `#626465` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (view more Button Fokus) |
| `--a-chat-view-more-button-hover-background-color` | `#e6e6e6` | `var(--a-button-hover-background-color)` → `#626465` | 1 |  | AI-Chat-Widget: Hintergrundfarbe (view more Button Hover) |
| `--a-chat-view-more-button-state-background-color` | — | — | 1 | L | AI-Chat-Widget: Hintergrundfarbe (view more Button Zustands-Slot) — lokal in `.a-ChatJumpToBottom-button:focus-visible` …; Fallback `var(--a-chat-view-more-button-backgroun…` |
| `--a-dev-headingoverlay-color` | — | — | 2 | L | Developer Toolbar: Farbe (headingoverlay) — lokal in `.a-HeadingOverlay--H1` …; Fallback `var(--a-palette-primary, #0572CE)` |
| `--a-dev-landmarkoverlay-color` | — | — | 2 | L | Developer Toolbar: Farbe (landmarkoverlay) — lokal in `.a-LandmarkOverlay--banner` …; Fallback `var(--a-palette-primary, #0572CE)` |
| `--a-dev-live-template-options-background-color` | `rgba(0, 0, 0, .65)` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (live template options) |
| `--a-dev-live-template-options-hover-background-color` | `rgba(0, 0, 0, .85)` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (live template options Hover) |
| `--a-dev-live-template-options-text-color` | `#fff` | = Vita | 1 |  | Developer Toolbar: Textfarbe (live template options) |
| `--a-dev-timeline-background-color` | `rgba(0, 0, 0, .5)` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (timeline) |
| `--a-dev-timeline-bar-background-color` | `#B22222` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (timeline bar) |
| `--a-dev-timeline-rule-background-color` | `rgba(255, 255, 255, .5)` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (timeline rule) |
| `--a-dev-timeline-text-color` | `rgba(255, 255, 255, .8)` | = Vita | 1 |  | Developer Toolbar: Textfarbe (timeline) |
| `--a-dev-timeline-time-background-color` | `rgba(122, 122, 122, .75)` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (timeline time) |
| `--a-dev-timeline-time-text-color` | `#fff` | = Vita | 1 |  | Developer Toolbar: Textfarbe (timeline time) |
| `--a-dev-toolbar-auto-hide-opacity` | — | — | 1 | L | Developer Toolbar: Deckkraft (Toolbar auto hide) — lokal in `.a-DevToolbar-menu.a-Menu`; Fallback `0.35` |
| `--a-dev-toolbar-backdrop-filter` | `none` | = Vita | 2 |  | Developer Toolbar: Backdrop-Filter (Toolbar) |
| `--a-dev-toolbar-background-color` | `#666` | = Vita | 2 |  | Developer Toolbar: Hintergrundfarbe (Toolbar) |
| `--a-dev-toolbar-button-active-background-color` | `rgba(0, 0, 0, .5)` | = Vita | 2 |  | Developer Toolbar: Hintergrundfarbe (Toolbar Button aktiv) |
| `--a-dev-toolbar-button-active-text-color` | `var(--a-dev-toolbar-text-color)` → `#fff` | = Vita | 1 |  | Developer Toolbar: Textfarbe (Toolbar Button aktiv) |
| `--a-dev-toolbar-button-background-color` | `transparent` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (Toolbar Button) |
| `--a-dev-toolbar-button-error-background-color` | `#EA1818` | = Vita | 2 |  | Developer Toolbar: Hintergrundfarbe (Toolbar Button Fehler) |
| `--a-dev-toolbar-button-error-text-color` | `#fff` | = Vita | 0 | ∅ | Developer Toolbar: Textfarbe (Toolbar Button Fehler) |
| `--a-dev-toolbar-button-icon-color` | `var(--a-dev-toolbar-text-color)` → `#fff` | = Vita | 0 | ∅ | Developer Toolbar: Farbe (Toolbar Button Icon) |
| `--a-dev-toolbar-button-icon-spacing` | — | — | 1 | L | Developer Toolbar: Abstand (Toolbar Button Icon) — lokal in `.a-DevToolbar span.a-Button.a-Button--devToolbar`; Fallback `4px` |
| `--a-dev-toolbar-button-text-color` | `var(--a-dev-toolbar-text-color)` → `#fff` | = Vita | 1 |  | Developer Toolbar: Textfarbe (Toolbar Button) |
| `--a-dev-toolbar-font-size` | — | — | 2 | L | Developer Toolbar: Schriftgröße (Toolbar) — lokal in `.a-DevToolbar span.a-Button.a-Button--devToolbar`; Fallback `12px` |
| `--a-dev-toolbar-sep-border-color` | `rgba(0, 0, 0, .1)` | = Vita | 5 |  | Developer Toolbar: Randfarbe (Toolbar Trenner) |
| `--a-dev-toolbar-shadow` | `0 0 12px rgba(0, 0, 0, .3)` | = Vita | 2 |  | Developer Toolbar: Schatten (Toolbar) |
| `--a-dev-toolbar-text-color` | `#fff` | = Vita | 6 |  | Developer Toolbar: Textfarbe (Toolbar) |
| `--a-dev-toolbar-ui-selector-background-color` | `transparent` | = Vita | 1 |  | Developer Toolbar: Hintergrundfarbe (Toolbar ui selector) |
| `--a-dev-toolbar-ui-selector-border-color` | `var(--a-palette-primary, #0572CE)` → `#056ac8` | = Vita | 1 |  | Developer Toolbar: Randfarbe (Toolbar ui selector) |
| `--a-diagram-background` | `var(--ut-region-background-color, var(--ut-co…` → `#fff` | `var(--ut-region-background-color, var(--ut-co…` → `#1b1d1e` | 4 |  | Workflow-Diagramm: Hintergrund |
| `--a-diagram-button-background-color` | `#fff` | = Vita | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (Button) |
| `--a-diagram-button-border-color` | `rgba(22, 21, 19, .5)` | = Vita | 0 | ∅ | Workflow-Diagramm: Randfarbe (Button) |
| `--a-diagram-button-text-color` | `rgb(22, 21, 19)` | = Vita | 0 | ∅ | Workflow-Diagramm: Textfarbe (Button) |
| `--a-diagram-cell-highlight` | `var(--ut-palette-success)` → `#278701` | `var(--ut-palette-success)` → `#388729` | 0 | ∅ | Workflow-Diagramm: Zelle Hervorhebung |
| `--a-diagram-cell-selection` | `rgb(22, 21, 19)` | = Vita | 0 | ∅ | Workflow-Diagramm: Zelle selection |
| `--a-diagram-element-background-color` | `var(--ut-body-background-color)` → `#fdfdfd` | `rgba(255, 255, 255, .2)` | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (element) |
| `--a-diagram-element-border-color` | `rgb(22, 21, 19)` | = Vita | 0 | ∅ | Workflow-Diagramm: Randfarbe (element) |
| `--a-diagram-element-container-button-background-color` | `var(--u-color-42)` → `#773492` | = Vita | 0 | ★26 ∅ | Workflow-Diagramm: Hintergrundfarbe (element Container Button) |
| `--a-diagram-element-container-children-container-background-color` | `#e6e6e6` | `#1a1a1a` | 0 | ★26 ∅ | Workflow-Diagramm: Hintergrundfarbe (element Container children Container) |
| `--a-diagram-element-container-icon-background-color` | `var(--u-color-27)` → `#9d71af` | = Vita | 0 | ★26 ∅ | Workflow-Diagramm: Hintergrundfarbe (element Container Icon) |
| `--a-diagram-element-diamond-icon-background-color` | `var(--u-color-38)` → `#d76a27` | = Vita | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (element diamond Icon) |
| `--a-diagram-element-icon-background-color` | `#cccccc` | `#333333` | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (element Icon) |
| `--a-diagram-element-icon-color` | `#fff` | = Vita | 0 | ∅ | Workflow-Diagramm: Farbe (element Icon) |
| `--a-diagram-element-rect-icon-background-color` | `var(--u-color-31)` → `#1a8bc9` | = Vita | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (element rect Icon) |
| `--a-diagram-element-selection` | `rgb(22, 21, 19)` | = Vita | 2 |  | Workflow-Diagramm: element selection |
| `--a-diagram-element-shadow` | `rgba(0, 0, 0, 0.3) 0 6px 12px` | = Vita | 4 |  | Workflow-Diagramm: Schatten (element) |
| `--a-diagram-element-subcontainer-body-background-color` | `#cccccc` | `#333333` | 0 | ★26 ∅ | Workflow-Diagramm: Hintergrundfarbe (element subcontainer Inhalt) |
| `--a-diagram-element-subcontainer-header-text-color` | `#000` | `#fff` | 0 | ★26 ∅ | Workflow-Diagramm: Textfarbe (element subcontainer Kopf) |
| `--a-diagram-element-terminator-background-color` | `rgba(0, 0, 0, 0.95)` | `rgba(255, 255, 255, .2)` | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (element terminator) |
| `--a-diagram-element-terminator-text-color` | `#fff` | `var(--ut-body-text-color)` → `#fff` | 0 | ∅ | Workflow-Diagramm: Textfarbe (element terminator) |
| `--a-diagram-element-text-color` | `var(--ut-body-text-color)` → `#000` | `var(--ut-body-text-color)` → `#fff` | 0 | ∅ | Workflow-Diagramm: Textfarbe (element) |
| `--a-diagram-label-background-color` | `var(--u-color-45)` → `#4d7391` | `#bcb6b1` | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (Label) |
| `--a-diagram-label-text-color` | `var(--u-color-45-contrast)` → `#e9eff4` | `#000` | 0 | ∅ | Workflow-Diagramm: Textfarbe (Label) |
| `--a-diagram-lasso-selection-background-color` | `rgba(51, 51, 51, .5)` | = Vita | 1 |  | Workflow-Diagramm: Hintergrundfarbe (lasso selection) |
| `--a-diagram-lasso-selection-border-color` | `#759C6C` | = Vita | 1 |  | Workflow-Diagramm: Randfarbe (lasso selection) |
| `--a-diagram-link-border-color` | `var(--u-color-44)` → `#8c9eb0` | = Vita | 0 | ∅ | Workflow-Diagramm: Randfarbe (Link) |
| `--a-diagram-link-placeholder-background-color` | `rgb(122, 115, 110)` | = Vita | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (Link Platzhalter) |
| `--a-diagram-link-placeholder-border-color` | `rgb(122, 115, 110)` | = Vita | 0 | ∅ | Workflow-Diagramm: Randfarbe (Link Platzhalter) |
| `--a-diagram-link-placeholder-highlight-background-color` | `#AE562C` | = Vita | 0 | ∅ | Workflow-Diagramm: Hintergrundfarbe (Link Platzhalter Hervorhebung) |
| `--a-diagram-link-placeholder-highlight-border-color` | `#AE562C` | = Vita | 0 | ∅ | Workflow-Diagramm: Randfarbe (Link Platzhalter Hervorhebung) |
| `--a-diagram-link-placeholder-text-color` | `#fff` | = Vita | 0 | ∅ | Workflow-Diagramm: Textfarbe (Link Platzhalter) |
| `--a-diagram-navigator-background-color` | `var(--a-diagram-background)` → `#fff` | `var(--a-diagram-background)` → `#1b1d1e` | 1 |  | Workflow-Diagramm: Hintergrundfarbe (navigator) |
| `--a-diagram-navigator-border-color` | `var(--ut-palette-primary)` → `#056ac8` | `#bcb6b1` | 1 |  | Workflow-Diagramm: Randfarbe (navigator) |
| `--a-diagram-route-active` | `var(--ut-palette-primary)` → `#056ac8` | = Vita | 0 | ∅ | Workflow-Diagramm: route aktiv |
| `--a-diagram-route-completed` | `var(--ut-palette-success)` → `#278701` | `var(--ut-palette-success)` → `#388729` | 1 |  | Workflow-Diagramm: route completed |
| `--a-diagram-route-default` | `var(--a-diagram-route-completed)` → `#278701` | `var(--a-diagram-route-completed)` → `#388729` | 0 | ∅ | Workflow-Diagramm: route Standard |
| `--a-diagram-route-faulted` | `var(--ut-palette-danger)` → `#cb1100` | `var(--ut-palette-danger)` → `#ee0701` | 0 | ∅ | Workflow-Diagramm: route faulted |
| `--a-diagram-route-suspended` | `var(--ut-palette-warning)` → `#ffc628` | `var(--ut-palette-warning)` → `#fbce4a` | 0 | ∅ | Workflow-Diagramm: route suspended |
| `--a-diagram-route-terminated` | `var(--ut-palette-danger)` → `#cb1100` | `var(--ut-palette-danger)` → `#ee0701` | 0 | ∅ | Workflow-Diagramm: route terminated |
| `--a-diagram-route-waiting` | `var(--ut-palette-info)` → `#056ac8` | `var(--ut-palette-info)` → `#006bd8` | 0 | ∅ | Workflow-Diagramm: route waiting |
| `--a-diagram-snap-border-color` | `#A17EB0` | = Vita | 1 |  | Workflow-Diagramm: Randfarbe (snap) |
| `--a-diagram-toast-background-color` | `rgba(255, 255, 255, .75)` | = Vita | 1 |  | Workflow-Diagramm: Hintergrundfarbe (toast) |
| `--a-diagram-toast-border-color` | `rgba(255, 255, 255, .95)` | = Vita | 1 |  | Workflow-Diagramm: Randfarbe (toast) |
| `--a-diagram-toast-text-color` | `#333` | = Vita | 1 |  | Workflow-Diagramm: Textfarbe (toast) |
| `--a-love-apex-hover-text-color` | `var(--a-palette-danger, #F00)` → `#cb1100` | `var(--a-palette-danger, #F00)` → `#ee0701` | 1 |  | „Built with APEX“: Textfarbe (apex Hover) |
| `--a-love-apex-margin` | `0 .125rem` | = Vita | 1 |  | „Built with APEX“: Außenabstand (apex) |
| `--a-map-legend-title-text-color` | `var(--ut-component-text-muted-color)` → `rgba(0,0,0,.65)` | `var(--ut-component-text-muted-color)` → `hsla(0,0%,100%,.65)` | 1 |  | Map Region: Textfarbe (legend Titel) |
| `--a-map-message-close-opacity` | — | — | 1 | L | Map Region: Deckkraft (Nachricht Schließen) — lokal in `.a-MapRegion-messageClose:hover, .a-MapRegion-messageClose:…`; Fallback `0.35` |
| `--a-map-popup-padding-offset` | — | — | 1 | L | Map Region: Versatz (popup padding) — lokal in `.a-MapRegion-popup--info`; Fallback `28px` |
| `--a-md-blockquote-border-color` | — | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 2 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (blockquote) |
| `--a-md-code-background-color` | — | `var(--ut-component-pre-background-color)` → `hsla(0,0%,100%,.1)` | 1 | D | Markdown-Ausgabe (is-markdownified): Hintergrundfarbe (code) |
| `--a-md-code-border-color` | — | `unset` | 1 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (code) |
| `--a-md-code-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (code) — lokal in `.a-ChatClient`; Fallback `14px` |
| `--a-md-h1-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h1) — lokal in `.a-ChatClient .is-markdownified`; Fallback `40px` |
| `--a-md-h1-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h1) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-h2-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h2) — lokal in `.a-ChatClient .is-markdownified`; Fallback `32px` |
| `--a-md-h2-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h2) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-h3-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h3) — lokal in `.a-ChatClient .is-markdownified`; Fallback `28px` |
| `--a-md-h3-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h3) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-h4-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h4) — lokal in `.a-ChatClient .is-markdownified`; Fallback `24px` |
| `--a-md-h4-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h4) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-h5-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h5) — lokal in `.a-ChatClient .is-markdownified`; Fallback `20px` |
| `--a-md-h5-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h5) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-h6-font-size` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Schriftgröße (h6) — lokal in `.a-ChatClient .is-markdownified`; Fallback `16px` |
| `--a-md-h6-line-height` | — | — | 1 | L | Markdown-Ausgabe (is-markdownified): Zeilenhöhe (h6) — lokal in `.a-ChatClient .is-markdownified`; Fallback `1.2` |
| `--a-md-hr-border-color` | — | `var(--ut-component-border-color)` → `hsla(0,0%,100%,.15)` | 1 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (hr) |
| `--a-md-pre-background-color` | — | `var(--ut-component-pre-background-color)` → `hsla(0,0%,100%,.1)` | 1 | D | Markdown-Ausgabe (is-markdownified): Hintergrundfarbe (pre) |
| `--a-md-pre-border-color` | — | `unset` | 1 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (pre) |
| `--a-md-table-background-color` | — | `var(--ut-report-cell-background-color, transp…` → `transparent` | 1 | D | Markdown-Ausgabe (is-markdownified): Hintergrundfarbe (table) |
| `--a-md-table-border-color` | — | `var(--ut-report-border-color, var(--ut-report…` → `#333639` | 1 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (table) |
| `--a-md-table-cell-border-color` | — | `var(--ut-report-cell-border-color, var(--ut-c…` → `#333639` | 1 | D | Markdown-Ausgabe (is-markdownified): Randfarbe (table Zelle) |
| `--a-md-table-heading-background-color` | — | `var(--ut-report-header-cell-background-color,…` → `#111213` | 1 | D | Markdown-Ausgabe (is-markdownified): Hintergrundfarbe (table Überschrift) |
| `--ck-border-radius` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Eckenradius — lokal in `body .ck.ck-dropdown__panel .ck-list` |
| `--ck-color-base-border` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color base border — lokal in `body` |
| `--ck-color-base-focus` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color base Fokus — lokal in `body` |
| `--ck-color-base-text` | — | — | 1 | L | CKEditor 5 (Rich Text Editor): color base Text — lokal in `body` |
| `--ck-color-button-cancel` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color Button cancel — lokal in `body` |
| `--ck-color-button-default-active-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button Standard aktiv) — lokal in `body` |
| `--ck-color-button-default-active-shadow` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Schatten (color Button Standard aktiv) — lokal in `body` |
| `--ck-color-button-default-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button Standard) — lokal in `body` |
| `--ck-color-button-default-disabled-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button Standard deaktiviert) — lokal in `body` |
| `--ck-color-button-default-hover-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button Standard Hover) — lokal in `body` |
| `--ck-color-button-on-active-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button on aktiv) — lokal in `body` |
| `--ck-color-button-on-active-shadow` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Schatten (color Button on aktiv) — lokal in `body` |
| `--ck-color-button-on-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button on) — lokal in `body` |
| `--ck-color-button-on-disabled-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button on deaktiviert) — lokal in `body` |
| `--ck-color-button-on-hover-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Button on Hover) — lokal in `body` |
| `--ck-color-button-save` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color Button save — lokal in `body` |
| `--ck-color-dropdown-panel-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color dropdown panel) — lokal in `body` |
| `--ck-color-dropdown-panel-border` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color dropdown panel border — lokal in `body` |
| `--ck-color-image-caption-background` | `#f7f7f7` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hintergrund (color Bild caption) |
| `--ck-color-image-caption-text` | `#333` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): color Bild caption Text |
| `--ck-color-labeled-field-label-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color labeled field Label) — lokal in `body` |
| `--ck-color-list-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Liste) — lokal in `body` |
| `--ck-color-list-button-hover-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Liste Button Hover) — lokal in `body` |
| `--ck-color-list-button-on-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Liste Button on) — lokal in `body` |
| `--ck-color-list-button-on-text` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color Liste Button on Text — lokal in `body` |
| `--ck-color-mention-background` | `rgba(153, 0, 48, .1)` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hintergrund (color mention) |
| `--ck-color-mention-text` | `#990030` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): color mention Text |
| `--ck-color-panel-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color panel) — lokal in `body` |
| `--ck-color-panel-border` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color panel border — lokal in `body` |
| `--ck-color-selector-caption-background` | `#f7f7f7` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hintergrund (color selector caption) |
| `--ck-color-selector-caption-text` | `#333` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): color selector caption Text |
| `--ck-color-text` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color Text — lokal in `body` |
| `--ck-color-toolbar-background` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Hintergrund (color Toolbar) — lokal in `body` |
| `--ck-color-toolbar-border` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): color Toolbar border — lokal in `body` |
| `--ck-drop-shadow` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): Schatten (drop) — lokal in `body` |
| `--ck-highlight-marker-blue` | `#72ccfd` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung Marker blue |
| `--ck-highlight-marker-green` | `#62f962` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung Marker green |
| `--ck-highlight-marker-pink` | `#fc7899` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung Marker pink |
| `--ck-highlight-marker-yellow` | `#fdfd77` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung Marker yellow |
| `--ck-highlight-pen-green` | `#128a00` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung pen green |
| `--ck-highlight-pen-red` | `#e71313` | = Vita | 1 |  | CKEditor 5 (Rich Text Editor): Hervorhebung pen red |
| `--ck-image-style-spacing` | `1.5em` | = Vita | 7 |  | CKEditor 5 (Rich Text Editor): Abstand (Bild style) |
| `--ck-inline-image-style-spacing` | `calc(var(--ck-image-style-spacing) / 2)` → `calc(1.5em/2)` | = Vita | 4 |  | CKEditor 5 (Rich Text Editor): Abstand (inline Bild style) |
| `--ck-todo-list-checkmark-size` | `16px` | = Vita | 8 |  | CKEditor 5 (Rich Text Editor): Größe (todo Liste checkmark) |
| `--ck-z-modal` | — | — | 0 | L | CKEditor 5 (Rich Text Editor): z modal — lokal in `.ck-editor` |
| `--fc-bg-event-color` | — | — | 0 | L | FullCalendar (Bibliothek): Farbe (bg Termin) — lokal in `.apex-fullcalendar-5` |
| `--fc-bg-event-opacity` | — | — | 0 | L | FullCalendar (Bibliothek): Deckkraft (bg Termin) — lokal in `.apex-fullcalendar-5` |
| `--fc-border-color` | — | — | 0 | L | FullCalendar (Bibliothek): Randfarbe — lokal in `.apex-fullcalendar-5` |
| `--fc-button-active-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (Button aktiv) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-active-border-color` | — | — | 0 | L | FullCalendar (Bibliothek): Randfarbe (Button aktiv) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (Button) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-border-color` | — | — | 0 | L | FullCalendar (Bibliothek): Randfarbe (Button) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-hover-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (Button Hover) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-hover-border-color` | — | — | 0 | L | FullCalendar (Bibliothek): Randfarbe (Button Hover) — lokal in `.apex-fullcalendar-5` |
| `--fc-button-text-color` | — | — | 0 | L | FullCalendar (Bibliothek): Textfarbe (Button) — lokal in `.apex-fullcalendar-5` |
| `--fc-daygrid-event-dot-width` | — | — | 0 | L | FullCalendar (Bibliothek): Breite (daygrid Termin dot) — lokal in `.apex-fullcalendar-5` |
| `--fc-event-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (Termin) — lokal in `.apex-fullcalendar-5` |
| `--fc-event-border-color` | — | — | 1 | L | FullCalendar (Bibliothek): Randfarbe (Termin) — lokal in `.apex-fullcalendar-5` |
| `--fc-event-resizer-dot-border-width` | — | — | 0 | L | FullCalendar (Bibliothek): Randbreite (Termin resizer dot) — lokal in `.apex-fullcalendar-5` |
| `--fc-event-resizer-dot-total-width` | — | — | 0 | L | FullCalendar (Bibliothek): Breite (Termin resizer dot total) — lokal in `.apex-fullcalendar-5` |
| `--fc-event-resizer-thickness` | — | — | 0 | L | FullCalendar (Bibliothek): Termin resizer thickness — lokal in `.apex-fullcalendar-5` |
| `--fc-event-selected-overlay-color` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` | 0 |  | FullCalendar (Bibliothek): Farbe (Termin ausgewählt Overlay) |
| `--fc-event-text-color` | — | — | 0 | L | FullCalendar (Bibliothek): Textfarbe (Termin) — lokal in `.apex-fullcalendar-5` |
| `--fc-highlight-color` | — | — | 0 | L | FullCalendar (Bibliothek): Farbe (Hervorhebung) — lokal in `.apex-fullcalendar-5` |
| `--fc-list-event-dot-width` | — | — | 0 | L | FullCalendar (Bibliothek): Breite (Liste Termin dot) — lokal in `.apex-fullcalendar-5` |
| `--fc-list-event-hover-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (Liste Termin Hover) — lokal in `.apex-fullcalendar-5` |
| `--fc-list-view-responsive-breakpoint` | `700px` | = Vita | 0 |  | FullCalendar (Bibliothek): Liste view responsive breakpoint |
| `--fc-neutral-bg-color` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` | 0 |  | FullCalendar (Bibliothek): Hintergrundfarbe (neutral) |
| `--fc-neutral-text-color` | `#000` | `#fff` | 0 |  | FullCalendar (Bibliothek): Textfarbe (neutral) |
| `--fc-non-business-color` | `rgba(0, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.2)` | 0 |  | FullCalendar (Bibliothek): Farbe (non business) |
| `--fc-now-indicator-color` | — | — | 0 | L | FullCalendar (Bibliothek): Farbe (now indicator) — lokal in `.apex-fullcalendar-5` |
| `--fc-page-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (page) — lokal in `.apex-fullcalendar-5` |
| `--fc-small-font-size` | — | — | 0 | L | FullCalendar (Bibliothek): Schriftgröße (small) — lokal in `.apex-fullcalendar-5` |
| `--fc-today-bg-color` | — | — | 0 | L | FullCalendar (Bibliothek): Hintergrundfarbe (today) — lokal in `.apex-fullcalendar-5` |
| `--fc5-toolbar-padding-y` | — | — | 3 | L | FullCalendar 5: Innenabstand vertikal (Toolbar) — lokal in `@media (max-width: 639px) » .apex-fullcalendar-5 .fc-toolba…`; Fallback `16px` |
| `--mg-bottom-left-ctrl-margin-x` | — | — | 0 | L ∅ | MapLibre (Map Region): Außenabstand horizontal (bottom left ctrl) — lokal in `.a-MapRegion` |
| `--mg-bottom-left-ctrl-margin-y` | — | — | 0 | L ∅ | MapLibre (Map Region): Außenabstand vertikal (bottom left ctrl) — lokal in `.a-MapRegion` |
| `--mg-ctrl-group-button-text-color` | `#000` | = Vita | 0 | ∅ | MapLibre (Map Region): Textfarbe (ctrl Gruppe Button) |
| `--mg-popup-border-radius` | — | — | 0 | L ∅ | MapLibre (Map Region): Eckenradius (popup) — lokal in `.a-MapRegion` |
| `--mg-popup-border-width` | — | — | 0 | L ∅ | MapLibre (Map Region): Randbreite (popup) — lokal in `.a-MapRegion` |
| `--mg-popup-close-button-offset` | — | — | 2 | L | MapLibre (Map Region): Versatz (popup Schließen Button) — lokal in `.maplibregl-popup-content` |
| `--mg-popup-content-box-shadow` | `var(--ut-shadow-lg)` → `0 1.5rem 3rem -1.5rem rgba(0,0,0,…` | = Vita | 0 | ∅ | MapLibre (Map Region): Schatten (popup Inhalt) |
| `--mg-popup-padding-x` | — | — | 3 | L | MapLibre (Map Region): Innenabstand horizontal (popup) — lokal in `.maplibregl-popup-content`; Fallback `var(--jui-tooltip-padding, 8px)` |
| `--mg-popup-padding-y` | — | — | 2 | L | MapLibre (Map Region): Innenabstand vertikal (popup) — lokal in `.maplibregl-popup-content`; Fallback `var(--jui-tooltip-padding, 8px)` |
| `--mg-top-right-ctrl-margin-x` | — | — | 0 | L ∅ | MapLibre (Map Region): Außenabstand horizontal (top right ctrl) — lokal in `.a-MapRegion` |
| `--mg-top-right-ctrl-margin-y` | — | — | 0 | L ∅ | MapLibre (Map Region): Außenabstand vertikal (top right ctrl) — lokal in `.a-MapRegion` |
| `--prism-boolean` | `var(--prism-literal)` → `#001080` | `var(--prism-literal)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „boolean“ (Code-Hervorhebung) |
| `--prism-builtin` | `#795E26` | `#DCDCAA` | 1 |  | Prism-Syntaxfarbe „builtin“ (Code-Hervorhebung) |
| `--prism-class` | `#267f99` | `#4EC9B0` | 2 |  | Prism-Syntaxfarbe „class“ (Code-Hervorhebung) |
| `--prism-comment` | `#008000` | `#6A9955` | 1 |  | Prism-Syntaxfarbe „comment“ (Code-Hervorhebung) |
| `--prism-constant` | `var(--prism-literal)` → `#001080` | `var(--prism-literal)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „constant“ (Code-Hervorhebung) |
| `--prism-decorator` | `var(--prism-class)` → `#267f99` | `var(--prism-class)` → `#4ec9b0` | 1 |  | Prism-Syntaxfarbe „decorator“ (Code-Hervorhebung) |
| `--prism-deleted` | `#9a050f` | `#CE9178` | 1 |  | Prism-Syntaxfarbe „deleted“ (Code-Hervorhebung) |
| `--prism-function` | `#795E26` | `#DCDCAA` | 1 |  | Prism-Syntaxfarbe „function“ (Code-Hervorhebung) |
| `--prism-inline-background` | `var(--prism-background)` | = Vita | 0 | ∅ | Prism-Syntaxfarbe „inline-background“ (Code-Hervorhebung) |
| `--prism-interpolation` | `var(--prism-literal)` → `#001080` | `var(--prism-literal)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „interpolation“ (Code-Hervorhebung) |
| `--prism-json-property` | `var(--prism-property)` → `#001080` | `var(--prism-property)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „json-property“ (Code-Hervorhebung) |
| `--prism-keyword` | `#AF00DB` | `#C586C0` | 3 |  | Prism-Syntaxfarbe „keyword“ (Code-Hervorhebung) |
| `--prism-keyword-control` | `var(--prism-keyword)` → `#af00db` | `var(--prism-keyword)` → `#c586c0` | 1 |  | Prism-Syntaxfarbe „keyword-control“ (Code-Hervorhebung) |
| `--prism-literal` | `#001080` | `#9CDCFE` | 5 |  | Prism-Syntaxfarbe „literal“ (Code-Hervorhebung) |
| `--prism-namespace` | `#267f99` | `#4EC9B0` | 1 |  | Prism-Syntaxfarbe „namespace“ (Code-Hervorhebung) |
| `--prism-number` | `#098658` | `#B5CEA8` | 1 |  | Prism-Syntaxfarbe „number“ (Code-Hervorhebung) |
| `--prism-property` | `#001080` | `#9CDCFE` | 2 |  | Prism-Syntaxfarbe „property“ (Code-Hervorhebung) |
| `--prism-regex` | `var(--prism-string)` → `#a31515` | `var(--prism-string)` → `#ce9178` | 1 |  | Prism-Syntaxfarbe „regex“ (Code-Hervorhebung) |
| `--prism-selector` | `var(--prism-keyword)` → `#af00db` | `var(--prism-keyword)` → `#c586c0` | 1 |  | Prism-Syntaxfarbe „selector“ (Code-Hervorhebung) |
| `--prism-string` | `#A31515` | `#CE9178` | 2 |  | Prism-Syntaxfarbe „string“ (Code-Hervorhebung) |
| `--prism-symbol` | `var(--prism-literal)` → `#001080` | `var(--prism-literal)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „symbol“ (Code-Hervorhebung) |
| `--prism-variable` | `var(--prism-literal)` → `#001080` | `var(--prism-literal)` → `#9cdcfe` | 1 |  | Prism-Syntaxfarbe „variable“ (Code-Hervorhebung) |

### 10.24 Sonstiges/Technik (--js-*, Safe-Area, Overrides) (16)

| Variable | Vita | Vita-Dark | Refs | Flags | Bedeutung |
|---|---|---|---:|---|---|
| `--a-animation-override` | — | — | 6 | L | a-animation: override [auf :root zusätzlich @media (prefers-reduced-motion: reduce): none] — Fallback `anim-mic-listening 1s infinite ease-in-…` |
| `--a-icon-background-size` | — | — | 0 | L ∅ | Icons: Größe (background) — lokal in `.t-Alert--horizontal` |
| `--a-icon-padding` | — | — | 12 | L | Icons: Innenabstand — lokal in `.t-Login-body` …; Fallback `4px` |
| `--a-icon-size` | `1rem` | = Vita | 56 |  | Standard-Icongröße (font-apex setzt pro .fa-Größenklasse eigene Werte). |
| `--a-opacity-override` | — | — | 1 | L | a-opacity: override [auf :root zusätzlich @media (prefers-reduced-transparency: reduce): 1] — Fallback `var(--a-dev-toolbar-auto-hide-opacity, …` |
| `--a-transition-override` | — | — | 22 | L | a-transition: override [auf :root zusätzlich @media (prefers-reduced-motion: reduce): none] — Fallback `var(--a-checkbox-icon-transition, 0.1s …` |
| `--js-dialog-close-timing` | `0s` | = Vita | 6 |  | JS-Konstante: Timing (Dialog Schließen) [auf :root zusätzlich @media screen and (prefers-reduced-motion: no-preference): .2s] |
| `--js-dialog-open-timing` | `0s` | = Vita | 8 |  | JS-Konstante: Timing (Dialog open) [auf :root zusätzlich @media screen and (prefers-reduced-motion: no-preference): .2s] |
| `--js-mq-lg` | `992px` | = Vita | 0 | ∅ | Breakpoint 992px – von theme42.js gelesen. |
| `--js-mq-md` | `768px` | = Vita | 0 | ∅ | Breakpoint 768px – von theme42.js gelesen. |
| `--js-mq-sm` | `640px` | = Vita | 0 | ∅ | Breakpoint 640px – von theme42.js gelesen. |
| `--js-mq-xl` | `1200px` | = Vita | 0 | ∅ | Breakpoint 1200px (definiert, von theme42.js nicht gelesen). |
| `--js-mq-xs` | `480px` | = Vita | 0 | ∅ | Breakpoint 480px – von theme42.js per getComputedStyle gelesen (Responsive-Logik). |
| `--js-mq-xxl` | `1400px` | = Vita | 0 | ∅ | Breakpoint 1400px (definiert, von theme42.js nicht gelesen). |
| `--js-page-title-height` | `0rem` | = Vita | 2 |  | Von theme42.js zur Laufzeit gesetzt (Title-Bar-Höhe) – nicht überschreiben. |
| `--js-sticky-top` | `0rem` | = Vita | 6 |  | Von theme42.js zur Laufzeit gesetzt (Header-Höhe für Sticky-Elemente) – nicht überschreiben. |

## 11. Hooks (referenziert, nie definiert)

1776 Variablen werden in den geladenen Dateien nur als `var(--name, fallback)` verwendet. Sie sind die offiziellen „Einhängepunkte“ für Themes: auf :root (oder im Komponenten-Selektor) setzen, und die Komponente übernimmt den Wert. Vollständige Liste mit Fallback, Eigenschaft und Selektor im JSON (`hooks`).

| Präfix | Anzahl | Beispiele |
|---|---:|---|
| `--a-chat-*` | 133 | `--a-chat-message-bubble-border-radius-point`, `--a-chat-message-button-border-width`, `--a-chat-message-pre-border-radius`, `--a-chat-item-body-gap-x` |
| `--a-datepicker-*` | 53 | `--a-datepicker-footer-item-spacing`, `--a-datepicker-border-color`, `--a-datepicker-monthpicker-select-padding-x`, `--a-datepicker-calendar-day-padding-x` |
| `--a-gv-*` | 52 | `--a-gv-cell-border-width`, `--a-gv-selected-background-color`, `--a-gv-selected-text-color`, `--a-gv-header-text-color` |
| `--a-fs-*` | 48 | `--a-fs-facet-option-padding-x`, `--a-fs-facet-option-padding-y`, `--a-fs-clear-remove-padding`, `--a-fs-control-item-badge-opacity` |
| `--ut-timeline-*` | 46 | `--ut-timeline-border-color`, `--ut-timeline-content-col-width`, `--ut-timeline-icon-size`, `--ut-timeline-selection-font-size` |
| `--a-map-*` | 44 | `--a-map-distance-offset`, `--a-map-message-padding-x`, `--a-map-legend-item-padding-y`, `--a-map-legend-line-height` |
| `--a-chip-*` | 40 | `--a-chip-value-font-weight`, `--a-chip-inline-size`, `--a-chip-active-border-color`, `--a-chip-active-text-color` |
| `--ut-metric-*` | 39 | `--ut-metric-card-group-icon-size`, `--ut-metric-card-body-gap-x`, `--ut-metric-card-badge-gap`, `--ut-metric-card-body-gap-y` |
| `--a-filedrop-*` | 37 | `--a-filedrop-border-width`, `--a-filedrop-progress-transition`, `--a-filedrop-body-spacing`, `--a-filedrop-active-background-color` |
| `--a-dev-*` | 36 | `--a-dev-toolbar-transition`, `--a-dev-toolbar-button-border-padding-x`, `--a-dev-toolbar-button-border-padding-y`, `--a-dev-toolbar-sep-border-width` |
| `--ut-cr-*` | 36 | `--ut-cr-border-color`, `--ut-cr-border-width`, `--ut-cr-icon-text-color`, `--ut-cr-item-border-color` |
| `--a-cv-*` | 34 | `--a-cv-placeholder-color`, `--a-cv-title-text-color`, `--a-cv-badge-font-weight`, `--a-cv-badge-line-height` |
| `--ut-comment-*` | 33 | `--ut-comment-icon-size`, `--ut-comment-caret-border-width`, `--ut-comment-icon-margin-x`, `--ut-comment-item-selected-background-color` |
| `--ut-statuslist-*` | 32 | `--ut-statuslist-marker-cal-height`, `--ut-statuslist-block-header-padding`, `--ut-statuslist-border-width`, `--ut-statuslist-item-desc-margin-y` |
| `--ut-report-*` | 31 | `--ut-report-cell-padding-x`, `--ut-report-cell-padding-y`, `--ut-report-cell-font-size`, `--ut-report-cell-line-height` |
| `--a-md-*` | 30 | `--a-md-blockquote-border-width`, `--a-md-blockquote-margin-x`, `--a-md-blockquote-margin-y`, `--a-md-blockquote-padding-x` |
| `--a-resultsitem-*` | 29 | `--a-resultsitem-icon-container-size`, `--a-resultsitem-image-fit`, `--a-resultsitem-placeholder-color`, `--a-resultsitem-alignment` |
| `--a-combo-*` | 28 | `--a-combo-select-item-padding-x`, `--a-combo-select-item-padding-y`, `--a-combo-chip-label-spacing-y`, `--a-combo-select-border-color` |
| `--ut-badgelist-*` | 28 | `--ut-badgelist-item-border-width`, `--ut-badgelist-item-padding-x`, `--ut-badgelist-item-padding-y`, `--ut-badgelist-label-font-size-large` |
| `--a-comboselect-*` | 27 | `--a-comboselect-counter-min-size`, `--a-comboselect-counter-padding-x`, `--a-comboselect-action-background-color`, `--a-comboselect-action-text-color` |
| `--ut-badge-*` | 27 | `--ut-badge-display`, `--ut-badge-border-color`, `--ut-badge-danger-background-color`, `--ut-badge-danger-text-color` |
| `--ut-ccalendar-*` | 26 | `--ut-ccalendar-border-color`, `--ut-ccalendar-date-today-font-weight`, `--ut-ccalendar-event-background-color`, `--ut-ccalendar-event-border-radius` |
| `--ut-xs-*` | 23 | `--ut-xs-breadcrumb-padding-x`, `--ut-xs-breadcrumb-padding-y`, `--ut-xs-breadcrumb-region-spacing`, `--ut-xs-cr-wrap-padding-x` |
| `--a-pwa-*` | 22 | `--a-pwa-actions-padding`, `--a-pwa-description-font-size`, `--a-pwa-description-line-height`, `--a-pwa-header-item-spacing` |
| `--ut-linkslist-*` | 22 | `--ut-linkslist-link-padding-x`, `--ut-linkslist-icon-size`, `--ut-linkslist-arrow-size`, `--ut-linkslist-transition-timing` |
| `--ut-cardlist-*` | 19 | `--ut-cardlist-grid-gap`, `--ut-cardlist-icon-background-color`, `--ut-cardlist-body-border-border-color`, `--ut-cardlist-body-border-border-width` |
| `--ut-field-*` | 19 | `--ut-field-input-icon-size`, `--ut-field-assistance-font-size`, `--ut-field-assistance-line-height`, `--ut-field-assistance-margin-y` |
| `--ut-wp-*` | 19 | `--ut-wp-step-track-size`, `--ut-wp-vertical-marker-size`, `--ut-wp-checkmark-color`, `--ut-wp-label-padding-y` |
| `--a-button-*` | 18 | `--a-button-cursor`, `--a-button-focus-shadow`, `--a-button-disabled-cursor`, `--a-button-disabled-opacity` |
| `--ut-contextualinfo-*` | 18 | `--ut-contextualinfo-label-margin-x`, `--ut-contextualinfo-border-color`, `--ut-contextualinfo-border-width`, `--ut-contextualinfo-container-margin-x` |
| `--ut-medialist-*` | 18 | `--ut-medialist-item-border-width`, `--ut-medialist-item-border-color`, `--ut-medialist-badge-padding-x`, `--ut-medialist-badge-padding-y` |
| `--a-field-*` | 17 | `--a-field-input-font-weight`, `--a-field-disabled-opacity`, `--a-field-input-focus-text-color`, `--a-field-input-hover-text-color` |
| `--ut-carousel-*` | 17 | `--ut-carousel-button-border-width`, `--ut-carousel-button-offset-x`, `--ut-carousel-button-padding-x`, `--ut-carousel-button-padding-y` |
| `--ut-minical-*` | 17 | `--ut-minical-date-height`, `--ut-minical-background-color`, `--ut-minical-border-color`, `--ut-minical-border-radius` |
| `--a-color-*` | 16 | `--a-color-picker-padding`, `--a-color-spectrum-size`, `--a-color-picker-inline-min-size`, `--a-color-spectrum-border-color` |
| `--u-space-*` | 16 | `--u-space-0`, `--u-space-0_5`, `--u-space-1`, `--u-space-10` |
| `--ut-alert-*` | 16 | `--ut-alert-type-border-radius`, `--ut-alert-offset`, `--ut-alert-margin`, `--ut-alert-background-color` |
| `--ut-body-*` | 16 | `--ut-body-actions-border-width`, `--ut-body-actions-border-color`, `--ut-body-actionstoggle-padding-y`, `--ut-body-info-background-color` |
| `--ut-header-*` | 16 | `--ut-header-item-spacing`, `--ut-header-controls-icon-transition`, `--ut-header-padding-y`, `--ut-header-border-width` |
| `--ut-megamenu-*` | 16 | `--ut-megamenu-item-padding-x`, `--ut-megamenu-item-top-padding-x`, `--ut-megamenu-item-top-padding-y`, `--ut-megamenu-badge-background-color` |
| `--ut-navtabs-*` | 16 | `--ut-navtabs-badge-line-height`, `--ut-navtabs-icon-spacing`, `--ut-navtabs-badge-background-color`, `--ut-navtabs-badge-border-radius` |
| `--ut-popuplov-*` | 16 | `--ut-popuplov-actions-padding-x`, `--ut-popuplov-footer-padding-x`, `--ut-popuplov-footer-padding-y`, `--ut-popuplov-actions-background-color` |
| `--ut-treeview-*` | 16 | `--ut-treeview-badge-padding-y`, `--ut-treeview-leaf-padding-x`, `--ut-treeview-leaf-padding-y`, `--ut-treeview-toplevel-leaf-padding-x` |
| `--ut-wizard-*` | 16 | `--ut-wizard-controls-padding-x`, `--ut-wizard-controls-padding-y`, `--ut-wizard-title-padding-y`, `--ut-wizard-body-padding-x` |
| `--ut-footer-*` | 15 | `--ut-footer-top-border-width`, `--ut-footer-top-size`, `--ut-footer-apex-font-size`, `--ut-footer-apex-item-spacing` |
| `--ut-completeness-*` | 13 | `--ut-completeness-background-color`, `--ut-completeness-border-color`, `--ut-completeness-border-radius`, `--ut-completeness-border-width` |
| `--ut-lv-*` | 13 | `--ut-lv-item-padding-y`, `--ut-lv-item-padding-x`, `--ut-lv-count-padding-x`, `--ut-lv-count-padding-y` |
| `--a-base-*` | 12 | `--a-base-font-weight-bold`, `--a-base-font-weight-heavy`, `--a-base-font-weight-normal`, `--a-base-link-active-text-color` |
| `--a-checkbox-*` | 12 | `--a-checkbox-cursor`, `--a-checkbox-icon-font-family`, `--a-checkbox-icon-font-weight`, `--a-checkbox-icon-transition` |
| `--jui-datepicker-*` | 12 | `--jui-datepicker-padding-x`, `--jui-datepicker-padding-y`, `--jui-datepicker-active-font-size`, `--jui-datepicker-border-width` |
| `--jui-slider-*` | 12 | `--jui-slider-handle-size`, `--jui-slider-border-width`, `--jui-slider-thickness`, `--jui-slider-background-color` |
| `--ut-media-*` | 12 | `--ut-media-list-item-margin-block-end`, `--ut-media-list-item-padding-block-end`, `--ut-media-list-group-header-background-color`, `--ut-media-list-group-header-gap` |
| `--ut-searchresults-*` | 12 | `--ut-searchresults-item-info-margin`, `--ut-searchresults-item-margin`, `--ut-searchresults-item-date-text-color`, `--ut-searchresults-item-desc-text-color` |
| `--ut-configpanel-*` | 11 | `--ut-configpanel-border-width`, `--ut-configpanel-padding`, `--ut-configpanel-border-color`, `--ut-configpanel-attr-border-color` |
| `--ut-breadcrumb-*` | 10 | `--ut-breadcrumb-item-font-size`, `--ut-breadcrumb-item-line-height`, `--ut-breadcrumb-item-sep-spacing`, `--ut-breadcrumb-region-gap` |
| `--ut-resultsregion-*` | 10 | `--ut-resultsregion-search-padding-x`, `--ut-resultsregion-search-padding-y`, `--ut-resultsregion-count-padding-x`, `--ut-resultsregion-count-padding-y` |
| `--a-alert-*` | 9 | `--a-alert-message-font-size`, `--a-alert-message-icon-container-size`, `--a-alert-message-icon-size`, `--a-alert-message-icon-spacing` |
| `--a-combobox-*` | 9 | `--a-combobox-chip-remove-gap-x`, `--a-combobox-floating-label-padding-y`, `--a-combobox-chips-spacing-x`, `--a-combobox-chips-spacing-y` |
| `--a-diagram-*` | 9 | `--a-diagram-tooltip-border-color`, `--a-diagram-element-subcontainer-resize-handle-background-color`, `--a-diagram-element-subcontainer-resize-handle-border-color`, `--a-diagram-element-subcontainer-resize-handle-hover-background-color` |
| `--a-file-*` | 9 | `--a-file-crop-reset-active-background`, `--a-file-crop-reset-active-color`, `--a-file-crop-reset-background`, `--a-file-crop-reset-border-color` |
| `--a-menu-*` | 9 | `--a-menu-callout-border-width`, `--a-menu-cursor`, `--a-menu-sep-border-width`, `--a-menu-disabled-opacity` |
| `--a-popuplov-*` | 9 | `--a-popuplov-chip-remove-gap-x`, `--a-popuplov-chip-border-radius`, `--a-popuplov-chip-remove-background-color`, `--a-popuplov-chip-remove-border-radius` |
| `--a-searchresults-*` | 9 | `--a-searchresults-border-radius`, `--a-searchresults-count-color`, `--a-searchresults-count-font-size`, `--a-searchresults-count-line-height` |
| `--ut-avatar-*` | 9 | `--ut-avatar-group-icon-size`, `--ut-avatar-group-header-background-color`, `--ut-avatar-group-header-gap`, `--ut-avatar-group-header-padding-x` |
| `--ut-content-*` | 9 | `--ut-content-block-border-color`, `--ut-content-block-border-radius`, `--ut-content-block-font-size`, `--ut-content-block-header-font-family` |
| `--ut-tagcloud-*` | 9 | `--ut-tagcloud-item-gap`, `--ut-tagcloud-item-background-color`, `--ut-tagcloud-item-border-width`, `--ut-tagcloud-item-count-background-color` |
| `--a-help-*` | 8 | `--a-help-dialog-base-font-size`, `--a-help-dialog-base-line-height`, `--a-help-dialog-h1-font-size`, `--a-help-dialog-h2-font-size` |
| `--a-kb-*` | 8 | `--a-kb-shortcut-border-style`, `--a-kb-shortcut-border-width`, `--a-kb-shortcut-font-size`, `--a-kb-shortcut-gap` |
| `--a-treeview-*` | 8 | `--a-treeview-disabled-opacity`, `--a-treeview-drag-helper-padding-x`, `--a-treeview-drag-helper-padding-y`, `--a-treeview-drag-helper-border-width` |
| `--jui-dialog-*` | 8 | `--jui-dialog-title-restore-icon-size`, `--jui-dialog-line-height`, `--jui-dialog-title-close-border-width`, `--jui-dialog-title-restore-height` |
| `--ut-image-*` | 8 | `--ut-image-filter-amount`, `--ut-image-filter-blur-amount`, `--ut-image-filter-grayscale-amount`, `--ut-image-filter-invert-amount` |
| `--ut-login-*` | 8 | `--ut-login-logo-size`, `--ut-login-region-max-width`, `--ut-login-container-item-spacing`, `--ut-login-logo-border-radius` |
| `--ut-tabs-*` | 8 | `--ut-tabs-item-active-background-color`, `--ut-tabs-item-active-highlight-color`, `--ut-tabs-item-icon-spacing`, `--ut-tabs-item-line-height` |
| `--a-iconlist-*` | 7 | `--a-iconlist-font-size`, `--a-iconlist-icon-name-font-size`, `--a-iconlist-icon-name-line-height`, `--a-iconlist-item-height` |
| `--fc3-header-*` | 7 | `--fc3-header-background-color`, `--fc3-header-border-color`, `--fc3-header-text-color`, `--fc3-header-title-font-size` |
| `--a-irr-*` | 6 | `--a-irr-item-spacing`, `--a-irr-alert-font-size`, `--a-irr-alert-line-height`, `--a-irr-alert-text-color` |
| `--a-mdeditor-*` | 6 | `--a-mdeditor-code-height`, `--a-mdeditor-caret`, `--a-mdeditor-empty-text-color`, `--a-mdeditor-font-size` |
| `--a-switch-*` | 6 | `--a-switch-border-width`, `--a-switch-disabled-cursor`, `--a-switch-disabled-opacity`, `--a-switch-toggle-active-transform` |
| `--fc3-day-*` | 6 | `--fc3-day-header-background-color`, `--fc3-day-header-border-color`, `--fc3-day-header-font-size`, `--fc3-day-header-line-height` |
| `--fc3-toolbar-*` | 6 | `--fc3-toolbar-border-radius`, `--fc3-toolbar-title-text-color`, `--fc3-toolbar-background-color`, `--fc3-toolbar-border-color` |
| `--ut-avp-*` | 6 | `--ut-avp-border-color`, `--ut-avp-padding-y`, `--ut-avp-font-size`, `--ut-avp-label-text-color` |
| `--ut-notification-*` | 6 | `--ut-notification-item-line-height`, `--ut-notification-title-font-size`, `--ut-notification-title-font-weight`, `--ut-notification-title-line-height` |
| `--ut-region-*` | 6 | `--ut-region-border-color`, `--ut-region-header-item-spacing`, `--ut-region-header-padding-y`, `--ut-region-header-icon-border-radius` |
| `--a-percent-*` | 5 | `--a-percent-chart-bar-alignment`, `--a-percent-chart-bar-border-radius`, `--a-percent-chart-bar-border-width`, `--a-percent-chart-bar-font-size` |
| `--a-report-*` | 5 | `--a-report-controls-input`, `--a-report-controls-search-width`, `--a-report-highlight-background-color`, `--a-report-highlight-font-weight` |
| `--a-tmv-*` | 5 | `--a-tmv-footer-font-size`, `--a-tmv-footer-line-height`, `--a-tmv-footer-padding-x`, `--a-tmv-footer-padding-y` |
| `--a-toolbar-*` | 5 | `--a-toolbar-sep-border-width`, `--a-toolbar-sep-spacing`, `--a-toolbar-text-color`, `--a-toolbar-disabled-cursor` |
| `--ut-button-*` | 5 | `--ut-button-badge-font-size`, `--ut-button-region-border-color`, `--ut-button-region-title-font-size`, `--ut-button-region-title-font-weight` |
| `--ut-dialog-*` | 5 | `--ut-dialog-region-padding-x`, `--ut-dialog-region-padding-y`, `--ut-dialog-pullout-max-width`, `--ut-dialog-pullout-max-block-size` |
| `--ut-hero-*` | 5 | `--ut-hero-region-column-spacing`, `--ut-hero-region-icon-background-color`, `--ut-hero-region-icon-text-color`, `--ut-hero-region-title-font-size` |
| `--ut-validaiton-*` | 5 | `--ut-validaiton-date-font-size`, `--ut-validaiton-date-text-color`, `--ut-validaiton-icon-margin`, `--ut-validaiton-user-font-size` |
| `--a-bar-*` | 4 | `--a-bar-chart-img-border-radius`, `--a-bar-chart-item-border-color`, `--a-bar-chart-item-border-width`, `--a-bar-chart-item-padding` |
| `--a-cropper-*` | 4 | `--a-cropper-face-background-color`, `--a-cropper-face-border-color`, `--a-cropper-face-width`, `--a-cropper-max-image-size` |
| `--a-menubar-*` | 4 | `--a-menubar-cursor`, `--a-menubar-item-border-radius`, `--a-menubar-disabled-cursor`, `--a-menubar-disabled-opacity` |
| `--a-spinner-*` | 4 | `--a-spinner-container-border-radius`, `--a-spinner-cursor`, `--a-spinner-speed`, `--a-spinner-zindex` |
| `--ut-valiation-*` | 4 | `--ut-valiation-icon-border-radius`, `--ut-valiation-icon-padding`, `--ut-valiation-icon-size`, `--ut-valiation-icon-text-color` |
| `--a-icon-*` | 3 | `--a-icon-large-size`, `--a-icon-medium-size`, `--a-icon-xlarge-size` |
| `--a-splitter-*` | 3 | `--a-splitter-bar-border-width`, `--a-splitter-thumb-border-width`, `--a-splitter-thumb-cursor` |
| `--a-starrating-*` | 3 | `--a-starrating-icon-font-family`, `--a-starrating-star-gap`, `--a-starrating-star-inline-size` |
| `--fc3-today-*` | 3 | `--fc3-today-border-color`, `--fc3-today-highlight-background-color`, `--fc3-today-text-color` |
| `--jui-tooltip-*` | 3 | `--jui-tooltip-border-width`, `--jui-tooltip-maxwidth`, `--jui-tooltip-zindex` |
| `--ut-base-*` | 3 | `--ut-base-line-height`, `--ut-base-font-family`, `--ut-base-font-size` |
| `--ut-fc4-*` | 3 | `--ut-fc4-basic-number-font-size`, `--ut-fc4-basic-number-padding`, `--ut-fc4-block-event-padding` |
| `--ut-file-*` | 3 | `--ut-file-icon-border-radius`, `--ut-file-icon-padding`, `--ut-file-icon-text-color` |
| `--ut-logo-*` | 3 | `--ut-logo-font-size`, `--ut-logo-line-height`, `--ut-logo-text-color` |
| `--ut-nodata-*` | 3 | `--ut-nodata-font-size`, `--ut-nodata-line-height`, `--ut-nodata-padding` |
| `--ut-ojet-*` | 3 | `--ut-ojet-small-font-size`, `--ut-ojet-font-size`, `--ut-ojet-medium-font-size` |
| `--a-addresslist-*` | 2 | `--a-addresslist-line1-font-weight`, `--a-addresslist-line2-font-weight` |
| `--a-column-*` | 2 | `--a-column-toggle-padding-x`, `--a-column-toggle-padding-y` |
| `--a-form-*` | 2 | `--a-form-container-padding-x`, `--a-form-container-padding-y` |
| `--a-love-*` | 2 | `--a-love-apex-hover-animation`, `--a-love-apex-text-color` |
| `--a-qrcode-*` | 2 | `--a-qrcode-aspect-ratio`, `--a-qrcode-max-size` |
| `--a-select-*` | 2 | `--a-select-comboselect-min-width`, `--a-select-comboselect-display-font-size` |
| `--js-sticky-*` | 2 | `--js-sticky-scrollpad-block-end`, `--js-sticky-scrollpad-block-start` |
| `--mg-ctrl-*` | 2 | `--mg-ctrl-group-botton-size`, `--mg-ctrl-icon-size` |
| `--mg-popup-*` | 2 | `--mg-popup-close-button-padding`, `--mg-popup-close-button-size` |
| `--ut-app-*` | 2 | `--ut-app-icon-background-color`, `--ut-app-icon-color` |
| `--ut-cv-*` | 2 | `--ut-cv-subcontent-margin`, `--ut-cv-subtitle-margin` |
| `--ut-diagram-*` | 2 | `--ut-diagram-toolbar-block-size`, `--ut-diagram-icon-font-weight` |
| `--ut-fs-*` | 2 | `--ut-fs-total-font-weight`, `--ut-fs-total-margin` |
| `--ut-no-*` | 2 | `--ut-no-script-padding-x`, `--ut-no-script-padding-y` |
| `--ut-validation-*` | 2 | `--ut-validation-date-line-height`, `--ut-validation-user-line-height` |
| `--a-check-*` | 1 | `--a-check-box-outline-offset` |
| `--a-colorpicker-*` | 1 | `--a-colorpicker-preview-border-color` |
| `--a-cr-*` | 1 | `--a-cr-checkbox-checked-background-color` |
| `--a-dialog-*` | 1 | `--a-dialog-move-handle-height` |
| `--a-media-*` | 1 | `--a-media-block-spacing` |
| `--a-palette-*` | 1 | `--a-palette-warning-text` |
| `--a-spectrum-*` | 1 | `--a-spectrum-slider-thickness` |
| `--a-tooltip-*` | 1 | `--a-tooltip-line-height` |
| `--comboselect-counter-*` | 1 | `--comboselect-counter-border-color` |
| `--fc3-highlight-*` | 1 | `--fc3-highlight-background-color` |
| `--fc5-header-*` | 1 | `--fc5-header-title-font-weight` |
| `--fc5-toolbar-*` | 1 | `--fc5-toolbar-padding-x` |
| `--jui-overlay-*` | 1 | `--jui-overlay-opacity` |
| `--mg-top-*` | 1 | `--mg-top-left-ctrl-margin-x` |
| `--prism-background-*` | 1 | `--prism-background` |
| `--ut-datepicker-*` | 1 | `--ut-datepicker-border-color` |
| `--ut-html-*` | 1 | `--ut-html-font-size` |
| `--ut-link-*` | 1 | `--ut-link-text-decoration` |
| `--ut-overlay-*` | 1 | `--ut-overlay-background-color` |
| `--ut-pillbutton-*` | 1 | `--ut-pillbutton-min-inline-size` |
| `--ut-prepost-*` | 1 | `--ut-prepost-text-color` |
| `--ut-pwa-*` | 1 | `--ut-pwa-dialog-border-top-radius` |
| `--ut-table-*` | 1 | `--ut-table-border-color` |

### 11.1 Hooks der Kernbereiche (UT-Shell, Regionen, Buttons, Felder, Menüs, Reports, Cards, Badges, Alerts, Tabs)

| Hook | Refs | Fallback | genutzt als | Flags |
|---|---:|---|---|---|
| `--a-base-font-weight-bold` | 73 | `700` | `--a-button-font-weight`, `font-weight`, `--ut-linkslist-label-font-weight` | ◆ H |
| `--a-base-font-weight-heavy` | 10 | `900` | `font-weight`, `--ut-megamenu-label-font-weight`, `--ut-text-heading-2xl-font-weight` | H |
| `--a-base-font-weight-light` | 1 | `300` | `font-weight` | H |
| `--a-base-font-weight-normal` | 7 | `400` | `font-weight`, `--a-field-display-font-weight`, `--ut-alternate-heading-font-weight` | ◇ H |
| `--a-base-font-weight-ultralight` | 1 | `100` | `font-weight` | H |
| `--a-base-html-font-size` | 1 | — | `font-size` | H |
| `--a-base-link-active-text-color` | 2 | `var(--a-base-link-text-color)` | `--a-button-active-text-color`, `--a-button-focus-text-color` | H |
| `--a-base-link-decoration` | 2 | `underline` | `-webkit-text-decoration`, `text-decoration` | H |
| `--a-base-link-focus-text-decoration` | 2 | `underline` | `-webkit-text-decoration`, `text-decoration` | H |
| `--a-base-link-hover-decoration` | 2 | `underline` | `-webkit-text-decoration`, `text-decoration` | H |
| `--a-base-link-hover-text-color` | 1 | `var(--a-base-link-text-color)` | `--a-button-hover-text-color` | H |
| `--a-base-link-hover-text-decoration` | 2 | `underline` | `-webkit-text-decoration`, `text-decoration` | H |
| `--a-button-cursor` | 19 | `pointer` | `cursor` | H |
| `--a-button-disabled-cursor` | 3 | `default` | `cursor` | H |
| `--a-button-disabled-opacity` | 3 | `0.5` | `opacity` | H |
| `--a-button-focus-shadow` | 6 | — | `--a-button-state-shadow`, `--a-fs-toggle-shadow` | H |
| `--a-button-gap-y` | 1 | `8px` | `margin-block-start` | H |
| `--a-button-icon-color` | 1 | — | `color` | H ☆26 |
| `--a-button-inline-size` | 2 | `32px` | `--a-fs-control-input-max-width` | H |
| `--a-button-link-line-height` | 1 | `16px` | `line-height` | H |
| `--a-button-link-size` | 1 | `16px` | `font-size` | H |
| `--a-button-link-text-color` | 1 | `var(--a-palette-primary)` | `color` | H |
| `--a-button-margin-inline-x` | 1 | `0.5rem` | `margin-inline-start` | H ☆26 |
| `--a-button-paddiny-y` | 2 | `0.5rem` | `min-height` | H |
| `--a-button-primary-background-color` | 1 | `#0572CE` | `--a-button-background-color` | H |
| `--a-button-primary-text-color` | 1 | `#fff` | `--a-button-text-color` | H |
| `--a-button-state-count-background-color` | 2 | `var(--a-button-type-count-background-color,…` | `background-color`, `color` | H ☆26 |
| `--a-button-state-count-text-color` | 2 | `var(--a-button-type-count-text-color, var(-…` | `color`, `background-color` | H ☆26 |
| `--a-button-type-count-background-color` | 2 | `var(--a-button-count-background-color, tran…` | `background-color`, `color` | H ☆26 |
| `--a-button-type-count-text-color` | 2 | `var(--a-button-count-text-color, inherit)` | `color`, `background-color` | H ☆26 |
| `--a-checkbox-active-text-color` | 2 | — | `--a-checkbox-text-color` | H |
| `--a-checkbox-cursor` | 8 | `pointer` | `cursor` | H |
| `--a-checkbox-disabled-cursor` | 4 | `default` | `cursor` | H |
| `--a-checkbox-disabled-hover-background-color` | 1 | `unset` | `--a-checkbox-hover-background-color` | H |
| `--a-checkbox-disabled-hover-opacity` | 1 | `0` | `--a-checkbox-hover-opacity` | H |
| `--a-checkbox-disabled-hover-text-color` | 1 | `unset` | `--a-checkbox-hover-text-color` | H |
| `--a-checkbox-disabled-opacity` | 4 | `0.5` | `opacity` | H |
| `--a-checkbox-icon-font-family` | 5 | `"apex-core-font"` | `font-family` | H |
| `--a-checkbox-icon-font-weight` | 5 | `normal` | `font-weight` | H |
| `--a-checkbox-icon-transition` | 5 | `0.1s ease` | `transition` | H |
| `--a-checkbox-min-click-size` | 2 | `24px` | `min-inline-size`, `min-block-size` | H |
| `--a-checkbox-outline-color` | 1 | `-webkit-focus-ring-color` | `outline` | H |
| `--a-cv-badge-font-weight` | 1 | `700` | `font-weight` | H |
| `--a-cv-badge-line-height` | 1 | `1` | `line-height` | H |
| `--a-cv-badge-text-color` | 1 | — | `color` | H |
| `--a-cv-body-background-color` | 1 | — | `background-color` | H |
| `--a-cv-focus-background-color` | 1 | — | `--a-cv-state-background-color` | H |
| `--a-cv-focus-outline-offset` | 1 | `0` | `outline-offset` | H |
| `--a-cv-focus-shadow` | 1 | — | `--a-cv-state-shadow` | H |
| `--a-cv-focus-text-color` | 1 | — | `--a-cv-state-text-color` | H |
| `--a-cv-font-size` | 1 | `inherit` | `font-size` | H |
| `--a-cv-grid-footer-background-color` | 1 | `transparent` | `background-color` | H |
| `--a-cv-grid-footer-border-color` | 1 | `transparent` | `border-top-color` | H |
| `--a-cv-grid-footer-border-width` | 1 | `0` | `border-top-width` | H |
| `--a-cv-grid-footer-font-size` | 1 | `var(--a-cv-font-size, inherit)` | `font-size` | H |
| `--a-cv-grid-footer-line-height` | 1 | `var(--a-cv-line-height, inherit)` | `line-height` | H |
| `--a-cv-header-item-spacing-y` | 1 | `12px` | `margin-block-end` | H |
| `--a-cv-header-text-color` | 1 | — | `color` | H |
| `--a-cv-icon-background-image` | 1 | — | `background-image` | H |
| `--a-cv-initials-background-image` | 1 | — | `background-image` | H |
| `--a-cv-initials-padding` | 1 | — | `padding` | H |
| `--a-cv-line-height` | 1 | `inherit` | `line-height` | H |
| `--a-cv-maincontent-text-color` | 1 | — | `color` | H |
| `--a-cv-order-actions` | 1 | `4` | `order` | H |
| `--a-cv-order-body` | 1 | `3` | `order` | H |
| `--a-cv-order-header` | 1 | `1` | `order` | H |
| `--a-cv-order-margin` | 1 | `1rem` | `margin-block-end` | H |
| `--a-cv-placeholder-color` | 3 | `var(--a-cv-border-color)` | `background-color` | H |
| `--a-cv-selected-background-color` | 1 | `var(--a-palette-primary-shade, #ecf3ff)` | `--a-cv-state-background-color` | H |
| `--a-cv-selected-text-color` | 1 | — | `--a-cv-state-text-color` | H |
| `--a-cv-title-font-weight` | 1 | `700` | `font-weight` | H |
| `--a-cv-title-text-color` | 2 | — | `color` | H |
| `--a-cv-type-background-color` | 1 | `var(--a-cv-background-color, transparent)` | `background-color` | H |
| `--a-cv-type-border-color` | 1 | `var(--a-cv-border-color)` | `border-color` | H |
| `--a-cv-type-shadow` | 1 | `var(--a-cv-shadow, none)` | `box-shadow` | H |
| `--a-cv-type-text-color` | 1 | `var(--a-cv-text-color, inherit)` | `color` | H |
| `--a-dialog-move-handle-height` | 1 | `12px` | `height` | H |
| `--a-field-disabled-opacity` | 6 | `0.5` | `opacity` | H |
| `--a-field-display-font-size` | 2 | `var(--a-field-input-font-size, 0.75rem)` | `font-size` | H |
| `--a-field-icon-size` | 4 | `16px` | `--a-popuplov-search-input-padding-inline-start`, `--a-icon-size`, `--a-popuplov-search-icon-margin-inline-start` | H |
| `--a-field-icon-spacing` | 4 | `8px` | `--a-popuplov-search-input-padding-inline-start`, `--a-popuplov-search-icon-margin-inline-start`, `--a-popuplov-search-icon-left` | H |
| `--a-field-input-counter-error-text-color` | 1 | `var(--a-palette-danger)` | `color` | H |
| `--a-field-input-counter-font-size` | 1 | `10px` | `font-size` | H |
| `--a-field-input-counter-warning-text-color` | 1 | `var(--a-palette-warning)` | `color` | H |
| `--a-field-input-focus-text-color` | 6 | — | `--a-field-input-state-text-color`, `--ut-field-input-icon-color` | H |
| `--a-field-input-font-weight` | 11 | `400` | `font-weight`, `--a-filedrop-heading-font-weight` | H |
| `--a-field-input-hover-border-color` | 4 | — | `--a-field-input-state-border-color` | H |
| `--a-field-input-hover-text-color` | 5 | — | `--a-field-input-state-text-color`, `--ut-field-input-icon-color` | H |
| `--a-field-input-icon-padding-x` | 4 | `4px` | `padding-inline-start`, `padding-inline-end` | H |
| `--a-field-input-icon-padding-y` | 4 | `4px` | `min-block-size`, `padding-block-start`, `padding-block-end` | H |
| `--a-field-input-state-border-style` | 1 | `dashed` | `border-style` | H |
| `--a-field-input-state-shadow` | 5 | `var(--a-field-input-shadow)` | `box-shadow` | H |
| `--a-field-placeholder-opacity` | 5 | `0.6` | `opacity` | H |
| `--a-field-placeholder-text-color` | 4 | `currentColor` | `color` | H |
| `--a-form-container-padding-x` | 6 | `8px` | `padding-inline-start`, `padding-inline-end`, `padding-inline` | H |
| `--a-form-container-padding-y` | 3 | `4px` | `padding-block-start`, `padding-block-end`, `padding-block` | H |
| `--a-gv-aggregate-background-color` | 1 | `#F4F4F4` | `background-color` | H |
| `--a-gv-body-background-color` | 1 | — | `background-color` | H |
| `--a-gv-cell-border-width` | 15 | `1px` | `border-bottom-width`, `border-top-width`, `box-shadow` | H |
| `--a-gv-cell-font-size` | 1 | — | `font-size` | H |
| `--a-gv-cell-frozen-border-width` | 2 | `3px` | `border-right-width`, `border-left-width` | H |
| `--a-gv-cell-line-height` | 1 | — | `line-height` | H |
| `--a-gv-deleted-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-gv-disabled-cursor` | 1 | `default` | `cursor` | H |
| `--a-gv-disabled-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-gv-focus-outline` | 1 | `auto 1px var(--a-palette-primary)` | `outline` | H |
| `--a-gv-focus-outline-offset` | 1 | `0` | `outline-offset` | H |
| `--a-gv-footer-border-width` | 1 | `var(--a-gv-cell-border-width, 1px)` | `border-top-width` | H |
| `--a-gv-frozen-last-border-width` | 4 | `4px` | `border-right-width`, `border-left-width` | H |
| `--a-gv-frozen-zindex` | 1 | `100` | `z-index` | H |
| `--a-gv-header-cell-border-width` | 4 | `1px` | `border-width`, `border-left-width`, `box-shadow` | H |
| `--a-gv-header-cell-font-size` | 3 | — | `font-size` | H |
| `--a-gv-header-cell-font-weight` | 4 | `var(--a-base-font-weight-bold, 700)` | `font-weight` | H |
| `--a-gv-header-cell-line-height` | 3 | — | `line-height` | H |
| `--a-gv-header-has-selected-background-color` | 2 | `rgba(0, 0, 0, .1)` | `--a-gv-header-background-color`, `--a-gv-background-color` | H |
| `--a-gv-header-selected-background-color` | 2 | `var(--a-gv-selected-background-color, var(-…` | `--a-gv-header-background-color`, `--a-gv-background-color` | H |
| `--a-gv-header-text-color` | 5 | `#404040` | `color` | H |
| `--a-gv-null-header-background-color` | 1 | `transparent` | `background-color` | H |
| `--a-gv-null-header-hover-background-color` | 1 | `transparent` | `background-color` | H |
| `--a-gv-pagination-button-border-radius` | 1 | `2px` | `border-radius` | H |
| `--a-gv-pagination-button-border-width` | 5 | `0px` | `padding-block-start`, `padding-block-end`, `padding-inline-start` | H |
| `--a-gv-pagination-button-min-width` | 1 | `24px` | `min-inline-size` | H |
| `--a-gv-pagination-button-selected-background-color` | 1 | `#E0E0E0` | `--a-gv-pagination-button-background-color` | H |
| `--a-gv-pagination-button-selected-text-color` | 1 | `var(--a-gv-pagination-button-text-color)` | `--a-gv-pagination-button-text-color` | H |
| `--a-gv-row-disabled-background-color` | 2 | `#f0f0f0` | `--a-gv-background-color`, `background-color` | H |
| `--a-gv-scroll-pad-start` | 1 | `0` | `scroll-padding-inline-start` | H |
| `--a-gv-selected-background-color` | 12 | `var(--a-palette-primary-shade)` | `--a-gv-background-color`, `background-color`, `--a-gv-header-background-color` | ◇ H |
| `--a-gv-selected-text-color` | 7 | `var(--a-gv-text-color)` | `--a-gv-text-color`, `color`, `--ut-medialist-item-text-color` | H |
| `--a-icon-large-size` | 1 | `32px` | `--a-icon-size` | H |
| `--a-icon-medium-size` | 1 | `24px` | `--a-icon-size` | H |
| `--a-icon-xlarge-size` | 1 | `48px` | `--a-icon-size` | H |
| `--a-iconlist-font-size` | 1 | `12px` | `font-size` | H |
| `--a-iconlist-icon-name-font-size` | 1 | `11px` | `font-size` | H |
| `--a-iconlist-icon-name-line-height` | 1 | `14px` | `line-height` | H |
| `--a-iconlist-item-height` | 1 | — | `height` | H |
| `--a-iconlist-item-width` | 1 | `128px` | `width` | H |
| `--a-iconlist-label-spacing` | 1 | `4px` | `margin-block-start` | H |
| `--a-iconlist-line-height` | 1 | `16px` | `line-height` | H |
| `--a-irr-alert-font-size` | 1 | `12px` | `font-size` | H |
| `--a-irr-alert-line-height` | 1 | `16px` | `line-height` | H |
| `--a-irr-alert-text-color` | 1 | `color-mix(in srgb, currentColor 65%, transp…` | `color` | H |
| `--a-irr-item-spacing` | 25 | `var(--a-toolbar-item-spacing, 8px)` | `padding`, `margin`, `padding-inline` | H |
| `--a-irr-microphone-listening-color` | 1 | — | `color` | H |
| `--a-irr-toolbar-search-transition` | 1 | `flex-grow 0.1s ease` | `transition` | H |
| `--a-menu-callout-border-width` | 16 | `var(--a-menu-border-width, 1px)` | `border-width`, `block-size`, `inline-size` | H |
| `--a-menu-cursor` | 8 | `pointer` | `cursor` | H |
| `--a-menu-disabled-cursor` | 1 | `default` | `cursor` | H |
| `--a-menu-disabled-opacity` | 3 | `0.5` | `opacity` | H |
| `--a-menu-item-border-radius` | 2 | — | `border-radius` | H |
| `--a-menu-sep-border-width` | 5 | `1px` | `border-top-width`, `border-bottom-width` | H |
| `--a-menu-sep-spacing-x` | 3 | `0` | `margin-inline`, `margin-inline-start`, `margin-inline-end` | H |
| `--a-menu-transform` | 1 | `translate3d(0, 0, 0)` | `transform` | H |
| `--a-menu-zindex` | 1 | `2010` | `z-index` | H |
| `--a-menubar-cursor` | 2 | `pointer` | `cursor` | H |
| `--a-menubar-disabled-cursor` | 1 | `default` | `cursor` | H |
| `--a-menubar-disabled-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-menubar-item-border-radius` | 2 | `0px` | `border-radius` | H |
| `--a-palette-warning-text` | 1 | — | `color` | H |
| `--a-report-controls-input` | 3 | — | `height` | H |
| `--a-report-controls-search-width` | 3 | `210px` | `width` | H |
| `--a-report-highlight-background-color` | 1 | — | `background-color` | H |
| `--a-report-highlight-font-weight` | 1 | `bolder` | `font-weight` | H |
| `--a-report-highlight-text-color` | 1 | `red` | `color` | H |
| `--a-switch-border-width` | 2 | `0px` | `--a-switch-toggled-offset`, `border-width` | H |
| `--a-switch-disabled-cursor` | 1 | `default` | `cursor` | H |
| `--a-switch-disabled-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-switch-toggle-active-transform` | 1 | `scale(0.75)` | `transform` | H |
| `--a-switch-toggle-border-radius` | 1 | `var(--a-switch-toggle-width, 20px)` | `border-radius` | H |
| `--a-switch-toggle-border-width` | 1 | `0px` | `border-width` | H |
| `--a-toolbar-disabled-cursor` | 1 | `default` | `cursor` | H |
| `--a-toolbar-disabled-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-toolbar-sep-border-width` | 4 | `1px` | `border-inline-end-width`, `border-right-width`, `border-left-width` | H |
| `--a-toolbar-sep-spacing` | 4 | `var(--a-toolbar-item-spacing, 8px)` | `padding-inline-end`, `margin-inline-end`, `padding-block-end` | H |
| `--a-toolbar-text-color` | 2 | — | `color` | H |
| `--a-tooltip-line-height` | 2 | `1.5` | `line-height` | H |
| `--a-treeview-disabled-opacity` | 2 | `0.5` | `opacity` | H |
| `--a-treeview-drag-helper-border-width` | 1 | `1px` | `border-width` | H |
| `--a-treeview-drag-helper-opacity` | 1 | `1` | `opacity` | H |
| `--a-treeview-drag-helper-padding-x` | 2 | `var(--a-treeview-node-padding-x, 4px)` | `padding-inline-start`, `padding-inline-end` | H |
| `--a-treeview-drag-helper-padding-y` | 2 | `var(--a-treeview-node-padding-y, 4px)` | `padding-block-start`, `padding-block-end` | H |
| `--a-treeview-drag-helper-text-color` | 1 | — | `color` | H |
| `--a-treeview-toggle-opacity` | 1 | `0.5` | `opacity` | H |
| `--a-treeview-toggle-selected-text-color` | 1 | `var(--a-treeview-node-selected-text-color)` | `color` | H |
| `--u-space-0` | 1 | `0rem` | `gap` | H ☆26 |
| `--u-space-0_5` | 1 | `0.125rem` | `gap` | H ☆26 |
| `--u-space-1` | 1 | `0.25rem` | `gap` | H ☆26 |
| `--u-space-1_5` | 1 | `0.375rem` | `gap` | H ☆26 |
| `--u-space-2` | 1 | `0.5rem` | `gap` | H ☆26 |
| `--u-space-2_5` | 1 | `0.625rem` | `gap` | H ☆26 |
| `--u-space-3` | 1 | `0.75rem` | `gap` | H ☆26 |
| `--u-space-3_5` | 1 | `0.875rem` | `gap` | H ☆26 |
| `--u-space-4` | 1 | `1rem` | `gap` | H ☆26 |
| `--u-space-5` | 1 | `1.25rem` | `gap` | H ☆26 |
| `--u-space-6` | 1 | `1.5rem` | `gap` | H ☆26 |
| `--u-space-7` | 1 | `1.75rem` | `gap` | H ☆26 |
| `--u-space-8` | 1 | `2rem` | `gap` | H ☆26 |
| `--u-space-9` | 1 | `2.25rem` | `gap` | H ☆26 |
| `--u-space-10` | 1 | `2.5rem` | `gap` | H ☆26 |
| `--u-space-px` | 1 | `1px` | `gap` | H ☆26 |
| `--ut-alert-background-color` | 1 | `var(--ut-component-background-color)` | `background-color` | H |
| `--ut-alert-border-color` | 1 | `var(--ut-component-border-color)` | `border-color` | H |
| `--ut-alert-horizontal-border-radius` | 1 | `.25rem` | `--ut-alert-border-radius` | H |
| `--ut-alert-horizontal-icon-padding` | 1 | `1rem` | `--ut-alert-icon-padding` | H |
| `--ut-alert-horizontal-icon-size` | 1 | `2rem` | `--ut-alert-icon-size` | H |
| `--ut-alert-margin` | 3 | `1rem` | `margin-block-end`, `margin-block-start` | H |
| `--ut-alert-offset` | 4 | `1rem` | `top`, `inset-inline-end`, `left` | H |
| `--ut-alert-text-color` | 1 | `var(--ut-component-text-default-color)` | `color` | H |
| `--ut-alert-title-margin` | 1 | — | `margin` | H |
| `--ut-alert-title-text-color` | 1 | — | `color` | H |
| `--ut-alert-type-border-color` | 1 | `var(--ut-alert-border-color, var(--ut-compo…` | `border-color` | H |
| `--ut-alert-type-border-radius` | 5 | `var(--ut-alert-border-radius, var(--ut-comp…` | `border-radius`, `border-top-left-radius`, `border-bottom-left-radius` | H |
| `--ut-alert-type-border-width` | 1 | `var(--ut-alert-border-width, var(--ut-compo…` | `border-width` | H |
| `--ut-alert-type-box-shadow` | 1 | `var(--ut-alert-box-shadow, none)` | `box-shadow` | H |
| `--ut-alert-wizard-border-radius` | 1 | `.125rem` | `--ut-alert-border-radius` | H |
| `--ut-alert-wizard-icon-size` | 1 | `4rem` | `--ut-alert-icon-size` | H |
| `--ut-app-icon-background-color` | 1 | `var(--ut-component-icon-background-color)` | `background-color` | H |
| `--ut-app-icon-color` | 1 | `var(--ut-component-icon-color)` | `color` | H |
| `--ut-avatar-group-header-background-color` | 1 | — | `background-color` | H ☆26 |
| `--ut-avatar-group-header-gap` | 1 | `1rem` | `gap` | H ☆26 |
| `--ut-avatar-group-header-padding-x` | 1 | — | `padding-inline` | H ☆26 |
| `--ut-avatar-group-header-padding-y` | 1 | `0.5rem` | `padding-block` | H ☆26 |
| `--ut-avatar-group-header-text-color` | 1 | — | `color` | H ☆26 |
| `--ut-avatar-group-icon-size` | 4 | `var(--ut-avatar-icon-font-size, 1.5rem)` | `font-size`, `background-size`, `min-inline-size` | H ☆26 |
| `--ut-avatar-group-title-font-size` | 1 | `1.25rem` | `font-size` | H ☆26 |
| `--ut-avatar-group-title-font-weight` | 1 | `700` | `font-weight` | H ☆26 |
| `--ut-avatar-group-title-line-height` | 1 | `1.5rem` | `line-height` | H ☆26 |
| `--ut-badge-border-color` | 1 | `var(--ut-badge-background-color)` | `border-color` | H |
| `--ut-badge-danger-background-color` | 1 | `var(--a-palette-danger)` | `--ut-badge-background-color` | H |
| `--ut-badge-danger-text-color` | 1 | `var(--a-palette-danger-contrast)` | `--ut-badge-text-color` | H |
| `--ut-badge-display` | 2 | `inline-flex` | `display` | H |
| `--ut-badge-font-stretch` | 1 | — | `font-stretch` | H |
| `--ut-badge-gap` | 1 | `0.25rem` | `gap` | H |
| `--ut-badge-info-background-color` | 1 | `var(--a-palette-info)` | `--ut-badge-background-color` | H |
| `--ut-badge-info-text-color` | 1 | `var(--a-palette-info-contrast)` | `--ut-badge-text-color` | H |
| `--ut-badge-label-font-weight` | 1 | `var(--a-base-font-weight-normal, 400)` | `font-weight` | H |
| `--ut-badge-label-opacity` | 1 | — | `opacity` | H |
| `--ut-badge-list-gap` | 1 | `0.25rem` | `gap` | H |
| `--ut-badge-rounded-border-radius` | 1 | `.375rem` | `--ut-badge-border-radius` | H ☆26 |
| `--ut-badge-shrink` | 1 | `0` | `flex-shrink` | H |
| `--ut-badge-subtle-background-color` | 1 | — | `--ut-badge-background-color` | H |
| `--ut-badge-subtle-danger-background-color` | 1 | `var(--a-palette-danger-shade)` | `--ut-badge-background-color` | H |
| `--ut-badge-subtle-danger-text-color` | 1 | `var(--a-palette-danger)` | `--ut-badge-text-color` | H |
| `--ut-badge-subtle-info-background-color` | 1 | `var(--a-palette-info-shade)` | `--ut-badge-background-color` | H |
| `--ut-badge-subtle-info-text-color` | 1 | `var(--a-palette-info)` | `--ut-badge-text-color` | H |
| `--ut-badge-subtle-success-background-color` | 1 | `var(--a-palette-success-shade)` | `--ut-badge-background-color` | H |
| `--ut-badge-subtle-success-text-color` | 1 | `var(--a-palette-success)` | `--ut-badge-text-color` | H |
| `--ut-badge-subtle-text-color` | 1 | — | `--ut-badge-text-color` | H |
| `--ut-badge-subtle-warning-background-color` | 1 | `var(--a-palette-warning-shade)` | `--ut-badge-background-color` | H |
| `--ut-badge-subtle-warning-text-color` | 1 | `var(--a-palette-warning)` | `--ut-badge-text-color` | H |
| `--ut-badge-success-background-color` | 1 | `var(--a-palette-success)` | `--ut-badge-background-color` | H |
| `--ut-badge-success-text-color` | 1 | `var(--a-palette-success-contrast)` | `--ut-badge-text-color` | H |
| `--ut-badge-warning-background-color` | 1 | `var(--a-palette-warning)` | `--ut-badge-background-color` | H |
| `--ut-badge-warning-text-color` | 1 | `var(--a-palette-warning-contrast)` | `--ut-badge-text-color` | H |
| `--ut-badgelist-item-border-color` | 1 | `var(--ut-component-border-color)` | `background-color` | H |
| `--ut-badgelist-item-border-width` | 5 | `var(--ut-component-border-width, 1px)` | `height`, `bottom`, `width` | H |
| `--ut-badgelist-item-padding-x` | 2 | `0.75rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-badgelist-item-padding-y` | 2 | `0.75rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-badgelist-label-font-size-large` | 2 | `0.875rem` | `--ut-badgelist-label-font-size` | H |
| `--ut-badgelist-label-font-size-medium` | 2 | `0.75rem` | `--ut-badgelist-label-font-size` | H |
| `--ut-badgelist-label-font-size-small` | 2 | `0.625rem` | `--ut-badgelist-label-font-size` | H |
| `--ut-badgelist-label-font-size-xlarge` | 2 | `1rem` | `--ut-badgelist-label-font-size` | H |
| `--ut-badgelist-label-font-size-xxlarge` | 2 | `1.25rem` | `--ut-badgelist-label-font-size` | H |
| `--ut-badgelist-label-margin-y` | 1 | `0.5rem` | `margin-block-start` | H |
| `--ut-badgelist-label-text-color` | 2 | `var(--ut-component-text-title-color)` | `color` | H |
| `--ut-badgelist-text-color` | 1 | `var(--ut-component-text-default-color)` | `color` | H |
| `--ut-badgelist-value-border-radius` | 2 | `8rem` | `border-radius` | H |
| `--ut-badgelist-value-border-width` | 1 | `var(--ut-component-border-width, 1px)` | `border-width` | H |
| `--ut-badgelist-value-font-size-large` | 1 | `1.25rem` | `--ut-badgelist-value-font-size` | H |
| `--ut-badgelist-value-font-size-medium` | 1 | `1rem` | `--ut-badgelist-value-font-size` | H |
| `--ut-badgelist-value-font-size-small` | 1 | `0.75rem` | `--ut-badgelist-value-font-size` | H |
| `--ut-badgelist-value-font-size-xlarge` | 1 | `1.5rem` | `--ut-badgelist-value-font-size` | H |
| `--ut-badgelist-value-font-size-xxlarge` | 1 | `2rem` | `--ut-badgelist-value-font-size` | H |
| `--ut-badgelist-value-font-weight` | 1 | `var(--a-base-font-weight-semibold, 500)` | `font-weight` | H |
| `--ut-badgelist-value-size-large` | 1 | `4rem` | `--ut-badgelist-value-size` | H |
| `--ut-badgelist-value-size-medium` | 1 | `3rem` | `--ut-badgelist-value-size` | H |
| `--ut-badgelist-value-size-small` | 1 | `2rem` | `--ut-badgelist-value-size` | H |
| `--ut-badgelist-value-size-xlarge` | 1 | `6rem` | `--ut-badgelist-value-size` | H |
| `--ut-badgelist-value-size-xxlarge` | 1 | `8rem` | `--ut-badgelist-value-size` | H |
| `--ut-badgelist-wrap-border-radius` | 2 | `0.25rem` | `border-radius` | H |
| `--ut-badgelist-wrap-hover-background-color` | 1 | `var(--ut-component-border-color)` | `background-color` | H |
| `--ut-badgelist-wrap-padding` | 2 | `0.75rem` | `padding`, `margin` | H |
| `--ut-base-font-family` | 1 | `var(--a-base-font-family, sans-serif)` | `font-family` | H |
| `--ut-base-font-size` | 1 | `1rem` | `font-size` | ◇ H |
| `--ut-base-line-height` | 2 | `1rem` | `line-height`, `margin-block-end` | ◇ H |
| `--ut-body-actions-border-color` | 3 | `var(--ut-component-border-color)` | `box-shadow`, `border-color` | H |
| `--ut-body-actions-border-width` | 8 | `1px` | `box-shadow`, `padding-block-start`, `padding-block-end` | H |
| `--ut-body-actions-toggle-offset` | 1 | `0` | `margin-block-start` | H |
| `--ut-body-actionstoggle-padding-y` | 2 | `0.625rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-body-actionstoggle-text-color` | 1 | `var(--ut-body-actions-text-color)` | `color` | H |
| `--ut-body-content-width` | 1 | `100%` | `width` | H |
| `--ut-body-info-background-color` | 2 | `var(--ut-body-title-background-color)` | `background-color` | H |
| `--ut-body-info-text-color` | 1 | `var(--ut-body-title-text-color)` | `color` | H |
| `--ut-body-main-background-color` | 1 | — | `background-color` | H |
| `--ut-body-main-content-background-color` | 1 | — | `background-color` | H |
| `--ut-body-nav-border-width` | 2 | `1px` | `box-shadow` | H |
| `--ut-body-nav-scrollbar-size` | 2 | `0.25rem` | `width`, `height` | H |
| `--ut-body-nav-scrollbar-thumb-box-shadow` | 1 | — | `box-shadow` | H |
| `--ut-body-sidebar-border-color` | 2 | `var(--ut-component-border-color)` | `box-shadow` | H |
| `--ut-body-sidebar-border-width` | 2 | `1px` | `box-shadow` | H |
| `--ut-body-title-border-color` | 1 | — | `border-color` | H |
| `--ut-breadcrumb-item-active-font-weight` | 1 | `var(--a-base-font-weight-semibold, 500)` | `font-weight` | H |
| `--ut-breadcrumb-item-font-size` | 4 | `0.875rem` | `font-size` | H |
| `--ut-breadcrumb-item-font-weight` | 1 | `400` | `font-weight` | H |
| `--ut-breadcrumb-item-line-height` | 4 | `1rem` | `line-height` | H |
| `--ut-breadcrumb-item-sep-opacity` | 1 | `0.5` | `opacity` | H |
| `--ut-breadcrumb-item-sep-spacing` | 3 | `0.5rem` | `margin-inline-start`, `margin-inline-end` | H |
| `--ut-breadcrumb-region-gap` | 2 | `0.75rem` | `-moz-column-gap`, `column-gap` | H |
| `--ut-breadcrumb-title-font-family` | 1 | — | `font-family` | H |
| `--ut-breadcrumb-title-font-size` | 1 | `2rem` | `font-size` | H |
| `--ut-breadcrumb-title-line-height` | 2 | `3rem` | `line-height`, `min-height` | H |
| `--ut-button-badge-font-size` | 1 | `0.6875rem` | `font-size` | H |
| `--ut-button-region-border-color` | 1 | `var(--ut-component-border-color)` | `border-color` | H |
| `--ut-button-region-title-font-size` | 1 | `1.25rem` | `font-size` | H |
| `--ut-button-region-title-font-weight` | 1 | `normal` | `font-weight` | H |
| `--ut-button-region-title-line-height` | 1 | `1` | `line-height` | H |
| `--ut-content-block-border-color` | 1 | `var(--ut-component-border-color)` | `border-color` | H |
| `--ut-content-block-border-radius` | 1 | `var(--ut-region-border-radius)` | `border-radius` | H |
| `--ut-content-block-font-size` | 1 | `0.875rem` | `font-size` | H |
| `--ut-content-block-header-font-family` | 1 | — | `font-family` | H |
| `--ut-content-block-header-line-height` | 1 | `1.5` | `line-height` | H |
| `--ut-content-block-light-background-color` | 1 | `var(--ut-component-background-color)` | `--ut-content-block-background-color` | H |
| `--ut-content-block-line-height` | 1 | `1.25rem` | `line-height` | H |
| `--ut-content-block-shadow-background-color` | 1 | `var(--ut-component-badge-background-color)` | `--ut-content-block-background-color` | H |
| `--ut-content-block-text-color` | 1 | — | `color` | H |
| `--ut-dialog-pullout-max-block-size` | 1 | `90dvh` | `max-block-size` | H ☆26 |
| `--ut-dialog-pullout-max-width` | 3 | `90dvw` | `max-width` | H |
| `--ut-dialog-region-padding-x` | 4 | `1rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-dialog-region-padding-y` | 4 | `1rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-dialog-spinner-color` | 1 | — | `color` | H |
| `--ut-field-assistance-font-size` | 2 | `0.6875rem` | `font-size` | H |
| `--ut-field-assistance-line-height` | 2 | `1rem` | `line-height` | H |
| `--ut-field-assistance-margin-y` | 2 | `0.25rem` | `margin-block-start` | H |
| `--ut-field-disabled-opacity` | 1 | `var(--a-field-disabled-opacity, 0.5)` | `opacity` | H |
| `--ut-field-error-font-size` | 1 | `var(--ut-field-assistance-font-size, 0.6875…` | `font-size` | H |
| `--ut-field-error-line-height` | 1 | `var(--ut-field-assistance-line-height, 1rem)` | `line-height` | H |
| `--ut-field-error-margin-y` | 1 | `var(--ut-field-assistance-margin-y, 0.25rem)` | `margin-block-start` | H |
| `--ut-field-fixed-min-width` | 1 | `10rem` | `width` | H |
| `--ut-field-inline-help-font-size` | 1 | `0.6875rem` | `font-size` | H |
| `--ut-field-inline-help-line-height` | 1 | `1rem` | `line-height` | H |
| `--ut-field-inline-help-spacing` | 1 | `0.25rem` | `margin-block-start` | H |
| `--ut-field-input-icon-size` | 8 | `var(--a-icon-size, 1rem)` | `--ut-field-input-icon-offset`, `--ut-field-input-min-height`, `font-size` | H |
| `--ut-field-item-min-height` | 1 | `calc(var(--ut-field-label-line-height, 1rem…` | `min-height` | H |
| `--ut-field-label-cursor` | 1 | `pointer` | `cursor` | H |
| `--ut-field-label-font-weight` | 1 | — | `font-weight` | H |
| `--ut-field-required-font-size` | 1 | `var(--ut-field-assistance-font-size, 0.6875…` | `font-size` | H |
| `--ut-field-required-line-height` | 1 | `var(--ut-field-assistance-line-height, 1rem)` | `line-height` | H |
| `--ut-field-required-margin-y` | 1 | `var(--ut-field-assistance-margin-y, 0.25rem)` | `margin-block-start` | H |
| `--ut-field-required-text-color` | 1 | `var(--ut-component-text-muted-color)` | `color` | H |
| `--ut-footer-apex-font-size` | 1 | `0.75rem` | `font-size` | H |
| `--ut-footer-apex-item-spacing` | 1 | `0.5rem` | `margin-inline-start` | H |
| `--ut-footer-apex-line-height` | 1 | `1.25rem` | `line-height` | H |
| `--ut-footer-border-width` | 1 | `1px` | `border-top-width` | H |
| `--ut-footer-padding-x` | 1 | `1rem` | `padding` | H |
| `--ut-footer-padding-y` | 1 | `1rem` | `padding` | H |
| `--ut-footer-text-color` | 1 | — | `color` | H |
| `--ut-footer-top-background-color` | 1 | `var(--a-button-background-color)` | `background-color` | H |
| `--ut-footer-top-border-color` | 1 | `var(--a-button-border-color)` | `border-color` | H |
| `--ut-footer-top-border-radius` | 1 | `100%` | `border-radius` | H |
| `--ut-footer-top-border-width` | 2 | `var(--a-button-border-width, 1px)` | `padding`, `border-width` | H |
| `--ut-footer-top-box-shadow` | 1 | `var(--a-button-box-shadow), none` | `box-shadow` | H |
| `--ut-footer-top-padding` | 1 | `0.75rem` | `padding` | H |
| `--ut-footer-top-size` | 2 | `2.5rem` | `width`, `height` | H |
| `--ut-footer-top-text-color` | 1 | `var(--a-button-text-color)` | `color` | H |
| `--ut-header-border-width` | 2 | `1px` | `padding-block-end`, `border-bottom-width` | H |
| `--ut-header-controls-icon-border-radius` | 1 | `0.25rem` | `border-radius` | H |
| `--ut-header-controls-icon-bottom-width` | 1 | `0.5rem` | `width` | H |
| `--ut-header-controls-icon-height` | 1 | `0.125rem` | `height` | H |
| `--ut-header-controls-icon-middle-width` | 1 | `var(--a-button-icon-size, 1rem)` | `width` | H |
| `--ut-header-controls-icon-top-width` | 1 | `0.75rem` | `width` | H |
| `--ut-header-controls-icon-transition` | 7 | `inset-block-start 75ms ease, opacity 75ms e…` | `transition` | H |
| `--ut-header-item-spacing` | 12 | `0.5rem` | `margin`, `gap`, `padding-block-start` | H |
| `--ut-header-logo-height` | 1 | `calc(var(--ut-header-height, 3rem) - var(--…` | `max-height` | H |
| `--ut-header-menubar-badge-background-color` | 1 | `var(--ut-treeview-badge-background-color)` | `background-color` | H |
| `--ut-header-menubar-badge-text-color` | 1 | `var(--ut-treeview-badge-text-color)` | `color` | H ☆26 |
| `--ut-header-menubar-item-border-width` | 1 | — | `--a-menubar-item-border-width` | H |
| `--ut-header-menubar-item-split-border-width` | 1 | `0px` | `--a-menubar-item-split-border-width` | H |
| `--ut-header-navbar-item-spacing` | 2 | `var(--ut-header-item-spacing, 0.5rem)` | `margin-inline-end`, `margin-inline-start` | H |
| `--ut-header-padding-x` | 2 | `var(--ut-header-item-spacing, 0.5rem)` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-header-padding-y` | 4 | `var(--ut-header-item-spacing, 0.5rem)` | `padding-block-start`, `padding-block-end`, `max-height` | H |
| `--ut-hero-region-column-spacing` | 4 | `1rem` | `margin-inline-start`, `margin-block-end`, `margin-block-start` | H |
| `--ut-hero-region-icon-background-color` | 1 | `var(--ut-component-icon-background-color)` | `background-color` | H |
| `--ut-hero-region-icon-text-color` | 1 | `var(--ut-component-icon-color)` | `color` | H |
| `--ut-hero-region-title-font-size` | 1 | `2rem` | `font-size` | H |
| `--ut-hero-region-title-line-height` | 1 | `2.5rem` | `line-height` | H |
| `--ut-link-text-decoration` | 18 | `underline` | `-webkit-text-decoration`, `text-decoration` | ◇ H |
| `--ut-linkslist-arrow-size` | 3 | `1rem` | `font-size`, `width`, `height` | H |
| `--ut-linkslist-arrow-transition-x` | 2 | `0.5rem` | `transform` | H |
| `--ut-linkslist-badge-background-color` | 1 | `var(--ut-component-badge-background-color, …` | `background-color` | H |
| `--ut-linkslist-badge-border-radius` | 1 | `0.25rem` | `border-radius` | H |
| `--ut-linkslist-badge-color` | 1 | `var(--ut-component-badge-text-color, #26262…` | `color` | H |
| `--ut-linkslist-badge-font-size` | 1 | `0.75rem` | `font-size` | H |
| `--ut-linkslist-badge-line-height` | 2 | `1.25rem` | `line-height`, `min-width` | H |
| `--ut-linkslist-badge-padding-x` | 2 | `0.5rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-linkslist-badge-padding-y` | 2 | `0` | `padding-block-start`, `padding-block-end` | H |
| `--ut-linkslist-badge-transition-timing` | 2 | `0.1s` | `transition` | H |
| `--ut-linkslist-hover-background-color` | 1 | — | `--ut-linkslist-background-color` | H |
| `--ut-linkslist-icon-color` | 1 | `var(--ut-component-text-muted-color)` | `color` | H |
| `--ut-linkslist-icon-size` | 4 | `1rem` | `min-width`, `width`, `height` | H |
| `--ut-linkslist-item-border-color` | 2 | `var(--ut-component-inner-border-color)` | `border-bottom-color` | H |
| `--ut-linkslist-label-color` | 1 | — | `color` | H |
| `--ut-linkslist-label-font-size` | 1 | — | `font-size` | H |
| `--ut-linkslist-label-line-height` | 1 | — | `line-height` | H |
| `--ut-linkslist-link-padding-x` | 6 | `0.75rem` | `padding-inline-start`, `padding-inline-end`, `margin-inline-start` | H |
| `--ut-linkslist-separator-border-border-color` | 1 | `var(--ut-linkslist-item-border-color, var(-…` | `border-bottom-color` | H |
| `--ut-linkslist-separator-border-border-width` | 1 | `var(--ut-linkslist-item-border-width, var(-…` | `border-bottom-width` | H |
| `--ut-linkslist-text-color` | 1 | `var(--ut-link-text-color)` | `color` | H |
| `--ut-linkslist-transition-timing` | 3 | `0.1s` | `transition` | H |
| `--ut-login-container-item-spacing` | 1 | `1rem` | `gap` | H |
| `--ut-login-logo-border-radius` | 1 | `0.25rem` | `border-radius` | H |
| `--ut-login-logo-size` | 3 | `4rem` | `width`, `height`, `line-height` | H |
| `--ut-login-region-border-color` | 1 | `var(--ut-component-border-color)` | `border-color` | H |
| `--ut-login-region-border-radius` | 1 | `0.5rem` | `border-radius` | H |
| `--ut-login-region-border-width` | 1 | `var(--ut-component-border-width, 1px)` | `border-width` | H |
| `--ut-login-region-max-width` | 3 | `28.75rem` | `max-width`, `width` | H |
| `--ut-login-region-padding` | 1 | `2rem` | `padding` | H |
| `--ut-logo-font-size` | 1 | `1.125rem` | `font-size` | H |
| `--ut-logo-line-height` | 1 | `1.5rem` | `line-height` | H |
| `--ut-logo-text-color` | 1 | `inherit` | `color` | H |
| `--ut-navtabs-badge-background-color` | 1 | — | `background-color` | H |
| `--ut-navtabs-badge-border-radius` | 1 | `0.5rem` | `border-radius` | H |
| `--ut-navtabs-badge-font-size` | 1 | `0.5rem` | `font-size` | H |
| `--ut-navtabs-badge-font-weight` | 1 | — | `font-weight` | H |
| `--ut-navtabs-badge-line-height` | 3 | `1rem` | `line-height`, `min-height`, `min-width` | H |
| `--ut-navtabs-badge-padding` | 1 | `0 0.25rem` | `padding` | H |
| `--ut-navtabs-badge-text-color` | 1 | — | `color` | H |
| `--ut-navtabs-box-shadow` | 1 | — | `box-shadow` | H |
| `--ut-navtabs-icon-size` | 1 | — | `font-size` | H |
| `--ut-navtabs-icon-spacing` | 2 | `0.25rem` | `margin-inline-end`, `margin-inline-start` | H |
| `--ut-navtabs-item-active-font-weight` | 1 | `var(--a-base-font-weight-semibold, 500)` | `--ut-navtabs-item-font-weight` | H |
| `--ut-navtabs-item-active-text-color` | 1 | — | `--ut-navtabs-item-text-color` | H |
| `--ut-navtabs-item-font-size` | 1 | `0.875rem` | `font-size` | H |
| `--ut-navtabs-item-hover-highlight-color` | 1 | — | `--ut-navtabs-item-highlight-color` | H |
| `--ut-navtabs-item-hover-text-color` | 1 | — | `--ut-navtabs-item-text-color` | H |
| `--ut-navtabs-item-line-height` | 1 | `1.5rem` | `line-height` | H |
| `--ut-region-border-color` | 10 | `var(--ut-component-border-color)` | `border-color`, `border-block-end-color`, `border-block-start-color` | ◆ H |
| `--ut-region-header-icon-border-radius` | 1 | `0.125rem` | `border-radius` | H |
| `--ut-region-header-icon-padding` | 1 | `0.25rem` | `padding` | H |
| `--ut-region-header-icon-spacing` | 1 | `0.25rem` | `margin-inline-end` | H |
| `--ut-region-header-item-spacing` | 4 | `0.5rem` | `padding-inline-start`, `padding-block-start`, `padding-block-end` | H |
| `--ut-region-header-padding-y` | 2 | `0.75rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-border-color` | 1 | `var(--ut-report-cell-border-color, var(--ut…` | `border-color` | H |
| `--ut-report-cell-font-size` | 3 | `0.75rem` | `font-size` | H |
| `--ut-report-cell-line-height` | 3 | `1rem` | `line-height` | H |
| `--ut-report-cell-padding-x` | 4 | `0.75rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-cell-padding-y` | 4 | `0.5rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-cell-stripe-background-color` | 1 | `var(--ut-component-highlight-background-col…` | `background-color` | H |
| `--ut-report-cell-text-color` | 1 | `var(--a-gv-text-color)` | `color` | H |
| `--ut-report-header-cell-background-color` | 1 | `var(--a-gv-header-background-color)` | `background-color` | H |
| `--ut-report-header-cell-border-color` | 2 | `var(--ut-report-cell-border-color, var(--ut…` | `border-color`, `box-shadow` | H |
| `--ut-report-header-cell-font-size` | 1 | `var(--ut-report-cell-font-size, 0.75rem)` | `font-size` | H |
| `--ut-report-header-cell-font-weight` | 1 | `var(--a-base-font-weight-bold, 700)` | `font-weight` | H |
| `--ut-report-header-cell-line-height` | 1 | `var(--ut-report-cell-line-height, 1rem)` | `line-height` | H |
| `--ut-report-header-cell-padding-x` | 2 | `0.75rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-header-cell-padding-y` | 2 | `0.75rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-header-text-color` | 1 | `var(--a-gv-header-text-color)` | `color` | H |
| `--ut-report-links-border-color` | 1 | `var(--ut-report-cell-border-color, var(--ut…` | `border-color` | H |
| `--ut-report-links-font-size` | 1 | `var(--ut-report-cell-font-size, 0.75rem)` | `font-size` | H |
| `--ut-report-links-line-height` | 1 | `var(--ut-report-cell-line-height, 1rem)` | `line-height` | H |
| `--ut-report-links-padding-x` | 2 | `var(--ut-report-cell-padding-x, 0.75rem)` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-links-padding-y` | 2 | `var(--ut-report-cell-padding-y, 0.5rem)` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-pagination-font-size` | 1 | `0.75rem` | `font-size` | H |
| `--ut-report-pagination-line-height` | 1 | `1rem` | `line-height` | H |
| `--ut-report-pagination-link-border-radius` | 1 | `0.125rem` | `border-radius` | H |
| `--ut-report-pagination-link-hover-background-color` | 1 | `var(--ut-palette-primary)` | `--ut-report-pagination-link-background-color` | H |
| `--ut-report-pagination-link-hover-text-color` | 1 | `var(--ut-palette-primary-contrast)` | `--ut-report-pagination-link-text-color` | H |
| `--ut-report-pagination-link-padding-x` | 2 | `0.5rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-pagination-link-padding-y` | 2 | `0.25rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-pagination-padding-x` | 2 | `0.25rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-pagination-padding-y` | 2 | `0.5rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-report-pagination-text-padding-x` | 2 | `0.5rem` | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-report-pagination-text-padding-y` | 2 | `0.25rem` | `padding-block-start`, `padding-block-end` | H |
| `--ut-tabs-background-color` | 1 | — | `background-color` | H |
| `--ut-tabs-item-active-background-color` | 2 | — | `--ut-tabs-item-background-color` | H |
| `--ut-tabs-item-active-highlight-color` | 2 | `currentColor` | `--ut-tabs-item-highlight-color` | H |
| `--ut-tabs-item-hover-background-color` | 1 | `var(--ut-component-highlight-background-col…` | `--ut-tabs-item-background-color` | H |
| `--ut-tabs-item-icon-spacing` | 2 | `0.375rem` | `margin-inline-end`, `margin-block-end` | H |
| `--ut-tabs-item-line-height` | 2 | `1rem` | `line-height` | H |
| `--ut-tabs-item-outline-offset` | 1 | `-1px` | `outline-offset` | H |
| `--ut-tabs-item-width` | 1 | `7.5rem` | `inline-size` | H |
| `--ut-treeview-badge-border-color` | 1 | `rgba(255, 255, 255, 0.35)` | `box-shadow` | H |
| `--ut-treeview-badge-border-width` | 1 | `1px` | `box-shadow` | H |
| `--ut-treeview-badge-font-family` | 1 | — | `font-family` | H |
| `--ut-treeview-badge-padding-y` | 2 | `0` | `padding-block-start`, `padding-block-end` | H |
| `--ut-treeview-collapsed-badge-border-radius` | 1 | `1.25rem` | `--ut-treeview-badge-border-radius` | H |
| `--ut-treeview-collapsed-badge-font-size` | 1 | `.5625rem` | `--ut-treeview-badge-font-size` | H |
| `--ut-treeview-collapsed-badge-line-height` | 1 | `.875rem` | `--ut-treeview-badge-line-height` | H |
| `--ut-treeview-collapsed-badge-padding-x` | 1 | `.25rem` | `--ut-treeview-badge-padding-x` | H |
| `--ut-treeview-icon-container-border-radius` | 1 | — | `border-radius` | H |
| `--ut-treeview-leaf-padding-x` | 2 | — | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-treeview-leaf-padding-y` | 2 | — | `padding-block-start`, `padding-block-end` | H |
| `--ut-treeview-node-icon-container-height` | 1 | — | `--ut-treeview-icon-container-height` | H |
| `--ut-treeview-toggle-width` | 1 | `2rem` | `width` | H |
| `--ut-treeview-toplevel-icon-container-height` | 1 | `1.5rem` | `--ut-treeview-icon-container-height` | H |
| `--ut-treeview-toplevel-leaf-padding-x` | 2 | — | `padding-inline-start`, `padding-inline-end` | H |
| `--ut-treeview-toplevel-node-font-size` | 1 | `.875rem` | `--a-treeview-node-font-size` | H |

Nicht gelistet: `--a-gv-frozen-offset-1…20` (vermutlich vom IG-JS inline gesetzt, *unverifiziert*) sowie Hooks der Spezial-Widgets (`--a-chat-*`, `--a-map-*`, `--a-fs-*`, `--a-filedrop-*`, `--a-datepicker-*`, `--a-combo*`, `--a-md*`, `--a-pwa-*`, `--ut-metric-*`, `--ut-timeline-*` …) – siehe JSON.

## 12. Methode und Reproduktion

- Statische Analyse: `_tmp/research/tokens-parse.mjs` (Übersicht) und `_tmp/research/tokens-model.mjs` (Modell): kommentar- und stringsicherer CSS-Parser, Kontext-Stack (@media » Selektor), :root-Kaskade in Lade-Reihenfolge, var()-Aufrufe inkl. Fallback, Theme-Roller-JSON aus Vita.css-Kommentaren.
- Laufzeit: `_tmp/research/tokens-runtime.mjs` (Harness `launchLab`): App 9042/9242, Seite 1101, `getComputedStyle(document.documentElement)` für alle 3518 Namen; Vita-Dark/Iris durch Tausch des `<link>`; Seite 6307 als Text; Chart-Check auf Seite 1902 (`charts*.mjs`).
- Aufgelöste Werte (→) stammen aus den ausgelieferten `*.min.css`; der Minifier schreibt Farben teils um (`white` → `#fff`, `rgba(255,255,255,.15)` → `hsla(0,0%,100%,.15)`) – inhaltlich identisch.
- Dokument: `_tmp/research/tokens-docs.mjs` + `tokens-meta.mjs` (Gruppenregeln, Bedeutungs-Generator, Hebel-Liste). Bedeutungen ohne manuellen Eintrag sind aus dem Namen generiert (Subjekt + Eigenschaft + Zustand) und daher knapp.
- *Unverifiziert:* Wer `--a-color-picker-preset-*` konsumiert (kein var()-Treffer in CSS; vermutlich Color-Picker-JS); ob der Theme Roller auf Styles mit reinen CSS-Dateien (ohne LESS/SCSS-Input) anwendbar ist.
