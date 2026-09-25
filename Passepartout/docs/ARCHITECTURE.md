# Passepartout – Architektur und Vertrag für Komponenten-Dateien

> Theme Styles für das Oracle APEX Universal Theme 42 (UT-Dateiversion **24.2** und **26.1**), Styles *Light* (Basis Vita), *Dark* (Basis Vita-Dark), *Auto* (Basis Vita + UT-Delta unter `prefers-color-scheme: dark`).
> Konzept: `_concepts/canvas/CONCEPT.md` („Rahmen und Leinwand“, ein Akzent: Kartenmagenta, Schrift Instrument Sans).
> Dieses Dokument ist die **Arbeitsgrundlage aller Komponenten-Dateien** (`src/components/*.css`). Was hier steht, gilt; was hier fehlt, gehört ins Fundament und wird dort ergänzt – nicht in einer Komponenten-Datei.
> Token-Tabellen und Kontrastwerte sind aus den Quellen erzeugt (`node Passepartout/tools/build-architecture.mjs` aus `docs/ARCHITECTURE.tpl.md`), Stand: 2026-09-25. Änderungen am Text nur in der Vorlage.

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

1. **Nur Tokens.** Komponenten-Dateien enthalten keine Farbwerte (kein `#hex`, `rgb()`, `hsl()`, keine Farbnamen außer `transparent`/`currentColor`/`inherit`). Farben kommen aus `--pp-*` oder aus UT-/APEX-Tokens, die die Brücke setzt.
2. **Modusneutral.** Eine Regel sieht in hell, dunkel und auto gleich aus – nur die Token-*Werte* wechseln. Kein `prefers-color-scheme`, keine Abfrage von `--ut-color-scheme`, keine Hell/Dunkel-Klassen.
3. **Globale Tokens nur im Fundament.** Komponenten setzen nie `:root` und nie einen globalen `--pp-*`-Namen neu. Eigene Werte = lokale Komponenten-Tokens `--pp-c-*` auf dem Komponenten-Selektor (§5.4).
4. **Vita-Selektoren mit gleicher Spezifität neu deklarieren** (gleiche Selektorliste, später geladen → gewinnt). Keine IDs, keine `:not()`-Ketten zur Spezifitätssteigerung, Ziel ≤ 0,3,0.
5. **`!important` nur gegen fremdes `!important`** – aus Vita, UT Core oder app_ui (TreeNav-Hover, Drawer-Geometrie, IR-Dialogliste …), mit gleichem Selektor und einem Kommentar zur Quelle (§5.3).
6. **Kein `@layer`.** Oracle-CSS ist ungelayert – gelayerte Regeln verlören immer.
7. **EIN Fokus-System:** nie eigene Ringfarben; nur die Hooks `--ut-focus-outline` / `--ut-focus-outline-offset` lokal anpassen oder `--pp-focus-shadow*` verwenden (§5.5). Nur `:focus-visible`, nie Fokus ersatzlos entfernen.
8. **Dichte aus Tokens:** Höhen nie in px festschreiben, sondern aus `--pp-control-h`, `--pp-row-h`, `--pp-head-h` ableiten (Desktop 32/34/36 px, Touch 40 px automatisch; §5.6).
9. **Magenta-Disziplin:** `--pp-accent*` nur für Primäraktion, Auswahl/Checked, Fokus und die Lasche. Flächen mit Schrift darauf = `--pp-accent`, Marken im Vordergrund (Lasche, aktiver Tab, Wizard-Schritt, Häkchen/Schalter) = `--pp-accent-text` (dunkel ≥ 3 : 1). Links sind Tusche mit Unterstrich, Zähler Tusche, Daten Kategoriefarben. Nie Magenta als große Fläche oder Dekoration (§5.8).
10. **RTL über logische Eigenschaften** (`margin-inline-*`, `inset-inline-*`, `border-start-start-radius` …). Physisch nur, wo UT physisch setzt – dann mit `.u-RTL`-Gegenstück.
11. **Header nie `display:none`/`position:fixed`, `--js-mq-*` nie setzen**, Kopfhöhe statisch (`--pp-header-h`).
12. **Auto bleibt pixelgleich:** Nach jeder Änderung `verify-auto.sh` – Light = Auto(hell), Dark = Auto(dunkel), 0 Pixel (§6).

---

## 1. Dateistruktur und Zuständigkeit

```
Passepartout/
  theme.json                       Styles: light (Vita), dark (Vita-Dark), auto (Vita + Delta)   [Fundament]
  assets/fonts/                    Instrument Sans latin + latin-ext (wght 400–700, wdth 75–100) + OFL-Lizenz  [Fundament]
  docs/ARCHITECTURE.md             dieses Dokument (erzeugt aus docs/ARCHITECTURE.tpl.md)                   [Fundament]
  tools/check-tokens.mjs           Kontraste, Danger↔Magenta, Palette (CVD, Akzent-Abstand, Farbton), Oracle-Blau [Fundament]
  tools/build-architecture.mjs     baut docs/ARCHITECTURE.md (Tabellen aus gen-token-tables.mjs + check-tokens) [Fundament]
  src/
    passepartout-light.css         Einstieg Light: tokens/light.css → index.css                                [Fundament]
    passepartout-dark.css          Einstieg Dark:  tokens/dark.css → tokens/light.css (nur print) → index.css  [Fundament]
    passepartout-auto.css          Einstieg Auto:  tokens/light.css → UT-Delta + tokens/dark.css
                                   (beide „screen and (prefers-color-scheme: dark)“) → index.css             [Fundament]
    index.css                      modusneutraler Kern: Reihenfolge aller Imports                            [Fundament]
    tokens/light.css               Farb-Tokens hell   – NUR :root, NUR --pp-* (+ --ut-color-scheme)          [Fundament]
    tokens/dark.css                Farb-Tokens dunkel – exakt dieselben Namen wie light.css                   [Fundament]
    tokens/scale.css               Maß-, Schrift-, Dichte-, Fokus-Geometrie-Tokens (modusneutral) + < 640 px   [Fundament]
    tokens/print.css               Druck: Rahmen/Radien/Schatten weg (nur unter „print“ geladen)              [Fundament]
    fonts.css                      @font-face „Passepartout Sans“                                            [Fundament]
    bridge.css                     --pp-* → --ut-* / --a-* / --jui-* / --oj-* / --u-color-* / --prism-*, Grund schwebender Ebenen (+ pointer: coarse) [Fundament]
    base.css                       Schrift, Skala, h1–h6, Links, ::selection, Fokus, Scrollbars, tabular-nums, pre, Druck [Fundament]
    components/shell.css           Header, Tree Nav + Lasche, Leinwand, Title Bar, Breadcrumb, Tabs/RDS, Footer
    components/login.css           Login-Seite
    components/regions.css         Standard-Region, Akzente, Hero, Alert, Collapsible, Button Container, Content Block, Wizard, Carousel
    components/buttons.css         t-Button/a-Button/ui-button, Hot/Primary/Status, Gruppen, Buttons in Feldern
    components/forms.css           Felder, Labels, Pflicht, Checkbox/Radio/Switch, LOVs, Date Picker, Datei, RTE, Validierung
    components/overlays.css        Menüs, Dialoge, Drawer, Popups, Tooltips, Meldungen
    components/reports.css         Classic Report, Interactive Report, Interactive Grid, Pagination
    components/search.css          Faceted Search, Smart Filters, Search Region, Chips
    components/cards.css           Card Regions (a-CardView), Legacy Cards (t-Cards)
    components/content.css         Badges, Avatare, Template Components, Links-Liste, Media List, Timeline, Comments
    components/viz.css             Charts (JET), Kalender, Karte, Tree
    components/utilities.css       u-color-*, u-hot/u-success …, sonstige u-*-Klassen
```

Die Komponenten-Dateien sind eigenständig; das Fundament ändert sie nur, wenn eine Token-Umbenennung es erzwingt (bisher: `--pp-pad-x` → `--pp-canvas-pad-x`, `--pp-line-2` → `--pp-line-strong`, Entfernen der Mobil-Token-Überschreibung aus `shell.css`, Reparatur der Dateiköpfe – siehe §7).

---

## 2. Ladereihenfolge

### 2.1 Im APEX-Seitenkopf

`app_ui/Core.css` → `app_ui/Theme-Standard.css` → `font-apex` → UT `Core.css` → **Basis-Style** (`Vita.css` bzw. `Vita-Dark.css`, File-URL `#THEME_FILES#css/Vita#MIN#.css`) → **unser Bundle** (`#APP_FILES#passepartout/passepartout-<style>#MIN#.css`) → ggf. Theme-Roller-Output → App-CSS → Seiten-CSS.
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

**Achtung Lightning CSS:** Wird eine Datei in *einem* Bundle zweimal importiert, legt der Bundler sie an die Stelle des **letzten** Imports und **verwirft dabei die Media-Bedingung**. Deshalb importiert nur `passepartout-dark.css` die hellen Tokens zusätzlich unter `print`; Light braucht es nicht, Auto bekommt den hellen Druck über `screen and (…dark)`. Jede Datei nur einmal pro Bundle importieren.

### 2.3 Auto-Style

`passepartout-auto.css` = helle Tokens → `@import "../../_shared/ut-dark-delta.css" screen and (prefers-color-scheme: dark)` (generiertes Delta Vita → Vita-Dark: 178 Variablen + 38 Regeln) → `@import "./tokens/dark.css" screen and (prefers-color-scheme: dark)` → `index.css`. Weil **alle Regeln modusneutral** sind und Token-Dateien **nur Werte** enthalten, ist Auto pixelgleich mit Light bzw. Dark (verifiziert, §6). Jede Regel, die nur in einem Modus greift, bricht diese Eigenschaft.

---

## 3. Token-System

### 3.1 Ebenen

| Ebene | Datei | Beispiel | Wer darf ändern |
|---|---|---|---|
| Farb-Tokens (modusabhängig) | `tokens/light.css`, `tokens/dark.css` | `--pp-surface`, `--pp-accent`, `--pp-danger-tint` | Fundament |
| Maß-Tokens (modusneutral) | `tokens/scale.css` | `--pp-control-h`, `--pp-r-lg`, `--pp-fs-sm` | Fundament |
| Brücke (UT/APEX-Hebel) | `bridge.css` | `--a-button-padding-y: var(--pp-control-pad-y)` | Fundament |
| Lokale Komponenten-Tokens | `components/*.css` auf dem Komponenten-Selektor | `.t-TreeNav { --pp-c-nav-inset: .5rem }` | Komponenten |
| Lokale UT/APEX-Tokens | `components/*.css` auf Vita-gleichem Selektor | `.t-Button--hot { --a-button-background-color: var(--pp-accent) }` | Komponenten |

Benennung: `--pp-<Rolle>[-<Variante>][-<Zustand>]`, z. B. `--pp-accent-text`, `--pp-soft-hover`, `--pp-success-tint`. Status immer als Quintett **Fläche · -hover · -on · -text · -tint**.

Abgeleitete Tokens (`calc()`/`var()` in `scale.css`, z. B. `--pp-control-pad-y`) werden auf `:root` aufgelöst. Wer lokal `--pp-control-h` ändern will, setzt stattdessen die daraus abgeleiteten UT-Hebel lokal (z. B. `--a-button-padding-y: calc((var(--pp-control-h-lg) - var(--pp-control-lh)) / 2)`). Einzige Ausnahme ist die Grundfläche schwebender Ebenen (§3.6): Dort löst das Fundament die Fokus-Lücke und die beiden Fokus-Schatten selbst noch einmal auf (bridge §18).

### 3.2 Farb-Tokens (hell / dunkel)

