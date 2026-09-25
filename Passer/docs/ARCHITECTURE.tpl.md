# Passer – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: **Zweifarbendruck auf kühlem Papier.** Teal ist die Arbeitsfarbe, Fluoreszenz-Pink der zweite Farbauszug, der leicht verrutscht darunter liegt (Passerversatz), Gelb der Marker. Text steht in der Überdruck-Tusche, einem tiefen Indigo. Schrift: Bricolage Grotesque.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Passer/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: {{DATE}}. Änderungen am Text nur in der Vorlage.

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

{{FARB}}

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

{{KAT}}

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Passer ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--pa-cat-N) 60%, #fff)` mit Text `--pa-on-light` (min. 4,6 : 1), 31–45 = `color-mix(in srgb, var(--pa-cat-N) 55%, #000)` mit Text `--pa-on-dark` (min. 4,8 : 1). So scheint keine Vita-Farbe durch. Die Textvarianten `.u-color-N-txt` mischen Tusche bei, bis jede Stufe auf Papier **und** Bogen ≥ 4,5 : 1 erreicht (utilities.css, berechnet aus den Tokens).

### 3.4 Maß-, Schrift-, Druckbild-, Dichte- und Fokus-Tokens (modusneutral)

{{SKALA}}

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--pa-control-h 2.5rem`, `--pa-control-h-sm 2rem`, `--pa-control-h-lg 3rem`, `--pa-row-h 2.5rem`, `--pa-head-h 2.5rem`, `--pa-hit-min 2.5rem`, `--pa-checkbox-size 1.25rem`. Alle abgeleiteten Hebel rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): weißes Papier und weißer Bogen, Kopf ohne Vollton (weiß mit Tusche), `--pa-plate`, `--pa-header-plate`, `--pa-header-dots`, `--pa-halftone-ink` transparent, `--pa-grain: none`, keine Schatten; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

**Schrift:** Bricolage Grotesque trägt drei Achsen. `font-optical-sizing: auto` (base.css) stellt `opsz` auf die Schriftgröße: Seitentitel (32 px) werden eng und kräftig, Tabellenzellen (13 px) offen und ruhig. Seitentitel stehen im Plakat-Schnitt (`--pa-fw-display` 760, `font-stretch: --pa-stretch-narrow` 88 %), der Login-Titel mit 800 und 86 %.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Passer/tools/check-tokens.mjs`).

{{KONTRAST}}

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
