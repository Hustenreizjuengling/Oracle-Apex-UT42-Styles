# Universal Theme – Anatomie des Seitenrahmens (Page Shell)

Stand: 2026-09-23 · gilt für UT-Dateiversion **24.2** und **26.1** (Theme 42) auf APEX-Runtime 26.1
Zielgruppe: alle, die eigene Theme Styles bauen (Architektur: UT-Basis `Vita`/`Vita-Dark` + eigenes CSS-Bundle, das Tokens überschreibt und Komponenten umbaut).

> Konventionen: „Core" = `_reference/ut-26.1/css/Core.css` (Zeilennummern 26.1), „Vita" = `_reference/ut-26.1/css/Vita.css`, „app_ui" = `_reference/app_ui/css/Core.css`, „JS" = `_reference/ut-26.1/js/theme42.js`.
> **[gemessen]** = live im Testbett per Harness verifiziert, **[Code]** = aus Quelltext abgeleitet, **[unverifiziert]** = plausibel, aber nicht geprüft.

---

## 0. Kurzfassung – das Wichtigste in 12 Punkten

1. Das ganze Seitengerüst ist **CSS Grid**: `form#wwvFlowForm` (Zeilen header/body/footer) → `.t-Body` (Spalten `nav | main | actions`) → `.t-Body-main` (`title / side / content`) → `.t-Body-content` (`content-main / content-footer`). Keine Floats, keine absoluten Positionen – ein Theme kann Abstände, Radien, Hintergründe frei setzen, solange es **die Grid-Areas nicht umbenennt**.
2. **Header-Höhe steuert man über `--ut-header-height`** (ist nur `min-height` von `.t-Header-branding`, Standard `3rem`). Oracle selbst nutzt das (Redwood/Iris: `3.5rem`). **[gemessen]** `4.5rem` → Header 72 px, JS setzt `--js-sticky-top: 72px`, Nav/Title/Actions rutschen korrekt mit.
3. **theme42.js misst die Header-Höhe** (`$("#t_Header").outerHeight()`) und schreibt sie als **Inline-Style** `--js-sticky-top` auf `<html>`. Davon hängen `top`/`height` von Tree-Nav, Title-Bar, Actions-Spalte und alle Sticky-Widgets (Report-Header, RDS) ab. Gemessen wird nur bei Page-Init und bei `apexwindowresized` – **spätere Höhenänderungen ohne Resize bleiben unbemerkt** (gemessen: Header 80 px, Sticky-Top blieb 48 px).
4. `--ut-header-height` kann den Header **nicht kleiner** machen als sein Inhalt (Buttons 32 px + Padding 2×8 px = 48 px). **[gemessen]** `2rem` → Header bleibt 48 px. Kleiner nur über `--ut-header-padding-y` + Button-Paddings.
5. **Header nie mit `display:none` ausblenden**: jQuery misst versteckte Elemente per Swap → `--js-sticky-top` bleibt 48 px, oben entsteht eine Lücke. **[gemessen]** Stattdessen `height:0; overflow:hidden` (→ 0 px) oder `:root{--js-sticky-top:0px !important}` (schlägt den Inline-Style). **Header nie `position:fixed` als vertikale Leiste**: Sticky-Top wird zur Fensterhöhe (900 px) – Layout kaputt. **[gemessen]**
6. **Nav-Breite**: `--ut-nav-width` (expandiert, Standard `15rem`) und `--ut-nav-collapsed-icon-width` (Icon-Modus, Fallback `52px`). JS liest keine dieser Breiten – gefahrlos änderbar. Achtung: `--ut-nav-width` begrenzt auch die Spaltenbreite des **Mega Menu** (Core Z. 13809).
7. **Breakpoints niemals umdefinieren**: `--js-mq-*` werden von theme42.js per `parseInt()` gelesen (Einheiten werden faktisch **nicht** entfernt – `62rem` wird zu `62` px **[gemessen]**), CSS-Media-Queries sind hart auf 480/640/768/992/1200/1400 px codiert.
8. **Tree-Nav-Farben sind in Vita teils hart codiert** (`#1e2225`, `#171a1d`, `#25292d !important`, `#056AC8`) – nur Tokens zu setzen reicht **nicht**, die Selektoren aus Vita Z. 3015–3130 müssen überschrieben werden (Hover inkl. `!important`).
9. **Mobile Side-Nav schiebt den Inhalt zur Seite** (kein Overlay; `#pushModal` wird zwar erzeugt, aber nie angezeigt). **[gemessen]** Ein Overlay lässt sich rein per CSS nachrüsten (Rezept in §5.7, **[gemessen]**).
10. **Dialoge bestehen aus zwei Dokumenten**: der jQuery-UI-Rahmen (`.ui-dialog`, Titelzeile, Overlay) lebt in der **aufrufenden Seite**, der Inhalt (`body.t-Dialog-page` / `.t-Drawer-page`) im **iframe**. Beide laden denselben Theme Style – das Theme muss beide Hälften stylen.
11. Title-Bar (`.t-Body-title`) ist sticky und **schrumpft beim Scrollen** (`.t-Body-title-shrink`, gemessen 120 → 72 px, Titel 32 → 14 px). JS rechnet danach neu (`apexwindowresized`).
12. **24.2 vs. 26.1**: Shell-DOM, Templates, Grid und JS-Logik sind praktisch identisch (Details §11). Einziger nennenswerter Unterschied: Template **„Blank"** und `t-PageBody--vertical*`-Modifier nur in 26.1.

---

## 1. Methodik & Quellen

- Referenz-CSS/JS: `_reference/ut-26.1/*`, `_reference/ut-24.2/*`, `_reference/app_ui/css/*` (Grep/Read, Diff 24.2↔26.1).
- Page-Template-Quelltexte (read-only per SQLcl aus `apex_application_temp_page` / `apex_application_temp_list` der Apps 9042/9242) → `_tmp/research/templates-9042.txt`, `templates-9242.txt`, `listtemplates-9042.txt`.
- Live-Messungen (APEX 26.1 Runtime, Vita light, 1440×900 / 900×900 / 390×844 mobile) mit eigenen Skripten unter `_tmp/research/`:
  `shell-skeleton.mjs` (DOM-Skelett + Boxen), `shell-interact.mjs` (Nav-Toggle, Mega Menu, Menüs, Dialoge, Header-Höhen-Experimente `hh1…hh9`, `hhlate`, `mqrem`), `header-metrics.mjs`, `shrink.mjs`, `overlay-nav.mjs`, `sticky-footer.mjs`, `head-order.mjs`.
  Rohausgaben: `_tmp/research/sk-*.txt`, `int-*.txt`, Screenshots `*.png`.