| Token | hell | dunkel | Bedeutung / Verwendung |
|---|---|---|---|
| `--ut-color-scheme` | `light` | `dark` | UT-Farbschema (native Controls, Scrollbars): `light`/`dark` |
| **Flächen** | | | |
| `--pp-frame` | `#E8EBEF` | `#0B0C0F` | Passepartout: Seitengrund, Kopf, Navigation |
| `--pp-frame-hover` | `rgb(21 24 28 / .06)` | `rgb(237 239 242 / .07)` | Hover auf dem Rahmen |
| `--pp-frame-press` | `rgb(21 24 28 / .10)` | `rgb(237 239 242 / .11)` | gedrückt/aktiv auf dem Rahmen |
| `--pp-surface` | `#FFFFFF` | `#282C33` | Leinwand; auch aktiver Nav-Eintrag |
| `--pp-surface-sunken` | `#F5F6F8` | `#22252B` | abgesenkte Fläche: Hinweisblöcke, Alerts ohne Hervorhebung, Code-Blöcke, Readonly |
| `--pp-surface-raised` | `#FFFFFF` | `#30353D` | schwebend: Menüs, Dialoge, Popups |
| `--pp-raised-hover` | `#E8EBEF` | `#3D424B` | Hover/Fokus auf schwebender Fläche (Menüeintrag, Tag im Date Picker, Icon-Liste, Kartensteuerung) – statt `--pp-soft`/`--pp-hover`, die dort dunkel kaum sichtbar sind |
| `--pp-ground` | `var(--pp-surface)` | `var(--pp-surface)` | aktuelle Grundfläche: an der Wurzel die Leinwand, in Menüs, Dialogen, Popups und Seiten-Dialogen `--pp-surface-raised` (bridge §18). Für alles, was „in der Farbe des Grundes“ gezeichnet wird (Mitte des aktiven Wizard-Schritts, Aussparungen) |
| `--pp-hover` | `#F3F4F6` | `#2F343B` | Zeilen-/Listen-Hover auf der Leinwand |
| `--pp-press` | `#EAECEF` | `#363B43` | gedrückt auf der Leinwand |
| `--pp-soft` | `#E8EBEF` | `#383D46` | Sekundär-Button, aktiver Tab = Stück Rahmen |
| `--pp-soft-hover` | `#DDE1E6` | `#414751` | Sekundär-Button Hover |
| `--pp-soft-press` | `#D2D7DD` | `#4A515C` | Sekundär-Button gedrückt |
| `--pp-field` | `#FFFFFF` | `#1E2126` | Eingabefelder |
| `--pp-field-readonly` | `#F5F6F8` | `#24282E` | schreibgeschützte Felder |
| `--pp-scrim` | `rgb(14 16 19 / .38)` | `rgb(0 0 0 / .6)` | Abdunklung hinter Dialogen/Schublade |
| **Text** | | | |
| `--pp-ink` | `#15181C` | `#EDEFF2` | Tusche: Text, Titel, Icons |
| `--pp-ink-2` | `#2F353C` | `#D4D8DE` | Labels, Nav-Text; im Code Eigenschaften, Variablen, Attribute |
| `--pp-muted` | `#59616B` | `#A7AFB9` | Graphit: Sekundärtext, Breadcrumb |
| `--pp-placeholder` | `#677080` | `#979FAA` | Platzhalter |
| `--pp-disabled` | `#8A929C` | `#6E7681` | deaktivierte Beschriftung |
| `--pp-on-dark` | `#FFFFFF` | `#FFFFFF` | Text auf dunklen/gesättigten Flächen |
| `--pp-on-light` | `#15181C` | `#15181C` | Text auf hellen Flächen |
| **Linien** | | | |
| `--pp-line-subtle` | `#E3E6EA` | `#353A41` | sehr zart: innere Trenner in Karten/Listen |
| `--pp-line` | `#D3D8DE` | `#434951` | Haarlinie: Tabellenzeilen, Trenner, Region-Titel |
| `--pp-line-strong` | `#BCC3CB` | `#58606A` | kräftig: Rahmen von Simple-Buttons, Containern |
| `--pp-edge` | `#848C97` | `#7D8590` | Feldkante – WCAG 1.4.11 |
| `--pp-edge-hover` | `#636B77` | `#9BA3AE` | Feldkante Hover |
| `--pp-head-rule` | `#2F353C` | `#C9CED5` | Grundlinie unter Tabellenköpfen |
| **Akzent: Kartenmagenta (nur Primäraktion, Auswahl, Fokus, Lasche)** | | | |
| `--pp-accent` | `#B0106E` | `#C72A80` | Fläche |
| `--pp-accent-hover` | `#960C5D` | `#B5226F` | Primär-Fläche Hover |
| `--pp-accent-press` | `#7E0A4E` | `#A01C63` | Primär-Fläche gedrückt |
| `--pp-accent-on` | `#FFFFFF` | `#FFFFFF` | Text/Icon auf Primär-Fläche |
| `--pp-accent-text` | `#B0106E` | `#F07AB8` | als Text |
| `--pp-accent-tint` | `#FAEBF3` | `#482C42` | Auswahl-Fläche |
| `--pp-accent-tint-2` | `#F3D6E6` | `#5B2B4C` | kräftigere Auswahl, ::selection |
| `--pp-accent-ring` | `rgb(176 16 110 / .20)` | `rgb(240 122 184 / .32)` | weicher Halo – nur Zusatz, nie einziger Fokus-Hinweis |
| **Fokus (ein System, überall >= 3:1)** | | | |
| `--pp-focus-ring-color` | `#B0106E` | `#F07AB8` | Ring |
| `--pp-focus-gap` | `var(--pp-ground)` | `var(--pp-ground)` | Innenring/Lücke des Doppelrings (= `--pp-ground`: Leinwand, in schwebenden Ebenen die schwebende Fläche) |
| **Links: Tusche mit Unterstrich, Hover-Unterstrich im Akzent** | | | |
| `--pp-link-text` | `#15181C` | `#EDEFF2` | Linkfarbe im Fließtext (= Tusche) |
| `--pp-link-underline` | `#848C97` | `#7D8590` | Unterstrich im Ruhezustand |
| `--pp-link-underline-hover` | `#B0106E` | `#F07AB8` | Unterstrich bei Hover (Akzent) |
| **Textauswahl** | | | |
| `--pp-selection` | `#F3D6E6` | `#6A2E57` | ::selection-Hintergrund |
| `--pp-selection-text` | `#15181C` | `#FFFFFF` | ::selection-Text |
| **Pflichtfeld-Markierung** | | | |
| `--pp-required-color` | `#AE300C` | `#FF9677` | = Danger-Text |
| **Status: Fläche · Hover · on (Text auf Fläche) · Text · Tönung (Alert-Grund)** | | | |
| `--pp-success` | `#1E7F4F` | `#45B07C` | Erfolg: Fläche (Buttons, Badges) |
| `--pp-success-hover` | `#196B42` | `#5BBE8D` | Erfolg: Fläche Hover |
| `--pp-success-on` | `#FFFFFF` | `#15181C` | Erfolg: Text/Icon auf der Fläche |
| `--pp-success-text` | `#176A42` | `#6BCB9A` | Erfolg: Textfarbe auf Leinwand/Tönung |
| `--pp-success-tint` | `#E9F3EE` | `#26393A` | Erfolg: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pp-warning` | `#E9A21B` | `#E9A21B` | Warnung: Fläche (Buttons, Badges) |
| `--pp-warning-hover` | `#F2B544` | `#F2B544` | Warnung: Fläche Hover |
| `--pp-warning-on` | `#15181C` | `#15181C` | Warnung: Text/Icon auf der Fläche |
| `--pp-warning-text` | `#874D00` | `#F0B84E` | Warnung: Textfarbe auf Leinwand/Tönung |
| `--pp-warning-tint` | `#FCF2DE` | `#3B372E` | Warnung: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pp-danger` | `#D2410F` | `#EE6A48` | Fehler/Gefahr: Fläche (Buttons, Badges) |
| `--pp-danger-hover` | `#B6380C` | `#F47F60` | Fehler/Gefahr: Fläche Hover |
| `--pp-danger-on` | `#FFFFFF` | `#15181C` | Fehler/Gefahr: Text/Icon auf der Fläche |
| `--pp-danger-text` | `#AE300C` | `#FF9677` | Fehler/Gefahr: Textfarbe auf Leinwand/Tönung |
| `--pp-danger-tint` | `#FBEDE8` | `#413235` | Fehler/Gefahr: Tönung (Alert-/Meldungs-Hintergrund) |
| `--pp-info` | `#1A6574` | `#68B4B8` | Information: Fläche (Buttons, Badges) |
| `--pp-info-hover` | `#14525F` | `#80C1C4` | Information: Fläche Hover |
| `--pp-info-on` | `#FFFFFF` | `#15181C` | Information: Text/Icon auf der Fläche |
| `--pp-info-text` | `#1A6574` | `#8DCBCD` | Information: Textfarbe auf Leinwand/Tönung |
| `--pp-info-tint` | `#E7F1F2` | `#2A3C40` | Information: Tönung (Alert-/Meldungs-Hintergrund) |
| **Code: Syntax-Hervorhebung (Prism – Code-Blöcke, Markdown-Editor)** | | | |
| `--pp-code-keyword` | `#1A6574` | `#8DCBCD` | Schlüsselwörter, Selektoren, Klassen: Petrol |
| `--pp-code-string` | `#176A42` | `#6BCB9A` | Zeichenketten: Tannengrün |
| `--pp-code-number` | `#874D00` | `#F0B84E` | Zahlen, Wahrheitswerte, Konstanten: Ocker |
| **Tiefe** | | | |
| `--pp-canvas-shadow` | `0 0 0 1px rgb(21 24 28 / .035)` | `0 0 0 1px rgb(255 255 255 / .05)` | Leinwand: nur Kante, kein Schlagschatten |
| `--pp-float-shadow` | `0 16px 40px -12px rgb(16 20 26 / .22), 0 2px 6px rgb(16 20 26 / .06), 0 0 0 1px rgb(16 20 26 / .06)` | `0 18px 44px -12px rgb(0 0 0 / .7), 0 0 0 1px rgb(255 255 255 / .08)` | Schatten schwebender Ebenen (Menüs, Dialoge, Popups) – nie auf der Leinwand |
| `--pp-tooltip-bg` | `#15181C` | `#EDEFF2` | Tooltip-Fläche (invertiert) |
| `--pp-tooltip-text` | `#FFFFFF` | `#15181C` | Tooltip-Text |
| **Scrollbars** | | | |
| `--pp-scrollbar-thumb` | `rgb(21 24 28 / .28)` | `rgb(237 239 242 / .26)` | Scrollbar-Daumen |
| `--pp-scrollbar-thumb-hover` | `rgb(21 24 28 / .45)` | `rgb(237 239 242 / .42)` | Scrollbar-Daumen Hover |
| `--pp-scrollbar-track` | `transparent` | `transparent` | Scrollbar-Spur |
| **Icons** | | | |
| `--pp-select-arrow` | *SVG (Data-URI)* | *SVG (Data-URI)* | Pfeil der Select-Listen (Graphit, als Data-URI) |

**Designvorgaben, wie umgesetzt:**
- *Dunkel gestuft:* Leinwand `#282C33` gegen Rahmen `#0B0C0F` = **1,40 : 1** (Vorgabe ≥ 1,3, Ziel ~1,4; der erste Entwurf `#1C2025`/`#0B0C0F` ergäbe nur 1,20). Lasche und Passepartout sind nachts klar lesbar.
- *Linien:* Haarlinie hell `#D3D8DE` (vorher `#E3E6EA`, das bleibt als `--pp-line-subtle`), dunkel `#434951` (1,54 : 1). Tabellenkopf-Grundlinie in Tusche: `--pp-head-rule` + `--pp-head-rule-width` (1 px; 2 px = `--pp-rule-strong`).
- *Danger ≠ Magenta:* hell `#D2410F` (orange-rot, L 0,175) gegen Magenta `#B0106E` (L 0,107): Helligkeit 1,43 : 1, ΔE00 normal 33 / Protan 47 / Deutan 32 / Tritan 9. Dunkel: Danger ist eine *helle* Fläche mit dunkler Schrift (`#EE6A48`), Magenta eine satte Fläche mit weißer Schrift (Helligkeit 1,67 : 1, ΔE00 31 / 45 / 32 / 14).
- *Info* ist Petrol (`#1A6574`), nicht APEX-Blau (ΔE00 ≥ 12 zu jeder Oracle-Blau-Referenz inkl. Vita-Chartblau `#309FDB`; geprüft von `check-tokens.mjs`).
- *Code:* eigene Rollen-Tokens `--pp-code-keyword|string|number` (Petrol, Tannengrün, Ocker). Die Werte gleichen den Status-Texten, die Rolle ist aber eine andere, denn Statusfarben bleiben semantisch. Kommentare = `--pp-muted`, Namen = `--pp-ink`/`--pp-ink-2`. Die Zuordnung auf die `--prism-*`-Variablen steht in bridge §17. Kein Magenta, kein Blau; alle ≥ 4,5 : 1 auf Leinwand, abgesenkt, Dialog und Feld (Tabelle §3.5).

### 3.3 Kategorie- und Diagrammpalette (`--pp-cat-*` → `--u-color-*`)

