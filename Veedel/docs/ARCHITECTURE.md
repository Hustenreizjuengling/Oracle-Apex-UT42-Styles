# Veedel – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: Kopfband in tiefem Markenblau, weiße Navigation mit blauem Aktiv-Block, Seitentitel als **Verlaufsband** (Tiefblau → Leuchtazur) mit riesiger weißer Headline in Figtree Black, weiße eckige Flächen auf hellgrauem Seitengrund, **Signalrot nur für die Hauptaktion**.
> Technische Grundlage ist die Architektur von Passepartout (erstes Theme dieses Projekts). Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Veedel/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

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

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Flächen** | | | |
| `--ve-page` | `#F4F6F7` | `#081E35` | Seitengrund unter Regionen und Karten |
| `--ve-surface` | `#FFFFFF` | `#0D2742` | Regionen, Karten, Navigation, Tab-Leiste |
| `--ve-surface-sunken` | `#F4F6F7` | `#0A2139` | abgesenkt in weißen Flächen: Toolbars, Code-Blöcke, Hinweisblöcke in Regionen, Readonly |
| `--ve-surface-raised` | `#FFFFFF` | `#12304F` | schwebend: Menüs, Dialoge, Popups |
| `--ve-raised-hover` | `#E6EEF5` | `#1B3D62` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--ve-soft`/`--ve-hover`, die dort dunkel kaum sichtbar sind |
| `--ve-ground` | `var(--ve-surface)` | `var(--ve-surface)` | aktuelle Grundfläche: an der Wurzel die Fläche (`--ve-surface`), in Menüs, Dialogen, Popups und Seiten-Dialogen `--ve-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--ve-hover` | `#EFF4F9` | `#12304F` | Zeilen-/Listen-Hover auf Weiß |
| `--ve-press` | `#E2EAF2` | `#173659` | gedrückt auf Weiß |
| `--ve-soft` | `#EBEFF3` | `#173659` | neutrale Fläche: Chips, Zähler-Grund, aktive Pagination |
| `--ve-soft-hover` | `#DFE5EB` | `#1E4066` | neutrale Fläche Hover |
| `--ve-soft-press` | `#D3DBE3` | `#264B74` | neutrale Fläche gedrückt |
| `--ve-field` | `#FFFFFF` | `#0A2139` | Eingabefelder |
| `--ve-field-readonly` | `#F4F6F7` | `#0F2B48` | schreibgeschützte Felder |
| `--ve-scrim` | `rgb(8 30 53 / .5)` | `rgb(0 8 18 / .65)` | Abdunklung hinter Dialogen/Schublade |
| `--ve-tint-hover` | `rgb(8 30 53 / .06)` | `rgb(242 246 250 / .07)` | durchscheinender Hover auf beliebigem Grund |
| `--ve-tint-press` | `rgb(8 30 53 / .11)` | `rgb(242 246 250 / .12)` | durchscheinend gedrückt |
| **Markenband: Kopf** | | | |
| `--ve-header` | `#004B8D` | `#003466` | Kopfband, tiefstes Markenblau – eine Stufe unter dem Band |
| `--ve-header-text` | `#FFFFFF` | `#FFFFFF` | Schrift und Icons im Kopf |
| `--ve-header-hover` | `rgb(255 255 255 / .14)` | `rgb(255 255 255 / .12)` | Hover auf dem Kopfband (Header-Buttons) |
| `--ve-header-press` | `rgb(255 255 255 / .24)` | `rgb(255 255 255 / .2)` | gedrückt/aktiv auf dem Kopfband |
| `--ve-header-focus` | `#FFFFFF` | `#FFFFFF` | Fokusring auf dem Band |
| **Signatur: Verlaufsband (Title Bar, Hero, Login)** | | | |
| `--ve-band-from` | `#005FAF` | `#00427F` | links: tief |
| `--ve-band-mid` | `#006AC0` | `#00569E` | Mitte |
| `--ve-band-to` | `#0091FA` | `#0077D6` | rechts: Leuchtazur |
| `--ve-band-text` | `#FFFFFF` | `#FFFFFF` | Schrift auf dem Verlaufsband (Titel, Breadcrumb aktiv) |
| `--ve-band-muted` | `rgb(255 255 255 / .9)` | `rgb(255 255 255 / .9)` | Breadcrumb auf dem Band |
| **Text** | | | |
| `--ve-ink` | `#081E35` | `#F2F6FA` | Nachtblau: Text, Labels der Navigation |
| `--ve-ink-2` | `#2B3F56` | `#D3DEE9` | Unterebenen der Navigation, Icons; im Code Eigenschaften, Variablen, Attribute |
| `--ve-muted` | `#56657A` | `#9DB1C6` | Sekundärtext, Feld-Labels, Breadcrumb |
| `--ve-placeholder` | `#63707F` | `#8BA0B6` | Platzhalter |
| `--ve-disabled` | `#8A95A1` | `#5E7690` | deaktivierte Beschriftung |
| `--ve-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--ve-on-light` | `#081E35` | `#081E35` | Text auf hellen Flächen |
| `--ve-heading` | `#0086EA` | `#6EC1FF` | Überschriften ab 19 px/800 |
| **Linien** | | | |
| `--ve-line-subtle` | `#E8ECEF` | `#163352` | sehr zart: innere Trenner in Karten/Listen |
| `--ve-line` | `#DCE1E6` | `#1F3E5E` | Haarlinie: Tabellenzeilen, Trenner |
| `--ve-line-strong` | `#C3CBD3` | `#2E5174` | kräftig: Rahmen von Containern, Karten |
| `--ve-edge` | `#7E8A97` | `#6A89A8` | Feldkante – WCAG 1.4.11 |
| `--ve-edge-hover` | `#56657A` | `#8FAAC4` | Feldkante Hover |
| `--ve-head-rule` | `#081E35` | `#C9D6E3` | Grundlinie unter Tabellenköpfen |
| **Akzent Blau: Auswahl, Aktiv, Checked, Links, Marken** | | | |
| `--ve-accent` | `#005FAF` | `#2474C4` | Fläche mit Schrift: aktiver Nav-Eintrag, gewählter Tag |
| `--ve-accent-hover` | `#004E91` | `#0B65B1` | Blau-Fläche Hover (Nav-Block, Auswahl) |
| `--ve-accent-press` | `#003F77` | `#005A9F` | Blau-Fläche gedrückt |
| `--ve-accent-on` | `#FFFFFF` | `#FFFFFF` | Text/Icon auf der Blau-Fläche |
| `--ve-accent-text` | `#005FAF` | `#6EC1FF` | als Text/Icon/Marke |
| `--ve-accent-bright` | `#0091FA` | `#3AA8FF` | Leuchtazur: nur Deko und große Flächen ohne kleine Schrift |
| `--ve-accent-tint` | `#E6F2FC` | `#103A63` | Auswahl-Fläche |
| `--ve-accent-tint-2` | `#CFE5F8` | `#164B7D` | kräftigere Auswahl, ::selection |
| `--ve-accent-ring` | `rgb(0 145 250 / .25)` | `rgb(110 193 255 / .32)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| **Aktion Rot: exklusiv für die Hauptaktion (Hot/Primary)** | | | |
| `--ve-action` | `#E3250C` | `#E3250C` | Signalrot |
| `--ve-action-hover` | `#CD2319` | `#CD2319` | Signalrot Hover (Hot/Primary) |
| `--ve-action-press` | `#B01C12` | `#B01C12` | Signalrot gedrückt |
| `--ve-action-on` | `#FFFFFF` | `#FFFFFF` | Schrift auf Signalrot |
| `--ve-action-text` | `#C8200E` | `#FF7A66` | Rot als Schrift : 5.7 Fläche |
| `--ve-action-tint` | `#FDECE9` | `#3A2030` | Hover einfacher Hot-Buttons |
| **Fokus (ein System, überall >= 3:1)** | | | |
| `--ve-focus-ring-color` | `#0078CD` | `#6EC1FF` | Ring |
| `--ve-focus-gap` | `var(--ve-ground)` | `var(--ve-ground)` | Innenring/Lücke des Doppelrings (= `--ve-ground`: Fläche, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Markenblau mit Unterstrich** | | | |
| `--ve-link-text` | `#005FAF` | `#7CC6FF` | Linkfarbe im Fließtext (Markenblau) |
| `--ve-link-underline` | `#005FAF` | `#7CC6FF` | Unterstrich im Ruhezustand |
| `--ve-link-underline-hover` | `#0086EA` | `#B5DEFF` | Unterstrich bei Hover (Leuchtblau, doppelt so stark) |
| **Textauswahl** | | | |
| `--ve-selection` | `#CFE5F8` | `#1D5288` | ::selection-Hintergrund |
| `--ve-selection-text` | `#081E35` | `#FFFFFF` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--ve-required-color` | `#9E1030` | `#FF8A95` | = Danger-Text |
| **Status: Fläche · Hover · on (Text auf Fläche) · Text · Tönung (Alert-Grund)** | | | |
| `--ve-success` | `#13803B` | `#3DBE72` | Erfolg: Fläche (Buttons, Badges) |
| `--ve-success-hover` | `#0F6B31` | `#58CC88` | Erfolg: Fläche Hover |
| `--ve-success-on` | `#FFFFFF` | `#081E35` | Erfolg: Text/Icon auf der Fläche |
| `--ve-success-text` | `#106E33` | `#5FD08C` | Erfolg: Textfarbe auf Fläche/Tönung |
| `--ve-success-tint` | `#E7F4EC` | `#0E3436` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ve-warning` | `#F5A800` | `#F5B000` | Warnung: Fläche (Buttons, Badges) |
| `--ve-warning-hover` | `#FFB930` | `#FFC23D` | Warnung: Fläche Hover |
| `--ve-warning-on` | `#081E35` | `#081E35` | Warnung: Text/Icon auf der Fläche |
| `--ve-warning-text` | `#8A5700` | `#FFC94D` | Warnung: Textfarbe auf Fläche/Tönung |
| `--ve-warning-tint` | `#FFF4D9` | `#2F3226` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ve-danger` | `#9E1030` | `#FF8A95` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--ve-danger-hover` | `#850B27` | `#FFA3AC` | Fehler/Gefahr: Fläche Hover |
| `--ve-danger-on` | `#FFFFFF` | `#081E35` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--ve-danger-text` | `#9E1030` | `#FF8A95` | Fehler/Gefahr: Textfarbe auf Fläche/Tönung |
| `--ve-danger-tint` | `#FBEBEE` | `#3A2236` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--ve-info` | `#005FAF` | `#6EC1FF` | Information: Fläche (Buttons, Badges) |
| `--ve-info-hover` | `#004E91` | `#8DCEFF` | Information: Fläche Hover |
| `--ve-info-on` | `#FFFFFF` | `#081E35` | Information: Text/Icon auf der Fläche |
| `--ve-info-text` | `#005FAF` | `#7CC6FF` | Information: Textfarbe auf Fläche/Tönung |
| `--ve-info-tint` | `#E6F2FC` | `#103A63` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--ve-code-keyword` | `#005FAF` | `#7CC6FF` | Schlüsselwörter, Selektoren, Klassen: Markenblau |
| `--ve-code-string` | `#106E33` | `#5FD08C` | Zeichenketten: Grün |
| `--ve-code-number` | `#8A5700` | `#FFC94D` | Zahlen, Wahrheitswerte, Konstanten: Ocker |
| **Tiefe** | | | |
| `--ve-card-shadow` | `none` | `none` | Flächen liegen flach auf dem Seitengrund |
| `--ve-lift-shadow` | `0 10px 24px -12px rgb(8 30 53 / .35)` | `0 10px 24px -12px rgb(0 0 0 / .7)` | Karten-Hover: leichtes Anheben |
| `--ve-float-shadow` | `0 16px 36px -10px rgb(8 30 53 / .28), 0 0 0 1px rgb(8 30 53 / .08)` | `0 18px 40px -10px rgb(0 0 0 / .65), 0 0 0 1px rgb(255 255 255 / .08)` | Schatten schwebender Ebenen (Menüs, Dialoge, Popups, Login-Fläche) – nie auf Regionen |
| `--ve-tooltip-bg` | `#081E35` | `#F2F6FA` | Tooltip-Fläche (invertiert) |
| `--ve-tooltip-text` | `#FFFFFF` | `#081E35` | Tooltip-Text |
| **Scrollbars** | | | |
| `--ve-scrollbar-thumb` | `rgb(8 30 53 / .28)` | `rgb(242 246 250 / .26)` | Scrollbar-Daumen |
| `--ve-scrollbar-thumb-hover` | `rgb(8 30 53 / .45)` | `rgb(242 246 250 / .42)` | Scrollbar-Daumen Hover |
| `--ve-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Icons** | | | |
| `--ve-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (Grau, als Data-URI) |

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

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--ve-cat-1` | `#0091FA` | `#081E35` | `#3AA8FF` | `#081E35` | 1 | Leuchtazur (Marke) |
| 2 | `--ve-cat-2` | `#647386` | `#FFFFFF` | `#9AA9BA` | `#081E35` | 9 | Schiefer |
| 3 | `--ve-cat-3` | `#624D29` | `#FFFFFF` | `#E6C488` | `#081E35` | 6 | Sandstein (hell als Umbra: dunkel, 8.0) |
| 4 | `--ve-cat-4` | `#0B2F5B` | `#FFFFFF` | `#C3D6EE` | `#081E35` | 2 | Nachtblau |
| 5 | `--ve-cat-5` | `#49A19C` | `#081E35` | `#4FC2B8` | `#081E35` | 10 | Rheinwasser |
| 6 | `--ve-cat-6` | `#2D6E3E` | `#FFFFFF` | `#62B076` | `#081E35` | 12 | Stadtwald |
| 7 | `--ve-cat-7` | `#D08200` | `#081E35` | `#FF9F1C` | `#081E35` | 3 | Bernstein |
| 8 | `--ve-cat-8` | `#8259CC` | `#FFFFFF` | `#CDB8FF` | `#081E35` | 7 | Flieder |
| 9 | `--ve-cat-9` | `#1B9A6C` | `#081E35` | `#1F9E68` | `#081E35` | 4 | Grün |
| 10 | `--ve-cat-10` | `#6E6A2C` | `#FFFFFF` | `#B5AE62` | `#081E35` | 8 | Moos |
| 11 | `--ve-cat-11` | `#C87D9D` | `#081E35` | `#F5A9C6` | `#081E35` | 11 | Rosé |
| 12 | `--ve-cat-12` | `#B6287A` | `#FFFFFF` | `#E26AAE` | `#081E35` | 5 | Beere |
| 13 | `--ve-cat-13` | `#0E6068` | `#FFFFFF` | `#3FA6AE` | `#081E35` | – | Tiefseegrün |
| 14 | `--ve-cat-14` | `#8995A1` | `#081E35` | `#B7C2CD` | `#081E35` | – | Nebel |
| 15 | `--ve-cat-15` | `#3E4B5A` | `#FFFFFF` | `#7F90A3` | `#081E35` | – | Basalt |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Veedel ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--ve-cat-N) 45%, #fff)` mit Text `--ve-on-light`, 31–45 = `color-mix(in srgb, var(--ve-cat-N) 55%, #000)` mit Text `--ve-on-dark` (beide ≥ 4,5 : 1, geprüft). So scheint keine Vita-Farbe durch – auch nicht im Zyklus `.u-colors > :nth-child(45n+N)` und im Workflow-Diagramm.

