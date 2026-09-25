# Style-Pack

Alle Theme Styles dieses Projekts mit einem Aufruf in eine APEX-App einspielen: **5 Themes mit je
3 Styles, zusammen 15** für das Universal Theme 42.
Die App wird nicht umgebaut: Die Styles erscheinen unter *Shared Components › Themes › Universal Theme › Theme Styles*
und lassen sich per Klick umschalten.

> Erzeugt von `node _tools/build.mjs --pack` – nicht von Hand bearbeiten (Texte: `_tools/style-pack.json`).

## Enthalten

| Theme | Style | Parameter | Basis | Anmutung |
|---|---|---|---|---|
| [Passepartout](../Passepartout/README.md) | **Passepartout Light** | `passepartout-light` | Vita | ruhiger hellgrauer Rahmen aus Kopf und Navigation, darin eine weiße, gerundete Leinwand; einziger Akzent Kartenmagenta; Instrument Sans |
|  | **Passepartout Dark** | `passepartout-dark` | Vita-Dark | fast schwarzer Rahmen, graphitgraue Leinwand, Magenta als heller Rosé-Ton |
|  | **Passepartout Auto** | `passepartout-auto` | Vita + UT-Delta | folgt der Hell/Dunkel-Einstellung des Betriebssystems – pixelgleich zu Light bzw. Dark |
| [Veedel](../Veedel/README.md) | **Veedel Light** | `veedel-light` | Vita | Kopfband in tiefem Markenblau, Seitentitel groß und weiß auf einem Blauverlauf, weiße eckige Flächen, Signalrot nur für die Hauptaktion; Figtree |
|  | **Veedel Dark** | `veedel-dark` | Vita-Dark | Nachtblau statt Schwarz, gedämpfter Blauverlauf, Überschriften in Himmelblau |
|  | **Veedel Auto** | `veedel-auto` | Vita + UT-Delta | folgt der Hell/Dunkel-Einstellung des Betriebssystems – pixelgleich zu Light bzw. Dark |
| [Frequenz](../Frequenz/README.md) | **Frequenz Light** | `frequenz-light` | Vita | weiße Seite, hellgraue Tafeln mit großen Radien, Magenta-Block mit dem App-Namen oben links, Kontur-Buttons; Onest |
|  | **Frequenz Dark** | `frequenz-dark` | Vita-Dark | schwarze Seite mit dunkelgrauen Tafeln, Magenta bleibt Akzent, Links in hellem Petrol |
|  | **Frequenz Auto** | `frequenz-auto` | Vita + UT-Delta | folgt der Hell/Dunkel-Einstellung des Betriebssystems – pixelgleich zu Light bzw. Dark |
| [Kracherl](../Kracherl/README.md) | **Kracherl Light** | `kracherl-light` | Vita | sonnengelbes Kopfband mit Wellenkante und Sprudelblasen, weiße Etiketten-Karten auf Lavendel, Überschriften in Violett; Bitter und PT Sans |
|  | **Kracherl Dark** | `kracherl-dark` | Vita-Dark | „Biergarten bei Nacht“: Violett-Schwarz mit Laternengelb |
|  | **Kracherl Auto** | `kracherl-auto` | Vita + UT-Delta | folgt der Hell/Dunkel-Einstellung des Betriebssystems – pixelgleich zu Light bzw. Dark |
| [Passer](../Passer/README.md) | **Passer Light** | `passer-light` | Vita | „Tagdruck“: Teal und Fluoreszenz-Pink mit Passerversatz auf kühlem Papier mit Korn, Text in Indigo-Tusche, Gelb als Marker; Bricolage Grotesque |
|  | **Passer Dark** | `passer-dark` | Vita-Dark | „Nachtdruck“: Neonfarben auf indigo gefärbtem Papier, Teal hell leuchtend |
|  | **Passer Auto** | `passer-auto` | Vita + UT-Delta | folgt der Hell/Dunkel-Einstellung des Betriebssystems – pixelgleich zu Light bzw. Dark |

## Installieren

```sql
-- alle 15 Styles anlegen, nichts umschalten
@style-pack/style-pack-install.sql 100

-- anlegen und Passepartout Dark aktivieren
@style-pack/style-pack-install.sql 100 passepartout-dark

-- zusätzlich dürfen die Nutzer ihren Style selbst wählen
@style-pack/style-pack-install.sql 100 passepartout-dark user

-- Nutzerwahl einschalten, ohne umzuschalten
@style-pack/style-pack-install.sql 100 - user
```