Kartografisch abgestimmt (Wasser, Straße, Wald, Grenze, Höhe, Siedlung …), harmonisch zu den kühlen Neutrals, **keine Vita-Farben**. Chart-Reihenfolge des UT (`.oj-dvt-category1…12` → `--u-color-1,4,7,9,12,3,8,10,2,5,11,6`) ist berücksichtigt: Die ersten Serien sind auch bei Farbfehlsichtigkeit unterscheidbar (Brettel/Viénot-Simulation, min. ΔE00 normal / Protan / Deutan / Tritan – erste 6 Serien hell 10,2 / 10,1 / 11,7 / 7,3, dunkel 20,8 / 17,1 / 10,4 / 11,0; erste 8 Serien hell 10,2 / 9,6 / 11,7 / 7,3, dunkel 17,8 / 8,2 / 9,2 / 11,0). Hell: alle ≥ 2,4 : 1 gegen die Leinwand (Serie 1–5 ≥ 3,1); dunkel alle ≥ 3,3 : 1.

Zwei weitere Regeln prüft `check-tokens.mjs`:
- **Magenta-Abstand:** Jede Kategorie liegt ≥ 20 ΔE00 von `--pp-accent` und `--pp-accent-text` (hell min. 21,2, dunkel 21,7). Kein Avatar, Badge oder Balken darf sich wie eine Auswahl lesen.
- **Gleiche Identität hell/dunkel:** Der HSL-Farbton einer Kategorie weicht zwischen den Modi um höchstens 25° ab (Grautöne ausgenommen; heute max. 20°, Lagune). Die dunkle Variante ist aufgehellt, gehört aber zur selben Farbfamilie.

Deshalb (2026-09): Serie 4 (`--pp-cat-9`) ist in beiden Modi **Violett** (hell `#6E40C4`, Weiß darauf 6,6 : 1; vorher hell Orchidee `#B566A5`, ΔE00 17 am Akzent, dunkel schon Violett). Serie 8 (`--pp-cat-10`) ist **Rosenholz** (hell `#6C4643`, dunkel `#A47672`). Die frühere Aubergine lag hell 14,7 und dunkel 15,0 am Akzent und war dunkel die schwächste Serie bei Protan/Deutan (6,0 / 5,6 → jetzt 8,2 / 9,2).

| n | Token | hell | on (hell) | dunkel | on (dunkel) | Chart-Serie | Name |
|---:|---|---|---|---|---|---:|---|
| 1 | `--pp-cat-1` | `#1F6B85` | `#FFFFFF` | `#1C91A0` | `#15181C` | 1 | Petrol (Wasser) |
| 2 | `--pp-cat-2` | `#7A6A55` | `#FFFFFF` | `#AC9982` | `#15181C` | 9 | Erde |
| 3 | `--pp-cat-3` | `#4A998D` | `#15181C` | `#7FDCF0` | `#15181C` | 6 | Lagune (≥ 3:1 auf Weiß, ΔE00 > 20 zu APEX-Chartblau) |
| 4 | `--pp-cat-4` | `#C98300` | `#15181C` | `#F5AA3E` | `#15181C` | 2 | Ocker (Straße) |
| 5 | `--pp-cat-5` | `#9082CE` | `#15181C` | `#BFB0F5` | `#15181C` | 10 | Lavendel |
| 6 | `--pp-cat-6` | `#3D6B2A` | `#FFFFFF` | `#6B9D55` | `#15181C` | 12 | Tanne |
| 7 | `--pp-cat-7` | `#14866A` | `#FFFFFF` | `#4CB898` | `#15181C` | 3 | Blaugrün (Wald) |
| 8 | `--pp-cat-8` | `#8B8F54` | `#15181C` | `#C2C67C` | `#15181C` | 7 | Salbei |
| 9 | `--pp-cat-9` | `#6E40C4` | `#FFFFFF` | `#986CEA` | `#15181C` | 4 | Violett (Grenze) |
| 10 | `--pp-cat-10` | `#6C4643` | `#FFFFFF` | `#A47672` | `#15181C` | 8 | Rosenholz (Siedlung) |
| 11 | `--pp-cat-11` | `#C8755E` | `#15181C` | `#F4B39E` | `#15181C` | 11 | Koralle |
| 12 | `--pp-cat-12` | `#B23D22` | `#FFFFFF` | `#F06D4B` | `#15181C` | 5 | Ziegel (Höhe) |
| 13 | `--pp-cat-13` | `#284F57` | `#FFFFFF` | `#4F8A96` | `#15181C` | – | Tiefsee |
| 14 | `--pp-cat-14` | `#838C96` | `#15181C` | `#B9C3CE` | `#15181C` | – | Nebel |
| 15 | `--pp-cat-15` | `#5E6873` | `#FFFFFF` | `#8D98A4` | `#15181C` | – | Schiefer |

**`--u-color-16…45`:** Vita setzt dort vorberechnete Hex-Ableitungen von 1–15 (16–30 ≈ 20 % Weiß beigemischt, 31–45 per SCSS-`darken()`; in Vita und Vita-Dark identisch, z. B. `#309FDB` → `#59b2e2` / `#1a8bc9`). Passepartout ersetzt alle 30 in `bridge.css` zur Laufzeit: 16–30 = `color-mix(in srgb, var(--pp-cat-N) 60%, #fff)` mit Text `--pp-on-light` (min. 5,7 : 1), 31–45 = `color-mix(in srgb, var(--pp-cat-N) 55%, #000)` mit Text `--pp-on-dark` (min. 4,9 : 1). So scheint keine Vita-Farbe durch – auch nicht im Zyklus `.u-colors > :nth-child(45n+N)` und im Workflow-Diagramm (`--u-color-27/31/38/42/44/45`).

### 3.4 Maß-, Schrift-, Dichte- und Fokus-Tokens (modusneutral)

| Token | Wert | Bedeutung / Verwendung |
|---|---|---|
| **Schrift** | | |
| `--pp-font` | `"Passepartout Sans", "Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | Schriftfamilie der gesamten Oberfläche (Instrument Sans, dann System) |
| `--pp-font-mono` | `ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Monospace (Code, Markdown, Prism) – nie für UI-Beschriftungen |
| `--pp-fw-regular` | `400` | normal: Fließtext, Zellen, Felder |
| `--pp-fw-medium` | `500` | Labels, Buttons, Navigation |
| `--pp-fw-semibold` | `600` | Titel, aktive Einträge, Tabellenköpfe |
| `--pp-fw-bold` | `650` | „fett“ im Fließtext (<b>, <strong>) – variable Achse |
| `--pp-stretch-normal` | `100%` | wdth-Achse 100 |
| `--pp-stretch-narrow` | `87.5%` | schmal geschnitten: Tabellenköpfe, dichte Spaltenlabels |
| `--pp-stretch-condensed` | `75%` | Minimum der Achse – nur für Notfälle (sehr enge Spalten) |
| **Größen-Skala 12 · 13 · 14 · 16 · 20 · 28 (+ 12,5 für Tabellenköpfe)** | | |
| `--pp-fs-xs` | `.75rem` | 12  Klein: Hilfe, Badges, Zähler |
| `--pp-fs-head` | `.78125rem` | 12,5 Tabellenköpfe |
| `--pp-fs-sm` | `.8125rem` | 13  Tabellenzellen, Labels, Breadcrumb, Menüs klein |
| `--pp-fs-md` | `.875rem` | 14  UI, Fließtext, Felder, Buttons |
| `--pp-fs-lg` | `1rem` | 16  Region-Titel |
| `--pp-fs-xl` | `1.25rem` | 20  Abschnitt (Content Block h2) |
| `--pp-fs-2xl` | `1.75rem` | 28  Seitentitel |
| `--pp-lh-xs` | `1rem` | zu 12 / 12,5 |
| `--pp-lh-sm` | `1.25rem` | zu 13 (Tabellenzellen 13/20) |
| `--pp-lh-md` | `1.25rem` | zu 14 |
| `--pp-lh-body` | `1.375rem` | zu 14 im Fließtext (Regionen, Content Blocks) |
| `--pp-lh-lg` | `1.5rem` | zu 16 |
| `--pp-lh-xl` | `1.75rem` | zu 20 |
| `--pp-lh-2xl` | `2.125rem` | zu 28 |
| `--pp-tracking-title` | `-.02em` | Seitentitel, Login-Titel |
| `--pp-tracking-heading` | `-.01em` | Region-/Abschnittstitel, h1–h4 |
| `--pp-tracking-ui` | `-.003em` | Buttons |
| **Geometrie: Rahmen und Leinwand** | | |
| `--pp-gutter` | `.75rem` | Rahmenbreite um die Leinwand (rechts/unten, ohne Nav auch links) |
| `--pp-canvas-pad-x` | `2rem` | Innenabstand der Leinwand, waagerecht |
| `--pp-canvas-pad-y` | `1.25rem` | Innenabstand der Leinwand, senkrecht (Title Bar, Inhalt) |
| `--pp-r-canvas` | `1.125rem` | 18 Radius der Leinwand |
| `--pp-r-lg` | `.75rem` | 12 Container: Tabellen, Karten, Menüs, Dialog-Inhalte, Alerts |
| `--pp-r-md` | `.5rem` | 8  Controls: Buttons, Felder, Nav-Einträge, Tabs |
| `--pp-r-sm` | `.3125rem` | 5  Checkbox, Badges, Chips |
| `--pp-r-dialog` | `1rem` | 16 Dialoge/Drawer (schwebende Leinwand) |
| `--pp-r-pill` | `62rem` | Pillen (Zähler, Avatare rund) |
| `--pp-header-h` | `3.5rem` | Kopfzeile (statisch – nie per JS/Font verändern) |
| `--pp-brand-lh` | `1.5rem` | feste Zeilenhöhe Logo/Branding: Font-Swap verschiebt nichts |
| `--pp-nav-w` | `15.5rem` | aufgeklappte Side-Navigation |
| `--pp-nav-rail-w` | `4rem` | eingeklappte Icon-Leiste |
| **Abstände (4er-Raster)** | | |
| `--pp-space-1` | `.25rem` | 4 |
| `--pp-space-2` | `.5rem` | 8 |
| `--pp-space-3` | `.75rem` | 12 |
| `--pp-space-4` | `1rem` | 16 |
| `--pp-space-5` | `1.25rem` | 20 |
| `--pp-space-6` | `1.5rem` | 24 |
| `--pp-space-8` | `2rem` | 32 |
| `--pp-space-12` | `3rem` | 48 |
| `--pp-region-gap` | `2rem` | Abstand zwischen Regionen (→ --ut-region-margin) |
| **Dichte (Desktop 32 px; unter pointer: coarse 40 px – siehe bridge.css)** | | |
| `--pp-control-h` | `2rem` | Höhe Buttons, Felder, Selects, Pillen (inkl. Rand) |
| `--pp-control-h-sm` | `1.5rem` | kleine Buttons (t-Button--small), Toolbar-Icons |
| `--pp-control-h-lg` | `2.5rem` | große Buttons (t-Button--large), Login |
| `--pp-control-lh` | `1.25rem` | Zeilenhöhe im Control |
| `--pp-control-pad-x` | `.75rem` | Innenabstand waagerecht (Felder); Buttons +2 px |
| `--pp-control-pad-y` | `calc((var(--pp-control-h) - var(--pp-control-lh)) / 2)` | inkl. 1 px Rand (app_ui-Konvention) |
| `--pp-row-h` | `2.125rem` | Tabellenzeile 34 px inkl. Haarlinie |
| `--pp-row-lh` | `1.25rem` | Zeilenhöhe in Zellen (13/20) |
| `--pp-row-pad-x` | `.75rem` | Zellen-Innenabstand waagerecht |
| `--pp-row-pad-y` | `calc((var(--pp-row-h) - var(--pp-row-lh) - 1px) / 2)` | = 6,5 px |
| `--pp-head-h` | `2.25rem` | Tabellenkopf 36 px |
| `--pp-hit-min` | `1.5rem` | Mindest-Trefferfläche (WCAG 2.5.8); coarse: 2.5rem |
| `--pp-checkbox-size` | `1.125rem` | Checkbox/Radio |
| **Linien-Geometrie** | | |
| `--pp-hairline` | `1px` | Haarlinie: Zeilen, Trenner, Region-Titel |
| `--pp-head-rule-width` | `1px` | Grundlinie unter Tabellenköpfen (Tusche); 2px = --pp-rule-strong |
| `--pp-rule-strong` | `2px` | kräftige Tusche-Linie (Summenzeile, betonte Köpfe) |
| **Fokus-Geometrie (Farben: --pp-focus-ring-color / --pp-focus-gap)** | | |
| `--pp-focus-ring-width` | `2px` | Breite des Fokusrings |
| `--pp-focus-ring-offset` | `2px` | Abstand Ring ↔ Element (zeigt den Grund als Innenring) |
| `--pp-focus-outline` | `var(--pp-focus-ring-width) solid var(--pp-focus-ring-color)` | fertiger outline-Wert; über --ut-focus-outline global aktiv |
| `--pp-focus-shadow` | `0 0 0 var(--pp-focus-ring-offset) var(--pp-focus-gap), 0 0 0 calc(var(--pp-focus-ring-offset) + var(--pp-focus-ring-width)) var(--pp-focus-ring-color)` | Doppelring als box-shadow (Grundfläche `--pp-focus-gap` innen, Magenta außen) – wo outline verdeckt würde; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--pp-focus-shadow-inset` | `inset 0 0 0 var(--pp-focus-ring-width) var(--pp-focus-ring-color), inset 0 0 0 calc(var(--pp-focus-ring-width) + 1px) var(--pp-focus-gap)` | Ring nach innen (1 px Lücke in der Grundfläche) – Zeilen, Zellen, Nav-Einträge in overflow-Containern; in schwebenden Ebenen neu aufgelöst (bridge §18) |
| `--pp-focus-field-shadow` | `0 0 0 1px var(--pp-focus-ring-color)` | Felder: zusammen mit border-color = Ringfarbe ein 2-px-Ring ohne Layoutsprung |
| **Links (Farben in light/dark)** | | |
| `--pp-link-underline-width` | `1px` | Unterstrich-Stärke im Fließtext |
| `--pp-link-underline-width-hover` | `2px` | Unterstrich-Stärke bei Hover |
| `--pp-link-underline-offset` | `.2em` | Abstand Unterstrich ↔ Grundlinie |
| **Pflichtfeld** | | |
| `--pp-required-mark` | `"*"` | in Textschrift, nicht als Icon |
| `--pp-required-gap` | `.25rem` | Abstand Label-Text → Markierung |
| **Bewegung** | | |
| `--pp-duration` | `.12s` | Dauer kurzer Zustandswechsel (Hover, Fokus); 0 s bei prefers-reduced-motion |
| `--pp-ease` | `cubic-bezier(.2, 0, 0, 1)` | Kurve für Zustandswechsel |
| **Mobil (< 640 px): schmaler Rahmen, kleinerer Leinwand-Innenabstand – Überschreibung `@media (max-width: 639px)`** | | |
| `--pp-gutter` | `.25rem` | 4 px: der Rahmen bleibt als Kante sichtbar |
| `--pp-canvas-pad-x` | `.5rem` | 8 px – Inhaltsbreite bei 390 px: 366 px (Vita 374) |
| `--pp-canvas-pad-y` | `.75rem` | 12 px |
| `--pp-r-canvas` | `.75rem` | 12 px: passt zum schmalen Rahmen |
| `--pp-region-gap` | `1.5rem` | 24 px zwischen Regionen |

Touch (`@media (pointer: coarse)`, in `bridge.css`): `--pp-control-h 2.5rem`, `--pp-control-h-sm 2rem`, `--pp-control-h-lg 3rem`, `--pp-row-h 2.5rem`, `--pp-head-h 2.5rem`, `--pp-hit-min 2.5rem`, `--pp-checkbox-size 1.25rem`. Alle abgeleiteten Hebel (Button-/Feld-Polster, IG-Zellenhöhen, Report-Polster) rechnen sich daraus neu.

Druck (`tokens/print.css`, nur `print`): `--pp-frame #FFF`, `--pp-gutter 0`, `--pp-r-canvas 0`, `--pp-canvas-pad-x 0`, `--pp-canvas-shadow none`, `--pp-float-shadow none`, `--pp-scrim transparent`; Dark lädt zusätzlich die hellen Farb-Tokens unter `print`.

