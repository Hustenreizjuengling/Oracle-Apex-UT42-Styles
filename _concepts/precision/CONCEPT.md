# Nonius – Theme-Konzept (Richtung C „präzise / Instrument“)

Schlüssel/Präfix: `precision` · Styles: **Nonius Light** (Basis Vita) · **Nonius Dark** (Basis Vita-Dark)

> Der **Nonius** ist die Hilfsskala am Messschieber, mit der man zwischen zwei Teilstrichen genau ablesen kann.
> Der Name steht für das, was das Theme leisten soll: Werte schnell und genau ablesen.

---

## 1. Leitidee

Nonius sieht aus wie ein gut gebautes Messgerät. Ein ruhiges **Graphit-Gehäuse** (Kopfleiste und Navigation) umschließt eine
**weiße Arbeitsfläche**. Beschriftet ist alles in **Tusche** auf feinen 1-px-Linien, und es gibt genau **eine gelbe Taste**
für die Hauptaktion, so wie am Tachymeter oder an der Nivellierlatte. Die Arbeit machen Typografie und Tabellen, Deko gibt es nicht.
An einer Stelle ist das Theme mutig: Die Titelleiste endet in einer **feinen Messskala mit gelber Nullmarke**.

## 2. Palette

### Hell – „Tag“

| Name | Hex | Rolle |
|---|---|---|
| Papier | `#FFFFFF` | Arbeitsfläche, „Anzeigen“: Felder, Tabellen, Karten, Titelleiste |
| Gehäuse | `#F3F4F6` | Rahmen (Header und Navigation), Regionen als Einschübe, Werkzeugleisten |
| Tusche | `#16191D` | Text, Tastatur-Fokusring, Kopflinie der Tabellen, Primär-Taste (`--primary`) |
| Skala | `#59626C` | Sekundärtext, Breadcrumb, Nav-Icons (6.2:1 auf Papier); Striche der Messskala in `#858D97`/`#C4C9CF` |
| Haarlinie | `#D9DDE2` | Trenn- und Zeilenlinien, Panelränder (Feldrahmen dunkler: `#858D97`, 3:1) |
| Signalgelb | `#F5B700` | **nur** Hauptaktion (Hot-Taste mit Tusche-Schrift, 9.8:1), Checked-/Auswahl-Zustand, Nav-Marke, Nullmarke |

### Dunkel – „Nacht“ (Nachtmodus für den Außendienst)

| Name | Hex | Rolle |
|---|---|---|
| Nachtgrund | `#171A1E` | Seite; Anzeigen etwas tiefer (`#131619`), wie ein eingelassenes Display |
| Gehäuse | `#21262B` | Rahmen, Regionen, Werkzeugleisten |
| Leuchtschrift | `#DDE1E6` | Text (kein reines Weiß → weniger Blendung; 13.3:1 auf Nachtgrund) |
| Skala | `#9EA6B0` | Sekundärtext, Skala (6.2:1 auf Gehäuse) |
| Haarlinie | `#2E343A` | Linien (Feldrahmen `#6B747F`, 3.2:1) |
| Signalamber | `#F2B418` | Hauptaktion, **Fokusring**, Zustände (8.2:1 auf Gehäuse) |

Warum Amber bei Nacht: Instrumentenbeleuchtung in Cockpits und auf Schiffen ist aus gutem Grund amber oder rot, denn diese Farben
stören die Dunkeladaption kaum. Der dunkle Style ist deshalb kein invertierter Hell-Style. Er hat eigene Flächenstufen (das Display liegt
*tiefer* als das Gehäuse), gedämpftes Weiß und im Dunkeln einen Fokusring in Signalfarbe.

**Funktionsfarben** (nur Status, nie Deko), hell / dunkel:
Erfolg `#1C7A4A` / `#3FB37A` · Warnung Fläche `#B8570A` / Text `#A34D08` (Warnorange, denn Gelb ist schon Signal) / `#F08A3E` · Fehler `#C0262D` / `#F0645F` · Info Schiefer `#4A5D72` / `#8FA6BF`.
Gefüllte Status-Tasten tragen weiße Schrift auf der hellen Stufe (≥ 4.7:1).