| Parameter | Bedeutung |
|---|---|
| 1 `APP_ID` | Application ID der Ziel-App (Pflicht) |
| 2 `STYLE` | optional: Style aktivieren, Schreibweise `<präfix>-<style>` wie in der Tabelle. Ohne Angabe oder `-` wird nichts umgeschaltet, ein aktiver Style bleibt aktiv. |
| 3 `user` | optional: *Allow End Users to choose Theme Style* einschalten – in der Fußzeile der App erscheint dann *Customize*, dort wählt jeder Nutzer einen der öffentlichen Styles für sich. |

Das Pack ruft nacheinander die Installer der Themes auf (Passepartout, Veedel, Frequenz, Kracherl, Passer). Jeder legt seine
Dateien unter `#APP_FILES#<präfix>/` ab und registriert seine Styles; nur das Theme des gewählten Styles schaltet um.
Ein unbekannter Wert bricht ab, bevor etwas geändert wird. Mehrfaches Ausführen ist erlaubt (Update, der aktive Style
bleibt). Am Ende stehen alle Styles der App, der aktive Style und die Einstellung der Nutzerwahl.

Am besten in einer eigenen SQLcl-Sitzung starten: SQL*Plus und SQLcl behalten Parameter früherer Skriptaufrufe. Die
Installer dieses Projekts räumen ihre Parameter am Ende selbst auf; hat aber ein anderes Skript vorher einen zweiten
Parameter hinterlassen, bricht das Pack ohne eigenen zweiten Parameter ab (nichts geändert) – dann `undefine 2 3` und
erneut aufrufen.

Jede Style-URL trägt einen Inhalts-Hash (`?v=…`). Nach einem Update laden die Browser deshalb sofort das neue CSS, obwohl
APEX App-Dateien als *immutable* ausliefert.

## Deinstallieren

```sql
@style-pack/style-pack-uninstall.sql 100
```

Ruft alle Deinstaller auf: Ist einer der Styles aktiv, wird auf *Vita* zurückgeschaltet. Die Styles werden deaktiviert
(nicht mehr öffentlich, nur noch Vita-CSS) und alle Dateien unter `#APP_FILES#<präfix>/` gelöscht. APEX hat keine API
zum Löschen von Theme Styles – die deaktivierten Einträge bei Bedarf im App Builder löschen; eine erneute Installation
aktiviert sie wieder. Die Nutzerwahl bleibt, wie sie ist (ausschalten: `apex_theme.disable_user_style`).

## Voraussetzungen

- Oracle APEX **24.2 oder neuer** (getestet auf 26.1); die App verwendet das **Universal Theme 42** mit der
  UT-Dateiversion **24.2 oder 26.1**.
- SQLcl oder SQL*Plus, verbunden als Parsing-Schema der App (oder mit `APEX_ADMINISTRATOR_ROLE`).
- Der Ordner `style-pack/` liegt neben den Theme-Ordnern – die Installer der Themes werden über relative Pfade aufgerufen.
  Der Aufruf selbst geht aus jedem Verzeichnis (Pfad zum Pack anpassen).

## Laufzeit

5 Installer mit zusammen 18,2 MB SQL laden 61 Dateien (CSS, Schriften, Lizenz- und Hinweisdateien) in die App.
Im Test (APEX 26.1, Datenbank im lokalen Netz, SQLcl) dauerte die Installation aller Styles 12 bis 16 Sekunden, die Deinstallation rund 7 Sekunden. Über langsame Verbindungen bestimmt vor allem die Größe der Skripte die Dauer.

## Einzelne Themes

Jedes Theme lässt sich auch allein installieren, Details, Bilder und Grenzen stehen in seiner README:

| Theme | Installer | Dateien | README |
|---|---|---|---|
| Passepartout 1.0.0 | `Passepartout/install/passepartout-install.sql` (3,5 MB) | 10 | [Passepartout/README.md](../Passepartout/README.md) |
| Veedel 1.0.0 | `Veedel/install/veedel-install.sql` (3,4 MB) | 12 | [Veedel/README.md](../Veedel/README.md) |
| Frequenz 1.0.0 | `Frequenz/install/frequenz-install.sql` (3,5 MB) | 10 | [Frequenz/README.md](../Frequenz/README.md) |
| Kracherl 1.0.0 | `Kracherl/install/kracherl-install.sql` (4,1 MB) | 19 | [Kracherl/README.md](../Kracherl/README.md) |
| Passer 1.0.0 | `Passer/install/passer-install.sql` (3,7 MB) | 10 | [Passer/README.md](../Passer/README.md) |

Nicht im Pack enthalten sind die Theme-Varianten (eigene Theme-Nummern, `<präfix>-theme-install.sql`, ab APEX 26.1).
