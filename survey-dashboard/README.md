# Sensou · Community Perceptions

Lokales Dashboard für den Hauptlauf **2jEY7L**. Pretests bleiben getrennt.

Die englische Oberfläche übernimmt Sensous Farben, Typografie, Logo und Wellenmotiv. Diagramme und CSV-Export sind als Community-Wahrnehmungen gekennzeichnet. Der Hinweis „Perceptions · Not game results“ bleibt beim Scrollen sichtbar.

## Starten

**`Start-Dashboard.cmd` doppelklicken**. Das Fenster offen lassen. Das Dashboard läuft unter <http://127.0.0.1:5174>.

Alternativ im Projektordner:

```powershell
npm run survey:build
npm run survey:start
```

Voraussetzung: Node.js 22.13+ und die vorhandenen Projektabhängigkeiten. Es wurden keine zusätzlichen Pakete benötigt. Der Game-Tracker auf Port 5173 bleibt separat.

## Aktuelle Antworten

- Der eingerichtete Tally-Key wird mit Windows DPAPI für denselben Windows-Benutzer verschlüsselt gespeichert. Er wird beim Neustart wieder geladen. Tally-Keys haben Kontorechte; diese Anwendung ruft ausschließlich lesend das Formular und dessen abgeschlossene Antworten ab.
- Beim Start, danach alle **fünf Minuten** und über **Aktualisieren** werden alle abgeschlossenen Abgaben des Hauptlaufs heruntergeladen. Das Intervall lässt sich unter **Daten & Methode** ändern.
- Der Server aktualisiert auch bei geschlossenem Browser. Bei geschlossenem Server oder ausgeschaltetem Rechner erfolgt kein Abruf. Der Browser liest den lokalen Stand alle 30 Sekunden neu ein.
- Jeder erfolgreiche Abruf ersetzt den Snapshot vollständig. Gelöschte Tally-Antworten verschwinden deshalb beim nächsten Abruf. Bei Netz-, Berechtigungs- oder Formatfehlern bleibt der letzte gültige Stand erhalten.
- Seitenweise API-Abfragen werden vollständig geladen und gegen die gemeldete Antwortzahl geprüft. Bei Änderungen während der Abfrage kann ein neuer Versuch nötig sein.

Der alternative CSV-Import erwartet einen unveränderten Tally-Export und die ausdrückliche Bestätigung des Hauptlaufs. Das Formular lässt sich aus einer CSV allein nicht zuverlässig erkennen. Bei aktiver API-Verbindung ersetzt der nächste Abruf einen manuellen Import wieder.

## Ansichten

- **Überblick:** Stärke, Zufriedenheit, Beteiligung und Zusammensetzung der Antworten.
- **Fraktionen:** Mittelwerte, Mediane, Verteilungen, Top-3-Nennungen und explizite Rankings. Fraktionen anklicken für Details.
- **Kreuzansichten:** Stärke oder Top-3-Nennungen nach Hauptfraktion und Erfahrung. Zellen zeigen ihre eigenen Nenner; eine Gruppe lässt sich in den globalen Filter übernehmen. Eigen-/Fremdbewertungen nutzen dieselbe Matrixfrage. Das Streudiagramm verknüpft Stärke-Ratings mit Top-3-Nennungen. Die Theme-Auswertung folgt der jeweiligen bedingten Frage.
- **Themes:** Globale Nennungen sowie gesonderte Folgefragen zu nominierten Fraktionen.
- **Matchups:** Gute und schlechte Nennungen aus Sicht der jeweiligen Hauptfraktion.
- **Freitext:** Lokale Themenübersicht, anklickbare Nennungen, Originalbelege, häufige freie Begriffe und Textsuche.

Globale Filter berechnen die Nenner der Live-Auswertungen neu; die **Synthesis** bleibt ein Bericht über die gesamte Befragung. Kleine Stichproben werden markiert; die einstellbare n-Grenze entfernt keine Antworten. Die oberste Stärke-Kachel berücksichtigt nur Fraktionen mit mindestens dieser Zahl an Bewertungen. **Fraktions-CSV** exportiert die gefilterte Fraktionsübersicht ohne IDs oder Freitexte.

## Interaktive Wahrnehmungsanalysen

