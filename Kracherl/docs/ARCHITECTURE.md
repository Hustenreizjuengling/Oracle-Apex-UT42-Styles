# Kracherl – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: „Sommer im Biergarten“ – sonnengelbes Band mit EINER Wellenkante und Sprudelblasen, weiße Etiketten-Karten auf Lavendel-Grund, Überschriften in Etikett-Violett (Bitter), Text in PT Sans, Brause-Orange für Fokus und „hier bin ich“; dunkel „Biergarten bei Nacht“ mit Laternengelb.
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Kracherl/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

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

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Band: der sonnengelbe Kopf mit Wellenkante** | | | |
| `--kr-band` | `#FFC400` | `#2D1D6A` | das Band: Kopf, Login-Himmel, Wellenkante (hell Sonnengelb, dunkel Nachthimmel-Violett) |
| `--kr-band-ink` | `#2D1D6A` | `#F1ECFF` | Text und Icons auf dem Band (Weiß wäre auf Gelb zu schwach) |
| `--kr-band-brand` | `#2D1D6A` | `#FFC400` | Logo-Schriftzug auf dem Band |
| `--kr-band-hover` | `rgb(45 29 106 / .10)` | `rgb(255 255 255 / .10)` | Hover auf dem Band (Header-Buttons, Menüleiste) |
| `--kr-band-press` | `rgb(45 29 106 / .17)` | `rgb(255 255 255 / .17)` | gedrückt/aktiv auf dem Band |
| `--kr-bubble` | `rgb(255 255 255 / .34)` | `rgb(255 255 255 / .06)` | Sprudelblase gefüllt (Band, Login) |
| `--kr-bubble-ring` | `rgb(255 255 255 / .62)` | `rgb(255 255 255 / .13)` | Sprudelblase als Ring (Band, Login) |
| `--kr-sun` | `#FFC400` | `#FFC400` | Etikett: aktueller Nav-Eintrag, aktive Seite der Pagination, Hero-Icon |
| `--kr-sun-ink` | `#2D1D6A` | `#1A1033` | Schrift auf dem Etikett |
| **Flächen** | | | |
| `--kr-page` | `#F5F3FA` | `#110A26` | Seitengrund: Navigation, Title Bar, zwischen den Karten |
| `--kr-page-hover` | `rgb(45 29 106 / .07)` | `rgb(241 236 255 / .08)` | Hover auf dem Seitengrund (Nav, Tabs) |
| `--kr-page-press` | `rgb(45 29 106 / .12)` | `rgb(241 236 255 / .13)` | gedrückt auf dem Seitengrund |
| `--kr-surface` | `#FFFFFF` | `#291E52` | Region, Karte, Tabelle |
| `--kr-surface-sunken` | `#F7F5FB` | `#1E1540` | abgesenkte Fläche: Tabellenkopf-Band, Hinweisblöcke, Code-Blöcke, Readonly |
| `--kr-surface-raised` | `#FFFFFF` | `#31265E` | schwebend: Menüs, Dialoge, Popups |
| `--kr-raised-hover` | `#EEEAF7` | `#403374` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--kr-soft`/`--kr-hover`, die dort dunkel kaum sichtbar sind |
| `--kr-ground` | `var(--kr-surface)` | `var(--kr-surface)` | aktuelle Grundfläche: an der Wurzel die Region, in Menüs, Dialogen, Popups und Seiten-Dialogen `--kr-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--kr-hover` | `#F4F1FA` | `#2F2359` | Zeilen-/Listen-Hover auf der Region |
| `--kr-press` | `#EAE5F4` | `#372A62` | gedrückt auf der Region |
| `--kr-soft` | `#EEEAF8` | `#372B66` | Sekundär-Button |
| `--kr-soft-hover` | `#E3DDF3` | `#413474` | Sekundär-Button Hover |
| `--kr-soft-press` | `#D8D0EE` | `#4B3E82` | Sekundär-Button gedrückt |
| `--kr-field` | `#FFFFFF` | `#1C1340` | Eingabefelder |
| `--kr-field-readonly` | `#F7F5FB` | `#211746` | schreibgeschützte Felder |
| `--kr-scrim` | `rgb(33 26 58 / .42)` | `rgb(6 3 16 / .66)` | Abdunklung hinter Dialogen/Schublade |
| **Text** | | | |
| `--kr-ink` | `#211A3A` | `#EEEAF8` | Tinte: Fließtext, Zellen, Icons |
| `--kr-ink-2` | `#3A3157` | `#D8D1EC` | Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute |
| `--kr-heading` | `#2D1D6A` | `#FFD24D` | Überschriften: Seitentitel, Region-, Dialog-, Karten-Titel, Tabellenköpfe, Sekundär-Buttons |
| `--kr-brand-ink` | `#2D1D6A` | `#D6CBFF` | Markentinte: Sekundär-Buttons, Tabellenköpfe, aktive Tabs, Nav- und Kachel-Icons (hell gleich den Überschriften, dunkel Flieder statt Gelb) |
| `--kr-muted` | `#5E5578` | `#B4ABCD` | Sekundärtext, Breadcrumb |
| `--kr-placeholder` | `#6E6689` | `#A198BE` | Platzhalter |
| `--kr-disabled` | `#9A93AE` | `#716894` | deaktivierte Beschriftung |
| `--kr-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--kr-on-light` | `#211A3A` | `#211A3A` | Text auf hellen Flächen |
| **Linien** | | | |
| `--kr-line-subtle` | `#ECE8F4` | `#2F2458` | sehr zart: innere Trenner in Karten/Listen |
| `--kr-line` | `#DFDAEB` | `#3A2E68` | Haarlinie: Region-Kante, Tabellenzeilen, Trenner |
| `--kr-line-strong` | `#C6BEDA` | `#54478A` | kräftig: Rahmen von Simple-Buttons, Containern |
| `--kr-edge` | `#857CA0` | `#8A7EB0` | Feldkante – WCAG 1.4.11 |
| `--kr-edge-hover` | `#5E5578` | `#ABA0CF` | Feldkante Hover |
| `--kr-head-rule` | `#C6BEDA` | `#54478A` | Grundlinie unter Tabellenköpfen |
| **Akzent: Etikett-Violett (Primäraktion, Auswahl-Marken)** | | | |
| `--kr-accent` | `#2D1D6A` | `#FFC400` | Fläche der Primäraktion – mit gelber Schrift |
| `--kr-accent-hover` | `#40308C` | `#FFD447` | Primär-Fläche Hover |
| `--kr-accent-press` | `#1F1250` | `#E9B000` | Primär-Fläche gedrückt |
| `--kr-accent-on` | `#FFC400` | `#1A1033` | Text/Icon auf der Primär-Fläche |
| `--kr-accent-text` | `#2D1D6A` | `#FFC400` | Marken: Checkbox/Radio/Switch, Sterne, Akzent-Text |
| `--kr-accent-tint` | `#FFF4CC` | `#463646` | Auswahl-Fläche: ein Sonnenstrahl |
| `--kr-accent-tint-2` | `#FFE88F` | `#5C4548` | kräftigere Auswahl, ::selection |
| `--kr-accent-ring` | `rgb(194 65 10 / .18)` | `rgb(255 155 84 / .28)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| `--kr-mark` | `#C2410A` | `#FF9B54` | Brause-Orange: „hier bin ich“ – aktiver Tab, aktueller Link/Wizard-Schritt, Sterne |
| **Fokus (ein System, überall >= 3:1)** | | | |
| `--kr-focus-ring-color` | `#C2410A` | `#FF9B54` | Brause-Orange |
| `--kr-focus-gap` | `var(--kr-ground)` | `var(--kr-ground)` | Innenring/Lücke des Doppelrings (= `--kr-ground`: Region, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Violett mit Unterstrich, Hover-Unterstrich in Orange** | | | |
| `--kr-link-text` | `#3A2A8C` | `#CDBEFF` | Linkfarbe im Fließtext (Violett) |
| `--kr-link-underline` | `#8B80B8` | `#8A7EB0` | Unterstrich im Ruhezustand |
| `--kr-link-underline-hover` | `#C2410A` | `#FF9B54` | Unterstrich bei Hover (Orange) |
| **Textauswahl** | | | |
| `--kr-selection` | `#FFE88F` | `#5C4548` | ::selection-Hintergrund |
| `--kr-selection-text` | `#211A3A` | `#FFFFFF` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--kr-required-color` | `#B3122E` | `#FF8C9A` | = Danger-Text |
| **Status: Fläche · Hover · on (Text auf Fläche) · Text · Tönung (Alert-Grund)** | | | |
| `--kr-success` | `#1D7A45` | `#4CC282` | Erfolg: Fläche (Buttons, Badges) |
| `--kr-success-hover` | `#17653A` | `#66CF96` | Erfolg: Fläche Hover |
| `--kr-success-on` | `#FFFFFF` | `#1A1033` | Erfolg: Text/Icon auf der Fläche |
| `--kr-success-text` | `#17693B` | `#6DD49C` | Erfolg: Textfarbe auf Region/Tönung |
| `--kr-success-tint` | `#E6F4EC` | `#1D3A42` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--kr-warning` | `#EE9A0A` | `#F5A524` | Warnung: Fläche (Buttons, Badges) |
| `--kr-warning-hover` | `#F5AE3A` | `#F8B94F` | Warnung: Fläche Hover |
| `--kr-warning-on` | `#211A3A` | `#1A1033` | Warnung: Text/Icon auf der Fläche |
| `--kr-warning-text` | `#8A4B00` | `#F7BA55` | Warnung: Textfarbe auf Region/Tönung |
| `--kr-warning-tint` | `#FFF1D9` | `#3F3035` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--kr-danger` | `#C8102E` | `#FF6B7D` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--kr-danger-hover` | `#A80D26` | `#FF8593` | Fehler/Gefahr: Fläche Hover |
| `--kr-danger-on` | `#FFFFFF` | `#1A1033` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--kr-danger-text` | `#B3122E` | `#FF8C9A` | Fehler/Gefahr: Textfarbe auf Region/Tönung |
| `--kr-danger-tint` | `#FDE9EC` | `#46203F` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--kr-info` | `#0E6E72` | `#4CC3C3` | Information: Fläche (Buttons, Badges) |
| `--kr-info-hover` | `#0B5B5E` | `#6BD0D0` | Information: Fläche Hover |
| `--kr-info-on` | `#FFFFFF` | `#1A1033` | Information: Text/Icon auf der Fläche |
| `--kr-info-text` | `#0D686C` | `#6FD3D3` | Information: Textfarbe auf Region/Tönung |
| `--kr-info-tint` | `#E3F3F2` | `#1B3548` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--kr-code-keyword` | `#0D686C` | `#6FD3D3` | Schlüsselwörter, Selektoren, Klassen: Petrol |
| `--kr-code-string` | `#17693B` | `#6DD49C` | Zeichenketten: Kastaniengrün |
| `--kr-code-number` | `#8A4B00` | `#F7BA55` | Zahlen, Wahrheitswerte, Konstanten: Bernstein |
| **Tiefe** | | | |
| `--kr-card-shadow` | `0 1px 2px rgb(45 29 106 / .05)` | `0 0 0 transparent` | Region/Karte: nur ein Hauch unter der Kante (dunkel keiner) |
| `--kr-float-shadow` | `0 18px 40px -14px rgb(33 26 58 / .30), 0 2px 6px rgb(33 26 58 / .07), 0 0 0 1px rgb(33 26 58 / .07)` | `0 18px 44px -12px rgb(0 0 0 / .72), 0 0 0 1px rgb(255 255 255 / .09)` | Schatten schwebender Ebenen (Menüs, Dialoge, Popups, Login-Karte) |
| `--kr-tooltip-bg` | `#211A3A` | `#EEEAF8` | Tooltip-Fläche (invertiert) |
| `--kr-tooltip-text` | `#FFFFFF` | `#211A3A` | Tooltip-Text |
| **Scrollbars** | | | |
| `--kr-scrollbar-thumb` | `rgb(45 29 106 / .26)` | `rgb(241 236 255 / .24)` | Scrollbar-Daumen |
| `--kr-scrollbar-thumb-hover` | `rgb(45 29 106 / .42)` | `rgb(241 236 255 / .40)` | Scrollbar-Daumen Hover |
| `--kr-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Icons** | | | |
| `--kr-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (als Data-URI) |

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

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--kr-cat-1` | `#127A7C` | `#FFFFFF` | `#3BB5B2` | `#1A1033` | 1 | Petrol |
| 2 | `--kr-cat-2` | `#9A6A3C` | `#FFFFFF` | `#C48A5E` | `#1A1033` | 9 | Brezel |
| 3 | `--kr-cat-3` | `#4E9E66` | `#211A3A` | `#7FD196` | `#1A1033` | 6 | Blattgrün |
| 4 | `--kr-cat-4` | `#DB7016` | `#211A3A` | `#FF9848` | `#1A1033` | 2 | Brause-Orange |
| 5 | `--kr-cat-5` | `#4FA59E` | `#211A3A` | `#8AD3CC` | `#1A1033` | 10 | Minze |
| 6 | `--kr-cat-6` | `#8C9A3C` | `#211A3A` | `#BFCB70` | `#1A1033` | 12 | Hopfen |
| 7 | `--kr-cat-7` | `#7B5CC9` | `#FFFFFF` | `#AB8DF2` | `#1A1033` | 3 | Flieder |
| 8 | `--kr-cat-8` | `#5F6472` | `#FFFFFF` | `#A5A9B6` | `#1A1033` | 7 | Schiefer |
| 9 | `--kr-cat-9` | `#6B3A22` | `#FFFFFF` | `#B77A5C` | `#1A1033` | 4 | Colabraun |
| 10 | `--kr-cat-10` | `#D48B9C` | `#211A3A` | `#F3B1C0` | `#1A1033` | 8 | Rosé |
| 11 | `--kr-cat-11` | `#B8866A` | `#211A3A` | `#E0B39A` | `#1A1033` | 11 | Sand |
| 12 | `--kr-cat-12` | `#C4336B` | `#FFFFFF` | `#F2719F` | `#1A1033` | 5 | Himbeere |
| 13 | `--kr-cat-13` | `#2F5A45` | `#FFFFFF` | `#6FA88C` | `#1A1033` | – | Tanne |
| 14 | `--kr-cat-14` | `#8C8799` | `#211A3A` | `#B7B2C6` | `#1A1033` | – | Nebel |
| 15 | `--kr-cat-15` | `#5D566E` | `#FFFFFF` | `#8F88A3` | `#1A1033` | – | Dämmerung |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15. Kracherl ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--kr-cat-N) 60%, #fff)` mit Text `--kr-on-light`, 31–45 = `color-mix(in srgb, var(--kr-cat-N) 55%, #000)` mit Text `--kr-on-dark` (beide ≥ 4,5 : 1, geprüft). Als **Schrift** (`.u-color-N-text`) mischt utilities.css je Stufe so viel Tinte bei, dass hell und dunkel ≥ 4,5 : 1 erreicht werden (Anteile aus den Tokens gerechnet, bei Palettenänderung neu rechnen).