### 3.5 Kontraste (WCAG 2.x, aus den Quellen gemessen)

Alle Textpaare ≥ 4,5 : 1, alle UI-/Fokuspaare ≥ 3 : 1 – in hell **und** dunkel (`node Passepartout/tools/check-tokens.mjs`).

| Paar | Rolle | hell | dunkel | Minimum |
|---|---|---:|---:|---:|
| `--pp-ink` / `--pp-surface` | Text auf Leinwand | 17.81 | 12.17 | 4.5 |
| `--pp-ink` / `--pp-frame` | Text auf Rahmen (Kopf, Nav) | 14.89 | 16.98 | 4.5 |
| `--pp-ink` / `--pp-surface-sunken` | Text abgesenkt | 16.47 | 13.33 | 4.5 |
| `--pp-ink` / `--pp-surface-raised` | Text in Menü/Dialog | 17.81 | 10.71 | 4.5 |
| `--pp-ink` / `--pp-soft` | Sekundär-Button | 14.89 | 9.47 | 4.5 |
| `--pp-ink` / `--pp-soft-hover` | Sekundär-Button Hover | 13.56 | 8.12 | 4.5 |
| `--pp-ink` / `--pp-accent-tint` | Auswahl-Zeile | 15.47 | 10.63 | 4.5 |
| `--pp-ink` / `--pp-accent-tint-2` | Auswahl kräftig | 13.20 | 9.62 | 4.5 |
| `--pp-ink-2` / `--pp-surface` | Label | 12.39 | 9.80 | 4.5 |
| `--pp-ink-2` / `--pp-frame` | Nav-Text auf Rahmen | 10.36 | 13.67 | 4.5 |
| `--pp-muted` / `--pp-surface` | Sekundärtext | 6.27 | 6.32 | 4.5 |
| `--pp-muted` / `--pp-surface-sunken` | Sekundärtext abgesenkt | 5.80 | 6.93 | 4.5 |
| `--pp-muted` / `--pp-surface-raised` | Sekundärtext Menü | 6.27 | 5.57 | 4.5 |
| `--pp-muted` / `--pp-frame` | Sekundärtext Rahmen | 5.25 | 8.83 | 4.5 |
| `--pp-muted` / `--pp-hover` | Sekundärtext Zeilen-Hover | 5.70 | 5.66 | 4.5 |
| `--pp-ink` / `--pp-raised-hover` | Menüeintrag Hover/Fokus | 14.89 | 8.77 | 4.5 |
| `--pp-muted` / `--pp-raised-hover` | Tastenkürzel im Menü-Hover | 5.25 | 4.56 | 4.5 |
| `--pp-placeholder` / `--pp-field` | Platzhalter | 4.99 | 6.04 | 4.5 |
| `--pp-ink` / `--pp-field` | Feldtext | 17.81 | 14.01 | 4.5 |
| `--pp-ink` / `--pp-field-readonly` | Feldtext readonly | 16.47 | 12.86 | 4.5 |
| `--pp-link-text` / `--pp-surface` | Link | 17.81 | 12.17 | 4.5 |
| `--pp-accent-text` / `--pp-surface` | Akzent-Text Leinwand | 6.68 | 5.46 | 4.5 |
| `--pp-accent-text` / `--pp-surface-raised` | Akzent-Text Menü | 6.68 | 4.81 | 4.5 |
| `--pp-accent-text` / `--pp-frame` | Akzent-Text Rahmen | 5.58 | 7.62 | 4.5 |
| `--pp-accent-text` / `--pp-accent-tint` | Akzent-Text auf Tönung | 5.80 | 4.77 | 4.5 |
| `--pp-accent-on` / `--pp-accent` | Primär-Button | 6.68 | 5.16 | 4.5 |
| `--pp-accent-on` / `--pp-accent-hover` | Primär-Button Hover | 8.38 | 6.13 | 4.5 |
| `--pp-accent-on` / `--pp-accent-press` | Primär-Button gedrückt | 10.29 | 7.39 | 4.5 |
| `--pp-selection-text` / `--pp-selection` | ::selection | 13.20 | 9.81 | 4.5 |
| `--pp-required-color` / `--pp-surface` | Pflicht-Markierung | 6.51 | 6.59 | 4.5 |
| `--pp-required-color` / `--pp-surface-sunken` | Pflicht-Markierung abgesenkt | 6.02 | 7.23 | 4.5 |
| `--pp-tooltip-text` / `--pp-tooltip-bg` | Tooltip | 17.81 | 15.46 | 4.5 |
| `--pp-edge` / `--pp-surface` | Feldkante/Leinwand (1.4.11) | 3.40 | 3.76 | 3 |
| `--pp-edge` / `--pp-surface-sunken` | Feldkante/abgesenkt | 3.14 | 4.12 | 3 |
| `--pp-edge` / `--pp-field` | Feldkante/Feld | 3.40 | 4.33 | 3 |
| `--pp-edge` / `--pp-surface-raised` | Feldkante/Dialog | 3.40 | 3.31 | 3 |
| `--pp-focus-ring-color` / `--pp-surface` | Fokus auf Leinwand | 6.68 | 5.46 | 3 |
| `--pp-focus-ring-color` / `--pp-frame` | Fokus auf Rahmen | 5.58 | 7.62 | 3 |
| `--pp-focus-ring-color` / `--pp-surface-sunken` | Fokus abgesenkt | 6.17 | 5.98 | 3 |
| `--pp-focus-ring-color` / `--pp-surface-raised` | Fokus in Menü/Dialog | 6.68 | 4.81 | 3 |
| `--pp-focus-ring-color` / `--pp-soft` | Fokus neben Sekundär-Button | 5.58 | 4.25 | 3 |
| `--pp-focus-ring-color` / `--pp-field` | Fokus-Feldkante/Feld | 6.68 | 6.29 | 3 |
| `--pp-focus-ring-color` / `--pp-focus-gap` | Doppelring innen/außen | 6.68 | 5.46 | 3 |
| `--pp-focus-ring-color` / `--pp-raised-hover` | Fokus-Innenring auf Menü-Hover | 5.58 | 3.93 | 3 |
| `--pp-accent-text` / `--pp-raised-hover` | Häkchen/Radio im Menü-Hover (Marke) | 5.58 | 3.93 | 3 |
| `--pp-link-underline` / `--pp-surface` | Link-Unterstrich | 3.40 | 3.76 | 3 |
| `--pp-link-underline` / `--pp-surface-sunken` | Link-Unterstrich abgesenkt | 3.14 | 4.12 | 3 |
| `--pp-link-underline-hover` / `--pp-surface` | Link-Unterstrich Hover | 6.68 | 5.46 | 3 |
| `--pp-code-keyword` / `--pp-surface` | Code keyword (Leinwand) | 6.65 | 7.71 | 4.5 |
| `--pp-code-keyword` / `--pp-surface-sunken` | Code keyword (abgesenkt) | 6.15 | 8.45 | 4.5 |
| `--pp-code-keyword` / `--pp-surface-raised` | Code keyword (Dialog) | 6.65 | 6.79 | 4.5 |
| `--pp-code-keyword` / `--pp-field` | Code keyword (Markdown-Editor) | 6.65 | 8.88 | 4.5 |
| `--pp-code-string` / `--pp-surface` | Code string (Leinwand) | 6.61 | 7.10 | 4.5 |
| `--pp-code-string` / `--pp-surface-sunken` | Code string (abgesenkt) | 6.11 | 7.78 | 4.5 |
| `--pp-code-string` / `--pp-surface-raised` | Code string (Dialog) | 6.61 | 6.25 | 4.5 |
| `--pp-code-string` / `--pp-field` | Code string (Markdown-Editor) | 6.61 | 8.18 | 4.5 |
| `--pp-code-number` / `--pp-surface` | Code number (Leinwand) | 6.79 | 7.79 | 4.5 |
| `--pp-code-number` / `--pp-surface-sunken` | Code number (abgesenkt) | 6.28 | 8.53 | 4.5 |
| `--pp-code-number` / `--pp-surface-raised` | Code number (Dialog) | 6.79 | 6.86 | 4.5 |
| `--pp-code-number` / `--pp-field` | Code number (Markdown-Editor) | 6.79 | 8.97 | 4.5 |
| `--pp-muted` / `--pp-field` | Code-Kommentar (Markdown-Editor) | 6.27 | 7.28 | 4.5 |
| `--pp-danger-text` / `--pp-surface-raised` | Code gelöscht (diff) (Dialog) | 6.51 | 5.80 | 4.5 |
| `--pp-danger-text` / `--pp-field` | Code gelöscht (diff) (Markdown-Editor) | 6.51 | 7.60 | 4.5 |
| `--pp-success-on` / `--pp-success` | success-Fläche | 5.00 | 6.58 | 4.5 |
| `--pp-success-on` / `--pp-success-hover` | success-Fläche Hover | 6.52 | 7.80 | 4.5 |
| `--pp-success-text` / `--pp-surface` | success-Text Leinwand | 6.61 | 7.10 | 4.5 |
| `--pp-success-text` / `--pp-surface-sunken` | success-Text abgesenkt | 6.11 | 7.78 | 4.5 |
| `--pp-success-text` / `--pp-success-tint` | success-Text auf Tönung | 5.83 | 6.15 | 4.5 |
| `--pp-ink` / `--pp-success-tint` | Text auf success-Tönung | 15.70 | 10.54 | 4.5 |
| `--pp-warning-on` / `--pp-warning` | warning-Fläche | 8.18 | 8.18 | 4.5 |
| `--pp-warning-on` / `--pp-warning-hover` | warning-Fläche Hover | 9.72 | 9.72 | 4.5 |
| `--pp-warning-text` / `--pp-surface` | warning-Text Leinwand | 6.79 | 7.79 | 4.5 |
| `--pp-warning-text` / `--pp-surface-sunken` | warning-Text abgesenkt | 6.28 | 8.53 | 4.5 |
| `--pp-warning-text` / `--pp-warning-tint` | warning-Text auf Tönung | 6.11 | 6.59 | 4.5 |
| `--pp-ink` / `--pp-warning-tint` | Text auf warning-Tönung | 16.02 | 10.29 | 4.5 |
| `--pp-danger-on` / `--pp-danger` | danger-Fläche | 4.66 | 5.76 | 4.5 |
| `--pp-danger-on` / `--pp-danger-hover` | danger-Fläche Hover | 5.90 | 6.83 | 4.5 |
| `--pp-danger-text` / `--pp-surface` | danger-Text Leinwand | 6.51 | 6.59 | 4.5 |
| `--pp-danger-text` / `--pp-surface-sunken` | danger-Text abgesenkt | 6.02 | 7.23 | 4.5 |
| `--pp-danger-text` / `--pp-danger-tint` | danger-Text auf Tönung | 5.69 | 5.70 | 4.5 |
| `--pp-ink` / `--pp-danger-tint` | Text auf danger-Tönung | 15.59 | 10.52 | 4.5 |
| `--pp-info-on` / `--pp-info` | info-Fläche | 6.65 | 7.47 | 4.5 |
| `--pp-info-on` / `--pp-info-hover` | info-Fläche Hover | 8.74 | 8.77 | 4.5 |
| `--pp-info-text` / `--pp-surface` | info-Text Leinwand | 6.65 | 7.71 | 4.5 |
| `--pp-info-text` / `--pp-surface-sunken` | info-Text abgesenkt | 6.15 | 8.45 | 4.5 |
| `--pp-info-text` / `--pp-info-tint` | info-Text auf Tönung | 5.78 | 6.35 | 4.5 |
| `--pp-ink` / `--pp-info-tint` | Text auf info-Tönung | 15.49 | 10.02 | 4.5 |
| `--pp-surface` / `--pp-frame` | Leinwand gegen Rahmen | 1.20 | 1.40 | – |
| `--pp-line` / `--pp-surface` | Haarlinie | 1.43 | 1.54 | – |
| `--pp-line-strong` / `--pp-surface` | kräftige Linie | 1.78 | 2.20 | – |
| `--pp-head-rule` / `--pp-surface` | Tabellenkopf-Grundlinie | 12.39 | 8.86 | – |
| `--pp-soft` / `--pp-surface` | Sekundär-Button-Fläche | 1.20 | 1.28 | – |
| `--pp-accent` / `--pp-surface` | Primär-Fläche | 6.68 | 2.72 | – |
| `--pp-raised-hover` / `--pp-surface-raised` | Hover auf schwebender Fläche | 1.20 | 1.22 | 1.15 |

