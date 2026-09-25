# Frequenz als eigenes Theme (Theme-Variante)

Die **Style-Variante** (`install/frequenz-install.sql`) ist der empfohlene Weg für bestehende Apps: Sie legt die Styles
*Frequenz Light / Dark / Auto* im Universal Theme an und ändert an der App sonst nichts.

Zusätzlich erzeugt `node _tools/build.mjs Frequenz` eine **Theme-Variante**: Frequenz als eigenes Theme mit der Nummer
**144**, Name *Frequenz*, Static ID `frequenz`, sichtbar unter *Shared Components › Themes*. Eine App nutzt es erst, wenn
du im App Builder auf dieses Theme umschaltest.

```sql
@Frequenz/install/frequenz-theme-install.sql <APP_ID> light     -- light | dark | auto
@Frequenz/install/frequenz-theme-uninstall.sql <APP_ID>         -- nur vor Unsubscribe/Switch Theme
```

Das Skript legt Theme 144 an, übernimmt die Einstellungen des Universal Themes der App, speichert die CSS-Bundles, die
beiden Schriftdateien, die Schriftlizenz und die Drittanbieter-Hinweise (zusammen 10 Dateien) als Theme-Dateien und
registriert die drei Styles. An der App selbst ändert
es nichts. Es bricht ab, bevor es etwas ändert, wenn die Nummer 144 schon ein fremdes Theme trägt, die Static ID
`frequenz` bei einem Theme mit anderer Nummer liegt oder APEX älter als 26.1 ist.

## Aktivieren und Nebenwirkungen

Der Installer und der Weg im App Builder sind für alle Themes dieses Projekts gleich; sie stammen aus demselben
Generator (`_tools/build.mjs`). Die bebilderte Anleitung, die Nebenwirkungen und die Testnachweise stehen deshalb an
einer Stelle: [Passepartout/docs/THEME-VARIANTE.md](../../Passepartout/docs/THEME-VARIANTE.md). Überall, wo dort
*Passepartout (142)* steht, gilt für dieses Theme *Frequenz (144)*.

Die wichtigsten Punkte in Kürze (APEX 26.1):

1. **Backup** der App exportieren. Es ist der einzige Rückweg zum Universal Theme.
2. *Shared Components › Themes › Frequenz › Theme Subscription › Unsubscribe*.
3. *Shared Components › Themes › Switch Theme*: Universal Theme (42) → Frequenz (144).
4. *Switch Theme* setzt *Column Span* und *Start New Column* aller Regionen und Items zurück. Das Layout danach prüfen.
5. Solange Theme 144 installiert ist und noch den UT-Master abonniert, listen die Template-Views jedes Template doppelt.
   Installiere das Theme deshalb erst kurz vor dem Umschalten.

Die Theme-Variante eignet sich damit vor allem für **neue Apps**, die von Anfang an mit Frequenz gebaut werden.

## Stand der Prüfung

Das Aussehen der Theme-Variante ist identisch mit der Style-Variante, denn beide laden dieselben Bundles aus `dist/`.
Getestet am 24.09.2026 in einer frischen UT-26.1-App: Der Installer legt Theme 144 an (abonniert den UT-Master,
alle Dateien aus `dist/` per HTTP 200, 3 eigene Styles, das aktive Theme der App bleibt 42), der Deinstaller entfernt es
wieder vollständig. *Unsubscribe* und *Switch Theme* sind im Builder nicht erneut durchgespielt; dafür gilt die
bebilderte Anleitung von Passepartout.
