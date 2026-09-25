# Loden – Designplan (Konzept `tonal`, Richtung B „tonal / materiell“)

## Name

**Loden** – der gewalkte, grau-grüne Wollstoff, aus dem Arbeitsjacken für draußen gemacht werden.
Ein Wort, deutsch, merkfähig, ein *Material* statt eines Himmelskörpers. Es beschreibt Farbe (gedecktes
Grau-Grün) und Haltung (robust, unaufgeregt, für Leute, die im Feld arbeiten) zugleich.

## Leitidee

Eine Oberfläche aus **einem** Grundton: Loden-Grün, in sechs tonalen Stufen von Kreide bis Tinte.
Die Anwendung ist ein heller **Arbeitsbogen**, der in einen ruhigen Loden-**Rahmen** eingelegt ist; alles
darauf wird über Tonwerte gestaffelt statt über Linien und Schatten. Weiche Formen (Pills, große Radien)
machen es freundlich, die gedeckte Farbe und die strenge Typografie halten es seriös.

## Palette

Alle Werte wurden in OKLCH entworfen (Farbton 162° für die Loden-Familie), in Hex umgerechnet und auf Kontrast
geprüft (`_tmp/tonal-work/final-palette.mjs`).

### Hell (Basis Vita)

| Name | Hex | Rolle |
|---|---|---|
| Flechte | `#DBE9E2` | Rahmen: Header, Side-Navigation, Login-Hintergrund |
| Kreide | `#F9FDFB` | Arbeitsbogen: Title-Bar und Inhaltsfläche |
| Filz | `#EBF3EE` | Regionen, Karten, Content Blocks (tonale Ebene 1) |
| Salbei | `#A8DCC1` | aktive Navigation, Segment-Auswahl, „Primary“-Buttons, Icon-Kacheln (Text darauf 9,6:1) |
| Loden | `#305A46` | Primärfarbe: Hot-Button (Weiß darauf 7,9:1), Fokusring, Links, Checkbox, Schalter, Logo |
| Tinte | `#141D18` | Text (15,3:1 auf Filz); Nebentext `#4D5952` (6,5:1 auf Filz, 5,9:1 auf Feld) |

Ergänzend: Feldfüllung `#DEE9E3`, Tabellenkopf/Filz 2 `#E6F0EA`, Linien `#D8E2DD`, Feldkante `#707E77` (3,4:1, Nicht-Text-Kontrast),
Auswahl `#D9EFE3`, tonaler Button `#D5E6DD`.
Status: Erfolg `#30752A`, Warnung `#F2B036` (Text dunkel), Fehler `#BA2B28`, Info `#2F698F` – je mit hellem Container-Ton.

### Dunkel (Basis Vita-Dark)

| Name | Hex | Rolle |
|---|---|---|
| Nachtwald | `#0C110E` | Rahmen: Header, Side-Navigation, Login |
| Tannenschatten | `#19201C` | Arbeitsbogen |
| Moos | `#212A25` | Regionen, Karten (tonale Ebene 1 – heller, nicht dunkler) |
| Salbei dunkel | `#254E3E` | aktive Navigation, Segment-Auswahl (Text `#C2EDD6`, 7,3:1) |
| Minze | `#8CCEB6` | Primärfarbe (Text darauf `#062619`, 8,9:1); bewusst kühler als Erfolg `#7BC772` |
| Nebel | `#E4ECE7` | Text (12,3:1 auf Moos); Nebentext `#B2BEB7` (7,7:1) |

Dunkel ist **nicht invertiert**: Im hellen Modus werden tiefere Ebenen dunkler getönt (Rahmen < Bogen),
im dunklen Modus steigen Ebenen zum Licht auf (Rahmen dunkelst, Regionen und Felder heller) – so wie ein
beleuchteter Stoff. Die Primärfarbe kippt von tiefem Loden zu heller Minze, damit sie auf dunklem Grund
dieselbe Rolle (Handlung, Fokus) spielt.

## Typografie

- **Figtree Variable** (OFL 1.1, selbst gehostet, latin + latin-ext, `font-display: swap`) für alles.
  Freundlich-geometrische Formen passen zur weichen Geometrie, schmal genug für dichte Tabellen,
  echte **Tabellenziffern** (`tnum`, geprüft) für Beträge und Datumsspalten.
- Eine Familie, Rollen über Gewicht und Größe:

