# Passepartout — Theme-Konzept (Schlüssel `canvas`, Richtung A „räumlich / Leinwand“)

## Name

**Passepartout.** Ein Wort, im Deutschen geläufig (das Karton-Passepartout um ein gerahmtes Bild), mit
Doppelsinn: *passe-partout* heißt „passt überall“ – genau das Versprechen „plug and play“ für jede APEX-App.

## Leitidee

Die Anwendung wird gerahmt wie ein Bild: Kopfzeile und Navigation bilden **ein** ruhiges, kühlgraues
Passepartout, in das die Arbeit als **eine** großzügig gerundete Leinwand eingelegt ist.
Die aktive Seite erkennt man daran, dass die Leinwand in den Rahmen hineingreift – der aktive
Navigationseintrag ist aus der Leinwand ausgeschnitten. Innerhalb der Leinwand ordnen Weißraum,
Typografie und Haarlinien den Inhalt, nicht Kästen.

## Palette

Kühle Neutrals ohne Gelbstich (kein Redwood-Beige) + genau **ein** gesättigter Akzent:
**Kartenmagenta**. Magenta ist die Hervorhebungsfarbe der Luftfahrtkarten, weil es sich von allen
topografischen Farben (Wasserblau, Waldgrün, Straßengelb, Höhenbraun) abhebt – passend für die Geo-Apps
des Teams, und weit weg von APEX-Blau, Linear-Violett und Redwood-Teal. Bewusst dunkler und
blaustichiger als ein reines Magenta, damit es ruhiger wirkt.

### Hell (Basis Vita)

| Name | Hex | Rolle | Kontrast |
|---|---|---|---|
| Passepartout | `#E8EBEF` | Rahmen: Seitengrund, Kopfzeile, Navigation, Sekundär-Buttons, aktiver Tab | Tusche darauf 14.9:1 |
| Leinwand | `#FFFFFF` | Arbeitsfläche, Menüs, Dialoge, aktiver Nav-Eintrag | – |
| Tusche | `#15181C` | Text, Titel, Icons | 17.8:1 auf Leinwand |
| Graphit | `#59616B` | Sekundärtext, Breadcrumb, Tabellenköpfe | 6.3:1 Leinwand / 5.3:1 Rahmen |
| Haarlinie / Feldkante | `#E3E6EA` / `#8A929C` | Trennlinien / Rand von Eingabefeldern | Feldkante 3.15:1 (WCAG 1.4.11) |
| Kartenmagenta | `#B0106E` | Primäraktion, Auswahl, Fokusring, Marke im aktiven Nav-Eintrag | Weiß darauf 6.7:1, als Text 6.7:1 |

### Dunkel (Basis Vita-Dark) — eigenständig gestaltet, nicht invertiert

Im Dunkeln liegt die Leinwand **heller** als der Rahmen (Erhebung = Licht), der Rahmen ist fast schwarz,
Magenta wird als Fläche satter und als Text heller geführt.

| Name | Hex | Rolle | Kontrast |
|---|---|---|---|
| Passepartout | `#0E1013` | Rahmen | Tusche darauf 16.5:1 |
| Leinwand | `#181B1F` | Arbeitsfläche | – |
| Tusche | `#EDEFF2` | Text | 15.0:1 |
| Graphit | `#A0A8B2` | Sekundärtext | 7.2:1 Leinwand / 7.9:1 Rahmen |
| Haarlinie / Feldkante | `#272B31` / `#666E79` | Linien / Feldrand | Feldkante 3.35:1 |
| Kartenmagenta | Fläche `#C72A80`, Text `#F07AB8` | wie hell | Weiß auf Fläche 5.2:1, Text 6.7:1 |

Statusfarben (nur semantisch, nie dekorativ): Erfolg `#1E7F4F`, Warnung Fläche `#E9A21B` / Text `#8F5200`,
Fehler `#C4331C` (orange-rot, klar unterscheidbar vom Magenta), Info Stahlblau `#3C6690`. Dunkel jeweils
aufgehellte Varianten.

## Typografie

**Instrument Sans** (Variable, 400–700, OFL, selbst gehostet, latin + latin-ext) – eine einzige Familie
für alles. Präzise, leicht schmal laufende Grotesk: wirkt zeitgemäß, ist aber in 13-px-Tabellen klar lesbar
und hat echte Tabellenziffern (`tnum`), die in allen Reports/Grids eingeschaltet werden.

| Rolle | Größe / Zeile | Gewicht | Bemerkung |
|---|---|---|---|
| Seitentitel | 28 / 34 px | 600 | Laufweite −0.015em |
| Abschnitt (Content Block h2) | 20 / 28 px | 600 | |
| Region-Titel | 16 / 24 px | 600 | |
| UI / Fließtext / Felder | 14 / 20 px | 400 | Vita: 12 px |
| Labels, Buttons | 13–14 / 18–20 px | 500 | Labels linksbündig |
| Tabellenzellen | 13 / 20 px | 400 | `tabular-nums` |
| Tabellenköpfe | 12.5 / 16 px | 600 | Graphit, **keine** Versalien |
| Klein (Breadcrumb, Hilfe) | 12–13 px | 400–500 | |