### 3.4 Maß-, Schrift-, Form-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--kr-font` | `"Kracherl Text", "PT Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Textschrift der Oberfläche: PT Sans (400/700), dann System |
| `--kr-font-slab` | `"Kracherl Slab", "Bitter", "Roboto Slab", Rockwell, "Rockwell Nova", Georgia, serif` | Überschriften, Logo, Login, Kennzahlen: Bitter (variabel, 700/800) |
| `--kr-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--kr-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--kr-fw-medium` | `400` | Labels, Navigation: PT Sans kennt kein 500 – bewusst normal |
| `--kr-fw-semibold` | `700` | Buttons, Tabellenköpfe, aktive Einträge |
| `--kr-fw-bold` | `700` | <b>, <strong> |
| `--kr-fw-slab` | `700` | Region-, Dialog-, Karten-Titel |
| `--kr-fw-slab-heavy` | `800` | Seitentitel, Logo, Login |
| **Größen-Skala 12,5 · 13 · 14 · 15 · 18 · 22 · 32** | | |
| `--kr-fs-xs` | `.78125rem` | 12,5  Klein: Hilfe, Badges, Zähler |
| `--kr-fs-head` | `.8125rem` | 13  Tabellenköpfe |
| `--kr-fs-sm` | `.875rem` | 14  Tabellenzellen, Labels, Breadcrumb, Menüs klein |
| `--kr-fs-md` | `.9375rem` | 15  UI, Fließtext, Felder, Buttons |
| `--kr-fs-lg` | `1.125rem` | 18  Region-Titel (Slab) |
| `--kr-fs-xl` | `1.375rem` | 22  Abschnitt (Content Block h2, Dialog groß) |
| `--kr-fs-2xl` | `2rem` | 32  Seitentitel (Slab 800) |
| `--kr-lh-xs` | `1rem` | zu 12,5 / 13 |
| `--kr-lh-sm` | `1.25rem` | zu 14 (Tabellenzellen 14/20) |
| `--kr-lh-md` | `1.375rem` | zu 15 |
| `--kr-lh-body` | `1.5rem` | zu 15 im Fließtext (Regionen, Content Blocks) |
| `--kr-lh-lg` | `1.5rem` | zu 18 |
| `--kr-lh-xl` | `1.75rem` | zu 22 |
| `--kr-lh-2xl` | `2.375rem` | zu 32 |
| `--kr-tracking-title` | `-.012em` | Seitentitel, Login-Titel (Slab) |
| `--kr-tracking-heading` | `-.004em` | Region-/Abschnittstitel (Slab) |
| `--kr-tracking-ui` | `.01em` | Buttons |
| **Formen: Etikett** | | |
| `--kr-r-sm` | `.375rem` | 6  Checkbox, kleine Kacheln |
| `--kr-r-md` | `.625rem` | 10 Felder, Menüeinträge, Tabellen-Innenecken |
| `--kr-r-lg` | `1rem` | 16 Regionen, Karten, Menüs, Alerts |
| `--kr-r-xl` | `1.5rem` | 24 Dialoge, Drawer, Login-Karte |
| `--kr-r-pill` | `62rem` | Buttons, Badges, Nav-Etikett, Tabs, Chips |
| `--kr-r-dialog` | `1.5rem` | = --kr-r-xl |
| **Geometrie: Band, Welle, Inhalt** | | |
| `--kr-header-h` | `3.75rem` | Kopfband 60 px (statisch – nie per JS/Font verändern) |
| `--kr-brand-lh` | `1.75rem` | feste Zeilenhöhe Logo/Branding: Font-Swap verschiebt nichts |
| `--kr-wave-h` | `.875rem` | Wellenkante unter dem Band (hängt über den Inhalt, zählt nicht zur Kopfhöhe) |
| `--kr-wave-w` | `22.5rem` | Wellenlänge 360 px: lang und ruhig |
| `--kr-wave` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='14' viewBox='0 0 360 14' preserveAspectRatio='none'%3E%3Cpath d='M0 0H360V2C270 2 270 14 180 14S90 2 0 2Z'/%3E%3C/svg%3E")` | die Welle als Maske (einzelne, einfarbige Kante; Farbe = `--kr-band`) |
| `--kr-wave-rise` | `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='14' viewBox='0 0 360 14' preserveAspectRatio='none'%3E%3Cpath d='M0 14H360V12C270 12 270 0 180 0S90 12 0 12Z'/%3E%3C/svg%3E")` | dieselbe Welle gespiegelt: Fläche mit Wellen-Oberkante (Login) |
| `--kr-content-pad-x` | `2rem` | Innenabstand des Inhalts, waagerecht |
| `--kr-content-pad-y` | `1.5rem` | Innenabstand des Inhalts, senkrecht |
| `--kr-title-pad-top` | `1.75rem` | Title Bar oben: Luft unter der Welle |
| `--kr-nav-w` | `16rem` | aufgeklappte Side-Navigation |
| `--kr-nav-rail-w` | `4.25rem` | eingeklappte Icon-Leiste |
| `--kr-nav-inset` | `.625rem` | Einzug der Nav-Etiketten zur Spaltenkante |
| **Abstände (4er-Raster)** | | |
| `--kr-space-1` | `.25rem` | 4 |
| `--kr-space-2` | `.5rem` | 8 |
| `--kr-space-3` | `.75rem` | 12 |
| `--kr-space-4` | `1rem` | 16 |
| `--kr-space-5` | `1.25rem` | 20 |
| `--kr-space-6` | `1.5rem` | 24 |
| `--kr-space-8` | `2rem` | 32 |
| `--kr-space-12` | `3rem` | 48 |
| `--kr-region-gap` | `1.5rem` | Abstand zwischen Regionen (→ --ut-region-margin) |
| `--kr-region-pad-x` | `1.25rem` | Innenabstand der Region, waagerecht |
| `--kr-region-pad-y` | `1rem` | Innenabstand der Region, senkrecht |
| **Dichte (Desktop 32 px; unter pointer: coarse 40 px – siehe bridge.css)** | | |
| `--kr-control-h` | `2rem` | Höhe Buttons, Felder, Selects, Pillen (inkl. Rand) |
| `--kr-control-h-sm` | `1.5rem` | kleine Buttons (t-Button--small), Toolbar-Icons |
| `--kr-control-h-lg` | `2.5rem` | große Buttons (t-Button--large), Login |
| `--kr-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--kr-control-pad-x` | `.75rem` | Innenabstand waagerecht (Felder); Buttons: Pille, +4 px |
| `--kr-control-pad-y` | `calc((var(--kr-control-h) - var(--kr-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--kr-row-h` | `2.25rem` | Tabellenzeile 36 px inkl. Haarlinie |
| `--kr-row-lh` | `1.25rem` | Zeilenhöhe in Zellen (14/20) |
| `--kr-row-pad-x` | `.75rem` | Zellen-Innenabstand waagerecht |
| `--kr-row-pad-y` | `calc((var(--kr-row-h) - var(--kr-row-lh) - 1px) / 2)` | = 7,5 px |
| `--kr-head-h` | `2.375rem` | Tabellenkopf 38 px |
| `--kr-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.5rem |
| `--kr-checkbox-size` | `1.125rem` | Checkbox/Radio |
| **Linien-Geometrie** | | |
| `--kr-hairline` | `1px` | Haarlinie: Zeilen, Trenner, Region-Kante |
| `--kr-head-rule-width` | `1px` | Grundlinie unter Tabellenköpfen |
| `--kr-rule-strong` | `2px` | kräftige Linie (Summenzeile, betonte Köpfe) |
| `--kr-mark-w` | `.1875rem` | Brause-Orange-Marke: Stärke (aktiver Tab, Wizard) |
| **Fokus-Geometrie (Farben: --kr-focus-ring-color / --kr-focus-gap)** | | |
| `--kr-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--kr-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Innenring) |
| `--kr-focus-outline` | `var(--kr-focus-ring-width) solid var(--kr-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--kr-focus-shadow` | `0 0 0 var(--kr-focus-ring-offset) var(--kr-focus-gap), 0 0 0 calc(var(--kr-focus-ring-offset) + var(--kr-focus-ring-width)) var(--kr-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--kr-focus-gap` innen, Orange außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--kr-focus-shadow-inset` | `inset 0 0 0 var(--kr-focus-ring-width) var(--kr-focus-ring-color), inset 0 0 0 calc(var(--kr-focus-ring-width) + 1px) var(--kr-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--kr-focus-field-shadow` | `0 0 0 1px var(--kr-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--kr-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--kr-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--kr-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--kr-required-mark` | `"*"` | in Textschrift, nicht als Icon |
| `--kr-required-gap` | `.25rem` | Abstand Label-Text → Markierung |
| **Bewegung** | | |
| `--kr-duration` | `.14s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--kr-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| `--kr-rise` | `14s` | Dauer eines Blasen-Durchlaufs auf der Login-Seite; 0 s bei prefers-reduced-motion |
| **Mobil (< 640 px): schmalerer Innenabstand, flachere Welle – Überschreibung `@media (max-width: 639px)`** | | |
| `--kr-content-pad-x` | `.75rem` | 12 px – Inhaltsbreite bei 390 px: 366 px |
| `--kr-content-pad-y` | `1rem` |  |
| `--kr-title-pad-top` | `.375rem` | 6 px: hier zählt der Wellenstreifen (14 px) schon zur Kopfhöhe (shell.css §1) |
| `--kr-region-gap` | `1rem` |  |
| `--kr-region-pad-x` | `1rem` |  |
| `--kr-wave-w` | `15rem` |  |
| `--kr-fs-2xl` | `1.625rem` | 26: lange Seitentitel passen auf 390 px |
| `--kr-lh-2xl` | `2rem` |  |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--kr-control-h 2.5rem`, `--kr-control-h-sm 2rem`, `--kr-control-h-lg 3rem`, `--kr-row-h 2.5rem`, `--kr-head-h 2.5rem`, `--kr-hit-min 2.5rem`, `--kr-checkbox-size 1.25rem`. Alle abgeleiteten Hebel rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): `--kr-page #FFF`, `--kr-band #FFF`, Blasen transparent, `--kr-content-pad-x 0`, Schatten aus, `--kr-scrim transparent`; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`. Die Welle blendet shell.css im Druck aus.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Kracherl/tools/check-tokens.mjs`).

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--kr-ink` / `--kr-surface` | Text auf Region | 16.49 | 12.67 | 4.5 |
| `--kr-ink` / `--kr-page` | Text auf Seitengrund | 14.98 | 16.22 | 4.5 |
| `--kr-ink` / `--kr-surface-sunken` | Text abgesenkt | 15.24 | 14.36 | 4.5 |
| `--kr-ink` / `--kr-surface-raised` | Text in Menü/Dialog | 16.49 | 11.32 | 4.5 |
| `--kr-ink` / `--kr-soft` | Text auf Lavendel-Pille | 13.95 | 10.45 | 4.5 |
| `--kr-ink` / `--kr-soft-hover` | Text auf Lavendel-Pille Hover | 12.49 | 9.02 | 4.5 |
| `--kr-ink` / `--kr-accent-tint` | Auswahl-Zeile | 14.97 | 9.46 | 4.5 |
| `--kr-ink` / `--kr-accent-tint-2` | Auswahl kräftig | 13.50 | 7.40 | 4.5 |
| `--kr-ink-2` / `--kr-surface` | Label | 11.95 | 10.17 | 4.5 |
| `--kr-ink-2` / `--kr-page` | Nav-Text auf Seitengrund | 10.86 | 13.01 | 4.5 |
| `--kr-ink-2` / `--kr-page-hover` | Nav-Text Hover | 9.54 | 11.01 | 4.5 |
| `--kr-heading` / `--kr-surface` | Titel auf Region | 14.04 | 10.40 | 4.5 |
| `--kr-heading` / `--kr-page` | Seitentitel auf Seitengrund | 12.76 | 13.31 | 4.5 |
| `--kr-heading` / `--kr-surface-raised` | Dialog-Titel | 14.04 | 9.29 | 4.5 |
| `--kr-brand-ink` / `--kr-surface` | Markentinte auf Region (aktiver Tab, Icons) | 14.04 | 9.88 | 4.5 |
| `--kr-brand-ink` / `--kr-page` | Markentinte auf Seitengrund (Tabs, Nav-Icons) | 12.76 | 12.64 | 4.5 |
| `--kr-brand-ink` / `--kr-surface-sunken` | Tabellenkopf (Lavendel-Band) | 12.98 | 11.20 | 4.5 |
| `--kr-brand-ink` / `--kr-surface-raised` | Markentinte in Menü/Dialog | 14.04 | 8.82 | 4.5 |
| `--kr-brand-ink` / `--kr-soft` | Sekundär-Button (Markentinte auf Lavendel) | 11.88 | 8.15 | 4.5 |
| `--kr-brand-ink` / `--kr-soft-hover` | Sekundär-Button Hover | 10.63 | 7.03 | 4.5 |
| `--kr-brand-ink` / `--kr-soft-press` | Sekundär-Button gedrückt | 9.48 | 5.99 | 4.5 |
| `--kr-page` / `--kr-brand-ink` | Zähler in der Navigation (Seitengrund auf Markentinte) | 12.76 | 12.64 | 4.5 |
| `--kr-muted` / `--kr-surface` | Sekundärtext | 6.89 | 6.88 | 4.5 |
| `--kr-muted` / `--kr-surface-sunken` | Sekundärtext abgesenkt | 6.37 | 7.80 | 4.5 |
| `--kr-muted` / `--kr-surface-raised` | Sekundärtext Menü | 6.89 | 6.15 | 4.5 |
| `--kr-muted` / `--kr-page` | Sekundärtext Seitengrund (Breadcrumb, Footer) | 6.26 | 8.81 | 4.5 |
| `--kr-muted` / `--kr-hover` | Sekundärtext Zeilen-Hover | 6.17 | 6.41 | 4.5 |
| `--kr-muted` / `--kr-soft` | Sekundärtext auf Lavendel (IR-Ansichten) | 5.83 | 5.68 | 4.5 |
| `--kr-ink` / `--kr-raised-hover` | Menüeintrag Hover/Fokus | 13.94 | 9.14 | 4.5 |
| `--kr-muted` / `--kr-raised-hover` | Tastenkürzel im Menü-Hover | 5.83 | 4.96 | 4.5 |
| `--kr-placeholder` / `--kr-field` | Platzhalter | 5.35 | 6.37 | 4.5 |
| `--kr-ink` / `--kr-field` | Feldtext | 16.49 | 14.60 | 4.5 |
| `--kr-ink` / `--kr-field-readonly` | Feldtext readonly | 15.24 | 13.92 | 4.5 |
| `--kr-link-text` / `--kr-surface` | Link | 11.11 | 8.85 | 4.5 |
| `--kr-link-text` / `--kr-page` | Link auf Seitengrund | 10.10 | 11.33 | 4.5 |
| `--kr-accent-text` / `--kr-surface` | Akzent-Text Region | 14.04 | 9.38 | 4.5 |
| `--kr-accent-text` / `--kr-surface-raised` | Akzent-Text Menü | 14.04 | 8.38 | 4.5 |
| `--kr-accent-text` / `--kr-page` | Akzent-Text Seitengrund | 12.76 | 12.00 | 4.5 |
| `--kr-accent-on` / `--kr-accent` | Primär-Button (Etikett) | 8.79 | 11.28 | 4.5 |
| `--kr-accent-on` / `--kr-accent-hover` | Primär-Button Hover | 6.51 | 12.66 | 4.5 |
| `--kr-accent-on` / `--kr-accent-press` | Primär-Button gedrückt | 10.43 | 9.16 | 4.5 |
| `--kr-selection-text` / `--kr-selection` | ::selection | 13.50 | 8.75 | 4.5 |
| `--kr-required-color` / `--kr-surface` | Pflicht-Markierung | 6.90 | 6.76 | 4.5 |
| `--kr-required-color` / `--kr-surface-sunken` | Pflicht-Markierung abgesenkt | 6.38 | 7.66 | 4.5 |
| `--kr-tooltip-text` / `--kr-tooltip-bg` | Tooltip | 16.49 | 13.95 | 4.5 |
| `--kr-band-ink` / `--kr-band` | Text/Icons auf dem Band | 8.79 | 12.16 | 4.5 |
| `--kr-band-ink` / `--kr-band-hover` | Header-Button Hover | 7.34 | 9.13 | 4.5 |
| `--kr-band-ink` / `--kr-band-press` | Header-Button gedrückt | 6.42 | 7.30 | 4.5 |
| `--kr-band-brand` / `--kr-band` | Logo auf dem Band | 8.79 | 8.79 | 4.5 |
| `--kr-band` / `--kr-band-ink` | aktueller Menüeintrag (Band-Farbe auf Tinte) | 8.79 | 12.16 | 4.5 |
| `--kr-sun-ink` / `--kr-sun` | Etikett: aktueller Nav-Eintrag, aktive Seite | 8.79 | 11.28 | 4.5 |
| `--kr-focus-ring-color` / `--kr-band` | Fokus auf dem Band | 3.24 | 6.73 | 3 |
| `--kr-edge` / `--kr-surface` | Feldkante/Region (1.4.11) | 3.90 | 4.06 | 3 |
| `--kr-edge` / `--kr-surface-sunken` | Feldkante/abgesenkt | 3.60 | 4.60 | 3 |
| `--kr-edge` / `--kr-field` | Feldkante/Feld | 3.90 | 4.68 | 3 |
| `--kr-edge` / `--kr-surface-raised` | Feldkante/Dialog | 3.90 | 3.63 | 3 |
| `--kr-edge` / `--kr-page` | Feldkante/Seitengrund | 3.54 | 5.20 | 3 |
| `--kr-edge` / `--kr-soft` | Kontur der Radio-Leiste (Radio Group As Buttons) innen | 3.30 | 3.35 | 3 |
| `--kr-focus-ring-color` / `--kr-surface` | Fokus auf Region | 5.18 | 7.18 | 3 |
| `--kr-focus-ring-color` / `--kr-page` | Fokus auf Seitengrund | 4.71 | 9.19 | 3 |
| `--kr-focus-ring-color` / `--kr-surface-sunken` | Fokus abgesenkt | 4.79 | 8.14 | 3 |
| `--kr-focus-ring-color` / `--kr-surface-raised` | Fokus in Menü/Dialog | 5.18 | 6.42 | 3 |
| `--kr-focus-ring-color` / `--kr-soft` | Fokus neben Sekundär-Button | 4.38 | 5.92 | 3 |
| `--kr-focus-ring-color` / `--kr-field` | Fokus-Feldkante/Feld | 5.18 | 8.28 | 3 |
| `--kr-focus-ring-color` / `--kr-focus-gap` | Doppelring innen/außen | 5.18 | 7.18 | 3 |
| `--kr-focus-ring-color` / `--kr-raised-hover` | Fokus-Innenring auf Menü-Hover | 4.38 | 5.18 | 3 |
| `--kr-mark` / `--kr-surface` | Orange-Marke auf Region (aktiver Tab, heute) | 5.18 | 7.18 | 3 |
| `--kr-mark` / `--kr-page` | Orange-Marke auf Seitengrund | 4.71 | 9.19 | 3 |
| `--kr-mark` / `--kr-surface-raised` | Orange-Marke in Menü/Dialog | 5.18 | 6.42 | 3 |
| `--kr-accent-text` / `--kr-raised-hover` | Häkchen/Radio im Menü-Hover (Marke) | 11.87 | 6.76 | 3 |
| `--kr-link-underline` / `--kr-surface` | Link-Unterstrich | 3.57 | 4.06 | 3 |
| `--kr-link-underline` / `--kr-surface-sunken` | Link-Unterstrich abgesenkt | 3.30 | 4.60 | 3 |
| `--kr-link-underline-hover` / `--kr-surface` | Link-Unterstrich Hover | 5.18 | 7.18 | 3 |
| `--kr-code-keyword` / `--kr-surface` | Code keyword (Region) | 6.53 | 8.51 | 4.5 |
| `--kr-code-keyword` / `--kr-surface-sunken` | Code keyword (abgesenkt) | 6.04 | 9.65 | 4.5 |
| `--kr-code-keyword` / `--kr-surface-raised` | Code keyword (Dialog) | 6.53 | 7.60 | 4.5 |
| `--kr-code-keyword` / `--kr-field` | Code keyword (Markdown-Editor) | 6.53 | 9.81 | 4.5 |
| `--kr-code-string` / `--kr-surface` | Code string (Region) | 6.73 | 8.24 | 4.5 |
| `--kr-code-string` / `--kr-surface-sunken` | Code string (abgesenkt) | 6.22 | 9.34 | 4.5 |
| `--kr-code-string` / `--kr-surface-raised` | Code string (Dialog) | 6.73 | 7.36 | 4.5 |
| `--kr-code-string` / `--kr-field` | Code string (Markdown-Editor) | 6.73 | 9.49 | 4.5 |
| `--kr-code-number` / `--kr-surface` | Code number (Region) | 6.80 | 8.64 | 4.5 |
| `--kr-code-number` / `--kr-surface-sunken` | Code number (abgesenkt) | 6.29 | 9.79 | 4.5 |
| `--kr-code-number` / `--kr-surface-raised` | Code number (Dialog) | 6.80 | 7.72 | 4.5 |
| `--kr-code-number` / `--kr-field` | Code number (Markdown-Editor) | 6.80 | 9.95 | 4.5 |
| `--kr-muted` / `--kr-field` | Code-Kommentar (Markdown-Editor) | 6.89 | 7.93 | 4.5 |
| `--kr-danger-text` / `--kr-surface-raised` | Code gelöscht (diff) (Dialog) | 6.90 | 6.03 | 4.5 |
| `--kr-danger-text` / `--kr-field` | Code gelöscht (diff) (Markdown-Editor) | 6.90 | 7.78 | 4.5 |
| `--kr-success-on` / `--kr-success` | success-Fläche | 5.35 | 8.02 | 4.5 |
| `--kr-success-on` / `--kr-success-hover` | success-Fläche Hover | 7.10 | 9.38 | 4.5 |
| `--kr-success-text` / `--kr-surface` | success-Text Region | 6.73 | 8.24 | 4.5 |
| `--kr-success-text` / `--kr-surface-sunken` | success-Text abgesenkt | 6.22 | 9.34 | 4.5 |
| `--kr-success-text` / `--kr-success-tint` | success-Text auf Tönung | 5.93 | 6.65 | 4.5 |
| `--kr-ink` / `--kr-success-tint` | Text auf success-Tönung | 14.54 | 10.23 | 4.5 |
| `--kr-warning-on` / `--kr-warning` | warning-Fläche | 7.27 | 8.83 | 4.5 |
| `--kr-warning-on` / `--kr-warning-hover` | warning-Fläche Hover | 8.64 | 10.33 | 4.5 |
| `--kr-warning-text` / `--kr-surface` | warning-Text Region | 6.80 | 8.64 | 4.5 |
| `--kr-warning-text` / `--kr-surface-sunken` | warning-Text abgesenkt | 6.29 | 9.79 | 4.5 |
| `--kr-warning-text` / `--kr-warning-tint` | warning-Text auf Tönung | 6.10 | 7.18 | 4.5 |
| `--kr-ink` / `--kr-warning-tint` | Text auf warning-Tönung | 14.79 | 10.54 | 4.5 |
| `--kr-danger-on` / `--kr-danger` | danger-Fläche | 5.88 | 6.56 | 4.5 |
| `--kr-danger-on` / `--kr-danger-hover` | danger-Fläche Hover | 7.63 | 7.74 | 4.5 |
| `--kr-danger-text` / `--kr-surface` | danger-Text Region | 6.90 | 6.76 | 4.5 |
| `--kr-danger-text` / `--kr-surface-sunken` | danger-Text abgesenkt | 6.38 | 7.66 | 4.5 |
| `--kr-danger-text` / `--kr-danger-tint` | danger-Text auf Tönung | 5.93 | 6.15 | 4.5 |
| `--kr-ink` / `--kr-danger-tint` | Text auf danger-Tönung | 14.17 | 11.54 | 4.5 |
| `--kr-info-on` / `--kr-info` | info-Fläche | 6.01 | 8.49 | 4.5 |
| `--kr-info-on` / `--kr-info-hover` | info-Fläche Hover | 7.86 | 9.91 | 4.5 |
| `--kr-info-text` / `--kr-surface` | info-Text Region | 6.53 | 8.51 | 4.5 |
| `--kr-info-text` / `--kr-surface-sunken` | info-Text abgesenkt | 6.04 | 9.65 | 4.5 |
| `--kr-info-text` / `--kr-info-tint` | info-Text auf Tönung | 5.72 | 7.24 | 4.5 |
| `--kr-ink` / `--kr-info-tint` | Text auf info-Tönung | 14.42 | 10.77 | 4.5 |
| `--kr-surface` / `--kr-page` | Region gegen Seitengrund | 1.10 | 1.28 | 1.25 |
| `--kr-band` / `--kr-page` | Band gegen Seitengrund (Wellenkante) | 1.45 | 1.37 | 1.2 |
| `--kr-sun` / `--kr-page` | Etikett gegen Seitengrund | 1.45 | 12.00 | – |
| `--kr-line` / `--kr-surface` | Haarlinie | 1.37 | 1.26 | – |
| `--kr-line` / `--kr-page` | Region-Kante gegen Seitengrund | 1.24 | 1.62 | – |
| `--kr-line-strong` / `--kr-surface` | kräftige Linie | 1.78 | 1.89 | – |
| `--kr-surface-sunken` / `--kr-surface` | Lavendel-Band (Tabellenkopf) | 1.08 | 1.13 | – |
| `--kr-soft` / `--kr-surface` | Lavendel-Pille | 1.18 | 1.21 | – |
| `--kr-accent` / `--kr-surface` | Primär-Fläche | 14.04 | 9.38 | – |
| `--kr-raised-hover` / `--kr-surface-raised` | Hover auf schwebender Fläche | 1.18 | 1.24 | 1.15 |

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