Unter **Filter respondents by their opinions** lassen sich Bewertungsbereiche durch Ziehen über Balken, Einzelklick oder Auswahlfelder übernehmen. Mehrere Bedingungen werden mit UND kombiniert und bleiben als einzeln entfernbare Chips sichtbar. Die Vorschau-Histogramme zeigen die Basis nach den bisherigen Gruppen-/Datums-/Qualitätsfiltern, vor den zusätzlichen Meinungsbedingungen. Fehlende Werte und „Not enough experience“ erfüllen keine Bewertungsbedingung. Auch Freitexte und bedingte Theme-Nenner folgen der Auswahl.

**Explore perceptions** ergänzt vier Ansichten:

- **Consensus map:** Mittlere wahrgenommene Stärke und beobachtete Streuung; Punktgröße = gültige Bewertungszahl. Anklicken öffnet die vollständige Verteilung. Die Streuung ist die deskriptive Standardabweichung mit Divisor n, keine Unsicherheitsschätzung. Bei weniger als zwei Bewertungen wird kein Streuungspunkt gezeichnet. Die Abstände der ordinalen Skala werden für diese beschreibende Ansicht gleich behandelt.
- **Faction duels:** Vergleicht zwei Bewertungen innerhalb derselben Abgabe. Nur Antworten mit beiden gültigen Werten zählen; höhere, gleiche und niedrigere Bewertungen bilden den gemeinsamen Nenner. Die Paarmatrix lässt weitere Vergleiche auswählen. Ein Klick auf einen Ausgang öffnet die Freitexte dieser Gruppe. Die Prozentwerte sind keine Winrates.
- **Matchup cross-check:** Zeigt beide Besitzerperspektiven einer Paarung mit getrennten Nennern. „Gut“, „schlecht“, widersprüchlich auf beiden Listen und „nicht genannt“ bilden vier getrennte Gruppen. „Nicht genannt“ bedeutet kein neutrales Matchup. Ohne irgendeine Matchup-Antwort geht eine Abgabe nicht in den Nenner ein. Originalerläuterungen können sich auf mehrere Gegner beziehen.
- **Co-nomination network:** Knoten = Nennungen, Kanten = gemeinsame Nennungen in derselben stärksten/schwächsten Fraktionsfrage. Der Häufigkeitsregler blendet dünn besetzte Verbindungen aus. Bis zu drei Knoten oder eine Kante auswählen, um die gemeinsamen Stimmen zu lesen. Eine Dreierauswahl verlangt alle drei Fraktionen in derselben Antwort; drei einzelne Paarverbindungen reichen dafür nicht. Die Verbindungen belegen weder spielerische Synergie noch gemeinsam gespielte Listen. Für kleine Displays gibt es zusätzlich Fraktionsschaltflächen und eine Paartabelle.

Beim optionalen Zusammenfassen nach Respondent ID wird die letzte Abgabe vor allen Gruppenfiltern gewählt. Eine frühere passende Antwort wird dadurch nicht wieder eingeblendet, wenn die neueste die Auswahl nicht erfüllt.

## Written responses

Die gemeinsame Seite hat drei Unteransichten:

- **Synthesis** ist die Hauptansicht mit der ausgearbeiteten Gesamtauswertung und verlinkten Belegen.
- **Topic explorer** bietet die kompakte Schlagwortnavigation mit Frage-/Themen-/Wortfiltern, Volltextsuche, Originalantworten und CSV. Die lokalen globalen Filter gelten weiterhin für diese Ansicht.
- **By main faction** ist ein Rohling für die spätere Auswertung nach der tatsächlich angegebenen Main Faction. Auswahl und Direktlinks für alle 15 Fraktionen sind vorbereitet. Die Analysebereiche enthalten noch keine Befunde.

Die Gesamtauswertung wird aus Codebuch, Einzelzuordnungen und ausformulierten Lesarten erzeugt. Vorgehen und Befehle stehen in [synthesis/README.md](synthesis/README.md). Quellenlinks nutzen `#comments/synthesis/...`; bisherige `#synthesis/...`-Links funktionieren weiter. Die öffentliche Textprojektion erhält keine neue Verknüpfung mit Spielerprofilen.