## 3. Typografie

**Instrument Sans** (OFL, selbst gehostet, variabel: Gewicht 400–700, Breite 75–100 %). Die Schrift ist kompakt und hat Charakter
(ß, g, R), sie hat echte **Tabellenziffern** (`tnum`) und eine **Breitenachse**. Den Schmalschnitt nutzt Nonius für Tabellenköpfe.
So bekommen die Köpfe den Charakter eines Instrumenten-Etiketts, ohne VERSALIEN und ohne Monospace.

| Rolle | Größe / Zeile | Schnitt |
|---|---|---|
| Seitentitel | 26 / 32 px | 650, −0.02 em |
| Abschnitt (Content Block h2) | 20 / 28 px | 650, −0.01 em |
| Regionstitel | 15 / 20 px | 600 |
| UI- und Fließtext | 14 / 20 px | 400 (APEX: 12 px) |
| Daten (Report, IR, IG) | 13 / 18 px | 400, `tabular-nums` |
| Tabellenkopf | 13 / 16 px | 600, **Breite 85 %** |
| Meta, Breadcrumb | 12–13 / 16 px | 400–500, Skala-Grau |

## 4. Layout-Prinzipien

- **4-px-Raster**. Bedienelemente sind 32 px hoch (APEX: 24 px Felder). Nur 1-px-Linien, eine einzige kräftige Linie (Tabellenkopf).
- **Radien**: 6 px für Komponenten, 4 px für Kleinteile. Weder 0 (Broadsheet) noch Pille.
- **Keine Schatten** auf ruhenden Flächen. Nur schwebende Ebenen (Menü, Dialog, Popup) bekommen einen Schatten.
- **Gehäuse und Anzeige**: Regionen sind graue Einschübe ohne Kopfstreifen. Felder, Tabellen und Karten darin sind weiße „Anzeigen“.
  Das ist genau umgekehrt zu APEX (dort weiße Kästen mit Kopfstreifen).
- **Labels linksbündig** über bzw. vor dem Feld (APEX: rechtsbündig). Pflicht-Dreieck entfällt.
- **Fokus**: hell ein Doppelring (gelber Kern, Tusche-Ring außen, 17:1), dunkel ein amberfarbener Ring. Felder zeigen Fokus als
  2-px-Rahmen mit gelber Unterkante.
- **Responsive**: unter 992 px legt sich die Navigation als Overlay über den Inhalt (APEX schiebt den Inhalt zur Seite).
  Bei grobem Zeiger (Tablet, Handschuh) werden die Bedienelemente 40 px hoch.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ≡   Strategie-Planer                                   Hilfe   M. Sabel ▾    │ Header 52px · GEHÄUSE
├────────────┬─────────────────────────────────────────────────────────────────┤
│ ⌂ Start    │  Planung / Maßnahmen                            PAPIER          │
│▌▣ Freigabe │  Maßnahmen-Übersicht                   [Export] [■ Speichern]   │ Titel 26/650
│   Offen    │ ─┴───────┴───────┼───────┴───────┴───────┼───────┴───────┴──────│ ← Nonius-Skala
│   Erledigt │  ▲ Nullmarke (gelb)                                             │
│ ◎ Karten   │  ┌ Offene Freigaben ────────────────────────── [Filter] ┐       │ Region = Einschub
│ ⚙ Admin    │  │ ┌──────────────────────────────────────────────────┐ │       │   (GEHÄUSE, 6px)
│            │  │ │ Objekt        Betrag €   Anz.  Status   ◂ schmal │ │       │ Anzeige (PAPIER)
│            │  │ │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ │       │ Kopflinie TUSCHE
│  GEHÄUSE   │  │ │ Trasse Nord 04   1.284,50    11  Frei          │ │       │ tnum, 13px
│            │  │ └──────────────────────────────────────────────────┘ │       │
│            │  └──────────────────────────────────────────────────────┘       │
└────────────┴─────────────────────────────────────────────────────────────────┘
  ▌ = gelbe Nav-Marke (aktueller Eintrag)      ■ = die eine gelbe Taste
