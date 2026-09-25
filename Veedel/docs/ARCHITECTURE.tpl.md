# Veedel – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: Kopfband in tiefem Markenblau, weiße Navigation mit blauem Aktiv-Block, Seitentitel als **Verlaufsband** (Tiefblau → Leuchtazur) mit riesiger weißer Headline in Figtree Black, weiße eckige Flächen auf hellgrauem Seitengrund, **Signalrot nur für die Hauptaktion**.
> Technische Grundlage ist die Architektur von Passepartout (erstes Theme dieses Projekts). Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Veedel/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: {{DATE}}. Änderungen am Text nur in der Vorlage.

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

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--ve-*` oder aus UT-/APEX-Tokens, die die Brücke setzt.
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen.
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--ve-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--ve-c-*` auf dem Komponenten-Selektor (§5.4).
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui (TreeNav-Hover, IR-Dialogliste, FullCalendar-Hilfsfläche …), mit gleichem Selektor und einem Kommentar zur Quelle (§5.3). Eigene Regeln werden über lokale Tokens geordnet, nie über `!important`.
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** nie eigene Ringfarben; nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` lokal anpassen oder `--ve-focus-shadow*` verwenden (§5.5). Einzige Ausnahme sind die blauen Bänder (Kopf, Verlaufsband, Dialog-Titel): dort ist der Ring weiß (`--ve-header-focus`), weil Blau auf Blau unsichtbar wäre. Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--ve-control-h`, `--ve-row-h`, `--ve-head-h` ableiten (Desktop 36/36/40 px, Touch 44 px automatisch; §5.6).
9. **Farbrollen-Disziplin (§5.8):** **Rot** (`--ve-action*`) ausschließlich für die Hauptaktion (Hot, Primary, `u-hot`). **Blau** (`--ve-accent*`) für Marke, Auswahl, Aktiv, Checked und Links. **Karminrot** (`--ve-danger*`) für Gefahr – bei Buttons als Kontur. Flächen mit Schrift darauf = `--ve-accent`, Marken im Vordergrund (Häkchen, Schalter, Wizard-Ring) = `--ve-accent-text`, Balken-Marken (aktiver Tab, Menüleiste) = `--ve-accent-bright`.
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--ve-header-h`).
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§6).

---

## 1. Dateistruktur und Zuständigkeit

```
Veedel/
  theme.json                       Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta); Theme-Variante 143  [Fundament]
  assets/fonts/                    Figtree latin + latin-ext, aufrecht + kursiv (wght 300–900) + OFL-Lizenz     [Fundament]
  docs/ARCHITECTURE.md             dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)                    [Fundament]
  docs/THEME-VARIANTE.md           Veedel als eigenes Theme 143 (Unterschiede zu Passepartout)               [Fundament]
  tools/check-tokens.mjs           Kontraste (inkl. Bänder), Gefahr↔Aktion, Palette (CVD, Rot-Abstand, Farbton), Oracle-Blau-Triage [Fundament]
  tools/build-architecture.mjs     baut docs/ARCHITECTURE.md (Tabellen aus gen-token-tables.mjs + check-tokens) [Fundament]
  tools/screenshots.mjs            Vorschaubilder der README (hell | dunkel)                                   [Fundament]
  src/
    veedel-light.css               Einstieg Light: tokens/light.css → index.css                                [Fundament]
    veedel-dark.css                Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css  [Fundament]
    veedel-auto.css                Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                                   (beide „screen and (prefers-color-scheme: dark)“) → index.css             [Fundament]
    index.css                      modusneutraler Kern: Reihenfolge aller Imports                            [Fundament]
    tokens/light.css               Farb-Tokens hell   – NUR :root, NUR --ve-* (+ --ut-color-scheme)          [Fundament]
    tokens/dark.css                Farb-Tokens dunkel – exakt dieselben Namen wie light.css                   [Fundament]
    tokens/scale.css               Maß-, Schrift-, Dichte-, Fokus-Geometrie-Tokens (modusneutral) + < 640 px   [Fundament]
    tokens/print.css               Druck: Seitengrund weiß, Schatten weg (nur unter „print“ geladen)          [Fundament]
    fonts.css                      @font-face „Veedel Sans“ (Figtree)                                        [Fundament]
    bridge.css                     --ve-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender Ebenen (+ pointer: coarse) [Fundament]
    base.css                       Schrift, Skala, h1–h6, Links, ::selection, Fokus, Scrollbars, tabular-nums, pre, Druck [Fundament]
    components/shell.css           Kopfband, Tree Nav + Aktiv-Block, Menüleiste/Tabs-Nav/Mega Menu, Verlaufsband (Title Bar), Tab-Leiste (RDS/Tabs), Spalten, Footer, mobile Schublade
    components/login.css           Login-Seite (Band über dem Seitengrund, weiße Anmeldefläche; geteilt: Band-Spalte, Phone: Band-Streifen oben)
    components/regions.css         Standard-Region (weiße Fläche), Akzente, Hero (Verlaufsband), Alert, Collapsible, Button Container, Content Block, Wizard, Carousel
    components/buttons.css         t-Button/a-Button/ui-button, Hot/Primary (Rot), Gefahr (Kontur), Status, Gruppen, Buttons in Feldern und auf dem Band
    components/forms.css           Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker, Datei, RTE, Validierung
    components/overlays.css        Menüs, Dialoge (Titelband), Drawer, Popups, Tooltips, Meldungen
    components/reports.css         Classic Report, Interactive Report, Interactive Grid, Pagination
    components/search.css          Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css           Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css         Etiketten („Störer“), Avatare, Template Components, Links-Liste, Media List, Timeline, Comments, Wizard Progress
    components/viz.css             Charts (JET), Kalender, Karte, Tree
    components/utilities.css       u-color-*, u-hot (Rot), u-success …, sonstige u-*-Klassen