**Paare außerhalb der Tabelle, die die Minima nicht erreichen** (unabhängige Nachprüfung, `_tmp/pp-check/contrast.mjs`) – Komponenten dürfen diese Kombinationen nicht erzeugen oder brauchen einen eigenen Token:
- `--pp-accent` als Fläche ohne Schrift gegen die Leinwand im Dunkeln **2,72 : 1**, im Dialog (`--pp-surface-raised`) **2,39 : 1**. **Gelöst über die Rolle, nicht über einen neuen Token:** Alles, was nur als Marke oder Zustand erkennbar sein muss, nimmt `--pp-accent-text` (dunkel `#F07AB8`: 5,5 Leinwand). Das sind Checkbox/Radio checked (`--a-checkbox-checked-background-color`, Häkchen `--pp-surface`), die Switch-Spur, die Sterne im Star Rating, die Lasche/Nav-Marke, der Strich am aktiven Tab, der aktuelle Wizard-Schritt und die Metric-Card-Kante. `--pp-accent` bleibt für Flächen mit Schrift darauf (Primär-Button, gewählter Tag im Date Picker).
- `--pp-muted` auf `--pp-soft-hover` / `--pp-soft-press`: hell 4,78 / 4,33, dunkel 4,22 / 3,61 – Sekundärtext nie auf gedrückten/überfahrenen Sekundär-Flächen.
- `--pp-accent-text` als **Text** auf `--pp-soft` dunkel 4,25, auf `--pp-raised-hover` dunkel 3,93 – Magenta-Schrift nie auf Sekundär- oder Hover-Flächen (als Icon/Marke ≥ 3 : 1 zulässig, z. B. das Menü-Häkchen). Der Date Picker hält das ein: „heute“ ist eine Tönung (`--pp-accent-tint`), der Tag unter Hover steht in Tusche (forms.css).
- `--pp-hover` bzw. `--pp-soft` als Hover **auf `--pp-surface-raised`**: dunkel 1,02 bzw. 1,13 : 1, also kaum oder gar nicht sichtbar. In Menüs, Dialogen und Popups daher `--pp-raised-hover` verwenden (1,20 / 1,22 : 1, §3.6).
- `--pp-edge` auf `--pp-frame` hell 2,84 – Felder auf dem Rahmen (Kopf, Navigation) brauchen die Feldfläche `--pp-field` als Grund (Kante gegen Feld 3,40).

### 3.6 Grundfläche schwebender Ebenen (`--pp-ground`, `--pp-raised-hover`)

Menüs, Dialoge und Popups liegen auf `--pp-surface-raised`, im Dunkeln heller als die Leinwand (`#30353D` gegen `#282C33`). Was „in der Farbe des Grundes“ gezeichnet wird, darf dort nicht die Leinwand nehmen, sonst entsteht eine dunkle Linie oder ein dunkler Punkt (1,14 : 1).
- **`--pp-ground`** ist die aktuelle Grundfläche: an der Wurzel `var(--pp-surface)`. Auf `.a-Menu`, `.ui-dialog` (IR/IG-Dialoge, Popup-LOV, Date-Picker- und Combobox-Popup, Inline-Dialoge, Drawer), `.a-IRR-sortWidget` und im iframe-Dokument der Seiten-Dialoge (`.t-Dialog-page`, `.t-Drawer-page`) setzt bridge §18 den Wert `var(--pp-surface-raised)`. Komponenten nehmen `--pp-ground` statt `--pp-surface` für Aussparungen, z. B. die Mitte des aktiven Wizard-Schritts (`--ut-wp-active-background-color`).
- **`--pp-focus-gap`** ist `var(--pp-ground)`. bridge §18 löst die Lücke und die beiden Schatten `--pp-focus-shadow` / `--pp-focus-shadow-inset` auf den genannten Ebenen neu auf. Die Formeln sind dieselben wie in `scale.css`, `check-tokens.mjs` vergleicht sie. So zeigt der Doppelring im Dialog die Dialogfläche als Lücke und keine Leinwand-Linie.
- **`--pp-raised-hover`** ist der Hover bzw. die Tastatur-Auswahl auf schwebenden Flächen (hell `#E8EBEF`, gleich dem bisherigen `--pp-soft`; dunkel `#3D424B`). Die Brücke legt `--a-menu-focused-background-color` (Menüs, damit auch IconList-, Popup-LOV-Link-, JET- und CKEditor-Hover) und `--a-datepicker-calendar-day-hover-background-color` darauf. Komponenten verwenden ihn für Hover in Dialogen, Popups und Kartensteuerungen statt `--pp-soft`/`--pp-hover`. `check-tokens.mjs` verlangt ≥ 1,15 : 1 gegen `--pp-surface-raised` sowie Tusche und Graphit darauf ≥ 4,5 : 1.
- Einen eigenen Grund (z. B. eine Tafel in `--pp-surface-sunken`) kann eine Komponente lokal mit `--pp-ground: var(--pp-…)` angeben. Die Fokus-Schatten folgen dann allerdings nur, wenn sie dort ebenfalls neu aufgelöst werden, und das geschieht nur im Fundament. Solche Fälle bitte anfragen.

---

## 4. Brücke: was auf welche UT-Hebel zeigt

`bridge.css` setzt **alle 102 Kern-Hebel** aus `_docs/ut-tokens.json` (`lever: true`) auf `--pp-*` (Kennzeichnung `◆` im Quelltext) und dazu die wichtigsten Feinschliff-Hebel. Abschnitte (in dieser Reihenfolge in der Datei): 1 Typografie · 2 Palette/Status · 3 Links, Fokus, Text · 4 Generische Komponente · 5 Schatten/Radien · 6 Shell (Rahmen, Kopf, Navigation, Title Bar, Inhalt) · 7 Regionen · 8 Tabs · 9 Buttons · 10 Formulare · 11 Menüs/Dialoge/Tooltips · 12 Reports/IR/IG · 13 Cards · 14 Badges/Avatare · 15 `--u-color-1…45` · 16 JET · 17 Code (PrismJS) und Markdown · 18 Schwebende Ebenen (Grundfläche, Fokus-Lücke; eigene Selektoren, §3.6) · `@media (pointer: coarse)`.

### 4.1 Hex-Kopien der Vita-Primärfarbe `#056AC8` (hardcodedPrimary)

| Vita-Deklaration | Passepartout | Ort |
|---|---|---|
| `:root --ut-link-text-color` | `var(--pp-link-text)` (Tusche) | bridge §3 |
| `:root --ut-focus-outline-color` | `var(--pp-focus-ring-color)` | bridge §3 |
| `:root --ut-header-background-color` | `var(--pp-frame)` | bridge §6 |
| `:root --ut-treeview-badge-background-color` | `var(--pp-ink)` (Zähler in Tusche) | bridge §6 |
| `:root --a-menu-focused-background-color` | `var(--pp-raised-hover)` | bridge §11 |
| `:root --ut-palette-info` | `var(--pp-info)` (Petrol) | bridge §2 |
| `:root --a-button-count-background-color` (26.1) | `var(--pp-ink)` (Zähler in Tusche) | bridge §9, `components/buttons.css` |
| `:root --a-field-input-focus-border-color` | `var(--pp-focus-ring-color)` | bridge §10 |
| `:root --ut-field-input-focus-icon-color` | `var(--pp-accent-text)` | bridge §10 |
| `:root --ut-field-fl-input-focus-icon-background-color` | `var(--pp-accent-tint)` | bridge §10 |
| `:root --a-checkbox-checked-background-color` | `var(--pp-accent-text)` (Häkchen `--pp-surface`; dunkel ≥ 3 : 1) | bridge §10 |
| `:root --a-cv-focus-border-color` / `--a-cv-icon-background-color` / `--a-cv-initials-background-color` | `var(--pp-focus-ring-color)` / `var(--pp-soft)` / `var(--pp-soft)` | bridge §13 |
| `.t-Button--hot, .a-Button--hot, .ui-button--hot, .a-CardView-button--hot, .apex-button-group input:checked + label, … radioButtonGroup …` (`--a-button-background-color`, `-hover-`, `-active-`) | `var(--pp-accent)`, `-hover`, `-press` | `components/buttons.css` |
| `… .t-Button--simple` (`--a-button-border-color`, `--a-button-text-color`) | `var(--pp-accent)`, `var(--pp-accent-text)` | `components/buttons.css` |
| `… .t-Button--link` / `… .t-Button--noUI` (Text, `color`) | `var(--pp-accent-text)` | `components/buttons.css` |
| `.t-Button--hot .fa:after, .t-Button--simple.t-Button--hot:hover .fa:after` | `var(--pp-accent)` | `components/buttons.css` |
| `.t-TreeNav--styleB … .is-current--top` (+ Hover `#056dcd !important`) | transparent / `var(--pp-frame-hover) !important` | `components/shell.css` |

Laufzeit-Audit (`audit-blue.mjs`, §6): **0 Treffer** auf 44 Seiten (Sets core, regions, forms, reports, dialogs) in hell und dunkel inkl. erzwungenem `:hover`/`:focus-visible` auf je bis zu 150 Bedienelementen, 0 Treffer mit geöffneten Menüs/Date Picker/Popup-LOV/Dialogen, 0 Treffer in App 9242 (UT 24.2) und im Auto-Style (dunkel).

