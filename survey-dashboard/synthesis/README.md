# Textsynthese: Aufbau und nächster Durchgang

Die erste Edition vom1. November2026 umfasst214 anonymitätsgeprüfte Antwortdokumente aus102 Abgaben, bei164 Umfrageabgaben zum Analyseschluss.89 Texte beantworten die Meta-Frage,59 die Themen-Frage und66 die Frage zur eigenen Fraktion und zu Matchups.208 Antworten enthalten konkrete Inhalte;4 verzichten auf eine Bewertung und2 sind ohne erklärenden Mechanismus. Alle214 wurden gelesen und bleiben im Belegbrowser zugänglich.

Die öffentliche Seite ist englischsprachig und liegt unter https://sensoutrack.pages.dev/survey/#synthesis. Sie enthält17 Themenprofile,5 ausführliche Kapitel,6 thematische Verbindungen,15 Fraktionsperspektiven,5 Gegenperspektiven und6 Folgefragen. Quellen öffnen im Dialog; Suche, Fragefilter und Direktlinks bleiben innerhalb der geprüften öffentlichen Dokumente.

## Module

| Datei | Aufgabe |
|---|---|
| codebook.json | Definitionen, Ein-/Ausschlüsse, Themenfamilien, Methode und Version |
| coding.json | Einzelzuordnungen: stabile Dokumentreferenz, öffentliche Dokument-ID, SHA-256 des geprüften Wortlauts, Frage, Themen, Disposition und explizite Zusatzmerkmale |
| editorial.json | Ausformulierte Lesarten, Kapitel, Gegenstimmen, Fraktionsbeispiele und Folgefragen mit Belegreferenzen |
| ../synthesis-analysis.mjs | Quellenabgleich, Themen-/Fragezählungen, Schnittmengen und CSV; gemeinsam für Browser und Build |
| ../../scripts/build-survey-synthesis.mjs | Validierung, Review-Queue und reproduzierbarer Bericht-Build |
| ../synthesis-report.json | Generiertes Ergebnis; nicht von Hand bearbeiten |
| ../SynthesisReport.jsx und ../synthesis.css | Darstellung und Belegnavigation |

Der Browser bezieht den Wortlaut aus der aktuellen geprüften Veröffentlichung. Lokale Vollversion: lesender, lokal gebundener Endpunkt /api/public-texts. Öffentliche Website: bestehender Supabase-Publikationspfad. Der Bericht enthält Quellen-IDs und Hashes. Wörtliche Auszüge werden beim Build auf Zeichenbereiche abgebildet; der Browser zeigt sie nur bei passendem aktuellem Hash. Er enthält keine Rohantwort-IDs, Profile oder private Prüfliste.

## Neu berechnen

1. Im lokalen Dashboard Tally aktualisieren und den abgeschlossenen Abruf abwarten.
2. Neue oder geänderte Texte auf Anonymität prüfen. Freigaben in private/public-text-review.json pflegen; die private Cloud-Kopie ledger.json im Bucket sensou-survey-review aktualisieren, bevor diese Texte online erscheinen sollen.
3. Öffentliche Eingabedaten erzeugen:

```powershell
npm run survey:publish-snapshot
npm run survey:synthesis:prepare
```

Die Queue liegt unter survey-dashboard/private/synthesis-review-queue.json. Neue, geänderte und entfernte Quellen werden ausgewiesen. Für einen anderen geprüften Eingabestand ist --input <Pfad> möglich. Die Queue wird nicht öffentlich ausgeliefert.

4. Neue Texte vollständig lesen, Zuordnungen gegen das Codebuch prüfen und coding.json ergänzen bzw. korrigieren. Dokumentreferenzen werden aus den zufälligen öffentlichen Dokument-IDs abgeleitet und bleiben stabil. Die Queue schlägt diese Referenz vor. Zuordnungen werden nach öffentlicher Dokument-ID sortiert; es gibt keine öffentliche Reihenfolge nach Abgabe oder Person. Pro Dokument nur eine ID, eine Frage und eine exakte Wortlaut-Prüfsumme. Für konkrete Inhalte disposition=substantive und mindestens ein Thema; für knappe Antworten oder Bewertungsverzicht brief bzw. abstention ohne Themen. Neue Einträge in der Queue sind zunächst unreviewed und werden vom Build abgelehnt.
5. Den inhaltlichen Durchgang auch im Editorial nachziehen: neue Gegenbeispiele aufnehmen, veraltete Aussagen korrigieren und Belegreferenzen prüfen. Edition, Analyseschluss und Korpus-Metadaten aktualisieren. Bei veränderten Definitionen Codebuchversion und betroffene Zuordnungen gemeinsam anpassen.
6. Bericht und Website neu erzeugen:

```powershell
npm run survey:synthesis:build
npm run survey:synthesis:check
npm run survey:test
npm test
npm run build:meta
```

Der Build berechnet Themenhäufigkeiten, Frage-Nenner, positive Gesamturteile und Schnittmengen neu. Er prüft doppelte IDs/Referenzen, unbekannte Themen, unvollständige Zuordnungen, Wortlautänderungen, entfernte Dokumente und nicht belegbare Zitate. Die Interpretationen werden beim nächsten inhaltlichen Durchgang überarbeitet. Es wird kein externes Sprachmodell aufgerufen.

build:meta und survey:build prüfen, ob das generierte Ergebnis zum Quellstand passt. Für die lokale Vollversion anschließend npm run survey:build verwenden. Öffentlich nur dist-meta/ in das bestehende Pages-Projekt hochladen.

## Verhalten bei neuem Live-Material

Die Seite prüft alle Dokument-Hashes gegen die aktuelle öffentliche Textveröffentlichung. Neue oder geänderte Antworten werden zur thematischen Prüfung markiert. Gelöschte oder veränderte Dokumente verschwinden aus den zugeordneten Beleglisten und laufenden Zählungen. Die ausformulierte Interpretation bleibt als datierte Edition gekennzeichnet. Quellenhinweise nennen den passenden Stand; die allgemeinen Umfragezahlen können inzwischen weitergestiegen sein.

## Zähleinheit und Qualitätsprüfung

Eine Antwort auf eine Frage ist ein Dokument. Eine Abgabe kann bis zu3 Dokumente beitragen; öffentliche Dokument-IDs sind nicht miteinander zu Personen verknüpft. Mehrere Themen können in derselben Antwort vorkommen. Häufigkeiten beschreiben Erwähnungen einschließlich Stärken und Problemen. Frage-Nenner sind89/59/66 für diese Edition; die Gesamtsicht nutzt214 Dokumente.

Zwölf Meta-Antworten enthalten ausdrücklich positive Gesamturteile. Zwei Grenzfälle mit bloßer Abwesenheit großer bzw. besonders negativer Probleme wurden nach der Konsistenzprüfung aus dieser Kennzeichnung entfernt. Dies ist eine einzelne, mit Codex erstellte Analyse samt Konsistenzchecks; eine unabhängige Zweitkodierung liegt nicht vor. Die Methode ist auf der Seite offengelegt.

Automatische Checks stehen in synthesis-analysis.test.mjs. Quellenänderungen, Fragenwechsel, neue und entfernte Texte werden getestet; neue Texte übernehmen keine alten Kategorien. Abweichungen in der Cross-Analysis werden separat in ../rating-deviation.mjs berechnet und getestet: Gruppenmittel minus Mittel derselben Fraktion in der aktuellen Gesamtauswahl. Rohwerte, n und Histogramme bleiben erhalten.

Methodische Vorbereitung: Kassis, T., Agarwal, V., He, Y., Patel, D., & Brueckner, A. M. (2026). Scientific Agent Skills: A Library of Procedural Knowledge for Research Agents. https://doi.org/10.48550/arXiv.2609.00065. Der Skill scientific-critical-thinking unterstützte die Prüfung von Einheit, Nennern, Belegführung und Gegenperspektiven. Die Software-/Methodenreferenz steht auch im öffentlichen Methodikabschnitt.

## Written responses navigation · 1 November 2026

All written material now sits under Written responses: Synthesis (default), Topic explorer (keyword browsing), By main faction (layout only, no faction-group publication). The 15 faction choices use shareable #comments/factions/<slug> routes. Later analysis must group by the respondent's actual main faction through the private source/review workflow; it must not infer ownership from text mentions or expose the private profile mapping. Existing faction lenses in the overall edition remain examples of faction-related passages.

Canonical evidence URLs use #comments/synthesis/<kind>/<id>; legacy #synthesis URLs still resolve. The keyword explorer retains question/topic/word filters, full-text search, unmatched answers and CSV; repeated summaries, featured-answer duplication and public profile disclaimers were removed.

## Deviation heatmap colours · 1 November 2026

The symmetric colour range uses the 90th percentile of absolute visible cell deviations, rounded up to a quarter point, minimum ±0.5. Values outside this range retain their full numbers and use the end colours. Stronger opaque terracotta/cream/green fills replace low-opacity tinting. Legend bounds use ≤/≥; colour methodology is expandable. Labels switch black/white with WCAG relative-luminance contrast at least 4.5:1 across the palette; sample-count labels retain full opacity. Current ranges: faction ±0.75, experience ±0.50. Absolute ratings and nomination scales are unchanged.