| Rolle | Größe / Zeile | Gewicht |
|---|---|---|
| Seitentitel | 28 / 36 px, −0,015 em | 700 |
| Regionstitel, Dialogtitel | 16 / 24 px | 650 |
| UI-Text, Buttons, Felder, Navigation | 14 / 20 px | 400 / 600 |
| Tabellenzellen, Labels, Breadcrumb | 13 / 20 px | 400 (Kopf 600) |
| Hilfe, Badges, Metadaten | 12 / 16 px | 500 |

Skala: 12 · 13 · 14 · 16 · 20 · 28. Keine Versalien-Labels, kein Monospace für Beschriftungen.

## Layout-Prinzipien

1. **Rahmen und Bogen.** Header und Side-Navigation teilen sich *eine* Fläche (Flechte). Der Header
   verschmilzt bewusst mit der Navigation: Er ist Orientierung, nicht Inhalt – eine farbige Leiste würde
   mit Karten, Statusfarben und dichten Tabellen konkurrieren. Im Außendienst (Sonne, Tablet) hilft
   dunkle Schrift auf hellem Rahmen mehr als weiße Schrift auf gesättigtem Balken.
2. **Tonale Ebenen statt Schatten.** Rahmen → Bogen → Filz (Region) → Feld. Keine Rahmenlinien um Regionen,
   keine Kopfstreifen, keine Schlagschatten. Schatten gibt es nur für wirklich schwebende Dinge (Menüs, Dialoge).
3. **Weiche Geometrie, gestuft.** Bogen 28 px, Regionen/Karten 20 px, Tabellenkörper 14 px, Felder 10 px,
   Buttons, Tabs, Navigation und Chips als Pills. Je kleiner das Element, desto kleiner der Radius.
4. **Gefüllte Felder** mit Unterkante (3,4:1) statt Rahmenkasten; beim Fokus hellt das Feld auf und bekommt
   einen 2-px-Loden-Ring. Labels linksbündig, gedämpft; Pflicht = „*“ nach dem Label, kein rotes Dreieck.
5. **Daten zuerst.** Tabellen liegen auf dem hellsten Ton (Kreide) innerhalb der Filz-Region, Kopfzeile
   getönt, 13 px mit Tabellenziffern, nur horizontale Haarlinien, Zeilenhöhe 36 px.
6. **Navigation als getönte Pills**: aktiver Eintrag Salbei mit fetter Schrift; Hover ist ein 6–7-%-Zustandsschleier
   aus der Textfarbe; eingeklappt eine 72 px breite Icon-Schiene mit zentrierten Pills.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ≡  Universal Theme                        ⟲ RTL   # Version  ✎ Style │  Rahmen „Flechte“ (64 px)
│        ╭─────────────────────────────────────────────────────────────╮│
│ (▣)    │ Components › Standard Region                                ││  ← der Bogen „Kreide“,
│  ◎     │ Standard Region                                  28/700     ││    Ecke 28 px
│  ✓     │ (Übersicht) Anleitung  Demo                   ← Tab-Pills   ││
│  ☰     │ ╭──────────────────────────────╮  ╭──────────────────────╮  ││
│        │ │ Region (Filz, r 20)          │  │ Template Options     │  ││
│ Schiene│ │  Label                       │  │  ☑ Option            │  ││
│ 72 px  │ │  ▭▭▭▭▭▭▭▭▭ gefülltes Feld     │  │  ◉ Radio             │  ││
│        │ │  (Speichern) (Abbrechen)     │  ╰──────────────────────╯  ││
│        │ ╰──────────────────────────────╯                            ││
└────────┴──────────────────────────────────────────────────────────────┘
```

Mobil (390 px): Rahmen schrumpft auf den Header, der Bogen läuft randlos mit oben gerundeten Ecken.

## Das EINE markante Element

**Der Bogen.** Die gesamte Arbeitsfläche (Title-Bar + Inhalt) ist ein heller Bogen, der mit einer großen
28-px-Rundung oben links (und oben rechts) in den Loden-Rahmen eingelegt ist. Das ersetzt die zwei stärksten
APEX-Erkennungsmerkmale – blaue Kopfleiste und schiefergraue Seitenleiste – durch *eine* ruhige Geste.
Alles andere bleibt diszipliniert: ein Grundton, eine Schrift, keine Deko.

## Gegencheck Klischee-Liste (vor dem CSS)

| Klischee | Stand | Entscheidung |
|---|---|---|
| Creme + Serif + Terrakotta | Neutrals sind kühl grün getönt, keine Serif, kein Terrakotta | ok |
| Fast-schwarz + Säuregrün/Zinnober | Dunkel ist grün-getöntes Anthrazit, Akzent gedeckte Minze (C 0,075), kein Neon | ok |
| Broadsheet, Haarlinien, Radius 0 | Gegenteil: große Radien, fast keine Linien | ok |
| SaaS-Karten-Kit mit Schatten, Verläufe | **Korrigiert:** erster Entwurf hatte weiße Karten mit weichem Schatten → ersetzt durch Filz-Ton ohne Schatten; Radien gestuft statt überall gleich; keine Verläufe | geändert |
| ALL-CAPS-Eyebrows | Breadcrumb und Tabellenköpfe in normaler Schreibung | ok |
| Monospace-Labels | keine | ok |
| „→“ an Buttons | keine Pfeile | ok |
| Indigo/Violett, APEX-Blau | Farbton 162° (grün); Info-Blau bewusst gedeckt (`#2F698F`), nur für Status | ok |
| Redwood (Beige, Oracle Sans, Pillar-Streifen, Texturen) | kein Beige, Figtree, keine Streifen/Texturen | ok |
| Erfolg = Grün im grünen Theme | **Bewusst entschieden:** Loden ist grau-grün (C 0,058), Erfolg ist ein sattes Blattgrün (C 0,13, Farbton 142°) – unterscheidbar über Sättigung | begründet |