## Auswertungsregeln

Das sind freiwillige Einschätzungen der Community, **keine gespielten Ergebnisse oder Winrates**. Es gibt keine Signifikanztests, Gewichtung oder Hochrechnung auf die gesamte Spielerschaft.

- Stärke und Zufriedenheit: gültige Werte 1–7, keine Imputation. „Not enough experience“, leere Antworten und ungültige Werte werden getrennt erkannt. Die Kreuztabelle zeigt diese fehlenden Matrixwerte bei Zellauswahl.
- Top 3: Anteil an Personen, die die jeweilige Nennungsfrage beantwortet haben. Mehrere Nennungen pro Person sind möglich; Summen dürfen über 100 % liegen. Unsortierte Nennungen ergeben kein Ranking. Nur explizite Rankings erhalten 3/2/1 Punkte für Platz 1/2/3.
- **Bedingte Themes:** Nur Personen, die die Fraktion unter den stärksten nennen, sind für ihre Folgefrage berechtigt. Erst danach wird zwischen Theme-Nennung, fehlender Erfahrung und leerer Antwort unterschieden. Prozentwerte lassen sich auf Berechtigte oder Theme-Antwortende beziehen. Gespeicherte Antworten außerhalb des passenden Zweigs werden ausgespart und markiert. Diese ausgewählte Gruppe darf nicht als allgemeine Theme-Nutzung interpretiert werden.
- **Eigene vs. andere Hauptfraktion:** Beide Gruppen werden aus derselben Matrixfrage verglichen. Die separate Frage zur Stärke der eigenen Fraktion ist in den Fraktionsdetails ausdrücklich separat ausgewiesen. Personen ohne angegebene Hauptfraktion zählen nicht zur Gruppe „andere“.
- Matchups: Nenner sind Personen der Zeilenfraktion mit mindestens einer guten oder schlechten Matchup-Nennung. Netto = (gute − schlechte Nennungen) / Antwortende × 100. Spiegelpaarungen bleiben in der Anzeige ausgespart. Antworten ohne Hauptfraktion können keiner Matchup-Zeile zugeordnet werden.
- Abgabe-IDs werden beim Import dedupliziert. Widersprüche bleiben markiert erhalten. Das optionale Zusammenfassen nach Respondent ID behält die letzte Abgabe dieses Browsers; die ID identifiziert keine verlässlich eindeutige Person.
- API-Zeitstempel werden nach Europe/Berlin in Tage gruppiert. CSV-Zeitstempel ohne Offset behalten ihren exportierten Kalendertag.

## Gemeinsame Fraktions-Baseline und optionale Modellintervalle

Die dunkle gepunktete Linie auf den Stärkeskalen ist die **durchschnittlich wahrgenommene Fraktion**: zuerst wird der Mittelwert je Fraktion berechnet, anschließend der ungewichtete Mittelwert dieser Fraktionsmittelwerte. Jede Fraktion mit mindestens einer gültigen Bewertung zählt genau einmal. Häufiger bewertete Fraktionen bekommen kein höheres Gewicht. Die Baseline verwendet dieselbe 1–7-Metrik wie die Mittelwert-Punkte; sie ist weder ein gepoolter Median noch ein gepoolter Mittelwert aller Einzelbewertungen.

Die Beschriftung nennt den Wert und die Zahl bewerteter Fraktionen von 15. Fraktionen ohne Bewertungen werden ausgespart, fehlende Antworten und „Not enough experience“ nicht ersetzt. Die n-Hervorhebungsgrenze verändert die Baseline nicht. Kleine oder unterschiedlich zusammengesetzte Bewertungsgruppen bleiben eine Einschränkung. Wie die vorhandenen Mittelwerte behandelt auch diese rein deskriptive Baseline die Skalenabstände als gleich groß; sie ist kein gemessener Balancewert oder Testschwellenwert.

Die helle Linie bleibt als feste Skalenmitte 4 erhalten. Überblick, Fraktionsansicht, Eigen-/Fremdbewertungsvergleich, Konsenskarte und Stärke-gegen-Nennungen zeigen dieselbe Baseline für die aktuelle globale Auswahl. Die Fraktion des Detailfensters oder die Achsenauswahl verändert sie nicht. Die Histogramme der Filter-Vorschau verwenden dagegen wie ihre Verteilungen die Basis **vor** zusätzlichen Meinungsbedingungen; das steht an der Vorschau.

