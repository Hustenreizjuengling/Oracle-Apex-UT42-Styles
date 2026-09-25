# Passer als eigenes Theme (Theme-Variante)

Die **Style-Variante** (`install/passer-install.sql`) ist der empfohlene Weg für bestehende Apps: Sie legt nur
Theme Styles auf das Universal Theme, jede Seite bleibt, wie sie ist, und das Umschalten ist jederzeit umkehrbar.

Die **Theme-Variante** legt Passer zusätzlich als eigenes Theme an: Nummer **146**, Name *Passer*, Static ID `passer`,
sichtbar unter *Shared Components › Themes*. Eine App nutzt es erst, wenn du im App Builder auf dieses Theme
umschaltest. Das CSS ist dasselbe wie in der Style-Variante; es kommt nur aus den Theme-Dateien statt aus den
Static Application Files.

> **Stand:** Der Installer wird von `node _tools/build.mjs Passer` aus `theme.json` erzeugt (Block `themeVariant`).
> Sein Ablauf und alle Grenzen von *Unsubscribe* und *Switch Theme* sind für APEX 26.1 im Schwester-Theme dieses
> Projekts ausführlich getestet und bebildert: [`Passepartout/docs/THEME-VARIANTE.md`](../../Passepartout/docs/THEME-VARIANTE.md).
> Für Passer wurden Installation (Theme 146, alle Dateien per HTTP 200, 3 Styles) und Deinstallation am 24.09.2026 in einer
> frischen UT-26.1-App geprüft. Mache vorher immer ein Backup.

## Theme oder Style

| | Style-Variante (empfohlen) | Theme-Variante |
|---|---|---|
| Wo sichtbar | *Themes › Universal Theme › Styles* | eigenes Theme *Passer (146)* unter *Themes* |
| Installation | `passer-install.sql` | `passer-theme-install.sql` |
| Aktivieren | Style auswählen, sofort und jederzeit umkehrbar | *Unsubscribe* und *Switch Theme*, umkehrbar nur über ein Backup |
| Templates | bleiben im Universal Theme und bekommen UT-Updates | werden beim *Unsubscribe* eingefroren |
| Layout der App | unverändert | *Switch Theme* setzt *Column Span* und *Start New Column* aller Regionen und Items zurück (APEX 26.1) |

**Wofür sich die Theme-Variante eignet:** für eine neue App, die von Anfang an mit Passer gebaut wird. Dort gibt es noch
kein Layout, das verloren gehen kann.

## Ablauf

Voraussetzung ist APEX 26.1 und das Universal Theme 42 (UT 24.2 oder 26.1) in der App. Ausführen in SQLcl,
SQL*Plus oder SQL Developer, verbunden als Parsing-Schema der App:

```sql
@Passer/install/passer-theme-install.sql <APP_ID> light     -- light | dark | auto
```

Das Skript legt Theme 146 *Passer* an, übernimmt die Einstellungen des Universal Themes der App, legt die Dateien als
Theme-Dateien ab (3 Styles lesbar und minifiziert, 2 Schriftdateien, Schriftlizenz, Drittanbieter-Hinweise) und registriert *Passer Light / Dark / Auto*.
**An der App selbst ändert es nichts.** Danach im App Builder:

1. **Backup:** App exportieren. Der Rückweg zum Universal Theme geht nur über dieses Backup.
2. **Unsubscribe:** *Shared Components › Themes › Passer › Theme Subscription › Unsubscribe*. Ohne diesen Schritt bricht
   *Switch Theme* ab. Der aktuelle Style springt dabei auf *Iris* – das Skript noch einmal ausführen oder den Style von
   Hand auf *Passer Light* setzen.
3. **Switch Theme:** *Shared Components › Themes › Switch Theme*, *Universal Theme (42)* → *Passer (146)*. Die Zuordnung
   der Templates übernimmt APEX selbst.
4. **Layout prüfen:** *Switch Theme* setzt in APEX 26.1 das Grid aller Regionen und Items zurück. Nebeneinander stehende
   Regionen rutschen untereinander und müssen neu angeordnet werden.

Solange Theme 146 den UT-Master abonniert (direkt nach der Installation), listen die Views
`apex_application_templates` und `apex_application_temp_*` jedes Template doppelt. Eigener Code mit `SELECT … INTO`
auf diese Views bricht dann mit *TOO_MANY_ROWS* ab. Installiere das Theme deshalb erst kurz vor dem Umschalten.

## Style wechseln, aktualisieren, entfernen

- **Style wechseln:** *Shared Components › Themes › Passer › Styles* oder das Skript erneut mit `light`, `dark` oder `auto`.
- **Neue Passer-Version:** `node _tools/build.mjs Passer`, dann das Skript erneut ausführen. Bei einem entkoppelten Theme
  aktualisiert es nur Theme-Dateien und Styles. Browser holen das neue CSS über `?v=<Version>` aus `theme.json` –
  die Version dort bei jeder Änderung erhöhen.
- **Deinstallieren:** `@Passer/install/passer-theme-uninstall.sql <APP_ID>`. Das geht nur, solange Theme 146 noch abonniert
  ist. Ist Passer aktuell (ORA-20006) oder entkoppelt (ORA-20007), zuerst das Backup einspielen.
- **Zurück zum Universal Theme:** nur über das Backup aus Schritt 1 (*Switch Theme* zurück scheitert an den Template
  Components).

## Bekannte Grenzen (APEX 26.1)

1. *Switch Theme* auf ein abonniertes Theme scheitert – erst *Unsubscribe*.
2. *Unsubscribe* hängt alle Template-Bezüge der App auf die Kopien in Theme 146 um; danach lässt es sich nicht mehr löschen.
3. *Switch Theme* setzt das Grid-Layout (*Column Span*, *Start New Column*) aller Regionen und Items zurück.
4. Kein Rückweg per *Switch Theme*, nur über das Backup.
5. Ein Theme-Import über den App Builder vergibt eine neue Nummer; *Switch Theme* scheitert danach bei Apps mit
   Template Components.
6. Das entkoppelte Theme bekommt keine UT-Updates mehr.
