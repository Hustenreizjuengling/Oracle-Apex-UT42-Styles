# Kracherl als eigenes Theme (Theme-Variante)

Stand: 24.09.2026, APEX 26.1.

Die **Style-Variante** (`install/kracherl-install.sql`) ist der empfohlene Weg für bestehende Apps: Sie legt drei
Theme Styles an das Universal Theme, ändert an der App sonst nichts und lässt sich jederzeit zurückschalten.

Die **Theme-Variante** legt Kracherl **zusätzlich** als eigenes Theme an: Nummer **145**, Name *Kracherl*,
Static ID `kracherl`, sichtbar unter *Shared Components › Themes*. Eine App nutzt es erst, wenn du im App Builder
darauf umschaltest.

> **Kurzfassung.** Das Theme bringt dieselben CSS- und Schriftdateien mit wie die Style-Variante, nur als
> Theme-Dateien (`#THEME_DB_FILES#`). Das Umschalten per *Switch Theme* hat in APEX 26.1 harte Nebenwirkungen:
> Es klappt nur nach einem *Unsubscribe*, setzt das Spaltenlayout aller Regionen und Items zurück und lässt sich per
> *Switch Theme* nicht rückgängig machen. Nimm die Theme-Variante deshalb nur für **neue Apps** oder für Apps, deren
> Layout du danach prüfst. Mache vorher immer ein Backup.

> **Teststand.** Installer und Deinstaller erzeugt derselbe Generator (`_tools/build.mjs`), dessen Theme-Variante für
> das erste Theme dieses Projekts in APEX 26.1 mit UT 26.1 und UT 24.2 durchgetestet wurde. Für Kracherl wurden
> Installation (Theme 145, alle Dateien per HTTP 200, 3 Styles) und Deinstallation am 24.09.2026 in einer frischen
> UT-26.1-App geprüft.

## Inhalt

