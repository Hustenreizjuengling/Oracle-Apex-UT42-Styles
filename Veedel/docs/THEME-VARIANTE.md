# Veedel als eigenes Theme (Theme-Variante)

Stand: 24.09.2026. Die **Style-Variante** (`install/veedel-install.sql`) ist der empfohlene Weg für bestehende
Apps. Die Theme-Variante legt Veedel **zusätzlich** als eigenes Theme an: Nummer **143**, Name *Veedel*,
Static ID `veedel`, sichtbar unter *Shared Components › Themes*. Eine App nutzt es erst, wenn du im App Builder auf
dieses Theme umschaltest.

> **Kurzfassung.** Die Theme-Variante wird vom selben Build-Werkzeug erzeugt wie die von Passepartout
> (`node _tools/build.mjs Veedel` → `install/veedel-theme-install.sql`). Ablauf, Nebenwirkungen und Grenzen sind
> identisch und in der bebilderten, getesteten Anleitung
> [Passepartout/docs/THEME-VARIANTE.md](../../Passepartout/docs/THEME-VARIANTE.md) beschrieben. Das Umschalten per
> *Switch Theme* hat in APEX 26.1 harte Nebenwirkungen: Es klappt nur nach einem *Unsubscribe*, setzt das
> Spaltenlayout aller Regionen und Items zurück und lässt sich per *Switch Theme* nicht rückgängig machen. Nimm die
> Theme-Variante deshalb nur für **neue Apps** und mache vorher immer ein Backup.

## Was bei Veedel anders ist

| | Passepartout | Veedel |
|---|---|---|
| Theme-Nummer | 142 | **143** (beide Themes passen gleichzeitig in eine App) |
| Name / interner Name / Static ID | Passepartout / PASSEPARTOUT / `passepartout` | **Veedel / VEEDEL / `veedel`** |
| Skripte | `passepartout-theme-install.sql`, `-theme-uninstall.sql` | `veedel-theme-install.sql`, `veedel-theme-uninstall.sql` |
| Theme-Dateien | 3 Styles × lesbar/minifiziert, 2 Schriftdateien, Schriftlizenz, `THIRD-PARTY-NOTICES.txt` | 3 Styles × lesbar/minifiziert, **4 Schriftdateien** (Figtree aufrecht und kursiv, je latin und latin-ext), Schriftlizenz, `THIRD-PARTY-NOTICES.txt` |
| Styles | Passepartout Light / Dark / Auto | **Veedel Light / Dark / Auto**, Standard: Light |
| Getestet in APEX | ja (Wegwerf-Apps 9142–9144) | Installation und Deinstallation am 24.09.2026 in einer frischen UT-26.1-App (Dateien per HTTP 200, 3 Styles); *Unsubscribe*/*Switch Theme* wie bei Passepartout |

## Installation per Skript

Voraussetzung ist APEX 26.1. Die App braucht das Universal Theme 42 (UT 24.2 oder 26.1). Ausführen in SQLcl,
SQL*Plus oder SQL Developer, verbunden als Parsing-Schema der App:

```sql
@Veedel/install/veedel-theme-install.sql <APP_ID> light     -- light | dark | auto
```

Das Skript legt Theme 143 *Veedel* an, übernimmt die Einstellungen des Universal Themes der App, legt die Dateien
als Theme-Dateien ab und registriert die Styles. **An der App selbst ändert es nichts.** Danach:

1. **Backup** der App (Export).
2. *Shared Components › Themes › Veedel (143) › Unsubscribe*.
3. *Shared Components › Themes › Switch Theme*: Universal Theme (42) → Veedel (143).
4. Style prüfen: Nach dem Umschalten steht der aktuelle Style von Theme 143 unter Umständen auf *Iris* – dann
   *Veedel Light* (oder Dark/Auto) als *Current* setzen.

Das Skript bricht ab, wenn die Nummer 143 schon ein fremdes Theme trägt oder die Static ID `veedel` bei einem
Theme mit anderer Nummer liegt (etwa nach einem Import über den App Builder).

> **Wichtig:** Solange Theme 143 den UT-Master abonniert, also direkt nach der Installation, listen die APEX-Views
> (`apex_application_temp_*`) jedes Template doppelt. Eigener Code mit `SELECT … INTO` darauf bricht dann ab.
> Installiere das Theme deshalb erst kurz vor dem Umschalten.

## Aktualisieren und Deinstallieren

```sql
@Veedel/install/veedel-theme-install.sql <APP_ID>      -- erneut ausführen = Update der Theme-Dateien und Styles
@Veedel/install/veedel-theme-uninstall.sql <APP_ID>    -- entfernt Theme 143, solange es noch abonniert
```

Ist Theme 143 schon entkoppelt (*Unsubscribe* oder Import), aktualisiert das Install-Skript **nur Theme-Dateien und
Styles**. Das Deinstallieren nach einem *Switch Theme* geht nur über das Backup (Rückweg per *Switch Theme* scheitert
in APEX 26.1 an den Template Components).

## Bekannte Grenzen (APEX 26.1)

Siehe [Passepartout/docs/THEME-VARIANTE.md, Abschnitt 9](../../Passepartout/docs/THEME-VARIANTE.md#9-bekannte-grenzen-apex-261):
Grid-Einstellungen gehen beim *Switch Theme* verloren, der Rückweg geht nur über ein Backup, ein über den App Builder
exportiertes und importiertes Theme bekommt eine neue Nummer und lässt sich danach nicht per *Switch Theme*
aktivieren. Für Veedel gilt dasselbe, weil Installer und APEX-Verhalten identisch sind.