- **Testbett-Besonderheiten**
  - In der Reference App hat die Tree-Nav die Template-Option `js-defaultCollapsed` → auf Desktop startet die Nav **eingeklappt** (Icon-Modus, 52 px). Normale Apps starten ab 992 px ausgeklappt.
  - Die Seiten 1120–1124 sind Navigations-Previews (1120 Menu Bar, 1121 Tabs, 1122 Mega Menu, 1123 Side Tree „hidden"-Modus).
  - Der aktive Theme Style des Testbetts kann durch parallele Arbeiten wechseln (während der Messung tauchte in 9242 `apex-theme-stub-dark` auf). Die Body-Klasse `apex-theme-<style-name>` zeigt den aktiven Style. Strukturmessungen sind davon unberührt, Farbwerte ggf. schon.

Ladereihenfolge im `<head>` **[gemessen, 9042/1101]**:
```
/i/app_ui/css/Core.min.css
/i/app_ui/css/Theme-Standard.min.css
/i/libraries/font-apex/2.5.1/css/font-apex.min.css
/i/themes/theme_42/26.1/css/Core.min.css
/i/themes/theme_42/26.1/css/Vita.min.css          ← css_file_urls des Styles (1)
r/…/files/static/v…/themelab/theme.min.css         ← css_file_urls des Styles (2) = unser Bundle
(ggf. theme_roller_output_file_url)
```
Skripte: `desktop_all.min.js`, `widget.stickyWidget.min.js`, `theme42.min.js`, `widget.treeView.min.js`.
Unser Bundle lädt **nach** Core und Vita → bei gleicher Spezifität gewinnen wir; gegen `!important` in Vita/Core nur mit eigenem `!important`.

---

## 2. Gesamtgerüst

### 2.1 Grid-Kaskade (Standard-Template, Side-Nav)

```
body#t_PageBody.t-PageBody …
└─ form#wwvFlowForm                 grid rows: header | after_header | body(1fr) | before_footer | footer   (Core 2502)
   ├─ header#t_Header.t-Header      sticky top:0, z 800                                                 (Core 4032)
   │  ├─ (#REGION_POSITION_07)
   │  ├─ div.t-Header-branding      grid cols: controls | logo | navbar                                  (Core 4043)
   │  └─ div.t-Header-nav           #TOP_GLOBAL_NAVIGATION_LIST# + #REGION_POSITION_06#                   (Core 4286)
   ├─ div.t-Body                    grid cols: var(--ut-nav-collapsed-width, auto) | 1fr | auto
   │  │                             areas:     "nav main actions"                                         (Core 2518)
   │  ├─ div#t_Body_nav.t-Body-nav  (aus List-Template „Side Navigation Menu") sticky, z 500             (Core 2529)
   │  ├─ div.t-Body-main            <640: rows title/side/content · ≥640: "title title" / "side content"  (Core 2576)
   │  │  ├─ div#t_Body_title.t-Body-title   sticky, z 490 (#REGION_POSITION_01 = Breadcrumb Bar)         (Core 2598)
   │  │  ├─ div#t_Body_side.t-Body-side     nur Left-/Both-Column-Templates, sticky, z 470                (Core 2637)
   │  │  └─ div#t_Body_content.t-Body-content  rows: content-main | content-footer                        (Core 2663)
   │  │     ├─ div#t_Body_content_offset       (per JS eingefügt, 0×0 – nicht anfassen)
   │  │     ├─ main#main.t-Body-mainContent
   │  │     │  ├─ #APEX_SUCCESS_MESSAGE / #APEX_ERROR_MESSAGE
   │  │     │  ├─ div.t-Body-fullContent      (#REGION_POSITION_08 „Full Width Content")
   │  │     │  ├─ div#t_Body_info.t-Body-info (nur Marquee, #REGION_POSITION_02)
   │  │     │  └─ div.t-Body-contentInner     (#BODY)  padding + max-width                                 (Core 2685)
   │  │     └─ footer#t_Footer.t-Footer       (steht in der Content-Spalte, NICHT unter der Nav)          (Core 4321)
   │  └─ div#t_Body_actions.t-Body-actions   nur Right-/Both-Column/Marquee, sticky, z 490                (Core 2711)
   └─ div#t_Body_inlineDialogs.t-Body-inlineDialogs  (#REGION_POSITION_04, visuell versteckt)
div#pushModal.u-DisplayNone.u-Overlay--glass   (per JS angehängt, z 1000 – wird nie sichtbar)
div.t-NavigationBar-menu.a-Menu …               (Popup-Menüs der Navigation Bar, am body-Ende)
```

Gemessen (9042/1101, 1440×900, Nav eingeklappt): `.t-Body` grid-template-columns `52px 1388px 0px`; `form` rows `48px 0px 852px 0px 0px`. Nav ausgeklappt: `240px 1200px 0px`.

### 2.2 Body-Klassen (Zustands- und Template-Klassen)

| Klasse | Quelle | Bedeutung |
|---|---|---|
| `t-PageBody` | Template | Shell-Seite (fehlt bei Login/Dialog) |
| `t-PageTemplate--standard/leftCol/rightSideCol/leftRightCol/marquee/minimal/login/dialog/wizard/drawer` | Template | Template-Kennung – idealer Hook für template-spezifisches Styling |
| `t-PageBody--hideLeft` / `--showLeft` / `--hideActions` | Template | setzt `--ut-body-sidebar-width` / `--ut-body-actions-width` auf 0 (Core 2737–2753) |
| `t-PageBody--masterDetail` | Marquee-Template | Title ohne Schatten, RDS-Container eingefärbt (Core 2758) |
| `t-PageBody--noNav` | Minimal-Template | `--ut-nav-width:0`, Hamburger aus; JS entfernt `apex-side-nav` |
| `t-PageBody--blank` | Blank (nur 26.1) | nur `main.t-Body-contentInner` |
| `no-anim` | Template, von JS entfernt (`misc`) | unterdrückt Layout-Transitions beim Laden (Core 2790) |
| `apex-side-nav` / `apex-top-nav` | APEX-Engine (effektive Position des Navigation Menus der Seite; in der Reference App seitenweise verschieden, z. B. 1101 side, 1102/1113 top) | `.apex-top-nav .t-Button--headerTree{display:none}` (Core 4082) |
| `t-PageBody--leftNav` | JS des List-Templates „Side Navigation Menu" | Tree-Nav vorhanden |
| `t-PageBody--topNav` | theme42.js, wenn keine Tree-Nav (und nicht noNav) | |
| `js-navExpanded` / `js-navCollapsed` | ToggleCore (Nav) | setzt `--ut-nav-initial-width` bzw. Collapsed-Regeln |
| `js-navCollapsed--icons` / `js-navCollapsed--hidden` | theme42.js (`treeNav$`), abhängig von Klasse `js-navCollapsed--hidden` an `#t_TreeNav` | Icon-Leiste vs. komplett weg |
| `js-rightExpanded` / `js-rightCollapsed` | Inline-Script im Template + ToggleCore (right) | Actions-Spalte |
| `js-HeaderExpanded` / `js-HeaderContracted` | ToggleCore „peeking header" (nur Top-Nav-Seiten, ≥640 px) | **hat in UT keinerlei CSS** – freier Hook [Code] |
| `js-pageStickyMobileHeader` | Template-Option „Sticky Mobile Header" | Title bleibt <640 px sticky |
| `js-regionIsMaximized` | theme42 (Maximize-Region) | |
| `js-ready`, `apex-icons-fontapex`, `apex-theme-<style>` | APEX | |
| `u-RTL` (am `<html>`) | Reference App: Link „RTL" in der Navigation Bar | RTL-Test – Core nutzt logische Properties + `.u-RTL`-Overrides |

### 2.3 z-Index-Stapel (gemessen/Code)

| Element | z-index | Quelle |
|---|---|---|
| Popup-Menüs `.a-Menu` (Mega Menu, Navigation-Bar-Menü, Menübar-Untermenüs) | 2010 | app_ui ~12082 `z-index: var(--a-menu-zindex, 2010)` [gemessen: Mega Menu 2010] |
| `#pushModal` (`.u-Overlay--glass`) | 1000 | app_ui 199 |
| `.ui-dialog.ui-front` / `.ui-widget-overlay.ui-front` | 901 / 900 | app_ui 16574–16579 |
| `.t-Header` | 800 | Core 4033 |
| `.t-Header-nav` | 790 | Core 4302 |
| `.t-Body-nav` | 500 | Core 2532 |
| `.t-ButtonRegion--stickToBottom.is-anchored` | 500 | Core 9318 |
| `.t-Body-title`, `.t-Body-actions` | 490 | Core 2600, 2713 |
| `.t-Body-side` | 470 | Core 2639 |
| Sticky-Widgets (Report-Header) | ab 200 | JS `sticky()` `zIndexStart:200` |
| `.t-NavTabs` (<768 px, unten fixiert) | 100 | Core 4554 |

Fallstrick: Eigene Overlays/Schatten zwischen Header und Nav (z. B. „schwebende" Nav) brauchen Werte zwischen 500 und 800 bzw. >800, sonst liegen sie unter dem Header.

---

## 3. Header (`.t-Header`)

### 3.1 DOM (Template „Standard", gekürzt, 24.2 = 26.1)

```html
<header class="t-Header" id="t_Header" role="banner">
  #REGION_POSITION_07#
  <div class="t-Header-branding">
    <div class="t-Header-controls">
      <button class="t-Button t-Button--icon t-Button--header t-Button--headerTree"
              id="t_Button_navControl" type="button" aria-controls="t_TreeNav" aria-expanded="false">
        <span class="t-Header-controlsIcon" aria-hidden="true"></span>   <!-- Minimal: <span class="t-Icon fa fa-bars"> -->
      </button>
    </div>
    <div class="t-Header-logo">
      <a href="#HOME_LINK#" class="t-Header-logo-link">#LOGO#</a>   <!-- span.apex-logo-text / img.apex-logo-img -->
      #AFTER_LOGO#
    </div>
    <div class="t-Header-navBar">
      <div class="t-Header-navBar--start">#BEFORE_NAVIGATION_BAR#</div>
      <div class="t-Header-navBar--center">#NAVIGATION_BAR#</div>   <!-- ul.t-NavigationBar -->
      <div class="t-Header-navBar--end">#AFTER_NAVIGATION_BAR#</div>
    </div>
  </div>
  <div class="t-Header-nav">#TOP_GLOBAL_NAVIGATION_LIST##REGION_POSITION_06#</div>
</header>
```
- `.t-Header` selbst hat **keinen Hintergrund** – Farbe/Schatten/Border sitzen an `.t-Header-branding`. Wer Header + Top-Nav als Einheit gestalten will, muss `.t-Header` (oder beide Kinder) stylen.
- Login-, Dialog-, Drawer- und Blank-Template haben **keinen** `#t_Header`.

### 3.2 Layout & gemessene Maße (Vita, 1440 px)

`.t-Header-branding` (Core 4043): `display:grid; grid-template-columns:auto auto 1fr; grid-template-areas:"controls logo navbar"; gap: var(--ut-header-item-spacing,.5rem)`; `padding-block-start: var(--ut-header-padding-y, var(--ut-header-item-spacing))`, `padding-block-end: calc(padding-y − var(--ut-header-border-width,1px))`, `padding-inline: var(--ut-header-padding-x, …)`, `min-height: var(--ut-header-height)`, `border-bottom: var(--ut-header-border-width,1px) solid var(--ut-header-border-color)`, `background-color`, `box-shadow`, `color` per Token.

[gemessen 9042/1101]: grid cols `32px 143px 1233px`, gap 8 px, padding `8px 8px 7px`, Höhe 48 px; Hamburger 32×32 bei x=8; Logo x=48 (Schrift 18/24 px, 600); Nav-Bar-Buttons `padding:7px`, 12 px Schrift, radius 2 px.
Top-Nav/Minimal (1102/1113): Hamburger `display:none`, **die leere Controls-Spalte erzeugt trotzdem einen Gap** → Logo bei x=16 statt 8 **[gemessen]**. Ausgleich z. B. `.apex-top-nav .t-Header-controls{display:none}` [unverifiziert].

Mobile (390 px) [gemessen]: gleiche Höhe (48 px), `.t-Button--navBar .t-Button-label{display:none}` unter 480 px (Core 4457), Badge wird absolut positioniert.

### 3.3 Header-Tokens

| Variable | Default (Vita) | Wirkung |
|---|---|---|
| `--ut-header-height` | `3rem` (Vita 1931; Redwood/Iris `3.5rem`) | `min-height` der Branding-Zeile; auch Basis für Logo-Bild-Maximalhöhe |
| `--ut-header-padding-y` / `--ut-header-padding-x` | undefiniert → `--ut-header-item-spacing` (.5rem) | Innenabstand Branding |
| `--ut-header-item-spacing` | `.5rem` (Fallback) | Grid-Gap, Abstände im Header, Skip-Link-Margin |
| `--ut-header-navbar-item-spacing` | Fallback item-spacing | Abstand navBar-start/end |
| `--ut-header-background-color` / `--ut-header-text-color` | `#056AC8` / `white` (Vita 813; Vita-Dark identisch) | Branding-Farbe |
| `--ut-header-border-color` / `--ut-header-border-width` | `rgba(0,0,0,.1)` / `1px` | untere Linie |
| `--ut-header-box-shadow` | `var(--ut-shadow-sm)` | |
| `--ut-header-logo-height` | calc(header-height − 2×padding-y) | `max-height` von `.t-Header-logo-link img` (Core 4228) |
| `--ut-logo-font-size` / `-line-height` / `-font-weight` / `-text-color` / `--ut-logo-img-spacing` | 1.125rem / 1.5rem / semibold / inherit / .25rem | Logo-Text |
| `--ut-header-controls-icon-{top,middle,bottom}-width`, `-height`, `-border-radius`, `-transition` | .75rem / 1rem / .5rem / .125rem / .25rem | CSS-Hamburger (3 Striche aus `::before`/`::after`) |
| `--ut-navbar-button-badge-background-color` / `-border-radius` | `rgba(0,0,0,.3)` / `16px` | Badges der Navigation Bar |
| `--ut-header-menubar-*` | siehe §6.1 | Top-Menü-Leiste |

Buttons im Header nutzen die Button-Tokens, lokal überschrieben in **Vita 2029** `.t-Button--header { --a-button-background-color: transparent; --a-button-hover-background-color: rgba(0,0,0,.1); --a-button-active-background-color: rgba(0,0,0,.15); … }` und `.t-Button--header.is-active { --a-button-background-color: rgba(0,0,0,.25) }` (Hamburger im ausgeklappten Zustand). Core 3753: `.t-Button--header{--a-button-padding-x:.5rem; --a-button-shadow:none}`, `.t-Button--headerTree{--a-button-padding-y/x:.5rem; --a-button-border-width:1px}`. → Ein Theme überschreibt diese Werte **auf `.t-Button--header`**, nicht auf `:root` (lokale Zuweisung in Vita gewinnt sonst).

### 3.4 Hart codierte Werte (Header), die ein Theme ggf. überschreiben muss

- `.t-Header{z-index:800}`, `.t-Header-nav{z-index:790}` (Core 4033/4302).
- Hamburger: Linienabstände `top:-0.3125rem` / `bottom:-0.3125rem`, `margin-block-start:-0.0625rem`, Animationskurven (Core 4106–4204). Das X-Morphing (`is-active` + hover/focus bzw. <480 px immer) ist typischer APEX-Look → ggf. `.t-Header-controlsIcon` komplett ersetzen (z. B. `display:none` + eigenes `::before`-Icon am Button).
- `.t-Button--headerUser{text-transform:lowercase}` (Core 3766), `.t-NavigationBar-item.has-username .t-Button-label{text-transform:lowercase}` (Core 4519) – Benutzername klein geschrieben = APEX-typisch.
- `.t-Header-nav .t-Menu-badge` Padding/Größe/Radius (Core 4304).
- Navigation-Bar-Menü: `.t-NavigationBar-menu{--a-menu-min-width:10rem; position:fixed !important}` (Core 4525).

### 3.5 Navigation Bar & Benutzer-Menü

List-Template „Navigation Bar" (DB):
```html
<ul class="t-NavigationBar #COMPONENT_CSS_CLASSES#" id="#LIST_ID#">
  <li class="t-NavigationBar-item [is-active] #A02#">
    <a class="t-Button t-Button--icon t-Button--header t-Button--navBar" …>
      <span class="t-Icon #ICON_CSS_CLASSES#"></span><span class="t-Button-label">…</span><span class="t-Button-badge">#A01#</span>
    </a>
  </li>
```
Einträge mit Untermenü werden zu `<button … data-menu="menu_L…" aria-haspopup="menu">` + `span.a-Icon.icon-down-arrow`; das Menü `div#menu_L….t-NavigationBar-menu.a-Menu` hängt **am Ende von `body`** (nicht im Header!) und wird mit `position:fixed`/inline `top/left` geöffnet [gemessen]. JS: `$(".t-NavigationBar-menu").menu({callout: …js-menu-callout})` (JS 1974). Styling über `--a-menu-*` (Vita 1080–1109: Hintergrund `#FFFFFF`, Fokus `#056AC8`/weiß).
Modifier-Klassen am `li`: `icon-only`, `no-icon`, `has-username` (Core 4497–4521).

---

## 4. Header-Höhe, Sticky-Offsets und JavaScript – was ein Theme wissen MUSS

### 4.1 Was theme42.js liest und schreibt

| Größe | Wer / wie | Wirkung |
|---|---|---|
| `--js-mq-xs/sm/md/lg` | **gelesen** einmalig beim Laden: `parseInt(getComputedStyle(html).getPropertyValue("--js-mq-lg").replace(C_REPLACE_UNITS,""),10) \|\| 1200` (JS 52–55). `C_REPLACE_UNITS` ist ein **String** (`` `/px\|em\|rem/gi` ``), kein RegExp → Einheiten werden nicht entfernt; `parseInt` schneidet nur ab. | Breakpoints für Nav/Actions-Toggle, Sticky-Logik. Wert `992px` (Core 17). **[gemessen]** `62rem` → 62 |
| `--js-mq-lg` | **gelesen** zusätzlich im Inline-Script des List-Templates „Side Navigation Menu": `matchMedia("(min-width: " + value + ")")` | setzt `js-navExpanded` schon vor Paint |
| `--js-sticky-top` | **geschrieben** als Inline-Style am `<html>` = `$("#t_Header").outerHeight()` (`resetHeaderOffset`, JS 111–121) | `top` + `height: calc(100dvh − …)` von `.t-Body-nav`, `.t-Body-title`, `.t-Body-actions`, `.t-Body-actionsContent` (Core 2537/2611/2719/2734) |
| `--js-page-title-height` | **geschrieben** nur wenn `#t_Body_side` existiert: Title-Höhe + Header-Höhe | `top`/`height` von `.t-Body-side` (Core 2645) |
| `theme.defaultStickyTop()` = `getFixedHeight()` | `$("header").outerHeight()` (**erstes `<header>` im Dokument!**) + RDS-Höhe (Marquee) + Title-Höhe (falls `position:sticky`); <640 px und `js-HeaderContracted` ohne Header | Offset für `stickyWidget` (Report-/IR-Header, Status-List, Marquee-RDS) und `scrollTo()` |
| `u-unstick` | **gesetzt** auf `#t_Body_title` (≤640 px, außer `js-pageStickyMobileHeader`), `#t_Body_side` (≤640 px), bei `t-PageBody--scrollTitle` / `--scrollAll` auch Header/Nav | `.u-unstick{position:relative!important; top:initial!important; height:auto!important}` (Core 379) |
| Toggle-Klassen | ToggleCore: `js-navExpanded/Collapsed`, `js-rightExpanded/Collapsed`, `js-HeaderExpanded/Contracted`, `t-Body-title-shrink` | siehe §5/§7 |

Wann wird `resetHeaderOffset()` aufgerufen [Code]: `prepUI` (DOM ready), `misc` (nach `apexreadyend`), bei `apexwindowresized` (Top-Nav-Seiten direkt; Side-Nav-Seiten über `onResize` des Nav-Toggles), nach Title-Shrink (löst `apexwindowresized` aus), bei Sticky-Mobile-Header-Änderungen. Öffentliche API: **`apex.theme42.util.fixLayout()`**.

### 4.2 Experimente (9042, 1440×900; 9242 für hh1 identisch)

CSS wurde vor theme42-Init injiziert (DOMContentLoaded, capture), außer bei `hhlate`.

| # | Seite | Theme-CSS | Ergebnis |
|---|---|---|---|
| hh1 | 1101 (Side-Nav) | `:root{--ut-header-height:4.5rem}` | Header 72 px, `--js-sticky-top:72px`, Nav/Title `top:72px` ✔ |
| hh2 | 1102 (Top-Nav) | dito | Header 120 px (72 + Menüleiste 48), Sticky-Top 120 px ✔ |
| hh6 | 1103 (Left Column) | dito | Sticky-Top 72 px, `--js-page-title-height:168px`, Side-Spalte `top:168px` ✔ |
| hh3 | 1101 | `.t-Header-branding{padding-block:1.25rem}` | Header 73 px, Sticky-Top 73 px ✔ (Höhe aus Inhalt funktioniert auch) |
| hh9 | 1101 | `:root{--ut-header-height:2rem}` | **Header bleibt 48 px** (Inhalt 32 px + Padding) ✘ – kleiner nur über Paddings/Button-Größen |
| hh5 | 1101 | `.t-Header{display:none}` | **`--js-sticky-top` bleibt 48px** (jQuery misst versteckte Elemente) → 48-px-Lücke über Nav/Title ✘ |
| hh8 | 1101 | `.t-Header{height:0;overflow:hidden}` | Sticky-Top 0 px ✔ |
| hh7 | 1101 | `:root{--js-sticky-top:0px !important}` + Header `display:none` | Computed 0 px trotz Inline-Style 48 px ✔ (`!important` im Stylesheet schlägt normalen Inline-Style) |
| hh4 | 1101 | `.t-Header{position:fixed; inset:0 auto 0 0; width:4rem}` (vertikale Leiste) | `--js-sticky-top:900px` → Nav `top:900px`, Höhe 0, Title unten ✘✘ |
| hhlate | 1101/1102 | nach Laden `:root{--ut-header-height:5rem}` | Header 80/128 px, Sticky-Top **bleibt 48/96 px** → Nav/Title kleben 32 px unter die Header-Kante. Erst `apexwindowresized` bzw. `apex.theme42.util.fixLayout()` korrigiert ✔ |
| mqrem | 1101 @1100 | `:root{--js-mq-lg:62rem}` | JS liest `62` (px!) ✘ |

### 4.3 Regeln für Theme Styles

1. Header-Höhe **statisch per CSS** festlegen (`--ut-header-height`, `--ut-header-padding-*`, Button-Größen). Sie muss zum Zeitpunkt DOM-ready/`apexreadyend` final sein.
2. Keine Höhenänderungen, die erst später eintreten: z. B. Webfonts mit `font-display:swap`, deren Metrik die Logo-Zeile verändert → im Header feste `line-height`/Höhen verwenden [unverifiziert, abgeleitet aus hhlate]. Hover-/Scroll-Effekte, die die Header-Höhe ändern, vermeiden (oder nur `transform` nutzen, das `outerHeight` nicht beeinflusst [unverifiziert]).
3. Header nie `display:none`; zum Ausblenden `height:0;overflow:hidden` **oder** `--js-sticky-top:0px !important`.
4. Header nicht aus dem Fluss nehmen (`position:fixed/absolute`) oder vertikal drehen – `outerHeight` des Headers ist das Maß aller Sticky-Offsets. Ein „Sidebar-Header" ist mit Theme-CSS allein **nicht** sauber machbar.
5. Die Top-Nav-Leiste (`.t-Header-nav`) zählt zur Header-Höhe (Menüleiste 48 px, NavTabs 40 px [gemessen]) – bei eigener Gestaltung Höhe konstant halten.
6. `--js-mq-*` **nie** überschreiben; CSS-Breakpoints sind ohnehin hart codiert (§10).
7. `--js-sticky-top` / `--js-page-title-height` nur lesen (z. B. für eigene sticky Elemente: `top: var(--js-sticky-top)`), nicht normal setzen.

---

## 5. Side Navigation (Tree Nav)

### 5.1 DOM

Server-Markup (List-Template „Side Navigation Menu", DB):
```html
<div class="t-Body-nav" id="t_Body_nav" role="navigation" aria-label="…">
  <div class="a-TreeView t-TreeNav #COMPONENT_CSS_CLASSES#" id="t_TreeNav" data-id="…_tree">
    <ul>
      <li data-current="true|false" data-id="#A01#" data-icon="#ICON_CSS_CLASSES#" data-shortcut="#A05#">
        <a href="#LINK#" class="u-DisplayNone">Label</a>
        <div class="a-TreeView-node a-TreeView-node--topLevel" aria-hidden="true">
          <div class="a-TreeView-row"></div>
          <div class="a-TreeView-content"><span class="fa #ICON#"></span><span class="a-TreeView-label">Label</span></div>
        </div>
      </li> …
    </ul>
  </div>
</div>
<script>/* setzt sessionStorage-Präferenz, js-navCollapsed--icons, js-navExpanded (matchMedia --js-mq-lg) */</script>
```
Laufzeit-Markup nach `treeView`-Widget [gemessen, 9042/1101, ausgeklappter Knoten]:
```html
<li id="t_TreeNav_1" class="a-TreeView-node a-TreeView-node--topLevel is-collapsible">
  <div class="a-TreeView-row is-selected is-current--top"></div>        <!-- absolut positionierte Hintergrund-Zeile -->
  <span class="a-TreeView-toggle"></span>
  <div class="a-TreeView-content is-selected is-current--top">
    <span class="fa fa fa-user"></span>
    <a class="a-TreeView-label is-current" role="treeitem" aria-level="1" aria-expanded="true">Menu Item 2</a>
  </div>
  <ul role="group" id="t_TreeNav_1_subtree">
    <li class="a-TreeView-node a-TreeView-node--leaf">
      <div class="a-TreeView-row"></div>
      <div class="a-TreeView-content"><a class="a-TreeView-label [is-current]" aria-level="2">Sub Menu Item 2.1</a></div>
    </li> …
  </ul>
</li>
```
Wichtig:
- **`.a-TreeView-row` ist ein leeres, absolut positioniertes Element** (app_ui 15312: `position:absolute; left:0; width:100%; height: line-height + 2×padding-y`) – Hover/Selected-Hintergründe liegen **dort**, nicht am Label. Für „Pill"-Optik (abgerundet, eingerückt) die Row stylen (`border-radius`, `inset-inline`, `width`), vgl. Vita `.t-TreeNav--styleB .a-TreeView-row{border-radius:.25rem}`.
- Das Label ist `color: transparent`, nicht versteckt, wenn eingeklappt (§5.3); es gibt **kein `title`-Tooltip** im Icon-Modus [gemessen].
- theme42.js ergänzt bei Top-Level-Knoten ohne Icon `<span class="fa fa-file-o">` (JS 1246) und setzt `is-current` (Eltern) / `is-current--top` (Top-Level-Vorfahr des aktuellen Eintrags) (JS 1233–1244). Badges: Label-Text `[5]` → `span.a-TreeView-badge` (JS 1254).

### 5.2 Zustände & Klassen

| Zustand | Klasse(n) | Wo |
|---|---|---|
| aktuelle Seite (Pfad) | `is-current` (Content/Label), `is-current--top` (Row+Content des Top-Level-Vorfahren) | Tree |
| ausgewählt (Tastatur/Fokus-Knoten) | `is-selected` (Row/Content) | Tree |
| Hover | `is-hover` (nur Row; gesetzt vom Widget) | Tree |
| Fokus | `is-focused` (Row) | Tree |
| aufgeklappt / aufklappbar | `is-collapsible` / `is-expandable` (Node) | Tree |
| Nav ausgeklappt / eingeklappt | `js-navExpanded` / `js-navCollapsed` | body |
| Einklapp-Modus | `js-navCollapsed--icons` (Icon-Leiste) / `js-navCollapsed--hidden` (ganz weg, z. B. 1123) | body |
| Hamburger aktiv | `.t-Button--headerTree.is-active`, `aria-expanded="true"` | Header |

Präferenz: `sessionStorage["ORA_WWV_apex.toggleCore.nav.<APP_ID>.preferenceForExpanded"]` (app-weit) [gemessen].

### 5.3 Breiten-Mechanik

```
.t-Body            grid-template-columns: var(--ut-nav-collapsed-width, auto) 1fr auto    (Core 2522)
.t-Body-nav        width: var(--ut-nav-initial-width, 0)                                    (Core 2531)
.js-navExpanded    --ut-nav-initial-width: var(--ut-nav-width, 15rem)                       (Core 2569)
.apex-side-nav.js-navCollapsed .t-Body-nav { width: var(--ut-nav-collapsed-width, 3rem) }   (Core 4971)
.apex-side-nav.js-navCollapsed--icons { --ut-nav-collapsed-width: auto }                    (Core 5007)
.apex-side-nav.js-navCollapsed--icons .t-TreeNav { width: var(--ut-nav-collapsed-icon-width, 52px) }  (Core 5015)
.apex-side-nav.js-navCollapsed.js-navCollapsed--hidden { --ut-nav-collapsed-width: 0rem }   (Core 4964)
@media (max-width:479px) .apex-side-nav.js-navCollapsed { --ut-nav-collapsed-width: 0rem }  (Core 4960)
@media (max-width:479px) .apex-side-nav.js-navCollapsed--icons { --ut-nav-collapsed-icon-width: 0px } (Core 5011)
```
Gemessen: eingeklappt 52 px, ausgeklappt 240 px, Transition `width var(--ut-layout-transition,.1s)`.
Eingeklappt (Core 4974–5005): Toggle `display:none`, Label `color:transparent; position:unset`, Top-Level-Icon über volle Breite (`width:100%`, gemessen 36 px), Badge verkleinert (`--ut-treeview-collapsed-badge-*`).
**Hebel:** `--ut-nav-width` (expandiert), `--ut-nav-collapsed-icon-width` (Icon-Leiste; Redwood: `3.875rem` ab 480 px). Beide werden von JS **nicht** gelesen.

### 5.4 Tokens der Tree-Nav

| Variable | Default | Anmerkung |
|---|---|---|
| `--ut-body-nav-background-color` / `--ut-body-nav-text-color` | `#2e3439` / `white` (Vita 951; Vita-Dark gleich) | Nav-Fläche |
| `--ut-body-nav-border-color` / `--ut-body-nav-border-width` | component-border / 1px | als `inset box-shadow` rechts (Core 2535) |
| `--ut-body-nav-scrollbar-size/-thumb-background-color/-thumb-box-shadow/-track-background-color` | .25rem / rgba(255,255,255,.2) / – / #2e3439 | WebKit-Scrollbar |
| `--a-treeview-node-selected-background-color` / `-selected-text-color` | `#171a1d` / white | (Vita 990) |
| `--a-treeview-node-focused-background-color` / `-focused-text-color` / `-focused-shadow` | `#171a1d` / white / `inset 0 0 0 1px rgba(57,155,234,.5)` | |
| `--a-treeview-node-hover-background-color` | undefiniert | wird von Vitas hartem Hover-Wert überstimmt (§5.5) |
| `--a-treeview-node-selected-icon-color` / `--a-treeview-node-icon-color` | white / inherit | |
| `--a-treeview-node-padding-y/-x`, `-font-size`, `-line-height`, `-indent`, `-font-weight` | **lokal an `.t-TreeNav`**: .5rem/.5rem, `.75rem`, `1rem`, `0` (Core 4788) | Top-Level-Schrift `--ut-treeview-toplevel-node-font-size` (.875rem) |
| `--ut-treeview-icon-size`, `--ut-treeview-icon-container-width/-height/-border-radius`, `--ut-treeview-toplevel-icon-container-width/-height`, `--ut-treeview-node-icon-size`, `--ut-treeview-icon-opacity` | 1rem, 1.5rem … | Icon-Kasten (gemessen 24×24 px) |
| `--ut-treeview-node-indent`, `--ut-treeview-leaf-node-indent`, `--ut-treeview-leaf-padding-x/-y`, `--ut-treeview-toplevel-leaf-padding-x/-y`, `--ut-treeview-toggle-width` | 1rem, –, –, .5rem, 2rem | Einrückung/Untermenü |
| `--ut-treeview-badge-*`, `--ut-treeview-collapsed-badge-*` | Badge `#056AC8`/white (Vita 1058) | |
| `--ut-layout-transition` | `.1s` (Core 2450) | alle Layout-Übergänge |

Überschreib-Stelle: Tree-spezifische `--a-treeview-*` auf **`.t-TreeNav`** setzen (Core weist sie dort lokal zu), Farben dürfen auf `:root`.

### 5.5 Hart codierte Werte in Vita (müssen per Selektor überschrieben werden)

Vita 3015–3033 (Vita-Dark 3018–3036 identisch):
```css
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-current,
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-selected,
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-current--top.is-selected { background-color: #1e2225; }
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-current--top,
.t-TreeNav .a-TreeView-node--topLevel.is-collapsible > .a-TreeView-row,
.t-TreeNav .a-TreeView-node--topLevel ul { background-color: #171a1d; color: white; }   /* ganzer aufgeklappter Unterbaum! */
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important; }
```
Gemessen: selected Row `rgb(30,34,37)`, Unterliste `rgb(23,26,29)`, Hover `rgb(37,41,45)`.
Außerdem Varianten `.t-TreeNav--styleA` / `--styleB` (Template-Optionen; Vita 3037–3130) mit `#056AC8` bzw. `#056dcd !important` und `box-shadow: inset var(--ut-palette-primary) 4px 0 0` (Akzentbalken). Ein Theme muss mindestens diese Selektoren mit gleicher Spezifität (Hover: + `!important`) neu setzen, sonst bleibt der dunkle Vita-Look.

Hart codiert in Core: Toggle-Icon `content:"\e0c2"` mit `rotate(-90deg)` (Core 4856–4866), Default-Icon `\f016` (Core 4804–4810), `.t-TreeNav .is-current{font-weight:semibold}`.

### 5.6 Responsive-Verhalten der Side-Nav [Code + gemessen]

| Breite | Verhalten |
|---|---|
| ≥ 992 (`mq_lg`) | Init: Präferenz „expanded" → ausgeklappt, sonst eingeklappt (`js-defaultCollapsed` am Tree = Default „eingeklappt"). |
| < 992 | Bei Init und bei jedem Resize **eingeklappt**; manuell aufklappbar. Aufklappen der Nav klappt die Actions-Spalte zu und umgekehrt. [gemessen 900 px: 52 → 240 px, Inhalt schrumpft 848 → 660 px] |
| < 640 (`mq_sm`) | Aufgeklappt: Klick auf `.t-Body-main` klappt zu (JS 635). |
| < 480 (`mq_xs`) | Eingeklappt = Breite 0, `#t_TreeNav` `visibility:hidden` + `aria-hidden` (Icon-Leiste verschwindet). [gemessen 390 px] |
| **mobil aufgeklappt** | **Push, kein Overlay**: Grid `240px 150px 0px`, Inhalt auf 150 px gequetscht; `#pushModal` bleibt `display:none` (`pushModal.notify` ist leer). [gemessen, 24.2 = 26.1] |

### 5.7 Rezept: Overlay-Nav unter 992 px (reines CSS) **[gemessen 390/900 px]**

```css
@media (max-width: 991px) {
  .apex-side-nav.js-navExpanded { --ut-nav-collapsed-width: 0px; }          /* Grid-Spalte bleibt 0 → kein Push */
  .apex-side-nav.js-navExpanded .t-Body-nav {
    position: fixed;
    inset-block: var(--js-sticky-top, 0px) 0;                              /* unter dem Header */
    inset-inline-start: 0;
    height: auto;
    z-index: 900;                                                           /* über Title (490), unter Menüs */
    box-shadow: 0 0 2rem rgb(0 0 0 / .4);
  }
}
```
Ergebnis: Nav 240 px fixed über dem Inhalt, Main 390 px bzw. 900 px breit; Tap auf den Inhalt (<640 px) klappt weiterhin zu. Bei Icon-Modus auf Tablets springt der Inhalt beim Aufklappen von x=52 auf x=0 – ggf. `--ut-nav-collapsed-width: var(--ut-nav-collapsed-icon-width, 52px)` statt `0px` [unverifiziert]. Ein Backdrop fehlt (eigenes `::after` am `.t-Body-main` o. ä. [unverifiziert]).

---

## 6. Top Navigation

### 6.1 Menu Bar (`.t-Header-nav-list.a-MenuBar`) – Seite 1102/1120

DOM [gemessen]:
```html
<div class="t-Header-nav">
  <div id="t_MenuNav" class="t-Header-nav-list js-tabLike a-MenuBar a-MenuBar--overflow a-MenuBar--tabs" role="menubar">
    <ul>
      <li class="a-MenuBar-item [a-Menu--current] [a-Menu--split]">
        <a class="a-MenuBar-label">Menu Item 2</a>
        <span class="a-Menu-subMenuCol" role="button"><span class="a-Icon icon-menu-split-drop-down"></span></span>
        <div id="t_MenuNav_1m" class="a-Menu a-Menu--top u-DisplayNone" role="menu"></div>   <!-- Untermenü, position:absolute -->
      </li> …
```
Initialisiert per List-Template-JS: `menu({menubar:true, menubarOverflow:true, behaveLikeTabs: js-tabLike, callout: js-menu-callout})`.
Tokens: `.t-Header-nav` mappt `--a-menubar-*` auf `--ut-header-menubar-*` (Core 4286–4303) und setzt **lokal** `--a-menubar-item-padding-y:.875rem; -padding-x:1.25rem; -font-size:.875rem; -line-height:1.25rem`. Farben (Vita 960–968): Leiste `#2e3439`, aktuell/hover `#171a1d`, Text weiß, Trenner `rgba(255,255,255,.1)`.
Vita 2978–3009 hart: `.t-Header-nav .a-MenuBar{box-shadow: inset 0 -1px 0 var(--a-menubar-item-border-color)}`, `.a-MenuBar-label{min-height: calc(padding-y*2 + line-height)}`, current `font-weight:700`.
Gemessen: Leiste 48 px hoch, Item-Border links 1 px, aktuelles Item `rgb(23,26,29)`/700. Untermenü `div.a-Menu.a-Menu--top` → `.a-Menu-content > ul > li.a-Menu-item > .a-Menu-inner > .a-Menu-labelContainer > a.a-Menu-label` (app_ui, `--a-menu-*`).
Mobile (390 px): Leiste bleibt sichtbar als zweite Zeile (Header 96 px), Overflow-Menü des Widgets; **kein Hamburger** auf Top-Nav-Seiten.

### 6.2 Tabs-Navigation (`.t-NavTabs`) – Seite 1115/1121

DOM: `ul#…_navtabs.t-NavTabs.t-NavTabs--inlineLabels-lg.t-NavTabs--displayLabels-sm > li.t-NavTabs-item[.is-active] > a.t-NavTabs-link > span.t-Icon + span.t-NavTabs-label + span.t-NavTabs-badge` (im `.t-Header-nav`).
Gemessen Desktop: Leiste 40 px → Header 88 px, Sticky-Top 88 px. **Unter 768 px** wandert die Leiste per CSS `position:fixed; bottom:0` an den unteren Rand (z 100, gemessen 58 px hoch) und theme42.js setzt `#t_Footer{margin-bottom:58px}` inline (JS 1614), damit der Footer nicht verdeckt wird.
Tokens: `--ut-navtabs-background-color/-text-color/-box-shadow`, `--ut-navtabs-item-{background,text,border,highlight}-color`, `-item-active-*`, `-item-hover-*`, `-item-highlight-width` (Vita: `0rem` → kein Unterstrich; Aktiv-Highlight `var(--ut-palette-primary)`), `-item-padding-x/-y`, `-item-font-size/-line-height/-font-weight`, `--ut-navtabs-icon-size/-padding/-spacing`, `--ut-navtabs-badge-*`, mobile `--ut-xs-navtabs-*`.
Hart codiert: `.t-NavTabs-item{min-width:3rem; border-right:…}`, Badge-Maße ≥768 (`padding:0 .375rem; font-size:.6875rem; border-radius:.125rem`), `--stacked`-Varianten (Core 4723–4749).

### 6.3 Mega Menu (`.t-MegaMenu`) – Seite 1122/1124

Markup (List-Template „Top Navigation Mega Menu"): `div#t_MenuNav.t-MegaMenu.u-DisplayNone > div.a-Menu-content.t-MegaMenu-container > div.t-MegaMenu-body > ul.t-MegaMenu-list.t-MegaMenu-list--top > li.t-MegaMenu-item.t-MegaMenu-item--top[.t-MegaMenu-item--hasSub][.is-active] > span.a-Menu-item.t-MegaMenu-itemBody > (span.t-Icon, a.a-Menu-label.t-MegaMenu-labelWrap > span.t-MegaMenu-label + span.t-MegaMenu-desc, span.t-MegaMenu-badge)` + verschachtelte `ul.t-MegaMenu-list--sub`.
Verhalten [gemessen]: Das Menü hängt nicht im Header; theme42.js macht `#t_Button_navControl` zum Toggle (`t-Button--megaMenuToggle`, `data-menu="t_MenuNav"`, inline `display` → sichtbar trotz `apex-top-nav`). Geöffnet: `position:fixed`, z 2010, bei (8,40) 722×226 px. Header bleibt 48 px (Menü zählt nicht zur Header-Höhe).
Tokens: `--ut-megamenu-*` (Label/Desc/Icon/Badge/Item-Padding), `--a-menu-*`. Vita 2966: `.t-MegaMenu{--a-menu-focused-background-color:transparent; --a-menu-focused-text-color:initial}` + Hover-Label in `--ut-link-text-color` mit Unterstreichung (Core 13628).
Fallstricke: Spaltenbreite `max-width: var(--ut-nav-width, 15rem)` bei `--layout2Cols…5Cols` (Core 13809) → eine breitere Side-Nav verbreitert auch Mega-Menu-Spalten. `.t-MegaMenu-body{max-height:80dvh}`, Grid-Spalten `repeat(5,auto)` ab 768 px.

---

## 7. Body-Bereiche

### 7.1 Title Bar `.t-Body-title` + Breadcrumb Region

DOM (Position `REGION_POSITION_01`, Template „Title Bar"):
```html
<div class="t-Body-title" id="t_Body_title">
  <nav class="t-BreadcrumbRegion t-BreadcrumbRegion--showBreadcrumb t-BreadcrumbRegion--useBreadcrumbTitle">
    <div class="t-BreadcrumbRegion-top">
      <div class="t-BreadcrumbRegion-buttons t-BreadcrumbRegion-buttons--start"></div>
      <div class="t-BreadcrumbRegion-body">
        <div class="t-BreadcrumbRegion-breadcrumb"><ul class="t-Breadcrumb">li.t-Breadcrumb-item > a/span.t-Breadcrumb-label</ul></div>
        <div class="t-BreadcrumbRegion-title"><h1 class="t-BreadcrumbRegion-titleText">…</h1></div>
      </div>
      <div class="t-BreadcrumbRegion-buttons t-BreadcrumbRegion-buttons--end"></div>
    </div>
    <div class="t-BreadcrumbRegion-bottom"></div>    <!-- z. B. Smart Filter -->
  </nav>
</div>
```
- `position:sticky; top: var(--js-sticky-top)`, z 490, `backdrop-filter: var(--ut-body-title-backdrop-filter)` (Vita: `saturate(180%) blur(8px)`), `box-shadow: var(--ut-body-title-box-shadow)` (Vita `0 1px 0 0 rgba(0,0,0,.1)`), `border-bottom-width: var(--ut-body-title-border-width)` (Vita 0). Leer → `display:none` (`:empty`). Template-Option `js-hideTitleBar` blendet ganz aus.
- **Shrink** [gemessen 1201/1500/1601]: Scroll > 400 px (bzw. `.t-Body-info`-Höhe − 100) → `.t-Body-title-shrink`: Höhe 120 → 72 px, großer Titel 32 → 14 px (Breadcrumb-Zeilenstil), Dokumenthöhe −48 px. Nicht bei `--compactTitle` oder ohne Breadcrumb Region (JS 1131ff.).
- Tokens: `--ut-body-title-background-color/-text-color/-border-color/-border-width/-box-shadow/-backdrop-filter`, `--ut-breadcrumb-padding-x/-y` (1rem; mobil `.5rem`), `--ut-breadcrumb-region-gap/-spacing`, `--ut-breadcrumb-title-font-size` (2rem) / `-line-height` (3rem) / `-font-weight` / `-font-family`, `--ut-breadcrumb-item-font-size/-line-height/-font-weight/-text-color` (Vita `rgba(0,0,0,.65)`), `--ut-breadcrumb-item-active-*`, `--ut-breadcrumb-item-sep-opacity/-sep-spacing`, `--ut-xs-breadcrumb-*`.
- **Hart codiert & sehr „APEX-typisch"**: Trenner `.t-Breadcrumb-item:after{content:"\\"}` (Backslash; RTL `/`, Core 11446) → per `content` ersetzen (z. B. `"/"`, `"›"` oder Icon). Mobil wird nur das vorletzte Element angezeigt (Core 11519).
- Master-Detail/Marquee: `.t-PageBody--masterDetail .t-Body-title{--ut-body-title-box-shadow:none}`.

### 7.2 Linke Spalte `.t-Body-side` (Left Side Column / Side Columns)

`grid-area: side`, ≥640 px `width: var(--ut-body-sidebar-width, 15rem)`, `position:sticky; top: var(--js-page-title-height); height: calc(100dvh − var(--js-page-title-height))`, Schatten rechts `--ut-body-sidebar-border-width/-color`, Farben `--ut-body-sidebar-background-color/-text-color` (Vita white/black; Dark `#313436`).
Gemessen 1103: Side 240×756 px bei x=52, `top:144px` (= Header 48 + Title 96). Mobil (390): Side wird volle Breite **über** dem Inhalt (`u-unstick`, Höhe 83 px). `--js-page-title-height` wird nur gesetzt, wenn `#t_Body_side` existiert.

### 7.3 Inhalt `.t-Body-content` / `.t-Body-contentInner`

- `.t-Body-contentInner`: `padding-block: var(--ut-body-content-padding-y,1rem)`, `padding-inline: var(--ut-body-content-padding-x,1rem)`, `width: var(--ut-body-content-width,100%)`, `max-width: var(--ut-body-content-max-width)` (Vita `100%`; Redwood `87rem` bei „contained"), zentriert (`margin-inline:auto`). Unter 640 px: `--ut-xs-body-content-padding-x/-y` (.5rem). `t-PageBody--noContentPadding` setzt alles auf 0.
- `--ut-body-main-background-color`, `--ut-body-main-content-background-color` sind in Vita **undefiniert** (transparent) → freie Hebel für z. B. eine „Karten"-Fläche hinter dem Inhalt; die Seitenfarbe kommt von `body{background-color: var(--ut-body-background-color)}` (Core 328; Vita `#FDFDFD`, Dark `#252729`).
- `.t-Body-fullContent` (Position „Full Width Content") liegt **außerhalb** des Paddings.
- `.t-Body-info` (nur Marquee): `--ut-body-info-background-color/-text-color` (Fallback Title-Farben); darin `.apex-rds-container` sticky über JS (`getFixedHeight − RDS-Höhe`).

### 7.4 Rechte Spalte `.t-Body-actions` (Right Side Column / Side Columns / Marquee)

DOM: `div#t_Body_actions.t-Body-actions > button#t_Button_rightControlButton.t-Body-actionsToggle[.is-active] > span.t-Body-actionsControlsIcon` + `div.t-Body-actionsContent[role=complementary]` (#REGION_POSITION_03).
- `width: var(--ut-body-actions-width, 12.5rem)` (Vita 1967), `js-rightCollapsed` → `0rem`; `position:sticky; top/height` über `--js-sticky-top`; Schatten links `--ut-body-actions-border-width/-color`; Farben `--ut-body-actions-background-color/-text-color` (Vita `#f9f9f9`).
- Zustand per Inline-Script im Template vorbelegt: `sessionStorage["ORA_WWV_apex.toggleCore.right.<APP>.<PAGE>.preferenceForExpanded"]` → `js-rightExpanded/Collapsed`; Init ≥992 aufgeklappt. JS setzt `.t-Body-actionsContent` beim Zuklappen `visibility:hidden; overflow:hidden` inline.
- Toggle-Knopf: `position:absolute; right:100%` (hängt **außen links** an der Spalte, Laschen-Optik), Paddings `--ut-body-actionstoggle-padding-x/-y` (hover/aktiv `.625rem` – „Ausfahr"-Effekt), Farben `--ut-body-actionstoggle-*`, vertikaler Versatz `--ut-body-actions-toggle-offset`. Icon hart: `font-size:1.25rem`, Glyphen `\e013`/`\e016` (Core 3999–4027).
- Gemessen: 200 px Breite (1440); mobil aufgeklappt schiebt sie den Inhalt (Grid `0px 190px 200px`).

### 7.5 Footer `.t-Footer`

`grid-area: content-footer` (nur Content-Spalte), `display:grid` (≥640 px: `"footer-body footer-top"`), `padding: var(--ut-footer-padding-y,1rem) var(--ut-footer-padding-x,1rem)`, `gap: var(--ut-footer-item-spacing)`, Farben `--ut-footer-background-color` (Vita `#f2f2f2`) / `-text-color` / `-border-color/-width` (oben). Inhalte: `.t-Footer-content` (#REGION_POSITION_05), `.t-Footer-apex` (`.t-Footer-version`, `.t-Footer-customize`, `span.u-BuiltWithAPEX`), `.t-Footer-top > a#t_Footer_topButton.t-Footer-topButton` (runder „nach oben"-Knopf, Tokens `--ut-footer-top-*`; Standard 2.5rem, `border-radius:100%`, Opacity .75). Mobil zentriert. theme42.js setzt ggf. `margin-bottom`/`padding-bottom` inline (NavTabs/Sticky-Buttons).

---

## 8. Page Templates im Überblick

Quelltexte identisch in 9042 (26.1) und 9242 (24.2), außer `!ATTR`-Escapes, `x-ua-compatible`-Meta (24.2) und Template „Blank" (nur 26.1).

| Template (Seite) | Body-Klassen | Shell-Teile | Gemessen (1440 / 390) |
|---|---|---|---|
| **Standard** (1101 Side-Nav, 1102 Top-Nav) | `t-PageBody --hideLeft --hideActions t-PageTemplate--standard` | Header, Nav/Top-Nav, Title, Content, Footer | 1101: Header 48, Nav 52 (Icon), Title 96 · 1102: Header 96 (inkl. Menüleiste) / mobil 96 |
| **Left Side Column** (1103/1104) | `--showLeft --hideActions t-PageTemplate--leftCol` | + `#t_Body_side` | Side 240 px, `--js-page-title-height:144px`; mobil Side oben 390×83 |
| **Right Side Column** (1105/1106) | `--hideLeft t-PageTemplate--rightSideCol` + `js-right*` | + `#t_Body_actions` | Actions 200 px; Grid `52px 1188px 200px` |
| **Left and Right Side Columns** (1109/1110) | `--showLeft t-PageTemplate--leftRightCol` | Side + Actions | Content 948 px |
| **Marquee** (1107/1108) | `--masterDetail --hideLeft t-PageTemplate--marquee` | + `#t_Body_info` (#REGION_POSITION_02) vor `contentInner`, Actions; JS-Modul `masterDetail` (Sticky-RDS, Sticky-Report-Header) | Title 48 (shrink), Actions 200 |
| **Minimal (No Navigation)** (1113) | `--hideLeft --hideActions t-PageBody--noNav t-PageTemplate--minimal` | Header **ohne** `.t-Header-nav`, kein `SIDE_GLOBAL_NAVIGATION_LIST`; Hamburger = `fa fa-bars`, ausgeblendet | Header 48 |
| **Login** (1114, 9999) | `t-PageBody--login t-PageTemplate--login` (+ `t-LoginPage--bg1..3`, `--split` per Option) – **kein `#t_PageBody`** | `.t-Login-bg > .t-Login-bgImg`, `.t-Login-container > header.t-Login-containerHeader / main.t-Login-containerBody / footer.t-Login-containerFooter`; Region `.t-Login-region > .t-Login-header(.t-Login-logo, .t-Login-title) / .t-Login-body / .t-Login-buttons / .t-Login-links / .t-Login-subRegions` | Region 460×406 zentriert; mobil 374 px; `--js-sticky-top:0px`; theme42-Toggles werden nicht initialisiert |
| **Blank** (nur 26.1) | `t-PageBody--hideLeft --hideActions t-PageBody--blank` | nur `main#main.t-Body-contentInner` + Inline-Dialogs | – |
| **Tabs-Navigation** (1115) | Standard + `apex-top-nav` | `.t-NavTabs` in `.t-Header-nav` | Header 88; mobil Tabs unten fixiert (58 px) |
| **Sticky Mobile Header** (1116/1117) | + `js-pageStickyMobileHeader` | Title bleibt <640 px sticky | 1117 mobil: Title `sticky top:48px` statt `relative` |
| **Modal Dialog** (1111, 1912) | `t-Dialog-page t-Dialog-page--standard t-PageTemplate--dialog` | §9 | |
| **Wizard Modal Dialog** (1112, 1920) | `t-Dialog-page t-Dialog-page--wizard t-PageTemplate--wizard` | §9 | |
| **Drawer** (1918) | `t-Drawer-page t-PageTemplate--drawer` + `js-dialog-class-*` | §9 | |

Login-Tokens: `--ut-login-page-background-color` (Vita `#e6e6e6`, wird zu `--ut-body-background-color`), `--ut-login-region-background-color` (`rgba(255,255,255,.65)`), `-filter` (`blur(4px)` als `backdrop-filter`), `-box-shadow`, `-border-*`, `-border-radius` (.5rem), `-padding` (2rem), `-max-width` (28.75rem), `--ut-login-logo-size/-font-size/-border-radius`, `--ut-login-container-item-spacing`. Hart: `.t-Login-title{font-size:1.5rem}`, `.t-Login-header{padding:1.5rem 0}`, Login-Buttons `padding:1rem 1.5rem; font-size:1rem; width:100%`, Animation `loginFade` (0.35s), Hintergründe `.t-LoginPage--bg1/2/3` = SVG `stripes/radar/circles` + `--ut-body-background-color: var(--ut-palette-primary)` (Core 3081–3103) – sehr wiedererkennbarer APEX-Look.

Hinweis: Dialog-Seiten direkt (ohne Dialog-Kontext) aufzurufen liefert nur eine Fehlerseite (`t-Alert--danger`) im Standard-Dialog-Template [gemessen 1111/1112/1920/1918 direkt] – zum Testen immer über Launcher öffnen (1910, 1917, 1208 „Open Modal Dialog Wizard").

---

## 9. Modal Dialog, Wizard Modal, Drawer

### 9.1 Zwei Ebenen

**Ebene A – aufrufende Seite (jQuery UI Dialog)** [gemessen 1910 „Dialog with Auto Size"]:
```html
<div class="ui-dialog ui-corner-all ui-widget ui-widget-content ui-front ui-dialog--apex t-Dialog-page--standard ui-draggable"
     role="dialog" aria-modal="true" style="position:fixed; height:205px; width:720px; top:347.5px; left:360px; max-width:100%">
  <div class="ui-dialog-titlebar ui-corner-all ui-widget-header ui-helper-clearfix ui-draggable-handle">
    <h1 class="ui-dialog-title">Auto Sizing Modal Dialog</h1>
    <button class="ui-button … ui-button-icon-only ui-dialog-titlebar-close" title="Close"><span class="ui-button-icon ui-icon ui-icon-closethick"></span></button>
  </div>
  <div id="apex_dialog_1" class="ui-dialog-content ui-widget-content js-dialogReady"><iframe …></iframe></div>
</div>
<div class="ui-widget-overlay ui-front"></div>     <!-- rgba(0,0,0,.25), z 900 -->
```
Die Klasse aus dem Template (`dlgCls`) landet am `.ui-dialog`: `t-Dialog-page--standard`, `t-Dialog-page--wizard` bzw. `t-Drawer-page--standard` + Template-Optionen, die die Dialogseite als `js-dialog-class-<klasse>` am iframe-Body trägt (theme42 `ut.dialog`, JS 264–270), z. B. `t-Drawer--pullOutStart t-Drawer--sm`.

**Ebene B – iframe-Inhalt**:
```html
<body class="t-Dialog-page t-Dialog-page--standard t-PageTemplate--dialog … js-dialogReady">
  <form id="wwvFlowForm">
    <div class="t-Dialog" role="dialog">                          <!-- grid: dialog-header | dialog-body | dialog-footer -->
      <div class="t-Dialog-header">#REGION_POSITION_01#</div>     <!-- Wizard: ul.t-WizardSteps -->
      <div class="t-Dialog-bodyWrapperOut"><div class="t-Dialog-bodyWrapperIn">   <!-- In: absolut, overflow:auto -->
        <div class="t-Dialog-body" role="main">#BODY#</div></div></div>
      <div class="t-Dialog-footer">#REGION_POSITION_03#</div>     <!-- Buttons (t-ButtonRegion) -->
    </div>
```
Drawer identisch mit `t-Drawer-page`, `.t-Drawer`, `.t-Drawer-header/-bodyWrapperOut/-bodyWrapperIn/-body/-footer`.

### 9.2 Tokens & Werte

- jQuery-UI-Rahmen (app_ui 15935ff.): `--jui-dialog-background-color/-text-color/-border-color/-border-width/-border-radius/-shadow/-font-size`, Titelzeile `--jui-dialog-titlebar-padding-x/-y/-background-color/-text-color/-border-width/-border-color`, `--jui-dialog-title-font-size/-line-height/-font-weight`, Close-Button `--jui-dialog-title-close-*` (inkl. `-icon` = Glyphe), Content `--jui-dialog-content-padding-*` (UT: 0), Buttonpane `--jui-dialog-buttonpane-*`. Vita-Werte (Vita 396–422): Hintergrund = Region-/Component-Farbe, Radius = component radius (gemessen 2 px), Schatten `var(--ut-shadow-lg), 0 0 0 1px border`, Titel 1rem/1.5rem, Titelzeile 12/16 px Padding + 1px Linie.
- Overlay: `--jui-overlay-background-color` (Theme-Standard.css 394: `rgba(0,0,0,.25)`), `--jui-overlay-opacity`.
- Inhalt: `--ut-dialog-padding-x/-y` (1rem; `t-Dialog--noPadding` → 0), `--ut-dialog-region-padding-*` (Inline-Dialog-Regionen), `--ut-dialog-spinner-color`, `--ut-dialog-content-font-size`.
- Animationen: `anim-dialogOpen/Close` mit `--js-dialog-open-timing/-close-timing` (.2s, nur ohne reduced motion), Klasse `is-closing`. Iframe-Seite blendet über `.js-dialogReady` ein (`opacity 0 → 1`).
- Wizard (`.t-Dialog-page--wizard`, Core 5114): Titelzeile ohne Linie/Hintergrund, Titel 1.25rem/2rem zentriert, Buttonpane-Größen. [gemessen: `border-bottom 0px`, Header-Zeile des Grids 70 px mit `ul.t-WizardSteps`]
- Drawer (Core 5326ff.): `height:100% !important; max-height:100dvh; top:0; border-radius:0 !important; max-width: var(--ut-dialog-pullout-max-width, 90dvw) !important`. Größen **hart mit `!important`**: `--sm 29rem`, `--md 40.5rem`, `--lg 60.5rem`, `--xl 110.75rem`; oben/unten `--ut-dialog-pullout-block-size` (20/30/50rem/90%). Richtung `t-Drawer--pullOutStart/End/Top/Bottom` mit eigenen Keyframes. [gemessen: 464×900 px, x=0, radius 0]
- Responsive: `.ui-dialog{max-width:100dvw; max-height:100dvh}`; theme42 `theme.initResponsiveDialogs()` (Code in desktop_all, nicht untersucht); PWA-Dialog <640 px als Bottom-Sheet (Core 5228).

### 9.3 Fallstricke Dialoge

1. Titelzeile, Schließen-Button, Rahmen, Schatten und Overlay **gehören zur aufrufenden Seite** – die iframe-Seite hat keine eigene Titelzeile. Wer z. B. einen „randlosen" Dialog mit großem Titel will, muss `.ui-dialog--apex` im Parent und `.t-Dialog` im iframe gemeinsam gestalten.
2. Hintergrund des Dialogs ist doppelt: `.ui-dialog` (Parent, `--jui-dialog-background-color`) **und** `.t-Dialog`/`.t-Drawer` (iframe, `var(--ut-component-background-color)`, Core 5044/5363). Beide konsistent halten (sonst Farbkanten, besonders im Dark-Style).
3. Drawer-Maße/Radien sind `!important` → eigene Werte nur mit `!important` und mind. gleicher Spezifität (`.ui-dialog.t-Drawer--md` o. ä.).
4. Dialogseiten haben keinen Header → `--js-sticky-top` spielt dort keine Rolle; `theme.modalAutoSize` misst `.t-Dialog-header/-body/-footer` (JS 862–867) – Paddings dort beeinflussen die Auto-Höhe.
5. Inline-Dialoge (`#t_Body_inlineDialogs`, `.ui-dialog--inline`) und Drawer-Regionen (`.ui-dialog--drawer`) nutzen dieselben `--jui-*`-Tokens, aber `.t-DialogRegion-*`/`.t-DrawerRegion-*`-Klassen.

---

## 10. Responsive-Übersicht

| Schwelle | CSS (hart codiert in Core, Anzahl Media-Queries) | JS (theme42, aus `--js-mq-*`) |
|---|---|---|
| 480 (`max 479`) | Nav-Icon-Leiste 0 px, NavBar-Labels aus, Breadcrumb-Buttons umbrechen (34×) | `mq_xs`: Tree `visibility:hidden` wenn zu |
| 640 (`max 639` / `min 640`) | `.t-Body-main` einspaltig ↔ `"title title"/"side content"`, Side-Breite, Footer zentriert, `form` `overflow:clip`, Content-/Breadcrumb-Paddings (40×/24×) | `mq_sm`: ≤640 Title/Side `u-unstick`; <640 Klick auf Main schließt Nav; Peeking-Header ≥640 |
| 768 (`max 767` / `min 768`) | NavTabs unten fixiert, Mega-Menu-Grid, Label-/Badge-Größen (13×/21×) | `mq_md`: Sticky-Mobile-Footer, NavTabs-Footer-Abstand |
| 992 | wenige Regeln (3×/2×) | `mq_lg`: Nav/Actions Init & Auto-Collapse, gegenseitiges Zuklappen |
| 1200 / 1400 | Grid-Spalten (`col-xl`, `col-xxl`) | nicht genutzt |

Off-by-one-Beobachtungen [Code]: Title/Side werden bei **genau 640 px** schon entsperrt (`min-width: mq_sm+1`), während die CSS-Zweispaltigkeit ab 640 greift; Sticky-Button-Region: JS verankert unter 768, CSS `position:fixed` greift erst unter 640 (Core 9307).

---

## 11. Unterschiede UT 24.2 ↔ 26.1 (Shell)

- **theme42.js**: Shell-Logik identisch (Header-Offset, Toggles, Breakpoints, Dialog-Wrapper). 26.1 nutzt `apex.util` als Parameter, `.on("scroll")` statt `.scroll()`, triggert zusätzlich `theme42layoutchanged` beim Actions-Toggle, Tabs-Region mit Icons.
- **Core.css** Scaffolding/Header/Nav/Dialog nahezu identisch; neu in 26.1: `.no-js .t-Body-nav{height:100%}`, `t-PageBody--blank` (+ Template „Blank"), `t-PageBody--verticalTop/Middle/Bottom`, Tree-Default-Icon nur bei `js-navCollapsed` bzw. ohne `js-hideDefaultIcon` (24.2: immer `\f016`), Tree-Badge mit logischen Properties (24.2: `right/left` + `.u-RTL`), `.t-DialogRegion-footer`, Drawer-Page-Höhenregeln. Bugfix 26.1: Menubar-Badge-Textfarbe nutzte in 24.2 fälschlich `--ut-header-menubar-badge-background-color`.
- **Vita.css**: Shell-Tokens identisch (Header `#056AC8`, Nav `#2e3439`, Höhen/Breiten gleich); StyleA-Unterzeilen-Hintergrund 24.2 `var(--ut-body-nav-background-color)` → 26.1 `var(--a-treeview-node-selected-background-color)`.
- **Templates (DB)**: identisch bis auf `!ATTR`-Escapes, `x-ua-compatible` (24.2) und „Blank" (nur 26.1).
- **Gemessen**: Header-/Nav-/Title-Maße, Nav-Toggle (Desktop/Mobil), Mega Menu, Dialog/Drawer/Wizard-DOM und das Header-Höhen-Experiment `hh1` ergaben auf 9042 und 9242 **identische** Werte.
→ Ein Theme-CSS kann für beide Versionen dieselben Shell-Selektoren verwenden. Die einzige Stelle mit Versionsbezug: Icons der Tree-Nav-Knoten ohne eigenes Icon (Default-`fa-file-o`).

---

## 12. Checkliste & Beispiel für Theme-Autoren

**Sichere Token-Hebel (reines `:root`/Style-Scope):**
`--ut-header-height`, `--ut-header-padding-x/-y`, `--ut-header-item-spacing`, `--ut-header-background-color`, `--ut-header-text-color`, `--ut-header-border-*`, `--ut-header-box-shadow`, `--ut-logo-*`, `--ut-nav-width`, `--ut-nav-collapsed-icon-width`, `--ut-body-nav-*`, `--a-treeview-node-*` (auf `.t-TreeNav`), `--ut-treeview-*`, `--ut-header-menubar-*`, `--ut-navtabs-*`, `--ut-megamenu-*`, `--a-menu-*`, `--ut-body-background-color`, `--ut-body-main(-content)-background-color`, `--ut-body-title-*`, `--ut-breadcrumb-*`, `--ut-body-content-padding-*`, `--ut-body-content-max-width`, `--ut-body-sidebar-*`, `--ut-body-actions-*`, `--ut-body-actionstoggle-*`, `--ut-footer-*`, `--ut-login-*`, `--jui-dialog-*`, `--jui-overlay-background-color`, `--ut-dialog-*`, `--ut-layout-transition`.

**Selektor-Overrides nötig:** `.t-Button--header` (Vita-Zustandsfarben), `.t-TreeNav …a-TreeView-row.is-current/.is-selected/.is-hover` + `…node--topLevel ul` (Vita, Hover `!important`), `.t-TreeNav--styleA/B`, `.t-Header-nav .a-MenuBar*` (Vita), `.t-Breadcrumb-item:after` (Trenner), `.t-Header-controlsIcon` (Hamburger-Form), `.t-LoginPage--bg*` / `.t-Login-*` (Login-Look), `.t-Drawer--*` (Maße, `!important`), `.t-Body-actionsToggle` (Laschen-Form).

**Nicht anfassen:** Grid-Area-Namen, `display`/`position` von `.t-Body*`-Containern (außer bewusst, s. Overlay-Rezept), `--js-*`-Variablen (lesen ja, setzen nein), `#t_Body_content_offset`, `u-unstick`.

Beispiel (Auszug, Idee für einen „nicht-APEX"-Rahmen; Werte beispielhaft, nur die markierten Mechaniken sind verifiziert):
```css
:root {
  --ut-header-height: 3.5rem;                 /* verifiziert: JS übernimmt Höhe */
  --ut-header-padding-x: 1rem;
  --ut-header-background-color: var(--brand-surface);
  --ut-header-text-color: var(--brand-text);
  --ut-header-border-width: 0px;
  --ut-header-box-shadow: none;
  --ut-nav-width: 16rem;                      /* JS liest das nicht; wirkt auch auf Mega-Menu-Spalten */
  --ut-nav-collapsed-icon-width: 4rem;
  --ut-body-nav-background-color: var(--brand-surface);
  --ut-body-nav-text-color: var(--brand-text);
  --ut-body-title-backdrop-filter: none;
  --ut-body-title-box-shadow: none;
}
.t-Button--header { --a-button-hover-background-color: var(--brand-hover); --a-button-border-radius: .75rem; }
/* Vita-Hardcodes der Tree-Nav neutralisieren (gleiche Spezifität; Hover braucht !important) */
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-current--top,
.t-TreeNav .a-TreeView-node--topLevel.is-collapsible > .a-TreeView-row,
.t-TreeNav .a-TreeView-node--topLevel ul { background-color: transparent; color: inherit; }
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-selected,
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-current { background-color: var(--brand-selected); }
.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: var(--brand-hover) !important; }
.t-TreeNav .a-TreeView-row { border-radius: .5rem; inset-inline: .5rem; width: calc(100% - 1rem); }  /* Pill-Optik, unverifiziert */
.t-Breadcrumb-item:after { content: "/"; }
```

Testhinweise: Nav-Zustände über Klick auf `#t_Button_navControl` prüfen (Reference App startet eingeklappt); Breiten 1440, 900 (<992), 600 (<640), 390 (<480) prüfen; Top-Nav (1102), Tabs (1115, mobil unten), Mega Menu (1122), Side Columns (1109), Marquee (1107, Scroll → Shrink), Login (1114/9999), Dialoge über 1910/1917/1208; nach Header-Änderungen `--js-sticky-top` am `<html>`-Inline-Style gegen die tatsächliche Header-Höhe prüfen.
