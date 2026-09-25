# Kracherl – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: „Sommer im Biergarten“ – sonnengelbes Band mit EINER Wellenkante und Sprudelblasen, weiße Etiketten-Karten auf Lavendel-Grund, Überschriften in Etikett-Violett (Bitter), Text in PT Sans, Brause-Orange für Fokus und „hier bin ich“; dunkel „Biergarten bei Nacht“ mit Laternengelb.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Kracherl/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: {{DATE}}. Änderungen am Text nur in der Vorlage.

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

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--kr-*` oder aus UT-/APEX-Tokens, die die Brücke setzt. Ausnahme: Attribut-Selektoren, die fest codierte JET-Werte *finden* (viz.css).
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen.
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--kr-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--kr-c-*` auf dem Komponenten-Selektor (§5.4).
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui (TreeNav-Hover, Drawer-Radius, IR-Dialogliste …), mit gleichem Selektor und einem Kommentar zur Quelle (§5.3).
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** nie eigene Ringfarben; nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` lokal anpassen oder `--kr-focus-shadow*` verwenden (§5.5). Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--kr-control-h`, `--kr-row-h`, `--kr-head-h` ableiten (Desktop 32/36/38 px, Touch 40 px automatisch; §5.6).
9. **Farbdisziplin:** *Gelb ist Rahmen, nie Lesefläche* – Band, Login-Himmel und das Etikett (aktueller Nav-Eintrag, aktive Seite). *Violett schreibt* – Überschriften (`--kr-heading`), Markentinte (`--kr-brand-ink`), Primäraktion (`--kr-accent`, mit gelber Schrift). *Orange zeigt* – Fokus und „hier bin ich“ (`--kr-mark`). Daten in Kategoriefarben, Status in Statusfarben (§5.8).
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--kr-header-h`). Die Welle hängt am Desktop als `::after` *unter* dem Kopf und zählt nicht zur gemessenen Höhe; auf dem Phone (< 640 px) zählt ein Wellenstreifen mit (`--kr-header-h` + `--kr-wave-h`, §5.9).
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§6).

**Eine Welle:** Nie gestapelte Wellenbänder und nie die Farbfolge Gelb–Orange–Rot–Pink–Lila. Erlaubt ist genau eine einfarbige Wellenkante (`--kr-wave`, `--kr-wave-rise`).

---

## 1. Dateistruktur und Zuständigkeit

```
Kracherl/
  theme.json                       Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta); Theme-Variante 145   [Fundament]
  assets/fonts/                    Bitter (variabel) + PT Sans (400/700, normal/kursiv), latin + latin-ext, OFL [Fundament]
  docs/ARCHITECTURE.md             dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)                   [Fundament]
  tools/check-tokens.mjs           Kontraste (auch Band/Etikett), Stufen, Danger↔Akzent, Palette (CVD, Akzent-Abstand,
                                   Farbton, Wellen-Farbfolge), Oracle-Blau                                   [Fundament]
  tools/build-architecture.mjs     baut docs/ARCHITECTURE.md (Tabellen aus gen-token-tables.mjs + check-tokens) [Fundament]
  src/
    kracherl-light.css             Einstieg Light: tokens/light.css → index.css                                [Fundament]
    kracherl-dark.css              Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css  [Fundament]
    kracherl-auto.css              Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                                   (beide „screen and (prefers-color-scheme: dark)“) → index.css             [Fundament]
    index.css                      modusneutraler Kern: Reihenfolge aller Imports                            [Fundament]
    tokens/light.css               Farb-Tokens hell   – NUR :root, NUR --kr-* (+ --ut-color-scheme)          [Fundament]
    tokens/dark.css                Farb-Tokens dunkel – exakt dieselben Namen wie light.css                   [Fundament]
    tokens/scale.css               Maß-, Schrift-, Form-, Wellen-, Dichte-, Fokus-Geometrie-Tokens + < 640 px [Fundament]
    tokens/print.css               Druck: Band, Blasen, Seitengrund, Schatten weg (nur unter „print“)         [Fundament]
    fonts.css                      @font-face „Kracherl Slab“ (Bitter) und „Kracherl Text“ (PT Sans)          [Fundament]
    bridge.css                     --kr-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender Ebenen (+ pointer: coarse) [Fundament]
    base.css                       Schrift, Skala, h1–h6 (Slab), Links, ::selection, Fokus, Scrollbars, tabular-nums, pre, Druck [Fundament]
    components/shell.css           Band + Welle + Blasen, Tree Nav + Etikett, Menüleiste, Tabs-Navigation, Mega Menu,
                                   Seitengrund, Title Bar, Breadcrumb, RDS/Tabs, Spalten, Footer, mobile Schublade
    components/login.css           Login-Seite (Himmel, aufsteigender Grund mit Welle, Karte, Blasen-Animation)
    components/regions.css         Region als Karte, Akzente, Hero, Alert, Collapsible, Button Container, Content Block, Wizard, Carousel
    components/buttons.css         t-Button/a-Button/ui-button, Hot/Primary/Status, Pillen-Gruppen, Buttons in Feldern
    components/forms.css           Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker, Datei, RTE, Validierung
    components/overlays.css        Menüs, Dialoge, Drawer, Popups, Tooltips, Meldungen
    components/reports.css         Classic Report, Interactive Report, Interactive Grid (als Karten), Pagination
    components/search.css          Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css           Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css         Badges, Avatare, Template Components, Links-Liste, Media List, Timeline, Comments, Wizard Progress
    components/viz.css             Charts (JET), Kalender, Karte, Tree
    components/utilities.css       u-color-*, u-hot/u-success …, sonstige u-*-Klassen