Die bisherigen einzelnen Fraktions-/Gruppen-Medianstriche werden dadurch ersetzt. Individuelle Mediane bleiben in Tabellen, Details, Tooltips und Histogrammtexten verfügbar. Zufriedenheit ist eine andere Frage und bekommt keine Power-Baseline. Gestapelte Antwortanteile haben keine lineare 1–7-Achse und erhalten deshalb keine vertikale Baseline.

In **Explore perceptions → Faction duels** lässt sich **Show exploratory 95% model intervals** zuschalten. Für jede der drei Kategorien (A höher, gleich, B höher) wird ein punktweises zweiseitiges 95%-Wilson-Intervall mit z = 1,959963984540054 gezeigt. Der Nenner enthält dieselben vollständig gepaarten Abgaben einschließlich gleicher Bewertungen. Die Methode verwendet nur die Ordnung der beiden Bewertungen und benötigt für die Anteile keine gleich großen Skalenabstände.

Das ist eine explorative Präzisionsdarstellung unter einem unabhängigen Bernoulli-Modell innerhalb der gewählten Gruppe, keine Fehlerspanne für die gesamte Bushido-Community. Selbstselektion, Nichtteilnahme, lokale Spielgruppen und antwortabhängige Filter werden damit nicht korrigiert. Bekannte Browser-Mehrfachabgaben sperren die Darstellung, bis der vorhandene globale Filter für die letzte Browserantwort greift; auch das beweist keine unabhängigen Personen. Die drei Intervalle sind keine simultane 95%-Abdeckung, kein Fraktions-Signifikanztest und keine korrigierte Mehrfachvergleichsfamilie. Es werden keine p-Werte oder Signifikanzsterne erzeugt. Kleine n bleiben sichtbar; auch null Nennungen erhalten ein Intervall mit positiver Obergrenze.