```

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#veedel/veedel-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
Folge: Bei gleicher Spezifität gewinnt unser Bundle gegen alles von Oracle, App-/Seiten-CSS gewinnt gegen uns (gewollt: Apps bleiben übersteuerbar).

### 2.2 Im Bundle (verbindlich)

| # | Datei | Inhalt |
|---:|---|---|
| 1 | `tokens/light.css` **oder** `tokens/dark.css` | Farb-Tokens des Styles (Auto: hell, danach Delta + dunkel unter Media) |
| 2 | `tokens/scale.css` | Maße, Schrift, Dichte, Fokus-Geometrie, Mobil-Überschreibung |
| 3 | `fonts.css` | `@font-face` |
| 4 | `bridge.css` | Mapping auf UT/APEX/JET, `@media (pointer: coarse)` |
| 5 | `base.css` | globale Grundlagen, niedrige Spezifität (`:where`; Ausnahmen: Überschriften `h1`–`h6` 0,0,1 gegen die Element-Regeln aus UT Core, §5.7; Tastatur-Fokusring 0,2,0, §5.5) |
| 6–17 | `components/*.css` | in der Reihenfolge von `index.css`: shell, login, regions, buttons, forms, overlays, reports, search, cards, content, viz, utilities |
| 18 | `tokens/print.css` | nur `@media print` |

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `veedel-dark.css` die hellen Tokens zusätzlich unter `print`; Light braucht es nicht, Auto bekommt den hellen Druck über `screen and (…dark)`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`veedel-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark: 178 Variablen + 38 Regeln) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (verifiziert, §6). Jede Regel, die nur in einem Modus greift, bricht diese Eigenschaft.

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--ve-surface`, `--ve-accent`, `--ve-action`, `--ve-band-to` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--ve-control-h`, `--ve-r-md`, `--ve-fs-display` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--a-button-padding-y: var(--ve-control-pad-y)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-TreeNav { --ve-c-nav-hover-bg: var(--ve-hover) }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--hot { --a-button-background-color: var(--ve-action) }` | Komponenten |

Benennung: `--ve-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--ve-accent-text`, `--ve-action-hover`, `--ve-success-tint`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--ve-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--ve-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal (z. B. `--a-button-padding-y: calc((var(--ve-control-h-lg) - var(--ve-control-lh)) / 2)`). Einzige Ausnahme ist die Grundfläche schwebender Ebenen (§3.6): Dort löst das Fundament die Fokus-Lücke und die beiden Fokus-Schatten selbst noch einmal auf (bridge §18).

### 3.2 Farb-Tokens (hell / dunkel)

{{FARB}}

**Entscheidungen, wie umgesetzt:**
- *Drei Blautöne, drei Aufgaben:* **Kopfband** `#004B8D` (tiefste Stufe, Weiß 8,8 : 1), **Verlaufsband** `#005FAF` → `#006AC0` → `#0091FA` (kleine Schrift steht links, Leuchtazur nur hinter dem 40-px-Titel), **Akzent** `#005FAF` für Auswahl, aktive Einträge und Links (6,5 : 1 auf Weiß). Dunkel ist der Akzent `#2474C4`: Der aktive Block steht 3,2 : 1 gegen die Navigationsfläche `#0D2742` (1.4.11, in `check-tokens.mjs` geprüft), weiße Schrift darauf 4,8 : 1; Hover und Gedrückt werden dunkler (`#0B65B1`, `#005A9F`). Überschriften ab 19 px/800 stehen in **Leuchtblau** `#0086EA` (großer Text, 3,8 : 1 auf Weiß, 3,5 : 1 auf dem Seitengrund).
- *Rot ist Aktion, Karmin ist Gefahr:* Signalrot `#E3250C` (Weiß 4,6 : 1; das Original-Rot der Vorlage `#FA280A` hätte mit 14-px-Schrift nur 3,9 : 1) gegen Karminrot `#9E1030`: ΔE00 normal 20 / Protan 19 / Deutan 19, Helligkeit 1,76 : 1. Zusätzlich trennt die **Form**: Hot ist eine gefüllte Fläche, Gefahr eine Kontur, die sich erst bei Hover füllt. Dunkel: Gefahr ist ein helles Korallrot mit dunkler Schrift (`#FF8A95`, ΔE00 26 / 33 / 22 zum Signalrot), Hot bleibt Signalrot mit weißer Schrift.
- *Nachtblau statt Schwarz:* Textfarbe hell `#081E35` = Seitengrund dunkel. Dunkel liegen die Flächen `#0D2742` 1,17 : 1 über dem Seitengrund, schwebende Ebenen `#12304F` noch einmal heller.
- *Info = Markenblau:* Hinweise sind blau wie die Marke (`--ve-info` = `--ve-accent`), keine eigene Petrol-Farbe.
- *Code:* eigene Rollen-Tokens `--ve-code-keyword|string|number` (Markenblau, Grün, Ocker); Kommentare = `--ve-muted`, Namen = `--ve-ink`/`--ve-ink-2`. Zuordnung auf `--prism-*` in bridge §17; alle ≥ 4,5 : 1 auf Fläche, abgesenkt, Dialog und Feld (Tabelle §3.5).

### 3.3 Kategorie- und Diagrammpalette (`--ve-cat-*` → `--u-color-*`)

Serie 1 ist das **Leuchtazur** der Marke, Serie 2 **Nachtblau** (dunkel: helles Stahlblau), danach Bernstein, Grün, Beere, Sandstein – deutlich getrennt, auch bei Farbfehlsichtigkeit. Chart-Reihenfolge des UT (`.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`) ist berücksichtigt (Brettel/Viénot-Simulation, Mindestabstände siehe Ausgabe von `check-tokens.mjs`; erste 6 Serien hell normal 30,7 / Protan 10,2 / Deutan 19,3 / Tritan 5,8, dunkel 15,8 / 13,1 / 12,3 / 9,0). **Alle 15 Kategorien ≥ 3 : 1 gegen die Fläche, hell wie dunkel** (WCAG 1.4.11 für Balken, Linien und Tortenstücke; `check-tokens.mjs` prüft das). Dafür stehen fünf helle Töne tiefer als im ersten Entwurf: Bernstein `#D08200`, Rheinwasser `#49A19C`, Rosé `#C87D9D`, Nebel `#8995A1` und Sandstein – dieser hell als dunkles Umbra `#624D29` mit weißer Schrift, weil ein mittelheller Sandton bei ≥ 3 : 1 unter Protanopie/Deuteranopie mit dem Bernstein zusammenfiele. Dunkel bleibt er der helle Sandton `#E6C488` (gleicher Farbton, aufgehellt wie die ganze dunkle Palette). Keiner der CVD-Mindestabstände (erste 6, erste 8, alle 12 Serien) ist dadurch kleiner geworden.

Zwei weitere Regeln prüft `check-tokens.mjs`:
- **Rot-Abstand:** Jede Kategorie liegt ≥ 20 ΔE00 vom Signalrot `--ve-action` und `--ve-action-text`. Kein Balken, Avatar oder Etikett darf sich wie die Hauptaktion lesen.
- **Gleiche Identität hell/dunkel:** Der HSL-Farbton einer Kategorie weicht zwischen den Modi um höchstens 25° ab (Grautöne ausgenommen).

{{KAT}}

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Veedel ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--ve-cat-N) 45%, #fff)` mit Text `--ve-on-light`, 31–45 = `color-mix(in srgb, var(--ve-cat-N) 55%, #000)` mit Text `--ve-on-dark` (beide ≥ 4,5 : 1, geprüft). So scheint keine Vita-Farbe durch – auch nicht im Zyklus `.u-colors > :nth-child(45n+N)` und im Workflow-Diagramm.

### 3.4 Maß-, Schrift-, Dichte- und Fokus-Tokens (modusneutral)

{{SKALA}}

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--ve-control-h 2.75rem`, `--ve-control-h-sm 2.25rem`, `--ve-control-h-lg 3.25rem`, `--ve-row-h 2.75rem`, `--ve-head-h 2.75rem`, `--ve-hit-min 2.75rem`, `--ve-checkbox-size 1.25rem`. Alle abgeleiteten Hebel (Button-/Feld-Polster, IG-Zellenhöhen, Report-Polster) rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): `--ve-page #FFF`, Kopf- und Verlaufsband weiß mit nachtblauer Schrift (`--ve-header*`, `--ve-band-*`), `--ve-page-pad-x 0`, `--ve-region-pad-x 0`, Schatten und Abdunklung weg; shell.css §8 nimmt den Verlauf weg und zieht eine 2-px-Linie in Markenblau. Browser drucken Hintergründe standardmäßig nicht – weiße Schrift auf einem nicht gedruckten Band wäre unsichtbar. Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, großer Text (≥ 19 px/800, Seitentitel im Band) ≥ 3 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Veedel/tools/check-tokens.mjs`).

{{KONTRAST}}

**Paare, die die Minima nicht erreichen** – Komponenten dürfen diese Kombinationen nicht erzeugen:
- `--ve-heading` (Leuchtblau) als **kleine** Schrift: nur ab 19 px/800 (großer Text). Wo UT Regionstitel verkleinert (rechte Spalte, Dialoge, Regionen in Panels), stellt die Komponente die Titelfarbe auf `--ve-ink` um (shell.css `.t-Body-actions .t-Region`, overlays.css `.t-Dialog-page`, regions.css Panels). Mega-Menu-Überschriften stehen in `--ve-accent-text`. Die Mega-Menü-Tafel hängt bündig an der Unterkante des Kopfbands (`--ve-c-mega-drop`, shell.css); mit Callout schwebt sie rundum gerundet am Pfeil.
- Weiße Schrift auf `--ve-band-to` (Leuchtazur, 3,3 : 1) nur für den Seitentitel. Mobil endet der Verlauf deshalb im Mittelblau (`--ve-band-mid`), weil die Breadcrumb dort bis zum Rand läuft.
- `--ve-accent-bright` nur als Balken-Marke (≥ 3 : 1), nie als Schrift auf Weiß.
- Blau- oder Rot-Kontur auf dem Band: unsichtbar. Buttons ohne eigene Fläche (Simple, noUI, Link) werden auf dem Band weiß (buttons.css §14).
- `--ve-hover` bzw. `--ve-soft` als Hover **auf `--ve-surface-raised`**: dunkel kaum sichtbar. In Menüs, Dialogen und Popups `--ve-raised-hover` verwenden (§3.6).

### 3.6 Grundfläche schwebender Ebenen (`--ve-ground`, `--ve-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--ve-surface-raised`, im Dunkeln heller als die Fläche (`#12304F` gegen `#0D2742`). Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht die Fläche nehmen.
- **`--ve-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--ve-surface)`. Auf `.a-Menu`, `.ui-dialog` (IR/IG-Dialoge, Popup-LOV, Date-Picker- und Combobox-Popup, Inline-Dialoge, Drawer), `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 den Wert `var(--ve-surface-raised)`. Komponenten nehmen `--ve-ground` für Aussparungen, z. B. die Mitte des aktiven Wizard-Schritts (`--ut-wp-active-background-color`).
- **`--ve-focus-gap`** ist `var(--ve-ground)`. bridge §18 löst die Lücke und die beiden Schatten `--ve-focus-shadow` / `--ve-focus-shadow-inset` auf den genannten Ebenen neu auf (dieselben Formeln wie `scale.css`, `check-tokens.mjs` vergleicht sie).
- **`--ve-raised-hover`** ist der Hover bzw. die Tastatur-Auswahl auf schwebenden Flächen. Die Brücke legt `--a-menu-focused-background-color` und `--a-datepicker-calendar-day-hover-background-color` darauf; Komponenten nehmen ihn für Hover in Dialogen, Popups, Combobox-Listen und Kartensteuerungen.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--ve-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte (in dieser Reihenfolge in der Datei): 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Seitengrund, Kopfband, Navigation, Verlaufsband, Inhalt) · 7 Regionen · 8 Tabs · 9 Buttons · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen (Grundfläche, Fokus-Lücke; eigene Selektoren, §3.6) · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Veedel | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--ve-link-text)` (Markenblau) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--ve-focus-ring-color)` | bridge §3 |
| `:root --ut-header-background-color` | `var(--ve-header)` (Kopfband) | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--ve-soft)` (Zähler neutral, im Aktiv-Block weiß) | bridge §6, shell.css |
| `:root --a-menu-focused-background-color` | `var(--ve-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--ve-info)` (Markenblau) | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--ve-ink)` (Zähler in Nachtblau) | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--ve-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--ve-accent-text)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--ve-accent-tint)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--ve-accent-text)` (Häkchen `--ve-surface`; dunkel ≥ 3 : 1) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | `var(--ve-focus-ring-color)` / `var(--ve-accent-tint)` / `var(--ve-accent-tint)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot` (`--a-button-background-color`, `-hover-`, `-active-`) | `var(--ve-action)`, `-hover`, `-press` (Signalrot) | `components/buttons.css` |
| `.apex-button-group input:checked + label, … radioButtonGroup …` | `var(--ve-accent)` (Auswahl = Blau) | `components/buttons.css` |
| `… .t-Button--simple` / `--link` / `--noUI` (Hot) | `var(--ve-action-text)` | `components/buttons.css` |
| `.t-Button--hot .fa:after, .t-Button--simple.t-Button--hot:hover .fa:after` | `var(--ve-action)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | transparent / lokale Tokens `--ve-c-nav-hover-*` `!important` | `components/shell.css` |

**Oracle-Blau-Triage:** Veedel *ist* blau. Die Laufzeit-Audits (`audit.mjs`, `audit-blue.mjs`) melden deshalb Treffer – jeder davon muss einem Veedel-Token gehören. Geprüft 2026-09-24: alle Treffer lassen sich einem Marken-Token zuordnen (`--ve-header`, `--ve-band-*`, `--ve-accent*`, `--ve-heading`, `--ve-focus-ring-color`, `--ve-link-*`, `--ve-info*`, `--ve-code-keyword`, `--ve-cat-1`) bzw. im Dunkeln den aus Nachtblau abgeleiteten Graublau-Neutralen (`--ve-edge`, `--ve-edge-hover`, `--ve-line-strong`, `--ve-disabled`, Buntheit C < 30); **kein** Treffer stammt aus Vita. `check-tokens.mjs` erzwingt das für die Tokens selbst (Liste `BRAND`, Graublau-Ausnahme mit C < 30), die Zuordnung der Laufzeit-Treffer steht im Bericht. Nachprüfung 2026-09-24 (Farbwert je Treffer gegen alle `--ve-*`-Werte, ±2 je Kanal): `audit.mjs --pages all` hell+dunkel 2 866 Treffer, `audit-blue.mjs` core mit Hover/Fokus 5 368 und mit geöffneten Menüs, Popups, Date Picker, Popup-LOV und Dialogen 11 466 Treffer – alle exakt Token-Werte; einzige Mischfarbe ist `.u-color-1-text` (6302) = `color-mix(--u-color-1, --ve-ink 35 %)`, also ebenfalls aus Tokens.

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--ve-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--ve-focus-outline)` = `2px solid <Ring>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--ve-focus-ring-offset)` = `2px` | dito |
| `--ut-focus-outline` auf `.t-Header`, `.t-Body-title`, `.t-HeroRegion`, `.ui-dialog-titlebar`, Title-Bar-Region im Inhalt | `2px solid var(--ve-header-focus)` (weiß) | Ring auf den blauen Bändern; die weiße Menüzeile (`.t-Header-nav`), Popups und die Tab-Leiste im Band stellen wieder auf den blauen Ring |
| `--a-combo-select-focus-outline(-color)`, `--a-combo-select-item-focus-outline-color` | Ring | Combobox |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--ve-focus-shadow-inset)`; im Aktiv-Block `--ve-c-nav-block-focus` (weiß mit blauer Lücke) | Tree-Knoten |
| `--ve-focus-gap`, `--ve-focus-shadow`, `--ve-focus-shadow-inset` auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget`, `.t-Dialog-page`, `.t-Drawer-page` | neu aufgelöst mit `--ve-ground: var(--ve-surface-raised)` | Lücke des Doppelrings = Dialogfläche (bridge §18, §3.6) |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `var(--ve-control-pad-y)` = `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 8 px → 36 px | 12 px → 44 px |
| `--a-field-input-padding-y` | dito | 36 px | 44 px |
| `--ut-pillbutton-padding-y` | dito | 36 px | 44 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--ve-row-h)` / `(row-h − row-lh − 1px) / 2` | 36 px | 44 px |
| `--a-gv-header-cell-height` | `var(--ve-head-h)` | 40 px | 44 px |
| `--ut-report-cell-padding-y` | `var(--ve-row-pad-y)` | 36 px | 44 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-xs − head-rule-width) / 2` | 40 px | 44 px |
| `--a-checkbox-size` | `var(--ve-checkbox-size)` | 18 px | 20 px |

Lokale UT-Überschreibungen, die diese Werte wieder aufheben, müssen die Komponenten neu deklarieren (z. B. UT Core `.a-IRR { --a-gv-cell-padding-y: .5rem }`, `.t-Form--large`, `.t-Button--small|large`, Floating Labels).

### 4.4 Gestaltungsentscheidungen in der Brücke

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Palette | `--ut-palette-primary*` | `--ve-accent` / `-on` / `-tint` / `-text` | Primärfarbe des UT = Markenblau (Login-Hintergrund, Kalender-Termine, Avatare, Checkboxen …) |
| | `--ut-palette-primary-alt*` | `--ve-header-text` / `--ve-header` | UT nutzt sie für den Sprunglink auf dem Kopfband: weißes Kästchen mit Schrift in Kopfblau. `t-Button--primary` ist Rot (buttons.css) |
| | `--ut-palette-info*` | Markenblau (`--ve-info*`) | Hinweise gehören zur Marke |
| | `--ut-palette-generic*` | `--ve-soft` / `--ve-surface-sunken` / `--ve-ink` | neutral |
| Buttons | `--a-button-*` | Fläche `--ve-surface`, Kante und Schrift `--ve-accent-text`, 700 | Normal = weiß mit Blau-Kontur; Rot bleibt der Hauptaktion vorbehalten |
| Regionen | `--ut-region-*` | Fläche `--ve-surface`, Titel `--ve-heading` 19/24 in 800, Radius 0, kein Schatten | weiße, eckige Tafeln auf dem Seitengrund |
| Etiketten | `--ut-component-badge-*`, `--a-cv-badge-*`, `--ut-badge-border-radius` | `--ve-accent` / `--ve-accent-on`, Radius 0 | „Störer“: flaches Rechteck, fette weiße Schrift |
| Checked-Controls | `--a-checkbox-checked-background-color`, `--a-switch-checked(-hover)-background-color`, `--a-starrating-stars-fg-color` | `--ve-accent-text` | Marke ohne Schrift: dunkel ≥ 3 : 1 |
| Prozentbalken | `--a-percent-chart-bar-*` | `--ve-cat-1` / `--ve-cat-1-on`, Spur `--ve-soft` | Daten = Kategoriefarbe (Serie 1 Leuchtazur) |
| Hover schwebend | `--a-menu-focused-background-color`, `--a-datepicker-calendar-day-hover-background-color` | `--ve-raised-hover` | dunkel sichtbar; zieht IconList-, Popup-LOV-Link-, JET- und CKEditor-Hover mit |
| Pagination aktiv | `--a-gv-pagination-button-selected-*` | `--ve-accent` / `--ve-accent-on` | aktive Seite = blauer Block |
| Tabs aktiv | `--ut-tabs-item-active-*` | Schrift `--ve-accent-text`, Balken in shell.css (`--ve-accent-bright`) | Unterstrich-Tabs wie die Menüleiste |
| Tabellenkopf | `--a-gv-header-*`, `--ut-report-header(-cell)-*` | `--ve-surface`, `--ve-ink`, 700, Grundlinie 2 px `--ve-head-rule` | offene Tabelle mit kräftiger Kopflinie |
| Zähler | `--ut-navbar-button-badge-*` | Weiß mit Kopfblau | Zähler im Kopf als weißes Kästchen |
| Seitentitel | `--ut-breadcrumb-title-*` | `--ve-fs-display` / `--ve-lh-display` (40/44), 900 | die Signatur |
| Marquee-Kopf | `--ut-body-info-*` | `--ve-surface` / `--ve-ink` | UT fiele sonst auf die Farben der Title Bar (das Band) zurück |
| Code | `--prism-*` (§17) | `--ve-code-*`, `--ve-muted`, `--ve-ink(-2)`, `--ve-danger-text` | statt VS-Code-Paletten |
| Markdown | `--a-md-h1…h6-*`, `--a-md-blockquote-*` | 19/24 · 16/24 · 14/20 · 13/20 · 12/16 · 12/16, Zitat 16/24 | eine #-Überschrift im Feld darf nicht größer sein als der Seitentitel |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--ve-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt (`var(--a-field-input-border-color)` ist erlaubt, weil die Brücke ihn auf `--ve-edge` legt). Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift, z. B. `--a-field-input-border-style` ist in 24.2 `dashed`).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anlegen (in `light.css` **und** `dark.css`).
- Halbtransparente Überlagerungen (`--ve-tint-hover`, `--ve-header-hover`, `--ve-scrollbar-thumb`) sind Token-Werte, keine Regel-Werte.
- **Grund und Hover schwebender Ebenen (§3.6):** Aussparungen nehmen `--ve-ground`, Hover auf schwebenden Flächen `--ve-raised-hover`.
- **Auf den Bändern** (Kopf, Verlaufsband, Hero, Dialog-Titel) gelten `--ve-header-text` / `--ve-band-text` / `--ve-band-muted` für Schrift und `--ve-header-hover` / `--ve-header-press` für Hover-Flächen.
- Werte, die der Browser selbst färbt (native Scrollbars, Date-Inputs, Checkboxen ohne UT-Template), folgen `--ut-color-scheme` → nichts tun.

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Vorgehen:
1. Selektor in `_reference/ut-26.1/css/Vita.css` (und `Vita-Dark.css`) suchen, **identische Selektorliste** übernehmen.
2. Nur die betroffenen Deklarationen neu setzen – mit Tokens.
3. Die 38 Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen (Status-Buttons inkl. `--simple/--link/--noUI` und `.fa:after`, 12 `.a-IG-controls-item--*`-Typen, IG-Zellen, `.a-IRR-header*`, `.a-GV-controlBreakHeader`, `.a-IG-button--controls`, `.t-CardsRegion--style*`). Jede davon muss in der zuständigen Komponenten-Datei neu deklariert sein.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen, also aus Vita, UT Core oder app_ui (`Theme-Standard.css`/`Core.css`). Dann mit gleichem Selektor bzw. gleicher Spezifität + `!important` und einem Kommentar, der die Quelle nennt. Nie, um eigene Regeln untereinander zu ordnen – dafür gibt es lokale Tokens (Beispiel: Der Nav-Hover muss Vitas `!important` schlagen; seine Farbe kommt aus `--ve-c-nav-hover-bg`, das der Aktiv-Block lokal auf `--ve-accent-hover` stellt). `node _tools/lint.mjs` zählt die Vorkommen je Datei als Hinweis.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `Vita.css .t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important }` | shell.css (Fläche aus `--ve-c-nav-hover-bg`) |
| Vita | `Vita.css .t-TreeNav--styleB … .is-current--top.is-hover { color: white / background-color: #056dcd !important }` | shell.css (Farben aus `--ve-c-nav-hover-*`) |
| UT Core | `apex-core-font` an den Pflicht-Sternchen (`:after`) | forms.css (`font-family: inherit !important`) |
| UT Core | `.u-color-N { --u-color: … !important }` | nur mit `!important` am selben Element übersteuerbar (utilities.css, derzeit nicht nötig) |
| app_ui | `.a-IRR-dialogList a` Textfarbe/Hover, 2 px Abstand am Farbwähler/Kalender-Knopf im IR-Filter | reports.css |
| app_ui | `.fc .fc-helper` (FullCalendar-Auswahl `#0572CE`) | viz.css |

Stand 2026-09-24 (Zählung `lint.mjs`, ohne Kommentare): shell 3, viz 3, forms 2, reports 2. Jedes davon richtet sich gegen eine der Quellen oben. Die Drawer-Geometrie von UT Core (bündig am Fensterrand, eckig) bleibt unverändert – sie passt zu Veedel.

### 5.4 Lokale Komponenten-Tokens

- Name: **`--ve-c-<komponente>-<name>`** (z. B. `--ve-c-nav-hover-bg`, `--ve-c-tab-pad-x`, `--ve-c-alert-bar`). Das Präfix `--ve-c-` ist für lokale Tokens reserviert; globale Tokens beginnen nie damit.
- Deklaration auf dem **Wurzel-Selektor der Komponente** (`.t-TreeNav`, `.a-IRR`, `.t-Alert`), nie auf `:root`.
- Werte nur aus globalen Tokens oder Längen, Farben immer als `var(--ve-*)`.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament.

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--ve-focus-ring-color`, 2 px (`--ve-focus-ring-width`), 2 px Abstand (`--ve-focus-ring-offset`) – auf Fläche **und** Seitengrund, hell und dunkel ≥ 3 : 1 (Tabelle §3.5). Der Abstand zeigt den Grund als Innenring (Doppelring). Die Schatten-Varianten `--ve-focus-shadow(-inset)` zeichnen die Lücke in `--ve-focus-gap` = `--ve-ground`.
- **Auf den blauen Bändern ist der Ring weiß** (`--ve-header-focus`) – über den Hook `--ut-focus-outline` am Band-Container (shell.css, regions.css, overlays.css, login.css). Kind-Container mit weißer Fläche (Menüzeile der Top-Navigation, Tab-Leiste im Band, Popups) stellen den Hook wieder auf `var(--ve-focus-outline)`.
- Global erledigt: `base.css` zeichnet `:focus-visible` mit den Hooks, entfernt den Ring bei Maus-Fokus (`:focus:not(:focus-visible)`) und lässt `tabindex="-1"` aus (wie UT). Der Tastatur-Ring (`:focus-visible:not([tabindex="-1"])`) hat bewusst Spezifität **0,2,0** und schlägt damit auch Oracle-Regeln, die den Umriss unterdrücken (`a.t-ContentRow-wrap`, `.a-CardView-titleLink`). Wo Oracle den Fokus anders zeigt, nimmt die Komponente den doppelten Ring lokal mit `--ut-focus-outline: none` weg: `.a-TreeView-label` (Navigation und Tree-Regionen) → shell.css / viz.css; `.a-FS .apex-item-option` → search.css; `.a-IRR-dialogList a` → reports.css.
- **Komponenten ändern den Ring nur über die Hooks** auf ihrem Selektor:
  - abgeschnittener Kontext (`overflow` hidden/clip, Tabs, Grid-Zellen, Listen in Scroll-Containern): `--ut-focus-outline-offset: calc(-1 * var(--ve-focus-ring-width))` (Ring nach innen) oder `box-shadow: var(--ve-focus-shadow-inset)` mit `--ut-focus-outline: none`;
  - freistehend, aber `outline` wird verdeckt: `box-shadow: var(--ve-focus-shadow)`;
  - **Felder:** `border-color: var(--ve-focus-ring-color)` + `box-shadow: var(--ve-focus-field-shadow)` (= 2 px Ring ohne Layoutsprung); der weiche Halo `--ve-accent-ring` darf nur **zusätzlich** erscheinen;
  - Checkbox/Radio/Switch: Ring am sichtbaren Kästchen, nicht am versteckten `input`;
  - **Ring-Raum in Scroll-Containern mit bündigem Inhalt:** regions.css gibt dem Körper von Body Overflow „Scroll“ Ring-Raum als seitliches Polster und nimmt ihn mit negativer Marge zurück (`--ve-c-region-ring-room`);
  - **Roving-Tabindex-Listen zeichnen den Ring selbst** (Facetten-Optionen, Date-Picker-Knöpfe, Icon-Listen, Tree, Grid-Zellen, Menüeinträge).
- Visuell versteckte Formular-Eingaben (`.u-vh`, `.u-VisuallyHidden`) zeichnen keinen eigenen Ring (base.css).
- Nie `outline: none` ohne gleichwertigen Ersatz.

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe (app_ui-Konvention: Polster enthält den 1-px-Rand). Eigene Elemente: `min-block-size: var(--ve-control-h)` bzw. `var(--ve-row-h)`; keine festen px-Höhen.
- Controls 36 px, Tabellenzeilen 36 px, Tabellenköpfe 40 px, Navigation 40/36 px; unter `pointer: coarse` automatisch 44 px. Nichts selbst mit `@media (pointer: coarse)` nachbauen – außer für Dinge ohne Token (dann Werte aus `--ve-hit-min`).
- Trefferflächen kleiner Icon-Buttons ≥ `--ve-hit-min` (24 px Desktop, 44 px Touch).
- Kleine/große Varianten: `--ve-control-h-sm` (28 px) / `--ve-control-h-lg` (44 px).

### 5.7 Typografie

- Schrift **Figtree** (als „Veedel Sans“), variable Achse 300–900, aufrecht und kursiv. Gewichte: 400 Fließtext · 500 Unterebenen · 600 Tabellen/Labels · **700** Buttons, Navigation, Tabellenköpfe · **800** Region- und Abschnittstitel · **900** Seitentitel, Marke, Login.
- Nur die Skala: `--ve-fs-xs|head|sm|md|lg|xl|2xl|3xl|display` (12 · 12,5 · 13 · 14 · 16 · 19 · 26 · 32 · 40) mit passender `--ve-lh-*`, Laufweite `--ve-tracking-*`. Hilfsklassen `.ve-text-*` in `base.css`.
- **Rohe Überschriften** (Static Content, Rich Text, Hilfe) setzt base.css auf die Skala: `h1` 26/32 · `h2` 19/24 · `h3` 16/24 · `h4` 14/20 · `h5` 13/20 · `h6` 12/16 in 800 bzw. 700.
- **Titel in Leuchtblau** (`--ve-heading`) nur ab 19 px und 800 (Region-Titel, Content Block h1/h2, Wizard, Login). Kleinere Titel in Nachtblau.
- **Code:** Monospace `--ve-font-mono`, Syntaxfarben nur über `--prism-*` (bridge §17 → `--ve-code-*`).
- Tabellenköpfe: `--ve-fs-head`, 700, Farbe `--ve-ink`, **kein Kopfband**, **keine Versalien**, Grundlinie 2 px `--ve-head-rule`. Zahlen tabellarisch.
- Keine Monospace-Schrift für UI-Beschriftungen, keine ALL-CAPS-Labels.
- **Labels immer linksbündig** (forms.css); die Template-Option „Label Alignment: Right“ entfällt (§7).

### 5.8 Farbrollen: Blau, Rot, Karmin, Status

- **Rot** (`--ve-action`, `-hover`, `-press`, `-on`, `-text`, `-tint`) ausschließlich für die **Hauptaktion**: `t-Button--hot`, `a-Button--hot`, `t-Button--primary`, `u-hot`. Keine roten Flächen als Dekoration, keine roten Etiketten.
- **Blau** (`--ve-accent*`):
  - `--ve-accent` (+ `-hover`/`-press`, Schrift `--ve-accent-on`): Flächen **mit Schrift** – aktiver Nav-Eintrag, gewählter Tag, gewähltes Segment, aktive Seite, Etiketten.
  - `--ve-accent-text`: Schrift, Icons, Kanten (normale Buttons), Häkchen, Schalter, Wizard-Ring.
  - `--ve-accent-bright`: Balken-Marken (aktiver Tab, Menüleiste, Tabs-Navigation).
  - `--ve-accent-tint`/`-tint-2`: Auswahl-Zeilen, Menü-Auswahl, Hover normaler Buttons, `::selection`.
- **Karminrot** (`--ve-danger*`): Fehler und Gefahr. Buttons `t-Button--danger` stehen im Ruhezustand als **Kontur** (weiße Fläche, Karmin-Kante und -Schrift) und füllen sich erst bei Hover/Druck. So bleibt die gefüllte rote Fläche der Hauptaktion eindeutig.
- **Status:** Fläche `--ve-<s>` + Schrift `--ve-<s>-on`; Text auf Fläche `--ve-<s>-text`; Alert-/Meldungs-Hintergrund `--ve-<s>-tint`. Alerts tragen zusätzlich einen 4-px-Balken in der Statusfarbe an der Startkante.
- **Zähler:** in Buttons Nachtblau, im Kopf weißes Kästchen, in der Navigation neutral (im Aktiv-Block weiß). **Daten** (Prozentbalken, Charts, Avatare mit `u-color`) in Kategoriefarben `--ve-cat-*`.
- **Farbpaare immer zusammen setzen (Icon-Kacheln):** Media List, Timeline, Comments, Legacy Cards jeweils `--ve-accent-tint` + `--ve-accent-text` am Element; farbige Kacheln über `u-color-N`/`u-colors`.
- **Empfehlung Freigeben/Ablehnen:** Freigeben als *Hot* (rote Fläche), Ablehnen als *Danger* (Karmin-Kontur).
- Pflichtfeld: `content: var(--ve-required-mark)`, `color: var(--ve-required-color)` (= Gefahr-Text).

### 5.9 RTL und Responsivität

- Logische Eigenschaften und Werte (`inset-inline-start`, `padding-inline`, `border-start-end-radius`, `text-align: start`). Wo UT physisch setzt, physisch überschreiben **und** `.u-RTL`-Variante liefern.
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (`--js-mq-*`, nur lesen). Innenabstände, Seitentitel und Band werden unter 640 px über Tokens kleiner – nicht in Komponenten nachbauen.
- **Lese-Hebel `--js-sticky-top`:** theme42.js misst `#t_Header` (bei Top-Navigation samt Menüleiste) und schreibt die Höhe als Inline-Style an `<html>`. Eigene sticky oder fixierte Elemente lesen ihn **immer mit Fallback**: `top: var(--js-sticky-top, 0px)` (shell.css: mobile Schublade, rechte Spalte). Nie setzen (Regel 11).

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; Bitmap-Texturen; Oracle Sans/Redwood-Paletten; Vita-Werte kopieren; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `veedel-auto.css`; eine Datei zweimal importieren; Namen oder Logos von Dritten in CSS und Style-Namen.

---

## 6. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`. Eigene Ausgabeordner unter `_tmp/veedel/` verwenden (andere Themes laufen parallel).

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Veedel` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Veedel` | „OK – keine Fehler“ (Hinweise prüfen) |
| Token-Kontraste, Palette | `node Veedel/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Veedel --style light,dark --pages core --out _tmp/veedel/<ordner>` | ansehen (Read) |
| Nav aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | blauer Aktiv-Block, Eltern-Eintrag blau |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 44 px) | Schublade über dem Inhalt, Band ohne Leuchtazur-Ende |
| Auto-Äquivalenz | `THEME=Veedel VERIFY_OUT=_tmp/veedel/verify bash _tools/verify-auto.sh [seiten] [app]` | alle `GLEICH 0 px` (Schwelle 0) |
| UT 24.2 | Screenshots mit `--app 9242`, `verify-auto.sh [seiten] 9242` | wie 9042 |
| Oracle-Blau | `node _tools/audit-blue.mjs --theme Veedel --pages core --styles light,dark --states --overlays --out _tmp/veedel/audit-blue.json` | jeder Treffer gehört einem Veedel-Token (§4.1) |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Veedel --style light,dark --pages all --out _tmp/veedel/audit` (`--mobile`, `--app 9242`) | 0 Überlauf, 0 JS-Fehler, Kontrast nur Demo-CSS (6100, 6302–6304, 6307, 6400) |
| Fokus | eigenes Skript mit `launchLab` aus `_tools/lib/lab.mjs`: `Tab` drücken, Ausschnitt fotografieren | Ring sichtbar, genau einer; auf den Bändern weiß |
| Berechnete Werte | `node _tools/shoot.mjs … --computed ".sel:prop1,prop2" --no-shot` | |
| Pixel-Vergleich | `node _tools/pixel-diff.mjs --dir-a A --dir-b B [--threshold 0]` | |
| Kontaktbogen | `node _tools/contact-sheet.mjs --out x.png --cols 2 --dir <ordner> --match <text>` | |
| Doku neu erzeugen | `node Veedel/tools/build-architecture.mjs` | Tabellen = Quellen |
| README-Bilder | `node Veedel/tools/screenshots.mjs` | `Veedel/screenshots/*.png` (hell \| dunkel) |

Seiten-Sets (`_tools/testbed-pages.json`): core, shell, regions, lists, reports, components, forms, dialogs, misc.

---

## 7. Bekannte Grenzen und offene Punkte

- **Blaues Theme im Blau-Audit:** Die Oracle-Blau-Audits sind für neutrale Themes gebaut. Bei Veedel melden sie jede Marken- und Auswahlfläche; die Triage (Treffer ↔ Token) ist Teil jeder Prüfung (§4.1).
- **Leuchtazur und kleine Schrift:** `#0091FA` trägt nur große Schrift (3,3 : 1). Apps, die eigene kleine Texte ins Band setzen (Static Content in der Breadcrumb-Leiste), stehen links auf Tiefblau – rechts nicht. Mobil endet der Verlauf deshalb im Mittelblau.
- **Nicht-deterministische Bildpixel:** Chrome dekodiert JPEGs gelegentlich um ±1 Farbwert anders (Kartenfotos auf 3110, auch zwischen zwei Läufen desselben Styles). `verify-auto.sh` ersetzt Fotos deshalb standardmäßig durch graue Flächen (`VERIFY_MASK=0` schaltet das ab).
- **9242 vs. 9042, Seite 1601:** Die Single-Checkbox steht im Testbett 9242 in der Feldspalte, in 9042 in der Label-Spalte – auch ohne Theme (Seiteninhalt der Testbetten), kein Theme-Unterschied.
- **Radio-Gruppe als Buttons in schmalen Spalten:** Figtree hat keine Breitenachse; zwei Segmente mit langen Beschriftungen brechen in schmalen Formularspalten (1601 bei 1440 px) in zwei Zeilen um. Der Umbruch ist gewollt (fließende Zeile statt Überlauf).
- **Body-Schriftgröße:** `--ut-base-font-size` ist 14 px (Vita 16 px). Unformatierter Text erbt 14 px.
- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Druck:** hell, ohne Bänder und Schatten; Vita-Dark-Werte, die die Brücke nicht setzt (Chat, Diagramm), bleiben im Druck des Dark-Styles dunkel (Hintergründe druckt der Browser standardmäßig nicht).
- **Markdown im Chat:** UT Core setzt für `.a-ChatClient .is-markdownified` lokal eigene Größen; das bleibt der Chat-Komponente überlassen.
- **Bewusst entfallene Template-Option „Label Alignment: Right“:** Veedel stellt Labels immer linksbündig (forms.css, §5.7).
- **Theme-Variante (Theme 143):** Der Installer wird vom selben Build-Werkzeug erzeugt wie bei Passepartout (dort getestet, Theme 142). Für Veedel wurden Installation und Deinstallation am 24.09.2026 in einer frischen UT-26.1-App geprüft (siehe `docs/THEME-VARIANTE.md`).
