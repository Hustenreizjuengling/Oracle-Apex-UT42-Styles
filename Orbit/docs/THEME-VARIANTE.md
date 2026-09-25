# Orbit als eigenes Theme (Theme-Variante)

Stand: 25.09.2026. Die **Style-Variante** (`install/orbit-install.sql`) ist der empfohlene Weg für bestehende Apps.
Die Theme-Variante legt Orbit **zusätzlich** als eigenes Theme an: Nummer **147**, Name *Orbit*, Static ID `orbit`,
sichtbar unter *Shared Components › Themes*. Eine App nutzt es erst, wenn du im App Builder auf dieses Theme umschaltest.

> **Kurzfassung.** Die Theme-Variante entsteht mit demselben Build-Werkzeug wie bei allen Themes dieses Projekts
> (`node _tools/build.mjs Orbit` → `install/orbit-theme-install.sql`). Ablauf, Nebenwirkungen und Grenzen sind
> identisch und in der bebilderten, getesteten Anleitung
> [Passepartout/docs/THEME-VARIANTE.md](../../Passepartout/docs/THEME-VARIANTE.md) beschrieben. Das Umschalten per
> *Switch Theme* hat in APEX 26.1 harte Nebenwirkungen: Es klappt nur nach einem *Unsubscribe*, setzt das
> Spaltenlayout aller Regionen und Items zurück und lässt sich per *Switch Theme* nicht rückgängig machen. Nimm die
> Theme-Variante deshalb nur für **neue Apps** und mache vorher immer ein Backup.

## Was bei Orbit anders ist

| | Passepartout | Orbit |
|---|---|---|
| Theme-Nummer | 142 | **147** (alle Themes des Projekts passen gleichzeitig in eine App) |
| Name / interner Name / Static ID | Passepartout / PASSEPARTOUT / `passepartout` | **Orbit / ORBIT / `orbit`** |
| Skripte | `passepartout-theme-install.sql`, `-theme-uninstall.sql` | `orbit-theme-install.sql`, `orbit-theme-uninstall.sql` |
| Theme-Dateien | 3 Styles × lesbar/minifiziert, 2 Schriftdateien, Schriftlizenz, `THIRD-PARTY-NOTICES.txt` | 3 Styles × lesbar/minifiziert, **10 Schriftdateien** (Barlow 300/400/500/600 und Barlow Semi Condensed 600, je latin und latin-ext), Schriftlizenz, `THIRD-PARTY-NOTICES.txt` |
| Styles | Passepartout Light / Dark / Auto | **Orbit Light / Dark / Auto**, Standard: Light |
| In APEX eingespielt | ja | Installation und Deinstallation am 25.09.2026 in je einer Test-App mit UT 26.1 und UT 24.2 (18 Theme-Dateien per HTTP 200, byte-gleich mit `dist/`, 3 Styles, 69 Templates); *Unsubscribe*/*Switch Theme* wie bei Passepartout |

## Installation per Skript

Voraussetzung ist APEX 26.1. Die App braucht das Universal Theme 42 (UT 24.2 oder 26.1). Ausführen in SQLcl,
SQL*Plus oder SQL Developer, verbunden als Parsing-Schema der App:

```sql
@Orbit/install/orbit-theme-install.sql <APP_ID> light     -- light | dark | auto
```

Das Skript legt Theme 147 *Orbit* an, übernimmt die Einstellungen des Universal Themes der App, legt die Dateien
als Theme-Dateien ab und registriert die Styles. **An der App selbst ändert es nichts.** Danach:

1. **Backup** der App (Export).
2. *Shared Components › Themes › Orbit (147) › Unsubscribe*.
3. *Shared Components › Themes › Switch Theme*: Universal Theme (42) → Orbit (147).
4. Style prüfen: Steht der aktuelle Style von Theme 147 nach dem Umschalten nicht auf Orbit, *Orbit Light*
   (oder Dark/Auto) als *Current* setzen.

Das Skript bricht ab, wenn die Nummer 147 schon ein fremdes Theme trägt oder die Static ID `orbit` bei einem
Theme mit anderer Nummer liegt (etwa nach einem Import über den App Builder).

> **Wichtig:** Solange Theme 147 den UT-Master abonniert, also direkt nach der Installation, listen die APEX-Views
> (`apex_application_temp_*`) jedes Template doppelt. Eigener Code mit `SELECT … INTO` darauf bricht dann ab; in der
> UT-Referenz-App trifft das die Plug-in-Region *Preview Template Options* (Seiten 1201, 1402, 1601). Installiere das
> Theme deshalb erst kurz vor dem Umschalten.

## Aktualisieren und Deinstallieren

```sql
@Orbit/install/orbit-theme-install.sql <APP_ID>      -- erneut ausführen = Update der Theme-Dateien und Styles
@Orbit/install/orbit-theme-uninstall.sql <APP_ID>    -- entfernt Theme 147, solange es noch abonniert
```

Ist Theme 147 schon entkoppelt (*Unsubscribe* oder Import), aktualisiert das Install-Skript nur Theme-Dateien und
Styles. Nach einem *Switch Theme* geht der Rückweg nur über das Backup.

## Bekannte Grenzen (APEX 26.1)

Siehe [Passepartout/docs/THEME-VARIANTE.md, Abschnitt 9](../../Passepartout/docs/THEME-VARIANTE.md#9-bekannte-grenzen-apex-261):
Grid-Einstellungen gehen beim *Switch Theme* verloren, der Rückweg geht nur über ein Backup, ein über den App Builder
exportiertes und importiertes Theme bekommt eine neue Nummer und lässt sich danach nicht per *Switch Theme*
aktivieren. Für Orbit gilt dasselbe, weil Installer und APEX-Verhalten identisch sind.