### 4.2 Fokus-Hooks

| Hook | Wert | Wirkung |
|---|---|---|
| `--ut-focus-outline-color` | `var(--pp-focus-ring-color)` | `* { outline-color }` in UT Core |
| `--ut-focus-outline` | `var(--pp-focus-outline)` = `2px solid <Ring>` | `*:focus` in UT Core, `:focus-visible` in base.css |
| `--ut-focus-outline-offset` | `var(--pp-focus-ring-offset)` = `2px` | dito |
| `--a-combo-select-focus-outline(-color)`, `--a-combo-select-item-focus-outline-color` | Ring | Combobox |
| `--a-gv-focus-outline` / `-offset` | Ring, `-2px` | IR-Icon-Ansicht, Zellen |
| `--a-cv-focus-outline` / `-offset` | Ring, `2px` | Card-Volllink |
| `--a-checkbox-outline-color`, `--a-chat-transcript-outline-color`, `--oj-core-focus-border-color` | Ring | Checkbox, Chat, JET |
| `--a-treeview-node-focused-shadow` | `var(--pp-focus-shadow-inset)` | Tree-Knoten |
| `--pp-focus-gap`, `--pp-focus-shadow`, `--pp-focus-shadow-inset` auf `.a-Menu`, `.ui-dialog`, `.a-IRR-sortWidget`, `.t-Dialog-page`, `.t-Drawer-page` | neu aufgelöst mit `--pp-ground: var(--pp-surface-raised)` | Lücke des Doppelrings = Dialogfläche statt Leinwand (bridge §18, §3.6) |

### 4.3 Dichte-Hebel

| Hebel | Formel | Desktop | Touch |
|---|---|---:|---:|
| `--a-button-padding-y` | `var(--pp-control-pad-y)` = `(control-h − control-lh) / 2` (inkl. 1 px Rand) | 6 px → 32 px | 10 px → 40 px |
| `--a-field-input-padding-y` | dito | 32 px | 40 px |
| `--ut-pillbutton-padding-y` | dito | 32 px | 40 px |
| `--a-gv-cell-height` / `--a-gv-cell-padding-y` | `var(--pp-row-h)` / `(row-h − row-lh − 1px) / 2` | 34 px | 40 px |
| `--a-gv-header-cell-height` | `var(--pp-head-h)` | 36 px | 40 px |
| `--ut-report-cell-padding-y` | `var(--pp-row-pad-y)` | 34 px | 40 px |
| `--ut-report-header-cell-padding-y` | `(head-h − lh-xs − head-rule-width) / 2` | 36 px | 40 px |
| `--a-checkbox-size` | `var(--pp-checkbox-size)` | 18 px | 20 px |

Lokale UT-Überschreibungen, die diese Werte wieder aufheben, müssen die Komponenten neu deklarieren (z. B. UT Core `.a-IRR { --a-gv-cell-padding-y: .5rem }`, `.t-Form--large`, `.t-Button--small|large`, Floating Labels).

### 4.4 Gestaltungsentscheidungen in der Brücke (Stand nach der Komponenten-Phase)