```

## 5. Das eine markante Element: die Nonius-Skala

Die Unterkante der Titelleiste ist eine **Messskala** wie auf einem Lineal (mm, 5 mm, cm): Teilstriche alle 8 px (4 px hoch),
Mittelstriche alle 40 px (6 px) und Hauptstriche alle 80 px (9 px), alles in 1 px und in Skala-Grau, auf einer durchgehenden Grundlinie.
Genau unter dem Beginn des Seitentitels sitzt eine **gelbe Nullmarke** (3 × 14 px). Die Teilung beginnt erst an der Nullmarke.
Der Inhalt fluchtet mit ihr, auch mobil (16 px). Umgesetzt ist das rein mit CSS als `::after` und fünf Hintergrund-Layern, ohne Bild und ohne HTML. Die Skala ersetzt den APEX-Unterstrich der Title-Bar,
erscheint auf jeder Seite und ein zweites Mal als Oberkante der Login-Karte. Sie verweist auf die Arbeit der Nutzer
(Vermessung, Karten, Trassen) und bleibt dabei ein 14 px hoher Rand. Alles andere im Theme ist bewusst zurückhaltend.

## 6. Abgleich mit der Klischee-Liste (vor dem CSS geprüft)

| Klischee | Nonius | Korrektur im Plan |
|---|---|---|
| Creme + Serif + Terrakotta | kühles Graphit, Grotesk, Gelb | – |
| fast-schwarz + Säure-Grün/Zinnober | Nacht = Graphit `#171A1E`/`#21262B` + Amber | Erster Entwurf `#121417` war zu nah an „fast-schwarz“ → auf Graphit angehoben. Orange/Zinnober als Akzent verworfen. |
| Broadsheet, Haarlinien, Radius 0 | 6-px-Radien, Einschübe statt Zeitungsspalten | – |
| SaaS-Karten-Kit (Schatten, Verläufe) | keine Ruheschatten, kein Verlauf, flache Linien | – |
| ALL-CAPS-Eyebrows / Monospace-Labels | Schmalschnitt 85 % in gemischter Schreibung | Idee „Mono-Etiketten“ verworfen |
| „→“ an Buttons | keine | – |
| Indigo/Violett, APEX-Blau | kein Blau; Links in Tusche mit Unterstrich, Info in Schiefer | Linkfarbe bewusst nicht blau |
| Redwood (Beige, Oracle Sans, Pillar-Streifen, Texturen) | kühles Neutral, eigene Schrift, keine Streifen | Die Skala ist *eine* Kante, keine Flächentextur |
| Gelb = „Baustelle“ | Gelb nur auf der Taste, bei Zuständen und an der Nullmarke, nie als Fläche | Warnfarbe auf Orange verlegt, damit Gelb eindeutig „Aktion“ bedeutet |

## 7. Umsetzung (Kurz)

- `src/tokens-light.css` und `src/tokens-dark.css` enthalten nur die Werte der `--precision-*`-Tokens.
  Beide importieren `src/tokens-map.css`: das modusneutrale Mapping auf `--ut-*`/`--a-*`, inklusive aller Hex-Kopien der Primärfarbe.
- `src/theme.css` enthält Komponentenregeln, die nur Tokens lesen, darunter die Vita-Selektoren für Hot-, Status- und Primary-Buttons, die Tree-Nav
  (mit `!important`, wo Vita es erzwingt), `.a-IRR-header`, Control-Types, IG-Zellen, Cards-Styles, Login und Breadcrumb-Trenner.
- `src/fonts.css` bindet Instrument Sans (latin + latin-ext, variabel) aus `assets/fonts/` ein, mit `font-display: swap`.
  Die Header-Zeilenhöhe ist fest, damit ein späterer Schriftwechsel die gemessene Header-Höhe nicht ändert.

## 8. Iterationen (fotografieren → prüfen → verbessern)