1. [Theme oder Style: Vor- und Nachteile](#1-theme-oder-style-vor--und-nachteile)
2. [Installation per Skript](#2-installation-per-skript)
3. [Aktivieren: Backup, Unsubscribe, Switch Theme](#3-aktivieren-backup-unsubscribe-switch-theme)
4. [Style wechseln](#4-style-wechseln)
5. [Ergebnis prüfen](#5-ergebnis-prüfen)
6. [Zurück zum Universal Theme](#6-zurück-zum-universal-theme)
7. [Aktualisieren und Deinstallieren](#7-aktualisieren-und-deinstallieren)
8. [Bekannte Grenzen (APEX 26.1)](#8-bekannte-grenzen-apex-261)

---

## 1. Theme oder Style: Vor- und Nachteile

| | Style-Variante (empfohlen) | Theme-Variante |
|---|---|---|
| Wo sichtbar | *Themes › Universal Theme › Styles* | eigenes Theme *Kracherl (145)* unter *Themes* |
| Installation | `kracherl-install.sql` | `kracherl-theme-install.sql` |
| Aktivieren | Style auswählen, sofort und jederzeit umkehrbar | *Unsubscribe* und *Switch Theme*, umkehrbar nur über ein Backup |
| Templates | bleiben im Universal Theme und bekommen UT-Updates von Oracle | werden beim *Unsubscribe* eingefroren, keine UT-Updates mehr |
| Layout der App | unverändert | *Switch Theme* setzt *Column Span* und *Start New Column* aller Regionen und Items zurück |
| Template Components (Avatar, Badge …) | unverändert | laufen nach dem Umschalten über die Kopien in Theme 145 |
| Aussehen | Referenz | dieselben Dateien, derselbe Look |

**Wofür sich die Theme-Variante eignet:** für eine neue App, die du von Anfang an mit Kracherl baust. Dort gibt es
noch kein Layout, das verloren gehen kann. Außerdem, wenn du im App Builder ein Theme mit eigenem Namen sehen willst.

---

## 2. Installation per Skript

Voraussetzung ist APEX 26.1. Die App braucht das Universal Theme 42 (UT 24.2 oder 26.1). Ausführen in SQLcl,
SQL*Plus oder SQL Developer, verbunden als Parsing-Schema der App:

```sql
@Kracherl/install/kracherl-theme-install.sql <APP_ID> light     -- light | dark | auto
```

Das Skript legt Theme 145 *Kracherl* an. Es übernimmt die Einstellungen des Universal Themes der App, legt die
Theme-Dateien ab (3 Styles lesbar und minifiziert, 10 Schriftdateien, 2 Schriftlizenzen, Drittanbieter-Hinweise)
und registriert die Styles *Kracherl Light / Dark / Auto*. **An der App selbst ändert es nichts.** Am Ende stehen die nächsten Schritte:

```
Nächste Schritte (nur im App Builder möglich, Anleitung: docs/THEME-VARIANTE.md):
  1. App exportieren (Backup) – der Rückweg zum Universal Theme geht nur über dieses Backup.
  2. Shared Components > Themes > Kracherl > Theme Subscription > Unsubscribe
  3. Shared Components > Themes > Switch Theme: Universal Theme (42) -> Kracherl (145)
```

Das Skript bricht ab, **bevor es etwas ändert**, wenn

- die Nummer 145 schon ein fremdes Theme hat (ORA-20003) – dann in `theme.json` unter `themeVariant.number` eine freie
  Nummer eintragen und neu bauen,
- die Static ID `kracherl` bei einem Theme mit anderer Nummer liegt (ORA-20004),
- APEX älter als 26.1 ist (ORA-20005) oder der Style-Parameter unbekannt ist (ORA-20002).

> **Wichtig:** Solange Theme 145 den UT-Master abonniert, also direkt nach der Installation, listen die APEX-Views
> `apex_application_templates` und `apex_application_temp_*` jedes Template **zweimal**. Code, der dort per
> `SELECT … INTO` ein Template über seine ID sucht, bricht dann mit *TOO_MANY_ROWS* ab (in der UT-Referenz-App etwa
> die Plug-in-Region *Preview Template Options*). Nach dem *Unsubscribe* oder der Deinstallation ist das behoben.
> Installiere das Theme deshalb erst kurz bevor du umschaltest.

---

## 3. Aktivieren: Backup, Unsubscribe, Switch Theme

### 3.1 Backup

*App Builder › App › Export / Import › Export* (oder `apex export -applicationid <APP_ID>` in SQLcl). **Dieses Backup ist
der einzige Rückweg** (siehe Abschnitt 6).

### 3.2 Unsubscribe

*Shared Components › Themes › Kracherl*, Bereich *Theme Subscription*, *Unsubscribe* klicken und bestätigen. Danach ist
Theme 145 eine eigene Kopie aller Templates und Template Components des Universal Themes.

Was dabei passiert, auch wenn es der Dialog nicht sagt:

- APEX hängt **alle Template-Bezüge der App** auf die Kopien in Theme 145 um – Regionen, Buttons, Labels, Listen,
  Berichte, Navigation –, obwohl das Universal Theme noch aktiv ist. Theme 145 lässt sich danach nicht mehr einfach löschen.
- Der aktuelle Style von Theme 145 springt auf *Iris*. Setze ihn wieder auf Kracherl (Abschnitt 4) oder führe das
  Installationsskript noch einmal aus.
- Der interne Name wird zu `UNIVERSAL_THEME`. Die Static ID `kracherl` bleibt erhalten, daran erkennt das Skript das Theme weiter.

**Warum der Schritt nötig ist:** Ohne *Unsubscribe* bricht *Switch Theme* mit „Cannot Switch Template Component …“ ab.

### 3.3 Switch Theme

*Shared Components › Themes › Switch Theme*:

1. *Switch to Theme* = *145. Kracherl*.
2. Weil die Templates Kopien sind, ordnet APEX sie selbst zu. Nichts ändern, *Next*.
3. *Switch Theme*.

> **Achtung, Layout:** *Switch Theme* setzt in APEX 26.1 bei **allen** Regionen und Items *Start New Column* auf *Ja*
> und leert *Column Span*. Nebeneinander stehende Regionen rutschen dadurch untereinander. Das passiert auch mit einer
> von APEX selbst kopierten UT-Kopie und liegt nicht an Kracherl. Das Layout musst du danach von Hand wiederherstellen
> oder aus dem Backup nachziehen.

---

## 4. Style wechseln

Im App Builder: *Shared Components › Themes › Kracherl*, Bereich *Styles*, *Current Theme Style* wählen,
*Apply Changes*. Oder per Skript, das dabei nur Dateien und Styles aktualisiert:

```sql
@Kracherl/install/kracherl-theme-install.sql <APP_ID> dark     -- light | dark | auto
```

Die Liste zeigt neben den drei Kracherl-Styles auch die kopierten UT-Styles (Iris, Vita …). Sie stören nicht.

---

## 5. Ergebnis prüfen

In der gerenderten Seite lädt der Style zuerst die UT-Basis, dann das Kracherl-Bundle aus den Theme-Dateien:

```html
<link rel="stylesheet" href="/i/themes/theme_42/26.1/css/Vita.min.css?v=26.1.0">
<link rel="stylesheet" href="r/<workspace>/<app>/files/theme/145/v…/kracherl-light.min.css?v=<Version>">
```

Das CSS und die Schriften (`fonts/bitter-*.woff2`, `fonts/pt-sans-*.woff2`) kommen mit HTTP 200. `document.fonts`
meldet *Kracherl Slab* und *Kracherl Text* als geladen, der Body hat die Klasse `apex-theme-kracherl-light`.
Bei *Dark* ist die Basis `Vita-Dark.min.css`. Bei *Auto* bleibt die Basis `Vita.min.css`, und das Farbschema folgt dem
Betriebssystem.

---

## 6. Zurück zum Universal Theme

*Switch Theme* von *Kracherl (145)* zurück auf *Universal Theme (42)* **scheitert** in APEX 26.1 an den Template
Components; die App bleibt dabei unverändert. Der Rückweg ist das Backup aus Schritt 3.1:

- App Builder: *Import*, Backup-Datei, *Reuse Application ID*.
- SQLcl: `@f<APP_ID>.sql` als Parsing-Schema.

---

## 7. Aktualisieren und Deinstallieren

**Neue Kracherl-Version:** `node _tools/build.mjs Kracherl` und dann das Skript erneut ausführen. Es erkennt,
wenn Theme 145 schon entkoppelt ist (*Unsubscribe*), und aktualisiert dann **nur Theme-Dateien und Styles**.
Browser holen das neue CSS über den Parameter `?v=<Version>` aus `theme.json` – erhöhe dort bei jeder Änderung die Version.

**Deinstallieren:** `@Kracherl/install/kracherl-theme-uninstall.sql <APP_ID>`

| Zustand der App | Ergebnis |
|---|---|
| Theme 145 abonniert noch (nur installiert) | Theme, Dateien und Styles werden entfernt, das Universal Theme bleibt unberührt |
| Kracherl ist das aktuelle Theme | Abbruch **ORA-20006**: erst das Backup einspielen |
| nach *Unsubscribe*, Universal Theme noch aktuell | Abbruch **ORA-20007**: die App nutzt die Template-Kopien; erst das Backup von vor dem *Unsubscribe* einspielen |
| kein Theme 145 vorhanden | „nichts zu tun“ |

---

## 8. Bekannte Grenzen (APEX 26.1)

1. **Switch Theme auf ein abonniertes UT-Theme scheitert.** Abhilfe: *Unsubscribe* vor dem Umschalten.
2. **Unsubscribe hängt alle Template-Bezüge der App um** auf die Kopien im entkoppelten Theme; danach lässt sich das
   Theme nicht mehr löschen (ORA-20007 im Deinstaller).
3. **Switch Theme setzt das Grid-Layout zurück** (*Column Span*, *Start New Column*) bei allen Regionen und Items.
4. **Kein Rückweg per Switch Theme.** Zurück geht es nur über das Backup.
5. **Import über den App Builder** (Theme-Export einer anderen App) vergibt eine neue Theme-Nummer, die Template-Zuordnung
   muss man von Hand korrigieren, und *Switch Theme* scheitert bei Apps mit Template Components. Der zuverlässige Weg ist
   das Skript.
6. **Doppelte Zeilen in den Template-Views**, solange Theme 145 abonniert.
7. **Keine UT-Updates** für das entkoppelte Theme. Kommt ein neues Universal Theme mit einem APEX-Upgrade, bleibt
   Kracherl auf dem Stand des *Unsubscribe*.
8. **`files_version` nach Unsubscribe:** APEX setzt sie auf den Wert des Universal Themes zurück; für frisches CSS sorgt `?v=<Version>`.