| Thema | Hebel | Wert | Warum |
|---|---|---|---|
| Palette | `--ut-palette-primary*` | `--pp-accent` / `-on` / `-tint` / `-text` | Primär = Kartenmagenta |
| | `--ut-palette-primary-alt*` (`t-Button--primary`) | `--pp-accent-tint-2`, Schrift `--pp-ink` | zweite Stufe als Tönung, nicht als zweite volle Magenta-Fläche |
| | `--ut-palette-info*` | Petrol (`--pp-info*`) | kein APEX-Blau |
| | `--ut-palette-generic*` | `--pp-soft` / `--pp-surface-sunken` / `--pp-ink` | neutral = Stück Rahmen |
| Checked-Controls | `--a-checkbox-checked-background-color`, `--a-switch-checked(-hover)-background-color`, `--a-starrating-stars-fg-color` | `--pp-accent-text` | Marke ohne Schrift: dunkel ≥ 3 : 1 (die Fläche `--pp-accent` hätte 2,72) |
| Prozentbalken | `--a-percent-chart-bar-background-color` / `-text-color`, Spur `--a-percent-chart-background-color` | `--pp-cat-1` / `--pp-cat-1-on`, Spur `--pp-soft` | Daten statt Aktion: Kategoriefarbe, nie Magenta (Items: forms.css, Reports: reports.css) |
| Hover schwebend | `--a-menu-focused-background-color`, `--a-datepicker-calendar-day-hover-background-color` | `--pp-raised-hover` | dunkel sichtbar (1,22 statt 1,13 : 1 mit `--pp-soft`); zieht IconList-, Popup-LOV-Link-, JET- und CKEditor-Hover mit, hell unverändert |
| Pagination aktiv | `--a-gv-pagination-button-selected-background-color` / `-text-color` | `--pp-soft` / `--pp-ink` | aktive Seite = Stück Rahmen, wie der aktive Tab |
| Tabs aktiv | `--ut-tabs-item-active-background-color`, `-highlight-color` | `--pp-soft`, `transparent` | Stück Rahmen; die Magenta-Marke (`--pp-accent-text`) zeichnet shell.css |
| Tabellenkopf | `--a-gv-header-background-color`, `--ut-report-header(-cell)-background-color`, `--a-gv-header-text-color` | `--pp-surface` (kein Band), `--pp-ink` | offene Tabelle: Kopf in Tusche auf der Fläche des Umfelds, darunter die Grundlinie `--pp-head-rule` (reports.css) |
| Zähler | `--ut-navbar-button-badge-*`, `--a-button-count-*`, `--ut-treeview-badge-*` | `--pp-ink` / `--pp-surface` | Zähler sind Information, keine Aktion |
| Seitentitel | `--ut-breadcrumb-title-font-size` / `-line-height` | `--pp-fs-2xl` / `--pp-lh-2xl` (28/34) | Skala |
| Code | `--prism-*` (§17) | `--pp-code-*`, `--pp-muted`, `--pp-ink(-2)`, `--pp-danger-text` | statt VS-Code-Paletten (Violett, Navy, Rot; dunkel Schlüsselwörter #C586C0 neben dem Akzent-Text, Kommentar 4,2 : 1) |
| Markdown | `--a-md-h1…h6-font-size` / `-line-height`, `--a-md-blockquote-*` | 20/28 · 16/24 · 14/20 · 13/20 · 12/16 · 12/16, Zitat 16/24 | app_ui: 40/32/28/24/20/16 px, Zitat 18 px – eine #-Überschrift im Feld wäre größer als der Seitentitel |
| Markdown-Editor | `--a-mdeditor-padding` | `--pp-control-pad-y` `--pp-control-pad-x` | Vorschau-Text steht wie im Feld (app_ui: 8 px rundum) |

---

## 5. Regeln für Komponenten-Dateien

### 5.1 Nur Tokens, modusneutral

- Farben ausschließlich über `var(--pp-*)` oder über UT/APEX-Tokens, deren Wert die Brücke setzt (`var(--a-field-input-border-color)` ist erlaubt, weil die Brücke ihn auf `--pp-edge` legt). Oracle-Tokens, die die Brücke **nicht** setzt, nicht lesen (Versions-Drift, z. B. `--a-field-input-border-style` ist in 24.2 `dashed`).
- Keine Regel darf vom Modus abhängen. Braucht eine Komponente im Dunkeln einen anderen Wert, fehlt ein Token → im Fundament anfragen/anlegen (in `light.css` **und** `dark.css`).
- Halbtransparente Überlagerungen (`--pp-frame-hover`, `--pp-scrollbar-thumb`) sind Token-Werte, keine Regel-Werte.
- **Grund und Hover schwebender Ebenen (§3.6):** Was in der Farbe des Grundes gezeichnet wird (Aussparungen, Mitte eines Ring-Markers), nimmt `--pp-ground`, nicht `--pp-surface`. Das Fundament setzt ihn in Menüs, Dialogen und Popups auf die schwebende Fläche. Hover und Tastatur-Auswahl **auf schwebenden Flächen** nehmen `--pp-raised-hover`. `--pp-hover` und `--pp-soft` sind dort im Dunkeln kaum sichtbar (1,02 / 1,13 : 1).
- Werte, die der Browser selbst färbt (native Scrollbars, Date-Inputs, Checkboxen ohne UT-Template), folgen `--ut-color-scheme` → nichts tun.

### 5.2 Vita-Selektoren mit gleicher Spezifität neu deklarieren

Vita setzt viele Werte lokal auf Komponenten-Selektoren (Button-Varianten, `t-CardsRegion--styleA|B|C`, `t-Form--large`, `t-TreeNav--styleA|B`, `.a-IRR-header`, IG-Zellen). Dort wirkt kein `:root`-Wert. Vorgehen:
1. Selektor in `_reference/ut-26.1/css/Vita.css` (und `Vita-Dark.css`) suchen, **identische Selektorliste** übernehmen.
2. Nur die betroffenen Deklarationen neu setzen – mit Tokens.
3. Die 38 Regeln des Dunkel-Deltas (`_shared/ut-dark-delta.css`) zeigen, welche Vita-Selektoren hart codierte Farben tragen (Status-Buttons inkl. `--simple/--link/--noUI` und `.fa:after`, 12 `.a-IG-controls-item--*`-Typen, IG-Zellen, `.a-IRR-header*`, `.a-GV-controlBreakHeader`, `.a-IG-button--controls`, `.t-CardsRegion--style*`). Jede davon muss in der zuständigen Komponenten-Datei neu deklariert sein.

### 5.3 `!important`

Nur, um ein **fremdes** `!important` zu schlagen, also aus Vita, UT Core oder app_ui (`Theme-Standard.css`/`Core.css`). Dann mit gleichem Selektor bzw. gleicher Spezifität + `!important` und einem Kommentar, der die Quelle nennt (`/* gegen UT-Core-!important */`). Nie, um eigene Regeln untereinander zu ordnen. `node _tools/lint.mjs` zählt die Vorkommen je Datei als Hinweis.

| Quelle | Deklaration | Gegenregel in |
|---|---|---|
| Vita | `Vita.css:3026 .t-TreeNav .a-TreeView-node--topLevel .a-TreeView-row.is-hover { background-color: #25292d !important }` | shell.css (Hover und die Lasche `is-current--top`, die sonst beim Überfahren den Vita-Hover bekäme) |
| Vita | `Vita.css:3123/3126 .t-TreeNav--styleB … .is-current--top.is-hover { color: white / background-color: #056dcd !important }` | shell.css |
| Vita | `Vita.css:3412` (Workflow-Diagramm, Position) | – (Geometrie, nicht angefasst) |
| UT Core | Drawer-Geometrie (`.t-Drawer…`/`.ui-dialog--drawer` Größen, Inset, Radius mit `!important`) | overlays.css (Schublade als schwebende Leinwand) |
| UT Core | `apex-core-font` an den Pflicht-Sternchen (`:after`) | forms.css (`font-family: inherit !important`) |
| UT Core | `.u-color-N { --u-color: … !important }` | nur mit `!important` am selben Element übersteuerbar (utilities.css) |
| app_ui | `.a-IRR-dialogList a` Textfarbe/Hover | reports.css |
| app_ui | Farbwähler im IR-Filter (2 px Abstand), `.a-Customize-button.a-Button--hot:active` (Oracle-Blau), `.fc .fc-helper` (FullCalendar-Auswahl `#0572CE`) | reports.css, buttons.css, viz.css |

Stand 2026-09 (Zählung `lint.mjs`, ohne Kommentare): overlays 16, shell 8, viz 3, forms 2, reports 2, buttons 1. Jedes davon richtet sich gegen eine der Quellen oben.

### 5.4 Lokale Komponenten-Tokens

- Name: **`--pp-c-<komponente>-<name>`** (z. B. `--pp-c-nav-inset`, `--pp-c-tab-r`, `--pp-c-field-icon-size`). Das Präfix `--pp-c-` ist für lokale Tokens reserviert; globale Tokens beginnen nie damit.
- Deklaration auf dem **Wurzel-Selektor der Komponente** (`.t-TreeNav`, `.a-IRR`, `.t-Form-fieldContainer`), nie auf `:root`.
- Werte nur aus globalen Tokens oder Längen (`--pp-c-nav-inset: var(--pp-space-2)`), Farben immer als `var(--pp-*)`.
- Ein lokaler Token, den eine zweite Komponente braucht, wird global → Fundament.
- Bestand erledigt: `shell.css` nutzt `--pp-tab-r`/`--pp-nav-inset` nicht mehr (die Duldung in `_tools/lint.mjs` kann entfallen).

### 5.5 Fokus-Konventionen (ein System)

- Ring = `--pp-focus-ring-color`, 2 px (`--pp-focus-ring-width`), 2 px Abstand (`--pp-focus-ring-offset`) – auf Leinwand **und** Rahmen, hell und dunkel ≥ 3 : 1 (Tabelle §3.5). Der Abstand zeigt den Grund als Innenring (Doppelring Grund/Magenta; Grund = Leinwand, in Menüs/Dialogen/Popups die schwebende Fläche, §3.6), auch auf der Magenta-Fläche des Primär-Buttons. Die Schatten-Varianten `--pp-focus-shadow(-inset)` zeichnen die Lücke in `--pp-focus-gap` = `--pp-ground`.
- Global erledigt: `base.css` zeichnet `:focus-visible` mit den Hooks, entfernt den Ring bei Maus-Fokus (`:focus:not(:focus-visible)`) und lässt `tabindex="-1"` aus (wie UT). Der Tastatur-Ring (`:focus-visible:not([tabindex="-1"])`) hat bewusst Spezifität **0,2,0** und schlägt damit auch Oracle-Regeln, die den Umriss unterdrücken – nötig, weil `a.t-ContentRow-wrap` und `.a-CardView-titleLink` (wenn nicht `tabindex="-1"`) bei Oracle sonst **gar keinen** Fokus-Hinweis haben. Kehrseite: Wo Oracle den Fokus anders zeigt, entsteht ein **Doppelring**, den die Komponente lokal mit `--ut-focus-outline: none` am betroffenen Element wegnimmt (gemessen, `_tmp/pp-check/focus-before`): `.a-TreeView-label` in der Tree-Navigation **und** in Tree-Regionen (1901; Fokus zeigt der Zeilen-Schatten `--a-treeview-node-focused-shadow`) → shell.css / viz.css; `.a-FS .apex-item-option` (UT zeichnet den Ring am Kästchen `label::before` mit demselben Hook – dort den Hook wieder auf `var(--pp-focus-outline)` setzen) → search.css; `.a-IRR-dialogList a` (app_ui: 1-px-Innenkante) → reports.css.
- **Komponenten ändern den Ring nur über die Hooks** auf ihrem Selektor:
  - abgeschnittener Kontext (`overflow` hidden/clip, Tabs, Grid-Zellen, Listen in Scroll-Containern): `--ut-focus-outline-offset: calc(-1 * var(--pp-focus-ring-width))` (Ring nach innen) oder `box-shadow: var(--pp-focus-shadow-inset)` mit `--ut-focus-outline: none`;
  - freistehend, aber `outline` wird verdeckt: `box-shadow: var(--pp-focus-shadow)`;
  - **Felder:** `border-color: var(--pp-focus-ring-color)` + `box-shadow: var(--pp-focus-field-shadow)` (= 2 px Ring ohne Layoutsprung), `--ut-focus-outline: none` im Feld-Kontext; der weiche Halo `--pp-accent-ring` (20–32 % Deckkraft, < 3 : 1) darf nur **zusätzlich** erscheinen.
  - Checkbox/Radio/Switch: Ring am sichtbaren Kästchen (`label::before` bzw. `.a-Switch-toggle`), nicht am versteckten `input`.
  - **Ring-Raum in Scroll-Containern mit bündigem Inhalt:** Ein Körper mit `overflow: auto` schneidet den äußeren Ring (Abstand + Breite = 4 px) seitlich ab, wenn der Inhalt bündig am Rand steht. regions.css gibt deshalb dem Körper von Body Overflow „Scroll“ (`t-Region--scrollBody`, `--shadowScroll`) Ring-Raum als seitliches Polster und nimmt ihn mit negativer Marge zurück (lokaler Token `--pp-c-region-ring-room` = `--pp-focus-ring-offset` + `--pp-focus-ring-width`, sonst `0px`). Der Inhalt bleibt bündig und der Ring passt in den Clip. Jeder Körper setzt den Token neu, damit verschachtelte Regionen ihn nicht erben. Carousel-Folien sind ausgenommen, weil die Region selbst abschneidet. Andere Komponenten mit eigenem Scroll-Container nehmen dasselbe Muster oder den Innenring.
  - **Roving-Tabindex-Listen zeichnen den Ring selbst:** In Widgets mit Pfeiltasten-Navigation tragen die erreichten Einträge `tabindex="-1"` (Facetten-Optionen, Knöpfe ‹ › im Date Picker, Icon-Listen, Tree, Grid-Zellen, Menüeinträge). base.css lässt sie wie UT aus, weil `:focus-visible:not([tabindex="-1"])` sie nicht trifft, und app_ui setzt dort oft `outline: none`. Ohne eigene Regel hätten sie **keinen** Fokus-Hinweis. Die Komponente setzt den Ring deshalb am Eintrag mit den Hooks (`outline: var(--ut-focus-outline); outline-offset: var(--ut-focus-outline-offset)`) oder als Innenring am `.is-focused`-Element (Beispiele: search.css Facetten-Popup, forms.css `.a-DatePicker-nav`, reports.css Zellen, overlays.css Menüs).
- Global erledigt (base.css): **Visuell versteckte Formular-Eingaben** (`input|select|textarea` mit `.u-vh`/`.u-VisuallyHidden`/`.visuallyhidden`) zeichnen keinen eigenen Ring (0,2,1). Ohne diese Regel entstand am 0×0-Input des Star Rating (`input.u-vh.is-focusable`) ein 4-px-Magenta-Kästchen neben dem richtigen Ring und am 1×1-Datei-Input ein Punkt. Den Fokus zeigt der sichtbare Stellvertreter: `.a-StarRating-stars.is-focused` (UT Core, Hook `--ut-focus-outline`) bzw. die FileDrop-Fläche. Versteckte **Links/Buttons** (Sprunglinks `.is-focusable`, die beim Fokus sichtbar werden) behalten den Ring.
- Nie `outline: none` ohne gleichwertigen Ersatz; nie Magenta-Fläche `--pp-accent` als Ringfarbe (im Dunkeln nur 2,7 : 1 gegen die Leinwand).

### 5.6 Dichte-Konventionen

- Höhen entstehen aus Polster + Zeilenhöhe (app_ui-Konvention: Polster enthält den 1-px-Rand). Eigene Elemente: `min-block-size: var(--pp-control-h)` bzw. `var(--pp-row-h)`; keine festen px-Höhen.
- Controls 32 px, Tabellenzeilen 34 px, Tabellenköpfe 36 px; unter `pointer: coarse` automatisch 40 px. Nichts selbst mit `@media (pointer: coarse)` nachbauen – außer für Dinge ohne Token (dann Werte aus `--pp-hit-min`).
- Trefferflächen kleiner Icon-Buttons ≥ `--pp-hit-min` (24 px Desktop, 40 px Touch).
- Kleine/große Varianten: `--pp-control-h-sm` (24 px) / `--pp-control-h-lg` (40 px).

### 5.7 Typografie

- Nur die Skala: `--pp-fs-xs|head|sm|md|lg|xl|2xl` mit passender `--pp-lh-*`, Gewichte `--pp-fw-*`, Laufweite `--pp-tracking-*`. Hilfsklassen `.pp-text-*` in `base.css`.
- **Rohe Überschriften** (Static Content, Rich Text, Hilfe) setzt base.css auf die Skala: `h1` 28/34 (`--pp-fs-2xl`, Laufweite `--pp-tracking-title`) · `h2` 20/28 · `h3` 16/24 · `h4` 14/20 · `h5` 13/20 · `h6` 12/16. UT Core hätte 32/24/20/16/14/12 px mit Zeilenhöhe 1,5. Dann wäre ein `h3` so groß wie der Abschnittstitel (Content Block `h2`, 20/28) und ein `h1` größer als der Seitentitel. Komponenten-Titel (`.t-*-title`, `.a-*-title`) setzen ihre Größe über Klassen/Tokens und bleiben davon unberührt. Ein Titel, der sich auf die Element-Größe verlässt (z. B. `.t-CardsRegion-title`), bekommt jetzt die Skala.
- **Markdown** (`.is-markdownified`, Vorschau des Markdown-Editors): Überschriften über `--a-md-h*` 20/28 · 16/24 · 14/20 · 13/20 · 12/16 · 12/16, Zitat 16/24 (bridge §17). Der Chat setzt lokal eigene Werte (UT).
- **Code:** Monospace `--pp-font-mono`, Syntaxfarben nur über `--prism-*` (bridge §17 → `--pp-code-*`). `pre` scrollt waagerecht in seinem Kasten (`overflow-x: auto`, base.css) statt über Rahmen und Leinwandkante zu laufen.
- Tabellenköpfe: `font-size: var(--pp-fs-head)`, `font-weight: var(--pp-fw-semibold)`, Farbe **Tusche** `--pp-ink` (reports.css `--pp-c-table-head-text`; vorher Graphit, das neben den Zellen in Tusche zu schwach war), **kein Kopfband** (Fläche = Umfeld), **keine Versalien**, bei engen Spalten `font-stretch: var(--pp-stretch-narrow)` (echte wdth-Achse 75–100 %; gemessen: 87,5 % spart ~14 %, 75 % ~26 % Breite bei 13 px/600). Grundlinie `border-block-end: var(--pp-head-rule-width) solid var(--pp-head-rule)`.
- Zahlen in Spalten: `font-variant-numeric: tabular-nums` ist global für Tabellen, Grids, Badges, Pagination, Date Picker, Zahlenfelder gesetzt; für weitere Stellen `.u-tabular-nums` oder die Eigenschaft direkt.
- Keine Monospace-Schrift für UI-Beschriftungen, keine ALL-CAPS-Labels.
- **Labels immer linksbündig** (`.t-Form-labelContainer { text-align: start }`, forms.css). Die Template-Option „Label Alignment: Right“ ist in UT der Standard ohne eigene Klasse. Sie entfällt damit bewusst und wirkt nicht mehr (§7).

### 5.8 Links, Akzent, Status

- `base.css` stylt nur **Links ohne Klasse** (`a:not([class])`): Tusche, Unterstrich `--pp-link-underline`, Hover-Unterstrich `--pp-link-underline-hover` (Akzent). Komponenten-Links (mit Klasse) bleiben unberührt; zeigt eine Komponente Fließtext-Links mit Klasse, dieselben Link-Tokens verwenden.
- Magenta nur: Primär-Button, Checked/Selected, Fokus, Lasche/Marke, heute im Kalender. Sekundär = `--pp-soft` („Stück Rahmen“), aktiver Tab und aktive Pagination-Seite = `--pp-soft` + Magenta-Marke.
- **Welcher Magenta-Token?**
  - `--pp-accent` (+ `-hover`/`-press`, Schrift `--pp-accent-on`): nur Flächen **mit Schrift darauf**, also Primär-Button und gewählter Tag im Date Picker.
  - `--pp-accent-text`: alles, was als **Marke im Vordergrund** erkennbar sein muss. Das sind Text und Icons, Lasche/Nav-Marke, der Strich am aktiven Tab, der aktuelle Wizard-Schritt, Checkbox/Radio checked, die Switch-Spur, die Sterne und die Metric-Card-Kante. Grund: dunkel 5,5 : 1 gegen die Leinwand, die Fläche `--pp-accent` hätte dort nur 2,72 : 1 (WCAG 1.4.11).
  - `--pp-accent-tint`/`-tint-2`: gewählte Zeilen und Menüeinträge, `::selection`, `t-Button--primary`.
- **Zähler** (Navbar-Badge, Button-Zähler `[data-count]`/`.t-Button-badge`, Tree-Nav-Badge) in Tusche: `--pp-ink` mit Schrift `--pp-surface`. **Daten** (Prozentbalken, Charts, Avatare) in Kategoriefarben `--pp-cat-*`, nie im Akzent.
- **Farbpaare immer zusammen setzen (Icon-Kacheln):** Wo UT Fläche und Schrift als zwei Tokens trennt, setzt die Komponente beide am Element. Das gilt für die Icon-Kacheln von Media List (`--ut-medialist-icon-background-color` / `-color`), Timeline (`--ut-timeline-icon-*`) und Comments (`--ut-comment-icon-*`), jeweils `--pp-soft` + `--pp-ink` (content.css). Setzt eine App per `:root` nur die Fläche (Vita-Gewohnheit: farbige Kachel mit weißem Symbol), stünde sonst Tusche auf der Kategoriefläche, z. B. `--u-color-15` dunkel 2,55 : 1. Farbige Kacheln entstehen über `u-color-N`/`u-colors`, die Fläche **und** Kontrastschrift setzen, oder app-seitig als Paar auf demselben Selektor.
- Status: Fläche `--pp-<s>` + Schrift `--pp-<s>-on`; Text auf Leinwand `--pp-<s>-text`; Meldungs-/Alert-Hintergrund `--pp-<s>-tint` mit Text `--pp-ink` oder `--pp-<s>-text`. Warnung nie in Danger-Farbe, Danger nie in Magenta. Statusfarben nur mit Bedeutung, nie als Dekoration (Syntaxfarben haben deshalb eigene `--pp-code-*`-Tokens).
- **Empfehlung Freigeben/Ablehnen:** Hot (Freigeben) neben Danger **`--simple`** (Ablehnen, Rand + Text), nicht zwei gesättigte Flächen nebeneinander (hell Beere neben Orange-Rot, ΔE00 33). Zwei volle Flächen bleiben möglich, sind aber die lautere Variante. Die Hierarchie trägt dann nur das Gewicht (Hot semibold, Danger medium) und dunkel zusätzlich die Helligkeit.
- Pflichtfeld: `content: var(--pp-required-mark)` (Sternchen in Textschrift), `color: var(--pp-required-color)`, Abstand `var(--pp-required-gap)`.

### 5.9 RTL und Responsivität

- Logische Eigenschaften und Werte (`inset-inline-start`, `padding-inline`, `border-start-end-radius`, `text-align: start`). Wo UT physisch setzt (`left`, `margin-left`), physisch überschreiben **und** `.u-RTL`-Variante liefern.
- Breakpoints wie UT: 480 / 640 / 768 / 992 / 1200 / 1400 px (`--js-mq-*`, nur lesen). Rahmen und Leinwand-Innenabstand werden unter 640 px über Tokens schmal – nicht in Komponenten nachbauen.
- **Lese-Hebel `--js-sticky-top`:** theme42.js misst `#t_Header` (bei Top-Navigation samt Menüleiste) und schreibt die Höhe als Inline-Style an `<html>`. Gemessen wird nur bei Page-Init und bei `apexwindowresized` (`_docs/ut-shell.md`). Eigene sticky oder fixierte Elemente unter dem Kopf lesen ihn **immer mit Fallback**: `top: var(--js-sticky-top, 0px)` (shell.css: Leinwand-Ecken, mobile Schublade und rechte Spalte). Vor `js-ready` fehlt der Wert. Wo 0 px unter den Kopf rutschen ließe, gilt mindestens die statische Kopfhöhe: `max(var(--js-sticky-top, 0px), var(--pp-header-h))` (overlays.css `t-Alert--page`). Nie setzen (Regel 11).

### 5.10 Tabu

`@layer`; IDs in Selektoren; `:not()`-Ketten zur Spezifitätssteigerung; `!important` außer §5.3; Header `display:none`/`position:fixed`; `--js-*` setzen; Bitmap-Texturen; Oracle Sans/Redwood-Paletten; Vita-Werte kopieren; JavaScript; Farbwerte in Komponenten; `prefers-color-scheme` außerhalb von `passepartout-auto.css`; eine Datei zweimal importieren.

---

## 6. Test-Rezepte

Alle Befehle im Projektordner `Oracle_Apex_Custom_Themes`.

| Zweck | Befehl | Erwartung |
|---|---|---|
| Build | `node _tools/build.mjs Passepartout` | fehlerfrei, 3 Bundles + Schriften + Installer |
| Vertrag/Lint | `node _tools/lint.mjs Passepartout` | „OK – keine Fehler“ (Hinweise prüfen) |
| Token-Kontraste, Palette | `node Passepartout/tools/check-tokens.mjs [--table]` | „OK – alle Prüfungen bestanden“ |
| Screenshots | `node _tools/shoot.mjs --theme Passepartout --style light,dark --pages core --out _tmp/<ordner>` | ansehen (Read) |
| Nav aufgeklappt | `… --pages 1101 --click "#t_Button_navControl" --tag navopen` | Lasche mit konkaven Ecken |
| Mobil / Touch | `… --mobile` (390×844, `pointer: coarse` → 40 px) | Rahmen 4 px, Innenabstand 12 px |
| Auto-Äquivalenz | `VERIFY_OUT=_tmp/<ordner> bash _tools/verify-auto.sh [seiten] [app]` | alle `GLEICH 0 px` (Schwelle 0) |
| UT 24.2 | `… verify-auto.sh [seiten] 9242`, Screenshots mit `--app 9242` | `GLEICH`; Ausnahme 1601 s. §7 |
| Oracle-Blau | `node _tools/audit-blue.mjs [--pages …] [--styles light,dark] [--states] [--overlays] [--app 9242]` | 0 Treffer |
| Laufzeit-Audit | `node _tools/audit.mjs --theme Passepartout --style light,dark --pages <liste> --out <ordner> [--mobile] [--app 9242]` | kein Blau, kein Kontrast unter AA, kein Überlauf |
| Fokus | eigenes Skript mit `launchLab` aus `_tools/lib/lab.mjs`: einmal `Tab` drücken (Tastatur-Modalität), dann `el.focus()`, Ausschnitt fotografieren | Ring sichtbar, genau einer |
| Berechnete Werte | `node _tools/shoot.mjs … --computed ".sel:prop1,prop2" --no-shot` | |
| Pixel-Vergleich | `node _tools/pixel-diff.mjs --dir-a A --dir-b B [--threshold 0]` | |
| Kontaktbogen | `node _tools/contact-sheet.mjs --out x.png --cols 2 --dir <ordner> --match <text>` | |
| Doku neu erzeugen | `node Passepartout/tools/build-architecture.mjs` | Tabellen = Quellen |

Seiten-Sets (`_tools/testbed-pages.json`): core, shell, regions, lists, reports, components, forms, dialogs, misc. Jede Komponenten-Änderung: eigenes Set hell + dunkel fotografieren und ansehen, `verify-auto.sh` auf den betroffenen Seiten, `lint.mjs`, Build.

---

## 7. Bekannte Grenzen und offene Punkte

- **Nicht-deterministische Bildpixel:** Auf Seite 3110 weichen bei `verify-auto.sh` ausschließlich die Pixel **innerhalb der Kartenfotos** ab (Bereich x 45–935, y 511–756; max. ±12 je Kanal, je nach Last 39 bis ~100 000 px) – ebenso zwischen zwei Läufen *desselben* Styles (Bildskalierung/-dekodierung). Alle übrigen Pixel sind gleich; in einzelnen Läufen ist Auto mit Dark bzw. Light vollständig pixelgleich. Wer 3110 prüft, maskiert die Fotos oder wiederholt den Lauf ohne parallele Last.
- **9242 vs. 9042, Seite 1601:** Die Single-Checkbox steht im Testbett 9242 in der Feldspalte, in 9042 in der Label-Spalte – auch ohne Theme (Seiteninhalt/Template der Testbetten), kein Theme-Unterschied. 1201/1500 hell+dunkel pixelgleich.
- **Reparierte Dateiköpfe:** Beim Umstrukturieren hatten acht Komponenten-Dateien einen kaputten Kommentarkopf; ihre jeweils **erste Regel wurde verworfen** (Login-Tokens, Region-Titel, Button-Laufweite, Feldfokus-Container, Menü-Trenner, Report-/Badge-Tabellenziffern, Card-Titel). Seit der Reparatur greifen diese Regeln – Login (1114, 9999) und die genannten Stellen bitte optisch prüfen.
- **Body-Schriftgröße:** `--ut-base-font-size` ist 14 px (Vita 16 px). Unformatierter Text erbt 14 px.
- **Live-Umschaltung im Auto-Style:** JET-Charts behalten bis zum Neu-Rendern ihre SVG-Textfarben (UT-Grenze, braucht JS).
- **Druck:** hell, ohne Rahmen/Schatten; Vita-Dark-Werte, die die Brücke nicht setzt (Chat, Diagramm), bleiben im Druck des Dark-Styles dunkel (Hintergründe druckt der Browser standardmäßig nicht). Code-Farben (Prism) folgen seit bridge §17 den Tokens und drucken hell.
- **Überschriften mit Icon im Demo-Inhalt:** Auf 401 steht vor jedem `h3` ein `fa-lg`-Icon mit `vertical-align: top` (Seiteninhalt). An der kleineren Zeile (16/24 statt 20/30) sitzt der Kreis etwa 4 px tiefer als die Schrift. Das ist eine Eigenheit des Demo-Markups, kein Theme-Fehler.
- **Markdown im Chat:** UT Core setzt für `.a-ChatClient .is-markdownified` lokal 20/18/16/14/13/12 px mit Zeilenhöhe 1. 18 px liegt außerhalb der Skala; das bleibt der Chat-Komponente überlassen.
- **Scrollbars:** `scrollbar-color` (vererbt) + `scrollbar-width: thin` für innere Container; die Seiten-Scrollbar bleibt normal breit (Bedienbarkeit).
- **Bewusst entfallene Template-Option „Label Alignment: Right“:** UT setzt Labels standardmäßig rechtsbündig, ohne eigene Klasse. Passepartout stellt sie immer linksbündig (forms.css, §5.7). Die Option lässt sich nicht von „nicht gesetzt“ unterscheiden und entfällt damit.
- **Grundfläche schwebender Ebenen (Fix-Runde 2, §3.6):** Das Fundament ist fertig: `--pp-ground`, `--pp-raised-hover`, bridge §18 (Fokus-Lücke in Menüs, Dialogen und Popups = Dialogfläche) sowie der Menü- und Date-Picker-Hover. Offen in den Komponenten: content.css `.t-WizardSteps { --ut-wp-active-background-color: var(--pp-ground) }`, damit die Mitte des aktiven Schritts im Modal-Wizard 1920–1922 keinen dunklen Punkt mehr zeigt. Außerdem sollen Hover-Flächen **in** schwebenden Ebenen `--pp-raised-hover` statt `--pp-soft`/`--pp-hover` nehmen: viz.css Kartensteuerung und Popup-Schließen, overlays.css Dialog-Schließen, forms.css Combobox-Liste und Popup-Knöpfe, reports.css Dialoglisten, Icon-Listen und Sortier-Widget.
- **Unabhängige Prüfung (2026-09-23, Belege `_tmp/pp-check/`)** – offen für die Komponenten:
  - *Layoutsprung (shell.css):* Die Leinwand springt beim Laden um 12 px nach rechts (CLS 0,008–0,015 je Seite, Basis-Vita 0,0001), weil der linke Rahmen erst mit den JS-Klassen `.js-navCollapsed.js-navCollapsed--hidden` kommt (shell.css `.apex-side-nav.js-navCollapsed.js-navCollapsed--hidden .t-Body-main`). Den Zustand vor `js-ready` gleich behandeln.
  - *Oracle-Blau in Zuständen, die kein Audit erreicht (app_ui hart codiert):* erledigt. Das betrifft `.a-IRR-singleRow-link:focus-visible` (reports.css), `.fc .fc-helper` (viz.css), `.a-Customize-button.a-Button--hot` (buttons.css) und `.a-IG-dialog-input-checkbox:focus + .a-IG-dialog-label-checkbox` (Theme-Standard `#4696fc` mit blauem Halo schon bei Maus-Fokus). Letzteres ist in reports.css neutralisiert: Kante `--pp-edge`, kein Halo; den Ring `--pp-focus-shadow` gibt es nur bei `:focus-visible`, die Auswahlkante bei `:checked`.
  - *Chart-Serie 1 dunkel:* erledigt. `--pp-cat-1` dunkel `#1C91A0` (ΔE00 15,2 zu `#309FDB`), `--pp-info` dunkel `#68B4B8`; `#309FDB` steht jetzt in den Referenzlisten von `audit-blue.mjs` und `check-tokens.mjs`.
  - *Tabellenköpfe:* gemessen 35,5 px (Classic Report) bzw. 36,5 px (IR) statt 36 px – Halbpixel aus `border-collapse`; nach Umsetzung der Kopf-Grundlinie nachmessen.
  - *Auto dunkel vs. Dark:* 11 Vita-Dark-Variablen (Chat, FullCalendar, Diagramm) unterscheiden sich nur in der Schreibweise (`hsla(0,0%,100%,.25)` gegen `#ffffff40` aus dem gebündelten Delta, Alpha 0,250 vs. 0,251); gemessen ohne Folgen (0 px auch auf 1800 Kalender und 1405 Kommentare). In 9242 setzt das 26.1-Delta zusätzlich drei Diagramm-Variablen, die 24.2 nicht kennt (wirkungslos).