## Technische Leitplanken (aus `_docs`)

- Overlay auf Vita/Vita-Dark, keine `@layer`, keine IDs, Spezifität wie Vita.
- Alle 27 Hex-Kopien der Primärfarbe + Hot-/Status-Selektorlisten + Tree-Nav-Hardcodes (inkl. `!important`)
  + `.a-IRR-header` werden neu gesetzt.
- Header-Höhe statisch (`--ut-header-height: 4rem`), Header nie versteckt/fixed, `--js-mq-*` unangetastet.
- Tokens: `src/tokens-light.css` / `src/tokens-dark.css` (nur Werte `--tonal-*`), `src/map.css` (Mapping auf
  `--ut-*`/`--a-*`), `src/theme.css` (Komponenten, nur Tokens).

## Entscheidungen während der Iterationen

1. **Iteration 1** (alle Seiten hell/dunkel): Rahmen, Bogen und Tonebenen funktionierten; Fehler gefunden und behoben:
   ein `*/` im Kommentar von `tokens-light.css` hat den kompletten hellen Token-Block verschluckt (seitdem prüft
   `_tmp/tonal-work/check.sh` alle Dateien auf Parser-Warnungen); Nav-Pill ragte über den Rand (`width:100%` aus app_ui);
   aktuelle Unterseite war nicht markiert → Pill am Blatt per `:has()`, Elternknoten nur fett.
2. **Iteration 2**: Select One/Combobox zeigten Doppelkante und Kerbe → Container trägt die Füllung; Labels horizontal
   auf die 40-px-Feldmitte gesetzt; Content-Block-Innenabstände; Pflicht-„*“ in Figtree statt Icon-Glyphe.
   Dunkel: Minze-Primär vs. Erfolg-Grün zu ähnlich → Primär auf 170° (kühler) verschoben.
3. **Iteration 3**: Rahmen hell etwas tiefer (`#DBE9E2`) und Salbei gesättigter, damit Bogen und aktive Pill klar lesbar
   sind; dunkle Ebenen angehoben (Bogen hebt sich vom Rahmen ab); Logo in Loden; Haarlinie unter der geschrumpften
   Title-Bar; IR-Suche 14 px; Karussell-/Kalender-Lücken aus Vita-Dark geschlossen.

## Prüfungen

- Sticky-Offsets: Header 64 px = `--js-sticky-top` 64 px (hell/dunkel); Bogen-Ecken bleiben beim Scrollen maskiert.
- Figtree lädt aus `assets/fonts` (latin), kein CDN; keine Oracle-Blautöne mehr im berechneten DOM (Scan auf `#056AC8`, `#0677E1`, `#0784F9`).
- Kontraste: alle Textpaare ≥ 4,5:1, Feldkante/Schalter/Outline ≥ 3:1 (Matrix aus den Token-Dateien berechnet).
- UT 24.2 (App 9242): Seiten 1201 und 1500 identisch zu 26.1.
- Zusatzbelege in `shots/x-*`: Button-Matrix inkl. Status/Simple/Link/NoUI/Disabled/Fokusring, Feldzustände (Floating,
  Pflicht, Fehler, Fokus), Date Picker dunkel, Actions-Menü.