```

Das Theme entstand als Kopie des ersten Themes dieses Projekts und wurde vollständig umgestaltet: neues Token-Modell (Band, Seitengrund, Etikett, Markentinte, Marke), neue Shell (`shell.css`, `login.css`, `regions.css` neu geschrieben), Karten statt offener Flächen, neue Schriften, neue Palette. Die bewährte technische Grundlage (Brücke, Fokus-System, Dichte, Vita-Neudeklarationen, schwebende Ebenen) ist geblieben.

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#kracherl/kracherl-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
Folge: Bei gleicher Spezifität gewinnt unser Bundle gegen alles von Oracle, App-/Seiten-CSS gewinnt gegen uns (gewollt: Apps bleiben übersteuerbar).

### 2.2 Im Bundle (verbindlich)

| # | Datei | Inhalt |
|---:|---|---|
| 1 | `tokens/light.css` **oder** `tokens/dark.css` | Farb-Tokens des Styles (Auto: hell, danach Delta + dunkel unter Media) |
| 2 | `tokens/scale.css` | Maße, Schrift, Formen, Welle, Dichte, Fokus-Geometrie, Mobil-Überschreibung |
| 3 | `fonts.css` | `@font-face` |
| 4 | `bridge.css` | Mapping auf UT/APEX/JET, `@media (pointer: coarse)` |
| 5 | `base.css` | globale Grundlagen, niedrige Spezifität (`:where`; Ausnahmen: Überschriften `h1`–`h6` 0,0,1 gegen die Element-Regeln aus UT Core, §5.7; Tastatur-Fokusring 0,2,0, §5.5) |
| 6–17 | `components/*.css` | in der Reihenfolge von `index.css`: shell, login, regions, buttons, forms, overlays, reports, search, cards, content, viz, utilities |
| 18 | `tokens/print.css` | nur `@media print` |

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `kracherl-dark.css` die hellen Tokens zusätzlich unter `print`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`kracherl-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (verifiziert, §6). Jede Regel, die nur in einem Modus greift, bricht diese Eigenschaft.

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--kr-band`, `--kr-heading`, `--kr-mark`, `--kr-danger-tint` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--kr-control-h`, `--kr-r-lg`, `--kr-wave`, `--kr-fs-sm` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--a-button-border-radius: var(--kr-r-pill)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-Header { --kr-c-bubbles: … }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--hot { --a-button-background-color: var(--kr-accent) }` | Komponenten |

Benennung: `--kr-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--kr-band-ink`, `--kr-soft-hover`, `--kr-success-tint`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

**Die Farbrollen von Kracherl:**

| Rolle | Token | hell | dunkel | wofür |
|---|---|---|---|---|
| Band | `--kr-band` (+ `-ink`, `-brand`, `-hover`, `-press`) | Sonnengelb | Nachthimmel-Violett | Kopf, Login-Himmel, Welle, Tabs-Navigation unten |
| Seitengrund | `--kr-page` (+ `-hover`, `-press`) | Lavendel-Hell | Violett-Schwarz | Navigation, Title Bar, zwischen den Karten |
| Region | `--kr-surface` | Weiß | gestuftes Violett | Karten: Regionen, Berichte, Alerts, Button Container |
| Etikett | `--kr-sun`, `--kr-sun-ink` | Gelb/Violett | Gelb/Nachtviolett | aktueller Nav-Eintrag, aktive Seite, Hero-Icon |
| Überschrift | `--kr-heading` | Violett | Laternengelb | Seiten-, Region-, Dialog-, Karten-, Login-Titel, Kennzahlen |
| Markentinte | `--kr-brand-ink` | Violett | Flieder-Hell | Sekundär-Buttons, Tabellenköpfe, aktive Tabs, Nav- und Kachel-Icons, Zähler |
| Primäraktion | `--kr-accent` (+ `-on`, `-hover`, `-press`) | Violett + gelbe Schrift | Gelb + dunkle Schrift | Hot-Button, gewählter Tag, „heute“ im Kalender |
| Auswahl-Marke | `--kr-accent-text` | Violett | Gelb | Checkbox/Radio/Switch, Menü-Häkchen, Auswahl-Kante |
| Auswahl-Fläche | `--kr-accent-tint`, `-tint-2` | Sonnenstrahl | Colabraun im Laternenlicht | gewählte Zeilen, Menüeinträge, `::selection`, `t-Button--primary` |
| Marke | `--kr-mark` = `--kr-focus-ring-color` | Brause-Orange | helles Orange | Fokus, aktiver Tab (Strich), aktueller Link/Wizard-Schritt, Sterne |

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--kr-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--kr-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal. Einzige Ausnahme ist die Grundfläche schwebender Ebenen (§3.6).

### 3.2 Farb-Tokens (hell / dunkel)

{{FARB}}

**Entscheidungen:**
- *Violett auf Gelb, nie Weiß:* Weiß auf `#FFC400` hätte 1,6 : 1. Auf dem Band steht `--kr-band-ink` (8,8 : 1); der aktuelle Eintrag von Menüleiste und Tabs-Navigation im Band trägt das Paar der Primäraktion (`--kr-accent`/`-on`): hell Gelb auf Violett, dunkel Violett-Schwarz auf Gelb – nachts also dasselbe gelbe Etikett wie in der Seitennavigation.
- *Dunkel gestuft:* Region `#291E52` gegen Seitengrund `#110A26` ≥ 1,25 : 1 (geprüft), Band `#2D1D6A` gegen Seitengrund ≥ 1,2 : 1 – die Welle bleibt nachts sichtbar.
- *Gelb nur für Titel (dunkel):* Die Markentinte ist dunkel Flieder statt Gelb. Sonst läsen sich Sekundär-Buttons und Tabellenköpfe wie Primäraktionen.
- *Danger ≠ Akzent ≠ Marke:* Himbeerrot `#C8102E` gegen Violett (ΔE00 40, Helligkeit 2,4 : 1) und gegen Brause-Orange (ΔE00 14). Warnung ist Bernstein `#EE9A0A` (ΔE00 13 vom Band) – orangestichiger als der Kopf.
- *Info* ist Petrol (`#0E6E72`), nicht APEX-Blau (ΔE00 ≥ 12 zu jeder Oracle-Blau-Referenz, geprüft).
- *Code:* eigene Rollen-Tokens `--kr-code-keyword|string|number` (Petrol, Kastaniengrün, Bernstein), alle ≥ 4,5 : 1 auf Region, abgesenkt, Dialog und Feld.

### 3.3 Kategorie- und Diagrammpalette (`--kr-cat-*` → `--u-color-*`)

„Biergarten“-Palette: Petrol, Brause-Orange, Flieder, Colabraun, Himbeere, Blattgrün, Schiefer, Rosé, Brezel, Minze, Sand, Hopfen (+ Tanne, Nebel, Dämmerung), harmonisch zu den violett getönten Neutrals, **keine Vita-Farben**. Die Chart-Reihenfolge des UT (`.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`) ist berücksichtigt: Die ersten sechs Serien sind auch bei Farbfehlsichtigkeit unterscheidbar (Brettel/Viénot-Simulation, min. ΔE00 ≥ 6 für normal, Protan, Deutan – Werte in `check-tokens.mjs`). Hell alle ≥ 2,4 : 1 gegen die Region, dunkel alle ≥ 3,3 : 1.

Drei weitere Regeln prüft `check-tokens.mjs`:
- **Akzent-Abstand:** Jede Kategorie liegt ≥ 20 ΔE00 von `--kr-accent` und `--kr-accent-text` (hell Violett, dunkel Gelb). Kein Avatar, Badge oder Balken liest sich wie eine Primäraktion.
- **Gleiche Identität hell/dunkel:** Der HSL-Farbton einer Kategorie weicht zwischen den Modi um höchstens 25° ab (Grautöne ausgenommen).
- **Keine Wellen-Farbfolge:** Die ersten fünf Serien bilden keine Teilfolge Gelb–Orange–Rot–Pink–Lila (heute: Petrol · Orange · Flieder · Colabraun · Himbeere).

{{KAT}}

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Kracherl ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--kr-cat-N) 60%, #fff)` mit Text `--kr-on-light`, 31–45 = `color-mix(in srgb, var(--kr-cat-N) 55%, #000)` mit Text `--kr-on-dark` (beide ≥ 4,5 : 1, geprüft). Als **Schrift** (`.u-color-N-text`) mischt utilities.css je Stufe so viel Tinte bei, dass hell und dunkel ≥ 4,5 : 1 erreicht werden (Anteile aus den Tokens gerechnet, bei Palettenänderung neu rechnen).

### 3.4 Maß-, Schrift-, Form-, Dichte- und Fokus-Tokens (modusneutral)

{{SKALA}}

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--kr-control-h 2.5rem`, `--kr-control-h-sm 2rem`, `--kr-control-h-lg 3rem`, `--kr-row-h 2.5rem`, `--kr-head-h 2.5rem`, `--kr-hit-min 2.5rem`, `--kr-checkbox-size 1.25rem`. Alle abgeleiteten Hebel rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): `--kr-page #FFF`, `--kr-band #FFF`, Blasen transparent, `--kr-content-pad-x 0`, Schatten aus, `--kr-scrim transparent`; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`. Die Welle blendet shell.css im Druck aus.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Kracherl/tools/check-tokens.mjs`).

{{KONTRAST}}

**Paare, die Komponenten nicht erzeugen dürfen:**
- **Weiß auf Gelb** (1,6 : 1) und **Orange als Schrift auf Gelb** (3,2 : 1) – auf dem Band und dem Etikett steht immer `--kr-band-ink` bzw. `--kr-sun-ink`.
- **Gelb als Schrift auf Weiß** (1,6 : 1) – im hellen Modus nie Gelb für Text oder Marken auf der Region; Marken sind dort Violett oder Orange.
- **Orange-Ring auf dem gelben Etikett im Dunkeln** (1,3 : 1): Der Ring in der Nav ist ein Innenring (`--kr-focus-shadow-inset`), seine äußere Nachbarfarbe ist der Seitengrund (≥ 8 : 1), die innere die 1-px-Lücke – so bleibt er erkennbar.
- `--kr-hover` bzw. `--kr-soft` als Hover **auf `--kr-surface-raised`** ist dunkel kaum sichtbar – in Menüs, Dialogen und Popups `--kr-raised-hover` verwenden (§3.6).

### 3.6 Grundfläche schwebender Ebenen (`--kr-ground`, `--kr-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--kr-surface-raised`, im Dunkeln heller als die Region. Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht die Region nehmen, sonst entsteht eine dunkle Linie oder ein dunkler Punkt.
- **`--kr-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--kr-surface)`. Auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 den Wert `var(--kr-surface-raised)`. Komponenten nehmen `--kr-ground` für Aussparungen, z. B. die Mitte des aktiven Wizard-Schritts.
- **`--kr-focus-gap`** ist `var(--kr-ground)`. bridge §18 löst die Lücke und die beiden Schatten `--kr-focus-shadow` / `--kr-focus-shadow-inset` auf den genannten Ebenen neu auf; `check-tokens.mjs` vergleicht die Formeln mit `scale.css`.
- **`--kr-raised-hover`** ist der Hover bzw. die Tastatur-Auswahl auf schwebenden Flächen. `check-tokens.mjs` verlangt ≥ 1,15 : 1 gegen `--kr-surface-raised` sowie Tinte und Sekundärtext darauf ≥ 4,5 : 1.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--kr-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte: 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Band, Seitengrund, Navigation, Title Bar, Inhalt) · 7 Regionen (Karten) · 8 Tabs · 9 Buttons (Pillen) · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Kracherl | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--kr-link-text)` (Violett) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--kr-focus-ring-color)` (Brause-Orange) | bridge §3 |
| `:root --ut-header-background-color` | `transparent` – das Band sitzt auf `.t-Header` (shell.css) | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--kr-brand-ink)` | bridge §6 |
| `:root --a-menu-focused-background-color` | `var(--kr-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--kr-info)` (Petrol) | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--kr-brand-ink)` | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--kr-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--kr-accent-text)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--kr-accent-tint)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--kr-accent-text)` (Häkchen `--kr-surface`) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | `var(--kr-focus-ring-color)` / `var(--kr-soft)` / `var(--kr-soft)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-group input:checked + label, … radioButtonGroup …` | `var(--kr-accent)`, `-hover`, `-press`, Schrift `--kr-accent-on` | `components/buttons.css` |
| `… .t-Button--simple` / `… .t-Button--link` / `… .t-Button--noUI` | `var(--kr-accent-text)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | transparent / `var(--kr-page-hover) !important`; Etikett `var(--kr-sun) !important` | `components/shell.css` |

Laufzeit-Audit (`audit-blue.mjs --sets core --states --overlays`, hell und dunkel): **0 Treffer** – auch mit erzwungenem `:hover`/`:focus-visible` und geöffneten Menüs, Date Picker, Popup-LOV und Dialogen. Laufzeit-Audit über alle 111 normalen Seiten der Reference App (`audit.mjs --pages all`, ohne Seite 0 und Dialogseiten), hell und dunkel: 0 × Blau.

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--kr-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--kr-focus-outline)` = `2px solid <Orange>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--kr-focus-ring-offset)` = `2px` | dito |
| `--a-combo-select-focus-outline(-color)`, `--a-combo-select-item-focus-outline-color` | Ring | Combobox |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--kr-focus-shadow-inset)` | Tree-Knoten (Nav: nur bei Tastatur, `:has(:focus-visible)`) |
| `--kr-focus-gap`, `--kr-focus-shadow`, `--kr-focus-shadow-inset` auf schwebenden Ebenen | neu aufgelöst mit `--kr-ground: var(--kr-surface-raised)` | Lücke des Doppelrings = Dialogfläche (bridge §18) |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `var(--kr-control-pad-y)` = `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 32 px | 40 px |
| `--a-field-input-padding-y` | dito | 32 px | 40 px |
| `--ut-pillbutton-padding-y` | dito | 32 px | 40 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--kr-row-h)` / `(row-h − row-lh − 1px) / 2` | 36 px | 40 px |
| `--a-gv-header-cell-height` | `var(--kr-head-h)` | 38 px | 40 px |
| `--ut-report-cell-padding-y` | `var(--kr-row-pad-y)` | 36 px | 40 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-xs − head-rule-width) / 2` | 38 px | 40 px |
| `--a-checkbox-size` | `var(--kr-checkbox-size)` | 18 px | 20 px |

Lokale UT-Überschreibungen, die diese Werte wieder aufheben, müssen die Komponenten neu deklarieren (z. B. UT Core `.a-IRR { --a-gv-cell-padding-y: .5rem }`, `.t-Form--large`, `.t-Button--small|large`, Floating Labels).

### 4.4 Gestaltungsentscheidungen in der Brücke

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Palette | `--ut-palette-primary*` | `--kr-accent` / `-on` / `-tint` / `-text` | Primär = violettes Etikett mit gelber Schrift |
| | `--ut-palette-primary-alt*` (`t-Button--primary`) | `--kr-accent-tint-2`, Schrift `--kr-ink` | leiser Sonnenstrahl statt zweiter Violett-Fläche |
| | `--ut-palette-info*` | Petrol | kein APEX-Blau |
| | `--ut-palette-generic*` | `--kr-soft` / `--kr-surface-sunken` / `--kr-ink` | neutral = Lavendel |
| Shell | `--ut-body-background-color`, `--ut-body-nav-background-color`, `--ut-body-title-background-color` | `--kr-page` | eine Ebene für Navigation, Title Bar und Inhalt |
| | `--ut-header-*` | Hintergrund transparent, Text `--kr-band-ink`, Logo Bitter 800 in `--kr-band-brand` | Band und Welle zeichnet shell.css auf `.t-Header` |
| Regionen | `--ut-region-*` | Fläche `--kr-surface`, Kante `--kr-line`, Radius 16 px, `--kr-card-shadow`, Titel `--kr-heading` ohne Linie | weiße Etiketten-Karten |
| Buttons | `--a-button-border-radius`, `-font-weight`, Sekundär | Pille, fett, `--kr-soft` + `--kr-brand-ink` | Etikett-Form |
| Checked-Controls | `--a-checkbox-checked-background-color`, `--a-switch-checked(-hover)-background-color` | `--kr-accent-text` | Marke ohne Schrift, ≥ 3 : 1 |
| Sterne | `--a-starrating-stars-fg-color` | `--kr-mark` | warm, ≥ 3 : 1 hell und dunkel |
| Prozentbalken | `--a-percent-chart-*` | `--kr-cat-1` / `-on`, Spur `--kr-soft` | Daten statt Aktion |
| Hover schwebend | `--a-menu-focused-background-color`, `--a-datepicker-calendar-day-hover-background-color` | `--kr-raised-hover` | dunkel sichtbar |
| Pagination aktiv | `--a-gv-pagination-button-selected-*` | `--kr-sun` / `--kr-sun-ink` | aktive Seite = Etikett |
| Tabs aktiv | `--ut-tabs-item-active-*` | Fläche transparent, Schrift `--kr-brand-ink`; Strich `--kr-mark` in shell.css | „hier bin ich“ in Orange |
| Tabellenkopf | `--a-gv-header-*`, `--ut-report-header(-cell)-background-color` | `--kr-surface-sunken`, Schrift `--kr-brand-ink` | zartes Lavendel-Band |
| Zähler | `--ut-navbar-button-badge-*`, `--a-button-count-*`, `--ut-treeview-badge-*` | Band-Tinte bzw. `--kr-brand-ink` | Information, keine Aktion |
| Seitentitel | `--ut-breadcrumb-title-*` | Bitter 800, 32/38 (mobil 26/32), `--kr-heading` | Etikett-Typografie |
| Datum „heute“ | `--a-datepicker-calendar-day-current-border-color` | `--kr-mark` | „hier bin ich“ |
| Code | `--prism-*` (§17) | `--kr-code-*`, `--kr-muted`, `--kr-ink(-2)`, `--kr-danger-text` | eigene, ruhige Syntaxfarben |
| Markdown | `--a-md-h1…h6-*`, `--a-md-blockquote-*` | auf der Skala | eine #-Überschrift im Feld wird nie größer als der Seitentitel |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--kr-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt. Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anlegen (in `light.css` **und** `dark.css`). Beispiel: `--kr-brand-ink` entstand, weil Sekundär-Buttons dunkel nicht gelb wie die Titel sein sollen.
- Muster aus Farben (Blasen) sind lokale Tokens aus Farb-Tokens (`--kr-c-bubbles` aus `--kr-bubble`/`--kr-bubble-ring`); Masken (Welle) sind Maß-Tokens in `scale.css`.
- Ein Schatten-Token muss in jedem Modus ein gültiger Schatten sein (dunkel `0 0 0 transparent` statt `none`), weil Komponenten ihn in Schattenlisten kombinieren.
- **Grund und Hover schwebender Ebenen (§3.6):** Aussparungen nehmen `--kr-ground`, Hover in schwebenden Flächen `--kr-raised-hover`.

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Vorgehen:
1. Selektor in `_reference/ut-26.1/css/Vita.css` (und `Vita-Dark.css`) suchen, **identische Selektorliste** übernehmen.
2. Nur die betroffenen Deklarationen neu setzen – mit Tokens.
3. Die Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen. Jede davon muss in der zuständigen Komponenten-Datei neu deklariert sein.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen, also aus Vita, UT Core oder app_ui. Dann mit gleichem Selektor bzw. gleicher Spezifität + `!important` und einem Kommentar zur Quelle. Nie, um eigene Regeln untereinander zu ordnen. `node _tools/lint.mjs Kracherl` zählt die Vorkommen je Datei.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `.t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important }` | shell.css (Hover in `--kr-page-hover`; das Etikett `--kr-sun` braucht deshalb ebenfalls `!important`, sonst würde es beim Überfahren violett) |
| Vita | `.t-TreeNav--styleB … .is-current--top.is-hover { color / background-color … !important }` | shell.css |
| UT Core | Drawer-Radius (`.ui-dialog--drawer`, `.t-Drawer-page--standard`, `pullOut*` mit `border-radius: 0 !important`) | overlays.css (freie Kante gerundet) |
| UT Core | `apex-core-font` an den Pflicht-Sternchen (`:after`) | forms.css |
| app_ui | `.a-IRR-dialogList a` Textfarbe/Hover, Farbwähler im IR-Filter, `.fc .fc-helper` | reports.css, viz.css |

Stand (Zählung `lint.mjs`): shell 8, overlays 4, viz 3, forms 2, reports 2. Jedes richtet sich gegen eine der Quellen oben.

### 5.4 Lokale Komponenten-Tokens

- Name: **`--kr-c-<komponente>-<name>`** (z. B. `--kr-c-bubbles`, `--kr-c-login-ground`, `--kr-c-tab-pad-x`). Das Präfix `--kr-c-` ist für lokale Tokens reserviert.
- Deklaration auf dem **Wurzel-Selektor der Komponente**, nie auf `:root`.
- Werte nur aus globalen Tokens oder Längen, Farben immer als `var(--kr-*)`.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament (so entstanden `--kr-nav-inset`, `--kr-mark-w`).

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--kr-focus-ring-color` (Brause-Orange), 2 px, 2 px Abstand – auf Region, Seitengrund, Band und in schwebenden Ebenen ≥ 3 : 1 (Tabelle §3.5). Der Abstand zeigt den Grund als Innenring.
- Global erledigt: `base.css` zeichnet `:focus-visible` mit den Hooks, entfernt den Ring bei Maus-Fokus und lässt `tabindex="-1"` aus (wie UT). Der Tastatur-Ring hat bewusst Spezifität **0,2,0** und schlägt damit Oracle-Regeln, die den Umriss unterdrücken. Wo Oracle den Fokus anders zeigt (Tree-Label, Facetten-Optionen, IR-Dialogliste), nimmt die Komponente den Doppelring lokal über `--ut-focus-outline: none` weg.
- **Komponenten ändern den Ring nur über die Hooks** auf ihrem Selektor:
  - abgeschnittener Kontext (Tabs, Grid-Zellen, Listen in Scroll-Containern, Nav-Etikett): Ring nach innen (`--ut-focus-outline-offset: calc(-1 * var(--kr-focus-ring-width))` oder `box-shadow: var(--kr-focus-shadow-inset)`);
  - freistehend, aber verdeckt: `box-shadow: var(--kr-focus-shadow)`;
  - **Felder:** `border-color: var(--kr-focus-ring-color)` + `box-shadow: var(--kr-focus-field-shadow)`, `--ut-focus-outline: none`; der Halo `--kr-accent-ring` nur zusätzlich;
  - **fehlerhafte Felder** (`.apex-page-item-error`): die rote Fehlerkante bleibt, der Fokus kommt als abgesetzter Ring dazu (`outline: var(--kr-focus-outline)`, Abstand `--kr-focus-ring-offset`; zusammengesetzte Felder am ganzen Feld) – Orange und Himbeerrot liegen bei Deuteranopie/Tritanopie bei ΔE00 ≈ 4–5 (check-tokens.mjs), die Form unterscheidet;
  - Radio-Gruppe als Buttons (Segmentleiste): Die Leiste schneidet ab (Nähte, runde Ecken) – Ring nach innen (`--kr-focus-shadow-inset`);
  - Checkbox/Radio/Switch: Ring am sichtbaren Kästchen.
  - **Roving-Tabindex-Listen** zeichnen den Ring selbst (Facetten-Popup, Date-Picker-Knöpfe, Menüs, Grid-Zellen).
- Nie `outline: none` ohne gleichwertigen Ersatz.

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe. Eigene Elemente: `min-block-size: var(--kr-control-h)` bzw. `var(--kr-row-h)`; keine festen px-Höhen.
- Controls 32 px, Tabellenzeilen 36 px, Tabellenköpfe 38 px, Top-Level-Nav 36 px; unter `pointer: coarse` automatisch 40 px.
- Trefferflächen kleiner Icon-Buttons ≥ `--kr-hit-min` (24 px Desktop, 40 px Touch).

### 5.7 Typografie

- Zwei Familien: **`--kr-font-slab`** (Bitter) für Seitentitel (800), Region-, Content-Block-, Dialog-, Karten-, Wizard-, Button-Container-, Alert- und Login-Titel, Logo, Mega-Menu-Obereinträge und Kennzahlen (700); **`--kr-font`** (PT Sans) für alles andere.
- PT Sans hat nur **400 und 700**: `--kr-fw-medium` ist 400, `--kr-fw-semibold` 700. `font-synthesis-weight: none` – nie künstlich fetten.
- Nur die Skala: `--kr-fs-xs|head|sm|md|lg|xl|2xl` mit passender `--kr-lh-*`. Hilfsklassen `.kr-text-*` in `base.css`.
- **Rohe Überschriften** (Static Content, Rich Text): base.css setzt `h1` 22/28 · `h2` 18/24 · `h3` 15/22 in Bitter und `--kr-heading`, `h4`–`h6` in PT Sans fett. Auf Farbflächen (`u-color-N`, `u-colors`) erben sie die Kontrastschrift der Fläche.
- **Markdown**: Überschriften über `--a-md-h*` auf der Skala (bridge §17).
- **Code:** Monospace `--kr-font-mono`, Syntaxfarben nur über `--prism-*`.
- Tabellenköpfe: `--kr-fs-head` (13 px), fett, `--kr-brand-ink` auf dem Lavendel-Band `--kr-surface-sunken`, **keine Versalien**.
- Zahlen in Spalten: `font-variant-numeric: tabular-nums` global für Tabellen, Grids, Badges, Pagination, Date Picker, Zahlenfelder.
- **Labels immer linksbündig** (forms.css).

### 5.8 Band, Etikett, Violett, Orange, Status

- **Band** (`--kr-band*`): nur `.t-Header` (+ Welle), Login-Himmel, Tabs-Navigation unten (< 768 px). Text darauf `--kr-band-ink`.
- **Etikett** (`--kr-sun`/`--kr-sun-ink`): nur „der aktuelle Ort“ als Fläche – Nav-Eintrag, aktive Pagination-Seite, Hero-Icon. Nie als Lesefläche oder große Fläche in der Region.
- **Überschrift** (`--kr-heading`) vs. **Markentinte** (`--kr-brand-ink`): Titel nehmen die Überschrift, alles, was „markenfarbig schreibt“, aber kein Titel ist (Sekundär-Buttons, Tabellenköpfe, aktive Tabs, Icons, Zähler), die Markentinte.
- **Primäraktion** `--kr-accent` (+ `-on`): nur Flächen mit Schrift – Hot-Button, gewählter Tag im Date Picker, „heute“ im Kalender, aktueller Eintrag von Menüleiste und Tabs-Navigation im Band.
- **Auswahl-Marke** `--kr-accent-text`: Checkbox/Radio/Switch, Menü-Häkchen, Kante ausgewählter Kommentare/Zeilen. **Auswahl-Fläche** `--kr-accent-tint(-2)`: gewählte Zeilen, Menüeinträge, `::selection`, `t-Button--primary`.
- **Marke** `--kr-mark` (Orange): Fokus, Strich unter aktivem Tab/RDS, Punkt vor der aktuellen Mega-Menu-Seite, Kante am aktuellen Links-List-Eintrag, Ring am aktuellen Wizard-Schritt, Sterne, „heute“ im Date Picker.
- **Daten** (Prozentbalken, Charts, Avatare mit Theme Colors) in Kategoriefarben `--kr-cat-*`, nie im Akzent.
- **Status:** Fläche `--kr-<s>` + Schrift `--kr-<s>-on`; Text `--kr-<s>-text`; Tönung `--kr-<s>-tint`. Warnung nie in Danger-Farbe; Statusfarben nur mit Bedeutung.
- **Freigeben/Ablehnen:** Hot (Freigeben) neben Danger **`--simple`** (Ablehnen).
- Pflichtfeld: `content: var(--kr-required-mark)`, `color: var(--kr-required-color)`.

### 5.9 RTL und Responsivität

- Logische Eigenschaften und Werte. Wo UT physisch setzt, physisch überschreiben **und** `.u-RTL`-Variante liefern (Beispiel: Drawer-Radien, deren Selektoren UT selbst physisch spiegelt).
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (`--js-mq-*`, nur lesen). Unter 640 px werden Innenabstände, Seitentitel, Logo (18 px) und Wellenlänge kleiner, das Blasenmuster ruhiger; unter 768 px rückt die Navigation Bar enger (Polster 8 px, 480–639 px Beschriftung 12,5 px), damit das Logo Platz behält. Die Blasen im Band stehen ab 640 px nur in der freien Zelle `.t-Header-navBar--start` (Container-Query: ≥ 400 px volle Traube, ≥ 200 px kleine, ≥ 120 px drei Perlen, sonst keine) – nie hinter Logo oder Navigation Bar.
- **Lese-Hebel `--js-sticky-top`:** theme42.js misst `#t_Header` und schreibt die Höhe an `<html>`. Eigene sticky oder fixierte Elemente lesen ihn **immer mit Fallback** (`top: var(--js-sticky-top, 0px)`), wo nötig `max(var(--js-sticky-top, 0px), var(--kr-header-h))`. Nie setzen (Regel 11). Am Desktop ist die Welle bewusst nicht Teil der gemessenen Höhe; was unter dem Kopf beginnt, hält `--kr-wave-h` Abstand – die Nav als Innenabstand der Scroll-Fläche `.t-Body-nav` (der TreeView scrollt den aktuellen Eintrag per `scrollTop` an deren Oberkante, Abstand *vor* dem Baum hält ihn unter der Welle), Title Bar und Actions-Spalte als Polster. **Phone (< 640 px):** Dort ist die Title Bar nicht sticky; UT scrollt RDS-Regionen und Anker bündig unter die gemessene Kopfhöhe (`theme.defaultStickyTop()`), klebende Tabellenköpfe haften an ihr. Deshalb bekommt `.t-Header` dort `padding-block-end: var(--kr-wave-h)` mit `background-clip: content-box` und die Welle sitzt *in* diesem Streifen – `--js-sticky-top` wird 74 px, nichts landet mehr unter der Welle. Die mobilen Schubladen beginnen an der Bandkante (`--js-sticky-top` − `--kr-wave-h`) und liegen *unter* dem Kopf (z-index 799, Abdunklung 798), damit die Welle klar über ihnen hängt.

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; Bitmap-Texturen; Oracle-Sans/Redwood-Paletten; Vita-Werte kopieren; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `kracherl-auto.css`; eine Datei zweimal importieren; **gestapelte oder mehrfarbige Wellenbänder**, fremde Logos oder Schriftzüge.

---

## 6. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`. Ausgaben immer unter `_tmp/kracherl/` (Parallelbetrieb mehrerer Themes).

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Kracherl` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Kracherl` | „OK – keine Fehler“ (Hinweise prüfen) |
| Token-Kontraste, Palette | `node Kracherl/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Kracherl --style light,dark --pages core --out _tmp/kracherl/shots` | ansehen (Read) |
| Nav aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | gelbes Etikett am aktuellen Eintrag |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 40 px) | Welle kürzer (240 px) und Teil der Kopfhöhe, RDS-Titel frei; Schublade unter dem Band über dem Inhalt |
| Auto-Äquivalenz | `THEME=Kracherl VERIFY_OUT=_tmp/kracherl/verify bash _tools/verify-auto.sh [seiten] [app]` | alle `GLEICH 0 px` (Fotos werden maskiert) |
| UT 24.2 | Screenshots mit `--app 9242` | wie 9042 |
| Oracle-Blau | `node _tools/audit-blue.mjs --theme Kracherl --pages core --styles light,dark --states --overlays --out _tmp/kracherl/audit-blue.json` | 0 Treffer |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Kracherl --style light,dark --pages all --out _tmp/kracherl/audit` | kein Blau, kein Überlauf, keine JS-Fehler; Kontrast nur Demo-CSS (§7); „nicht bewertbar“ = Text über Foto oder Bildgrafik (Karten mit Hintergrundbild auf 3110, Auswahlpfeil in Selects). Der Kopf gehört nicht dazu: Die Blasen liegen ab 640 px auf `.t-Header-navBar--start::before` (nur die freie Zelle zwischen Logo und Navigation Bar), darunter auf `.t-Header::before` oberhalb der Schriftzeile – die Schrift steht immer auf der glatten Bandfarbe und wird bewertet |
| Berechnete Werte | `node _tools/shoot.mjs … --computed ".sel:prop1,prop2" --no-shot` | |
| Kontaktbogen | `node _tools/contact-sheet.mjs --out x.png --cols 2 --dir <ordner> --match <text>` | |
| README-Bilder | `node Kracherl/tools/screenshots.mjs` | `Kracherl/screenshots/*.png` |
| Doku neu erzeugen | `node Kracherl/tools/build-architecture.mjs` | Tabellen = Quellen |

Seiten-Sets (`_tools/testbed-pages.json`): core, shell, regions, lists, reports, components, forms, dialogs, misc. Jede Komponenten-Änderung: eigenes Set hell + dunkel fotografieren und ansehen, `verify-auto.sh` auf den betroffenen Seiten, `lint.mjs`, Build.

---

## 7. Bekannte Grenzen und offene Punkte

- **Kontrast-Befunde aus der Reference App** (`audit.mjs --pages all`, 111 Seiten, hell + dunkel: 210 Befunde, alle aus Demo-CSS, keine Theme-Farben):
  - 6303, 6304, 6307, 6400: fest codierte Code-Farben im Seiten-CSS der Demo (`#008676`, `#9C27B0`, `red`), dunkel unverändert hell-optimiert (6303/6304 nur dunkel);
  - 6100 (dunkel): Hinweistext `#767676` aus dem Demo-CSS;
  - 6302: die Demo zeigt `u-opacity-10…90` absichtlich mit abnehmender Deckkraft.
- **Welle über dem Inhalt (Desktop):** Sie hängt 14 px unter dem Kopf. Title Bar, Nav und Actions-Spalte halten Abstand. Auf Seiten *ohne* Title Bar (z. B. `js-hideTitleBar`) haften klebende Tabellenköpfe an der Bandkante und liegen 14 px unter der Welle. Auf dem Phone ist das gelöst (§5.9).
- **Breite Classic Reports:** `.t-Report` schneidet ab (Karte mit Radius); die Tabelle scrollt deshalb waagerecht in `.t-Report-tableWrap` (`overflow-x: auto`, ohne *Stretch Report* hält `max-inline-size: 100%` den float-Wrap in der Kartenbreite). Folge: ein `position: sticky` im Tabellenkopf aus App-CSS klebt am Wrap statt am Fenster. Der fixierte Kopf von APEX (theme42 `setTableHeadersAsFixed`, `t-fht-*`) ist nicht betroffen (geprüft auf 1107 mit eingefügtem Bericht).
- **Logo 480–559 px:** Dort zeigt UT die Beschriftungen der Navigation Bar, das Logo bekommt nur den Rest. Unter 768 px rücken die Navigation-Bar-Knöpfe deshalb enger (Polster 8 px), zwischen 480 und 639 px mit 12,5-px-Beschriftung und 8 px Abstand im Band. Mit drei beschrifteten Einträgen (Reference App) passen 15 Zeichen ab 560 px (Vita ebenso); bei 480 px bleiben ~70 px, UT kürzt mit „…“ (Vita: ~95 px). Unter 480 px (nur Icons) passen 15 Zeichen ab 360 px Breite.
- **Inline Date Picker in schmalen Spalten:** kompakter als das Popup (Tage 2 px Abstand, Monatsknöpfe 28 px), damit Kopf und sieben Spalten in ~230 px passen (1601 bei aufgeklappter Navigation). Noch schmaler bricht der Kopf um; die Tage-Tabelle schneidet UT (`overflow: hidden`) ab ~224 px – Vita schon ab ~300 px.
- **Nav-Scroll an den Rand:** Liegt der aktuelle Eintrag knapp unter der Unterkante der Nav, scrollt der TreeView nicht (UT-Logik prüft nur die Oberkante) – wie in Vita.
- **Body-Schriftgröße:** `--ut-base-font-size` ist 15 px (Vita 16 px) – PT Sans läuft klein.
- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Druck:** hell, ohne Band, Welle und Schatten; Vita-Dark-Werte, die die Brücke nicht setzt (Chat, Diagramm), bleiben im Druck des Dark-Styles dunkel.
- **Installer (Styles und Theme-Variante 145):** vom gemeinsamen Generator erzeugt; der Installationstest in einer Test-App steht für Kracherl aus (docs/THEME-VARIANTE.md). Alle Prüfungen liefen über den Labor-Style der Testbetten.
- **Werkzeuge:** `_tools/lint.mjs` prüft die Token-Regeln über `tokenPrefix` aus `theme.json` (`--kr-`); `_tools/audit-blue.mjs` versteht `--pages core`; `verify-auto.sh` maskiert Fotos (3110 ist damit deterministisch).