| Runde | Befund | Änderung |
|---|---|---|
| 0 | Plan: Nachtfläche `#121417` zu nah an „fast-schwarz“ | Nachtgrund auf Graphit `#171A1E`/`#21262B` angehoben |
| 1 | Kommentar `--ut-*/--a-*` beendete den CSS-Kommentar → Hell-Bundle ohne Tokens | Kommentar umformuliert; Bundles werden jetzt mit `errorRecovery:false` geprüft |
| 1 | RDS-Tabs sitzen auf der Skala; Teilstriche beginnen schon links von der Nullmarke | mehr Abstand unter den Tabs; Teilung per `background-clip: content-box` erst ab der Nullmarke |
| 1 | Aktiver Tab gelb und Nullmarke gelb direkt übereinander (zu viel Gelb) | Tabs und RDS aktiv in Tusche, Gelb bleibt Aktion und Zustand vorbehalten |
| 1 | Radio-Pills zu klein, Tabellenköpfe 12.5 px zu klein | Pills 13 px mit 6/12 px Innenabstand, Köpfe 13 px im Schmalschnitt |
| 2 | Eingeklappte Nav: Label des aktuellen Eintrags sichtbar („M.“ über dem Icon) | `.js-navCollapsed …label { color: transparent }` |
| 2 | Skala wirkte flach | dritte Strichstufe (40 px) ergänzt, wie ein echtes Lineal |
| 3 | RDS-Sprungnavigation scrollt Überschrift bündig unter die Skala | `.t-ContentBlock.a-Tabs-panel { padding-top: .75rem }` |
| 3 | Mobil: Inhalt bei 8 px, Nullmarke bei 16 px | `--ut-xs-body-content-padding-x: 1rem` |
| 3 | Floating Labels 11 px | 12 px |

## 9. Prüfergebnisse

- **Kontraste** (berechnet): Jede Text/Grund-Kombination liegt bei ≥ 4.5:1 (Minimum 4.73 Erfolg auf Erfolg-Tönung, 4.77 Weiß auf Warnorange).
  Feldrahmen erreichen 3.05–3.8:1, Fokusringe 9.4–17.6:1.
- **Laufzeit-Audit** (9042 und 9242, hell und dunkel): „Nonius Sans“ wird aus `assets/fonts` geladen, der Header ist 52 px hoch und `--js-sticky-top` = 52 px.
  In allen sichtbaren Elementen bleibt kein APEX-Blau übrig. `color-scheme` ist light bzw. dark, und `.a-IRR-header` ist überschrieben.
- **Tastaturfokus** (Nahaufnahmen in `shots/extra/focus-*`): hell ein Doppelring aus Tusche mit gelbem Kern, Felder mit 2-px-Rahmen und gelber Unterkante;
  dunkel ein Amberring.
- **Responsive**: bei 390 px kein horizontales Scrollen (1101, 1402, 1601). Die Navigation legt sich unter 992 px als Overlay über den Inhalt.
- **UT 24.2** (App 9242): Seiten 1201 und 1500 hell im Pixelvergleich mit 9042: **0 abweichende Pixel**.
- Zusätzliche Belege in `shots/extra/`: Button-, Regions- und Alert-Galerien, Actions-Menü, Date-Picker-Popup, Modal-Dialog (dunkel),
  IG 1410, Classic Report 1401, Floating Labels 1600, eingeklappte Navigation, mobile Overlay-Navigation.

## 10. Bekannte Lücken (Prototyp)

- Pflicht-Kennzeichnung (`is-required`) und Seitenmeldungen (`t-Alert--page`) sind gestaltet, aber im Testbett nicht live ausgelöst worden.
- Charts (JET), Kalender, Karte, Faceted Search/Smart Filter, IG-Editiermodus und IR-Dialoge (Filter, Pivot) sind nicht einzeln geprüft.
  Die neue u-color-Palette ändert auch die Serienfarben von Diagrammen.
- Das mobile IR bricht Datumswerte in schmalen Spalten um (APEX-Verhalten, nicht angepasst).
- `@media (pointer: coarse)` (40-px-Bedienelemente) und die RTL-Spiegelung der Skala sind nicht verifiziert.
- Kein Theme-Roller-Addon und kein „Auto“-Style (prefers-color-scheme). Beides lässt sich nach `ut-style-anatomy.md` §3/§6 ergänzen.