Skala: 12 · 13 · 14 · 16 · 20 · 28.

## Layout-Prinzipien

1. **Zwei Flächen, eine Regel.** Rahmen und Leinwand. Was aktiv ist, nimmt die jeweils *andere* Fläche an:
   aktiver Nav-Eintrag (auf dem Rahmen) = Leinwand-Weiß; aktiver Tab und Sekundär-Button (auf der Leinwand) = Rahmen-Grau.
2. **Eine Leinwand.** Radius 18 px, 12 px Luft rechts und unten; links grenzt sie direkt an die Navigation.
   Die untere Kante bleibt beim Scrollen stehen (sticky Kante), die obere Kante hält die sticky Title Bar –
   so wirkt die Leinwand wie ein eingesetztes Fenster, obwohl APEX weiter das Dokument scrollt (JS-kompatibel).
3. **Flache Regionen.** Titel + Haarlinie statt Kasten mit Kopfstreifen; Inhalt bündig auf einem 32-px-Rand.
   Hinweis-Blöcke als leicht abgesenkte Fläche ohne Rahmen.
4. **Maße.** Controls 36 px hoch (Tablets im Außendienst), Radius 8 px; Container (Tabellen, Karten, Menüs,
   Dialoge) 12 px; Leinwand 18 px. Keine Schlagschatten auf der Leinwand – nur schwebende Ebenen (Menüs,
   Dialoge) bekommen Schatten.
5. **Akzent-Disziplin.** Magenta nur für Primäraktion, Auswahl/Checked, Fokusring und die Marke im aktiven
   Nav-Eintrag. Nie als große Fläche, nie für Dekoration.
6. **Mobil (390 px) und Tablet.** Unter 640 px schrumpft der Rahmen auf 8 px, die Leinwand behält 14 px Radius
   und ihre Ecken (sticky, auch ohne sticky Title Bar). Unter 992 px klappt die Navigation als Schublade **über**
   die Leinwand (reines CSS, Abdunklung nur unterhalb des Kopfes) statt sie zu quetschen; auf Tablets bleibt die
   Icon-Leiste stehen.

```
 Passepartout #E8EBEF ─ eine Fläche, keine Linien ───────────────────────────────┐
│  [▯|]  Universal Theme                               RTL   Version ▾   Style ▾  │
│                        ╭────────────────────────────────────────────────────╮  │
│   ⌂  Übersicht          │ Komponenten  ›  Standard Region                   │  │
│  ╭──────────────────────╯ Standard Region                                   │  │
│  │ ▍◉  Komponenten        ( Übersicht )  Anleitung   Demo                   │  │
│  ╰──────────────────────╮                                                   │  │
│   ⚙  Design             │ Region-Titel                                      │  │
│   ✎  Werkzeuge          │ ───────────────────────────────────────────────── │  │
│                         │ Inhalt, Formulare, Reports – flach auf der Leinwand│  │
│                         ╰────────────────────────────────────────────────────╯  │
└─────────────────────────────────── 12 px Rahmen ─────────────────────────────────┘
   aktiver Eintrag = aus der Leinwand ausgeschnitten, konkave Ecken, Magenta-Marke ▍
```

## Das eine markante Element: „Die Lasche“

Der aktive Navigationseintrag ist **ein Stück Leinwand**: gleiche Farbe, links gerundet, rechts nahtlos
mit der Arbeitsfläche verbunden, oben und unten mit nach innen gewölbten (konkaven) Ecken – wie ein Browser-Tab,
um 90° gedreht. Eine kurze Magenta-Marke sitzt darin. Das funktioniert in der aufgeklappten Liste (aktuelles
Blatt), in der eingeklappten Icon-Leiste (die Lasche greift um das Icon) und – als echter Browser-Tab –
in der Top-Navigation (Menüleiste), wo der aktuelle Eintrag von unten aus der Leinwand wächst.
Sonst ist alles ruhig: keine Balken, keine Trennlinien im Rahmen, flache Regionen, ein Akzent.

## Gegencheck Klischee-Liste (vor dem CSS)

| Klischee | Passepartout | Ergebnis |
|---|---|---|
| Creme + Serif + Terrakotta | kühles Grau, eine Grotesk, Magenta | vermieden |
| Fast-Schwarz + Säuregrün/Zinnober | Dunkel = Graphit-Rahmen + hellere Leinwand, Magenta | vermieden |
| Broadsheet, Haarlinien, Radius 0 | Haarlinien ja, aber Radien 8/12/18 und zwei Flächen | vermieden |
| SaaS-Karten-Kit mit Schatten | **eine** Leinwand, Regionen flach, keine Deko-Schatten/Verläufe | vermieden |
| ALL-CAPS-Eyebrows | Tabellenköpfe/Labels in Satzschreibung | vermieden |
| Monospace-Labels | keine Mono-Schrift in der UI | vermieden |
| „→“ an Buttons | nein | vermieden |
| Indigo/Violett-Linear | Magenta-Beere, kein Violett | vermieden |
| APEX-Blau | nur Info-Status in gedecktem Stahlblau | vermieden |
| Redwood (Beige, Oracle Sans, Pillars, Texturen) | kühle Neutrals, Instrument Sans, keine Streifen/Texturen | vermieden |