Methodik: [NIST, Wilson intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm). Einordnung freiwilliger Stichproben: [AAPOR, model-based uncertainty and nonprobability polls](https://aapor.org/statements/understanding-a-credibility-interval-and-how-it-differs-from-the-margin-of-sampling-error-in-a-public-opinion-poll/).

## Lokale Themenübersicht für Freitext

Die Ansicht **Written responses** bietet elf vorgegebene Themen mit einsehbaren Suchwörtern. Sie ist eine **explorative, schlagwortgestützte Lesehilfe**, kein trainiertes Topic-Modell und keine generative KI-Zusammenfassung. Häufige freie Begriffe helfen beim Entdecken weiterer Inhalte. Kategorien können unterschiedlich breit sein; ihre Häufigkeit ist keine Rangfolge der Wichtigkeit.

- Standardmäßig wird nur die Frage nach den größten Meta-Problemen betrachtet. Die beiden anderen Fragen und eine gemeinsame Ansicht lassen sich wählen. Globale Filter wirken vor der Auswertung.
- Pro Thema zählt eine Abgabe-ID einmal, auch bei mehreren passenden Antworten und wiederholten Wörtern. Antworten können mehreren Themen zugeordnet sein; Anteile können sich auf mehr als 100 % summieren. Personenangaben bezeichnen eindeutige Abgaben, keine verifizierten Identitäten.
- Der Nenner umfasst nur Abgaben mit Text zur ausgewählten Frage. Fehlende oder nicht angebotene Antworten werden nicht als fehlende Themen-Nennung behandelt.
- Nennung bedeutet weder Zustimmung noch Kritik. Negierte oder gegensätzliche Aussagen können dieselbe Kategorie treffen. Ungematchte Texte bleiben vollständig lesbar.
- Beispiele werden anhand passender Suchwörter gewählt und als unveränderte Auszüge mit Kontext gezeigt. Sie sind keine Konsensmeinung. Alle Originalantworten bleiben erhalten.
- Die Mindestzahl blendet nur Themenbalken aus. Die Abdeckungszahlen beziehen sich auf alle elf Regeln. Die Textsuche filtert die Antwortliste; sie verändert die Themenbasis nicht.
- Der Topic-CSV-Export enthält Häufigkeiten, Nenner und Methodennotiz, keine Antwort-IDs oder Originalzitate.

Die Verarbeitung läuft im Browser, ohne zusätzliche Pakete, KI-Zugang oder Übertragung an einen Modellanbieter. Neue Tally-Daten aktualisieren die Übersicht automatisch. Regeln stehen unter **How this summary works** und in `text-topics.mjs`, die Oberfläche in `WrittenResponses.jsx`. Eine spätere semantische oder generative Analyse braucht ein zusätzliches Sprachmodell und eine Prüfung der Zuordnungen.

## Lokale Dateien

`private/` wird nicht durch den Webserver ausgeliefert und ist in `.gitignore` ausgeschlossen:

| Datei | Inhalt |
|---|---|
| `responses.json` | Normalisierte Einzelantworten für das Dashboard |
| `tally-raw.json` | Letzter API-Rohabruf inklusive Fragen und Formularstruktur; signierte Vorschau-/PDF-Links werden entfernt |
| `connection.json` | Verschlüsselter API-Key und Aktualisierungsintervall |

Die Antwortdateien enthalten IDs und Freitext und sind **nicht verschlüsselt**. Sie gehören nicht in ein öffentliches Repository oder eine Veröffentlichung. Der Server bindet nur an 127.0.0.1; er ist kein öffentliches Hosting. Für ein Backup der Antworten die beiden Datendateien separat sichern. Der verschlüsselte Key ist an den Windows-Benutzer gebunden und sollte bei einem Rechnerwechsel neu verbunden werden. Widerrufen lässt er sich in [Tally → API keys](https://tally.so/settings/api-keys).

Die bisherige Löschzusage des Hauptlaufs gilt auch für lokale Exporte und Backups: Rohdaten drei Monate nach Umfrageende löschen. Das Dashboard richtet dafür keinen automatischen Löschjob ein.

## Integration in die Website

Die bestehende lokale Vollversion bleibt `main.jsx` mit Port5174 und `npm run survey:build`. Die öffentliche Website verwendet `public.jsx` und dieselben Diagramm-Komponenten; gebaut wird sie im Projekt-Hauptordner mit `npm run build:meta`. Game Meta und die neun Survey-Bereiche werden links über `src/hub-navigation.jsx` navigiert.

`npm run survey:publish-snapshot` erzeugt die öffentlichen Aggregatdateien und den separat geprüften Textkorpus. Die privaten Antwortdateien oder der lokale Dashboard-Build dürfen nicht als öffentliche Website hochgeladen werden. Details und Veröffentlichungsgrenzen stehen in `../PUBLIC-RELEASE.md`.

Neu unter `private/`: `public-text-review.json` enthält Quelltext-Hashes, Freigaben, unabhängige Dokumentkennungen und gegebenenfalls bereinigte Fassungen. Dieser Prüfstand ist privat und fällt ebenfalls unter die Löschzusage der Umfrage. Ungeprüfte, geänderte oder gelöschte Quellen werden nicht automatisch als bisher freigegebener Text weiterveröffentlicht. Eine neue Anonymitätsprüfung ist nötig; daraus entsteht keine fertige qualitative Gesamtauswertung.

Die öffentliche Freitextansicht zeigt keine Hauptfraktion, Erfahrung, Zeitstempel oder Antwortprofile. Texte derselben Abgabe werden nicht öffentlich miteinander verknüpft. Über mehrere Fragen zählen Themenhäufigkeiten deshalb Antwortdokumente; die lokale Version behält ihre ursprünglichen Zählungen nach Abgabe-ID.

## Prüfen und weiterentwickeln

```powershell
npm run survey:test
npm run survey:dev
```

Tests decken CSV-Fehler, das echte Tally-Matrixformat, fehlende Erfahrung, Rankings, Frage-Nenner, bedingte Zweige, Gruppenfilter, Eigentümervergleich, Matchups, Zeitzonen, API-Paginierung, falsche Formulare und verschlüsselte Schlüsselspeicherung ab. Sie nutzen synthetische Testfälle und verändern keine echten Antworten.

Die Analysefunktionen stehen in `analysis.mjs` und `cross-analysis.mjs`, der lesende Abruf in `tally.mjs`. `server.mjs` speichert atomar und schützt lokale Schreibzugriffe mit Origin-/Host-Prüfung und CSRF-Token. Die React-Oberfläche und Diagramme verwenden die bereits vorhandenen Projektpakete, SVG und CSS; Schriften werden lokal ausgeliefert.

API-Vertrag: [Tally Submissions](https://developers.tally.so/api-reference/endpoint/forms/submissions/list), [API keys](https://developers.tally.so/api-reference/api-keys).

Die Auswertungsprüfung wurde durch den Skill `statistical-analysis` unterstützt. Referenz: Kassis, T., Agarwal, V., He, Y., Patel, D., & Brueckner, A. M. (2026). *Scientific Agent Skills: A Library of Procedural Knowledge for Research Agents*. [arXiv](https://doi.org/10.48550/arXiv.2609.00065).

## Cloud-Aktualisierung · 31. Oktober 2026

Die öffentliche Website liest jetzt die veröffentlichte Supabase-Datenrevision. Die Edge Function `survey-refresh` ruft Tally stündlich zur Minute17 ab; `pg_cron` und `pg_net` starten den Job mit einem separaten, in Vault gespeicherten Token. Die Seite prüft alle fünf Minuten auf neue Daten und bietet Refresh. `publication.json` wird erst nach allen Dateien einer Revision ersetzt. Dadurch stammen Diagramme, Gruppen und Texte stets aus demselben Abruf.

Der vorhandene Tally-Schlüssel liegt als Edge Secret vor. Rohantworten werden im Server-Arbeitsspeicher verarbeitet. Der öffentliche Bucket `sensou-survey` enthält ausschließlich die expliziten öffentlichen Projektionen. `sensou-survey-review/ledger.json` bleibt privat und enthält die geprüften Quelltext-Hashes. Neue oder geänderte Texte werden zurückgehalten. Nach einer neuen lokalen Anonymitätsprüfung muss die private Ledger-Datei auch im privaten Cloud-Bucket ersetzt werden; lokale Änderungen allein reichen nicht.

Stand der geprüften Veröffentlichung:159 Abgaben,21 Gruppen,211 geprüfte Textdokumente,5 bearbeitete Texte. Der Parser akzeptiert nun auch `4 (neutral)`:139 gültige Zufriedenheitsbewertungen mit Mittelwert4,62. Die Live-Seite verwendet den Cloud-Stand; `npm run survey:publish-snapshot` erzeugt weiterhin eine lokale statische Ausgabe zur Prüfung. Einrichtung, Diagnose und noch offene Abnahmen stehen in `../PUBLIC-RELEASE.md` und `../qa/WEBSITE-REVIEW-2026-10-31.md`.

## Ausführliche Textanalyse und Abweichungen · 1. November2026

Die erste Textanalyse ist unter `#comments` integriert:214 einzeln gelesene Dokumente,17 Themen,5 ausführliche Kapitel,15 Fraktionsperspektiven sowie Gegenstimmen und Folgefragen. Alle Lesarten führen zu aufrufbaren Originalantworten mit Suche, Fragefilter und Direktlink. Die Edition hat einen festen Analyseschluss; neue Live-Texte werden zur Einordnung markiert. Methodenbeschreibung und Kodierregeln sind auf der Seite sichtbar.

Der modulare Aufbau und die Befehle für den nächsten Durchgang stehen in [synthesis/README.md](synthesis/README.md). Die Ausgabe wird aus Codebuch, Einzelzuordnungen und ausformulierten Lesarten erzeugt. Der Build prüft die Quellen-Hashes und Belege. Der neue lokale Endpunkt `/api/public-texts` liefert ausschließlich die anonymitätsgeprüfte Projektion; Rohprofile gelangen nicht in die Textsynthese.

Die Cross-Analysis-Matrix bietet nun einen Umschalter für Abweichungen: Gruppenmittel minus Durchschnitt derselben Fraktion in der aktuellen Gesamtauswahl. Rohwerte, gültige n und Verteilungen bleiben in den Details sichtbar. Die Farbskala ist symmetrisch um0. Kleine bzw. ausgeblendete Werte behalten ihre bisherigen Grenzen.