### 3.4 Maß-, Schrift-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--ve-font` | `"Veedel Sans", "Figtree", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Schriftfamilie der gesamten Oberfläche (Figtree als „Veedel Sans“, dann System) |
| `--ve-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--ve-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--ve-fw-medium` | `500` | Labels, Breadcrumb, Unterebenen der Navigation |
| `--ve-fw-semibold` | `600` | Tabellenköpfe klein, Menüs |
| `--ve-fw-bold` | `700` | Buttons, Navigation, „fett“ im Fließtext |
| `--ve-fw-heavy` | `800` | Region- und Abschnittstitel |
| `--ve-fw-black` | `900` | Seitentitel im Band, Marke, Login |
| `--ve-fs-xs` | `.75rem` | 12  Klein: Hilfe, Badges, Zähler |
| `--ve-fs-head` | `.78125rem` | 12,5 Tabellenköpfe |
| `--ve-fs-sm` | `.8125rem` | 13  Tabellenzellen, Labels, Breadcrumb |
| `--ve-fs-md` | `.875rem` | 14  UI, Fließtext, Felder, Buttons |
| `--ve-fs-lg` | `1rem` | 16  Karten-Titel, Dialog-Titel, Unterüberschriften |
| `--ve-fs-xl` | `1.1875rem` | 19  Region-Titel (800: WCAG „großer Text“) |
| `--ve-fs-2xl` | `1.625rem` | 26  Abschnitt (Content Block), Seitentitel eingeklappt/mobil |
| `--ve-fs-3xl` | `2rem` | 32  Content Block h1 |
| `--ve-fs-display` | `2.5rem` | 40  Seitentitel im Verlaufsband |
| `--ve-lh-xs` | `1rem` | zu 12 / 12,5 |
| `--ve-lh-sm` | `1.25rem` | zu 13 |
| `--ve-lh-md` | `1.25rem` | zu 14 (Controls) |
| `--ve-lh-body` | `1.375rem` | zu 14 im Fließtext |
| `--ve-lh-lg` | `1.5rem` | zu 16 |
| `--ve-lh-xl` | `1.5rem` | zu 19 |
| `--ve-lh-2xl` | `2rem` | zu 26 |
| `--ve-lh-3xl` | `2.375rem` | zu 32 |
| `--ve-lh-display` | `2.75rem` | zu 40 |
| `--ve-tracking-title` | `-.025em` | Seitentitel im Band, Login |
| `--ve-tracking-heading` | `-.012em` | Region-/Abschnittstitel |
| `--ve-tracking-ui` | `0em` | Buttons |
| **Geometrie: Seite, Band, Navigation** | | |
| `--ve-page-pad-x` | `2rem` | Innenabstand des Inhalts, waagerecht |
| `--ve-page-pad-y` | `1.5rem` | Innenabstand des Inhalts, senkrecht |
| `--ve-band-pad-y` | `1.75rem` | Verlaufsband: oben/unten |
| `--ve-band-angle` | `100deg` | Richtung des Verlaufs (tief links → Leuchtazur rechts) |
| `--ve-r-lg` | `0rem` | Container: Regionen, Karten, Tabellen, Alerts – eckig |
| `--ve-r-md` | `.25rem` | 4  Buttons, Tabs, Chips |
| `--ve-r-sm` | `.125rem` | 2  Checkbox, kleine Marken |
| `--ve-r-field` | `0rem` | Eingabefelder – eckig |
| `--ve-r-float` | `.25rem` | 4  schwebend: Menüs, Dialoge, Popups |
| `--ve-r-pill` | `62rem` | Pillen (runde Avatare, Schalter) |
| `--ve-header-h` | `3.5rem` | Kopfband (statisch – nie per JS/Font verändern) |
| `--ve-brand-lh` | `1.5rem` | feste Zeilenhöhe Logo/Branding: Font-Swap verschiebt nichts |
| `--ve-nav-w` | `16rem` | aufgeklappte Side-Navigation |
| `--ve-nav-rail-w` | `3.75rem` | eingeklappte Icon-Leiste |
| `--ve-mark-w` | `.25rem` | Balken-Marke (aktiver Tab, Menüleiste, Alert-Kante) |
| **Abstände (4er-Raster)** | | |
| `--ve-space-1` | `.25rem` | 4 |
| `--ve-space-2` | `.5rem` | 8 |
| `--ve-space-3` | `.75rem` | 12 |
| `--ve-space-4` | `1rem` | 16 |
| `--ve-space-5` | `1.25rem` | 20 |
| `--ve-space-6` | `1.5rem` | 24 |
| `--ve-space-8` | `2rem` | 32 |
| `--ve-space-12` | `3rem` | 48 |
| `--ve-region-gap` | `1.5rem` | Abstand zwischen Regionen (→ --ut-region-margin) |
| `--ve-region-pad-x` | `1.5rem` | Innenabstand weißer Regionen |
| `--ve-region-pad-y` | `1.25rem` |  |
| **Dichte (Desktop 36 px; unter pointer: coarse 44 px – siehe bridge.css)** | | |
| `--ve-control-h` | `2.25rem` | Höhe Buttons, Felder, Selects (inkl. Rand) |
| `--ve-control-h-sm` | `1.75rem` | kleine Buttons (t-Button--small), Toolbar-Icons |
| `--ve-control-h-lg` | `2.75rem` | große Buttons (t-Button--large), Login |
| `--ve-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--ve-control-pad-x` | `.875rem` | Innenabstand waagerecht (Felder); Buttons +2 px |
| `--ve-control-pad-y` | `calc((var(--ve-control-h) - var(--ve-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--ve-row-h` | `2.25rem` | Tabellenzeile 36 px inkl. Haarlinie |
| `--ve-row-lh` | `1.25rem` | Zeilenhöhe in Zellen (13/20) |
| `--ve-row-pad-x` | `.75rem` | Zellen-Innenabstand waagerecht |
| `--ve-row-pad-y` | `calc((var(--ve-row-h) - var(--ve-row-lh) - 1px) / 2)` | = 7,5 px |
| `--ve-head-h` | `2.5rem` | Tabellenkopf 40 px |
| `--ve-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.75rem |
| `--ve-checkbox-size` | `1.125rem` | Checkbox/Radio |
| **Linien-Geometrie** | | |
| `--ve-hairline` | `1px` | Haarlinie: Zeilen, Trenner |
| `--ve-head-rule-width` | `2px` | Grundlinie unter Tabellenköpfen (Nachtblau) |
| `--ve-rule-strong` | `2px` | kräftige Linie (Summenzeile, betonte Köpfe) |
| **Fokus-Geometrie (Farben: --ve-focus-ring-color / --ve-focus-gap)** | | |
| `--ve-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--ve-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Innenring) |
| `--ve-focus-outline` | `var(--ve-focus-ring-width) solid var(--ve-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--ve-focus-shadow` | `0 0 0 var(--ve-focus-ring-offset) var(--ve-focus-gap), 0 0 0 calc(var(--ve-focus-ring-offset) + var(--ve-focus-ring-width)) var(--ve-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--ve-focus-gap` innen, Ringfarbe außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--ve-focus-shadow-inset` | `inset 0 0 0 var(--ve-focus-ring-width) var(--ve-focus-ring-color), inset 0 0 0 calc(var(--ve-focus-ring-width) + 1px) var(--ve-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--ve-focus-field-shadow` | `0 0 0 1px var(--ve-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--ve-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--ve-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--ve-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--ve-required-mark` | `"*"` | in Textschrift, nicht als Icon |
| `--ve-required-gap` | `.25rem` | Abstand Label-Text → Markierung |
| **Bewegung** | | |
| `--ve-duration` | `.12s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--ve-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| **Mobil (< 640 px): schmalerer Innenabstand, kleinerer Seitentitel – Überschreibung `@media (max-width: 639px)`** | | |
| `--ve-page-pad-x` | `1rem` | 16 px – Inhaltsbreite bei 390 px: 358 px |
| `--ve-page-pad-y` | `1rem` |  |
| `--ve-band-pad-y` | `1.25rem` |  |
| `--ve-fs-display` | `1.75rem` | 28 px Seitentitel im Band |
| `--ve-lh-display` | `2.125rem` |  |
| `--ve-region-gap` | `1rem` |  |
| `--ve-region-pad-x` | `1rem` |  |
| `--ve-region-pad-y` | `1rem` |  |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--ve-control-h 2.75rem`, `--ve-control-h-sm 2.25rem`, `--ve-control-h-lg 3.25rem`, `--ve-row-h 2.75rem`, `--ve-head-h 2.75rem`, `--ve-hit-min 2.75rem`, `--ve-checkbox-size 1.25rem`. Alle abgeleiteten Hebel (Button-/Feld-Polster, IG-Zellenhöhen, Report-Polster) rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): `--ve-page #FFF`, Kopf- und Verlaufsband weiß mit nachtblauer Schrift (`--ve-header*`, `--ve-band-*`), `--ve-page-pad-x 0`, `--ve-region-pad-x 0`, Schatten und Abdunklung weg; shell.css §8 nimmt den Verlauf weg und zieht eine 2-px-Linie in Markenblau. Browser drucken Hintergründe standardmäßig nicht – weiße Schrift auf einem nicht gedruckten Band wäre unsichtbar. Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, großer Text (≥ 19 px/800, Seitentitel im Band) ≥ 3 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Veedel/tools/check-tokens.mjs`).

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--ve-ink` / `--ve-surface` | Text auf Fläche (Region, Karte, Navigation) | 16.83 | 13.95 | 4.5 |
| `--ve-ink` / `--ve-page` | Text auf Seitengrund | 15.53 | 15.50 | 4.5 |
| `--ve-ink` / `--ve-surface-sunken` | Text abgesenkt | 15.53 | 15.00 | 4.5 |
| `--ve-ink` / `--ve-surface-raised` | Text in Menü/Dialog | 16.83 | 12.39 | 4.5 |
| `--ve-ink` / `--ve-soft` | Text auf neutraler Fläche (Chip, Zähler) | 14.57 | 11.32 | 4.5 |
| `--ve-ink` / `--ve-hover` | Text in Zeilen-/Nav-Hover | 15.21 | 12.39 | 4.5 |
| `--ve-ink` / `--ve-accent-tint` | Auswahl-Zeile | 14.81 | 10.70 | 4.5 |
| `--ve-ink` / `--ve-accent-tint-2` | Auswahl kräftig | 13.00 | 8.28 | 4.5 |
| `--ve-ink-2` / `--ve-surface` | Unterebene der Navigation | 10.78 | 11.11 | 4.5 |
| `--ve-muted` / `--ve-surface` | Sekundärtext, Feld-Label | 5.94 | 6.88 | 4.5 |
| `--ve-muted` / `--ve-page` | Label auf Seitengrund | 5.48 | 7.65 | 4.5 |
| `--ve-muted` / `--ve-surface-sunken` | Sekundärtext abgesenkt | 5.48 | 7.40 | 4.5 |
| `--ve-muted` / `--ve-surface-raised` | Sekundärtext Menü | 5.94 | 6.11 | 4.5 |
| `--ve-muted` / `--ve-hover` | Sekundärtext Zeilen-Hover | 5.36 | 6.11 | 4.5 |
| `--ve-ink` / `--ve-raised-hover` | Menüeintrag Hover/Fokus | 14.36 | 10.23 | 4.5 |
| `--ve-muted` / `--ve-raised-hover` | Tastenkürzel im Menü-Hover | 5.06 | 5.05 | 4.5 |
| `--ve-placeholder` / `--ve-field` | Platzhalter | 5.05 | 6.05 | 4.5 |
| `--ve-ink` / `--ve-field` | Feldtext | 16.83 | 15.00 | 4.5 |
| `--ve-ink` / `--ve-field-readonly` | Feldtext readonly | 15.53 | 13.25 | 4.5 |
| `--ve-link-text` / `--ve-surface` | Link | 6.45 | 8.21 | 4.5 |
| `--ve-link-text` / `--ve-page` | Link auf Seitengrund | 5.95 | 9.12 | 4.5 |
| `--ve-heading` / `--ve-surface` | Überschrift ≥ 19 px/800 (großer Text) | 3.75 | 7.75 | 3 |
| `--ve-heading` / `--ve-page` | Überschrift auf Seitengrund (großer Text) | 3.46 | 8.61 | 3 |
| `--ve-heading` / `--ve-surface-raised` | Überschrift im Dialog (großer Text) | 3.75 | 6.88 | 3 |
| `--ve-header-text` / `--ve-header` | Kopfband: Schrift, Icons | 8.78 | 12.48 | 4.5 |
| `--ve-header-focus` / `--ve-header` | Kopfband: Fokusring | 8.78 | 12.48 | 3 |
| `--ve-band-text` / `--ve-band-from` | Verlaufsband links (kleine Schrift) | 6.45 | 10.07 | 4.5 |
| `--ve-band-text` / `--ve-band-mid` | Verlaufsband Mitte (kleine Schrift) | 5.49 | 7.43 | 4.5 |
| `--ve-band-text` / `--ve-band-to` | Verlaufsband rechts (nur Titel 40 px/900) | 3.27 | 4.56 | 3 |
| `--ve-band-muted` / `--ve-band-from` | Breadcrumb auf dem Band | 5.54 | 8.46 | 4.5 |
| `--ve-band-muted` / `--ve-band-mid` | Breadcrumb auf dem Band (Mitte) | 4.76 | 6.34 | 4.5 |
| `--ve-header-focus` / `--ve-band-from` | Verlaufsband: Fokusring | 6.45 | 10.07 | 3 |
| `--ve-header-focus` / `--ve-band-to` | Verlaufsband: Fokusring rechts | 3.27 | 4.56 | 3 |
| `--ve-accent-text` / `--ve-surface` | Akzent-Text (Link, aktiver Tab, Button-Schrift) | 6.45 | 7.75 | 4.5 |
| `--ve-accent-text` / `--ve-page` | Akzent-Text auf Seitengrund | 5.95 | 8.61 | 4.5 |
| `--ve-accent-text` / `--ve-surface-raised` | Akzent-Text Menü | 6.45 | 6.88 | 4.5 |
| `--ve-accent-text` / `--ve-accent-tint` | Button-Schrift auf Hover-Tönung | 5.67 | 5.94 | 4.5 |
| `--ve-accent-text` / `--ve-accent-tint-2` | Button-Schrift gedrückt | 4.98 | 4.59 | 4.5 |
| `--ve-accent-on` / `--ve-accent` | aktiver Nav-Block, gewählter Tag, Etikett | 6.45 | 4.81 | 4.5 |
| `--ve-accent-on` / `--ve-accent-hover` | aktiver Nav-Block Hover | 8.40 | 5.98 | 4.5 |
| `--ve-accent-on` / `--ve-accent-press` | Auswahl gedrückt | 10.62 | 7.09 | 4.5 |
| `--ve-accent-bright` / `--ve-surface` | Balken-Marke (aktiver Tab, Menüleiste) | 3.27 | 5.93 | 3 |
| `--ve-action-on` / `--ve-action` | Hot/Primary-Button | 4.63 | 4.63 | 4.5 |
| `--ve-action-on` / `--ve-action-hover` | Hot/Primary Hover | 5.45 | 5.45 | 4.5 |
| `--ve-action-on` / `--ve-action-press` | Hot/Primary gedrückt | 6.95 | 6.95 | 4.5 |
| `--ve-action-text` / `--ve-surface` | Hot einfach/Link: rote Schrift | 5.72 | 5.94 | 4.5 |
| `--ve-action-text` / `--ve-action-tint` | Hot einfach: Hover-Tönung | 5.00 | 5.76 | 4.5 |
| `--ve-selection-text` / `--ve-selection` | ::selection | 13.00 | 8.03 | 4.5 |
| `--ve-required-color` / `--ve-surface` | Pflicht-Markierung | 8.17 | 6.73 | 4.5 |
| `--ve-required-color` / `--ve-page` | Pflicht-Markierung auf Seitengrund | 7.54 | 7.47 | 4.5 |
| `--ve-tooltip-text` / `--ve-tooltip-bg` | Tooltip | 16.83 | 15.50 | 4.5 |
| `--ve-edge` / `--ve-surface` | Feldkante/Fläche (1.4.11) | 3.52 | 4.15 | 3 |
| `--ve-edge` / `--ve-page` | Feldkante/Seitengrund | 3.25 | 4.61 | 3 |
| `--ve-edge` / `--ve-surface-sunken` | Feldkante/abgesenkt | 3.25 | 4.46 | 3 |
| `--ve-edge` / `--ve-field` | Feldkante/Feld | 3.52 | 4.46 | 3 |
| `--ve-edge` / `--ve-surface-raised` | Feldkante/Dialog | 3.52 | 3.69 | 3 |
| `--ve-focus-ring-color` / `--ve-surface` | Fokus auf Fläche | 4.60 | 7.75 | 3 |
| `--ve-focus-ring-color` / `--ve-page` | Fokus auf Seitengrund | 4.24 | 8.61 | 3 |
| `--ve-focus-ring-color` / `--ve-surface-sunken` | Fokus abgesenkt | 4.24 | 8.32 | 3 |
| `--ve-focus-ring-color` / `--ve-surface-raised` | Fokus in Menü/Dialog | 4.60 | 6.88 | 3 |
| `--ve-focus-ring-color` / `--ve-soft` | Fokus neben neutraler Fläche | 3.98 | 6.28 | 3 |
| `--ve-focus-ring-color` / `--ve-field` | Fokus-Feldkante/Feld | 4.60 | 8.32 | 3 |
| `--ve-focus-ring-color` / `--ve-focus-gap` | Doppelring innen/außen | 4.60 | 7.75 | 3 |
| `--ve-focus-ring-color` / `--ve-raised-hover` | Fokus-Innenring auf Menü-Hover | 3.92 | 5.68 | 3 |
| `--ve-accent-on` / `--ve-accent` | Fokus-Innenring im Nav-Block (weiß auf Blau) | 6.45 | 4.81 | 3 |
| `--ve-accent-text` / `--ve-raised-hover` | Häkchen/Radio im Menü-Hover (Marke) | 5.50 | 5.68 | 3 |
| `--ve-link-underline` / `--ve-surface` | Link-Unterstrich | 6.45 | 8.21 | 3 |
| `--ve-link-underline-hover` / `--ve-surface` | Link-Unterstrich Hover | 3.75 | 10.72 | 3 |
| `--ve-code-keyword` / `--ve-surface` | Code keyword (Fläche) | 6.45 | 8.21 | 4.5 |
| `--ve-code-keyword` / `--ve-surface-sunken` | Code keyword (abgesenkt) | 5.95 | 8.82 | 4.5 |
| `--ve-code-keyword` / `--ve-surface-raised` | Code keyword (Dialog) | 6.45 | 7.29 | 4.5 |
| `--ve-code-keyword` / `--ve-field` | Code keyword (Markdown-Editor) | 6.45 | 8.82 | 4.5 |
| `--ve-code-string` / `--ve-surface` | Code string (Fläche) | 6.36 | 7.86 | 4.5 |
| `--ve-code-string` / `--ve-surface-sunken` | Code string (abgesenkt) | 5.87 | 8.44 | 4.5 |
| `--ve-code-string` / `--ve-surface-raised` | Code string (Dialog) | 6.36 | 6.97 | 4.5 |
| `--ve-code-string` / `--ve-field` | Code string (Markdown-Editor) | 6.36 | 8.44 | 4.5 |
| `--ve-code-number` / `--ve-surface` | Code number (Fläche) | 6.10 | 9.89 | 4.5 |
| `--ve-code-number` / `--ve-surface-sunken` | Code number (abgesenkt) | 5.62 | 10.63 | 4.5 |
| `--ve-code-number` / `--ve-surface-raised` | Code number (Dialog) | 6.10 | 8.78 | 4.5 |
| `--ve-code-number` / `--ve-field` | Code number (Markdown-Editor) | 6.10 | 10.63 | 4.5 |
| `--ve-muted` / `--ve-field` | Code-Kommentar (Markdown-Editor) | 5.94 | 7.40 | 4.5 |
| `--ve-danger-text` / `--ve-surface-raised` | Code gelöscht (diff) (Dialog) | 8.17 | 5.97 | 4.5 |
| `--ve-danger-text` / `--ve-field` | Code gelöscht (diff) (Markdown-Editor) | 8.17 | 7.23 | 4.5 |
| `--ve-success-on` / `--ve-success` | success-Fläche | 5.03 | 7.06 | 4.5 |
| `--ve-success-on` / `--ve-success-hover` | success-Fläche Hover | 6.63 | 8.34 | 4.5 |
| `--ve-success-text` / `--ve-surface` | success-Text Fläche | 6.36 | 7.86 | 4.5 |
| `--ve-success-text` / `--ve-surface-sunken` | success-Text abgesenkt | 5.87 | 8.44 | 4.5 |
| `--ve-success-text` / `--ve-success-tint` | success-Text auf Tönung | 5.62 | 6.97 | 4.5 |
| `--ve-ink` / `--ve-success-tint` | Text auf success-Tönung | 14.87 | 12.37 | 4.5 |
| `--ve-warning-on` / `--ve-warning` | warning-Fläche | 8.40 | 8.89 | 4.5 |
| `--ve-warning-on` / `--ve-warning-hover` | warning-Fläche Hover | 9.81 | 10.45 | 4.5 |
| `--ve-warning-text` / `--ve-surface` | warning-Text Fläche | 6.10 | 9.89 | 4.5 |
| `--ve-warning-text` / `--ve-surface-sunken` | warning-Text abgesenkt | 5.62 | 10.63 | 4.5 |
| `--ve-warning-text` / `--ve-warning-tint` | warning-Text auf Tönung | 5.57 | 8.54 | 4.5 |
| `--ve-ink` / `--ve-warning-tint` | Text auf warning-Tönung | 15.39 | 12.05 | 4.5 |
| `--ve-danger-on` / `--ve-danger` | danger-Fläche | 8.17 | 7.47 | 4.5 |
| `--ve-danger-on` / `--ve-danger-hover` | danger-Fläche Hover | 10.12 | 8.89 | 4.5 |
| `--ve-danger-text` / `--ve-surface` | danger-Text Fläche | 8.17 | 6.73 | 4.5 |
| `--ve-danger-text` / `--ve-surface-sunken` | danger-Text abgesenkt | 7.54 | 7.23 | 4.5 |
| `--ve-danger-text` / `--ve-danger-tint` | danger-Text auf Tönung | 7.09 | 6.38 | 4.5 |
| `--ve-ink` / `--ve-danger-tint` | Text auf danger-Tönung | 14.61 | 13.23 | 4.5 |
| `--ve-info-on` / `--ve-info` | info-Fläche | 6.45 | 8.61 | 4.5 |
| `--ve-info-on` / `--ve-info-hover` | info-Fläche Hover | 8.40 | 9.94 | 4.5 |
| `--ve-info-text` / `--ve-surface` | info-Text Fläche | 6.45 | 8.21 | 4.5 |
| `--ve-info-text` / `--ve-surface-sunken` | info-Text abgesenkt | 5.95 | 8.82 | 4.5 |
| `--ve-info-text` / `--ve-info-tint` | info-Text auf Tönung | 5.67 | 6.30 | 4.5 |
| `--ve-ink` / `--ve-info-tint` | Text auf info-Tönung | 14.81 | 10.70 | 4.5 |
| `--ve-danger-text` / `--ve-surface-raised` | danger-Text in Dialog | 8.17 | 5.97 | 4.5 |
| `--ve-surface` / `--ve-page` | Fläche gegen Seitengrund | 1.08 | 1.11 | – |
| `--ve-line` / `--ve-surface` | Haarlinie | 1.32 | 1.38 | – |
| `--ve-line-strong` / `--ve-surface` | kräftige Linie | 1.64 | 1.84 | – |
| `--ve-head-rule` / `--ve-surface` | Tabellenkopf-Grundlinie | 16.83 | 10.25 | – |
| `--ve-soft` / `--ve-surface` | neutrale Fläche | 1.16 | 1.23 | – |
| `--ve-hover` / `--ve-surface` | Hover auf Fläche | 1.11 | 1.13 | – |
| `--ve-accent` / `--ve-surface` | Nav-Block/Auswahl-Fläche (aktiver Zustand, 1.4.11) | 6.45 | 3.15 | 3 |
| `--ve-accent` / `--ve-page` | Auswahl-Fläche auf Seitengrund (1.4.11) | 5.95 | 3.50 | 3 |
| `--ve-header` / `--ve-band-from` | Kopfband gegen Band-Anfang | 1.36 | 1.24 | – |
| `--ve-raised-hover` / `--ve-surface-raised` | Hover auf schwebender Fläche | 1.17 | 1.21 | 1.12 |

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