Korrektur aus dem Check: Zuerst war ein Unterstrich als Tab-Markierung geplant – das ist der Vita-Look
(blauer Unterstrich) und wurde durch die Flächen-Regel (aktiver Tab = Rahmen-Grau) ersetzt.

## Technik (Kurz)

- `theme.json`: Styles *Passepartout Light* (Basis Vita) und *Passepartout Dark* (Basis Vita-Dark).
- `src/tokens-light.css` / `src/tokens-dark.css`: nur eigene Tokens `--canvas-*` und modusabhängige Werte
  (inkl. `--ut-color-scheme`).
- `src/map.css` (von `theme.css` importiert): `@font-face` + modusneutrales Mapping `--canvas-*` → `--ut-*` /
  `--a-*` / `--jui-*`, inkl. aller `:root`-Hex-Kopien der Primärfarbe (Link, Fokus, Header, Menü-Fokus,
  Feld-Fokus, Checkbox, Cards-Icon/-Initialen/-Fokus, TreeNav-Badge, Button-Zähler) und `--u-color-1…15`.
- `src/theme.css`: Komponenten-Regeln, die nur Tokens verwenden; überschreibt Vita-Selektoren mit gleicher
  Spezifität (Hot-Liste inkl. Radio-Pills/`.ui-button--hot`, `--simple/--link/--noUI`, Status- und
  Primary-Buttons, `.fa:after`, Tree-Nav inkl. `!important`-Hover und Style A/B, `.a-IRR-header`,
  IG-Zellen/Control-Break, Report-Control-Chips, Cards-Stile, Login-Hintergründe).
- Kein `@layer`, kein JavaScript, Header-Höhe statisch (`--ut-header-height: 3.5rem`), `--js-*` unangetastet,
  Leinwand-Kanten per `position: sticky` (Dokument scrollt weiter normal → Sticky-Widgets/Title-Shrink intakt).

## Iterationen (fotografiert → geprüft → verbessert)

1. **Erstes Bild:** alles weiß – ein `*/` in einem Kommentar (`--ut-*/--a-*`) hatte die Token-Datei still
   verschluckt. Behoben; seitdem wird jedes Bundle auf Lightning-CSS-Warnungen geprüft.
2. **Lasche ohne konkave Ecken:** app_ui setzt `.a-TreeView-row{width:100%}`, der Einzug schob die Zeile 8 px über
   die Nav-Kante (abgeschnitten). `width:auto` → Ecken sitzen pixelgenau an der Leinwand.
3. **Formulare/Reports:** Felder auf 36 px (Tablets), Popup-LOV-/Kalender-/Passwort-Knöpfe als Teil des Feldes,
   Pill-Gruppe entzerrt; Reports nur mit waagerechten Haarlinien, Classic Report mit gerundetem Rahmen,
   IR-Suche als **ein** Feld (Spaltenwahl | Eingabe | Go) statt dreier Kästen.
4. **Date Picker:** grauer Kalenderkörper (Container malt die Feldkante als Lückenfarbe) → Kalenderfläche gesetzt.
5. **Mobil:** Push-Navigation quetschte den Inhalt auf 150 px → Overlay-Schublade; obere Leinwand-Ecken
   verschwanden beim Scrollen (Title Bar mobil nicht sticky) → eigene sticky Ecken.
6. **Feinschliff:** Fokusring nur bei Tastatur (`:focus-visible`), Rail-Icon ruhig (nur die Marke ist Magenta),
   Dialog-Rahmen und iframe-Inhalt im Dunkeln auf einer Fläche, Top-Nav-Lasche ausgerichtet.
7. **Gegencheck UT 24.2 (App 9242):** 1201 und 1500 hell pixelgleich mit 26.1 (0 abweichende Pixel).

## Bekannte Lücken (Prototyp)

- Ganzseiten-Screenshots (`--full`) zeigen die sticky Unterkante mitten im Bild (Artefakt der Aufnahme bei
  900 px Viewport, nicht der Seite).
- Nicht gestaltet/geprüft: Charts (JET-Serien nur über `--u-color-*`), Kalender, Karte, Faceted Search/Smart
  Filters, Wizard, Pivot-/Single-Row-Ansicht des IR, Rich Text Editor, Timeline/Comments im Detail.
- Pflichtfeld-Punkt und Floating-Label-Pflichtmarke nur per CSS verifiziert (kein Pflicht-Item im Testbett).
- Auto-Style (prefers-color-scheme) und Theme-Roller-Addon noch nicht angelegt; RTL nur über logische
  Eigenschaften vorbereitet, nicht fotografiert.
