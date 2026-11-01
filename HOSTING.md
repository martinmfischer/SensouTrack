# Kostenlos online: Cloudflare + Supabase

Stand: 26. Oktober 2026. Supabase Free „Sensou“ (EU/Ireland) und Cloudflare Static Assets „sensoutrack“ sind angelegt. Die App ist unter https://sensoutrack.the-zj.workers.dev erreichbar. Das Datenbankschema ist angewendet; die Live-Prüfung der Tabellenrechte ist bestanden. Turnstile ist serverseitig aktiviert; ein Login ohne CAPTCHA-Nachweis wird abgewiesen. Brevo SMTP ist verbunden und Bestätigungsmails sind laut Provider zugestellt; vollständige Hosted-Auth-Tests stehen noch aus. Aktueller Einzelstatus: `hosting-status.json`.

## Auswahl

Seit der AdSense-Einrichtung gibt es zusätzlich die öffentliche Meta-Seite unter https://sensoutrack.pages.dev/. Sie wird als eigenes kostenloses Pages-Projekt aus `npm run build:meta` / `dist-meta/` veröffentlicht. Konten, Spielmeldung und private Historie bleiben in der bestehenden Workers-App. Die öffentliche Seite nutzt dieselbe anonymisierte Supabase-Projektion, enthält aber keinen Auth-Client. Supabase-Redirects und Turnstile-Hostlisten müssen für diese reine Leseseite nicht erweitert werden. AdSense akzeptiert die ursprüngliche zusätzliche Workers-Unterdomain nicht als Website; die Pages-Adresse wurde akzeptiert, ihre Inhaberschaft bestätigt und eine Prüfung beantragt. Werbung wird noch nicht ausgeliefert. Details: `ADS-OPTIONS.md`.

| Teil | Anbieter | Free-Tarif / relevante Grenze |
|---|---|---|
| React-Oberfläche + HTTPS | Cloudflare Workers Static Assets | Statische Abrufe kostenlos und unbegrenzt; keine eigenen Worker-Funktionen nötig |
| API + dauerhafte PostgreSQL-Datenbank | Supabase Free | 500 MB Datenbank, 5 GB Egress, 50.000 monatlich aktive Auth-Nutzer |
| Accounts, Login, E-Mail-Bestätigung, Passwort-Reset | Supabase Auth | Im Free-Tarif enthalten; öffentlicher E-Mail-Versand benötigt einen SMTP-Anbieter |

Für einen kleinen Community-Start passt das voraussichtlich. Supabase kann Free-Projekte bei geringer Aktivität über eine Woche pausieren. Free enthält keine automatischen Datenbank-Backups. Bei überschrittenen Free-Kontingenten sind Einschränkungen möglich; nicht automatisch auf einen kostenpflichtigen Tarif wechseln.

Render Free wurde geprüft: lokale SQLite-Dateien verschwinden bei Neustarts/Spin-downs, und kostenlose Render-Postgres-Datenbanken laufen nach 30 Tagen ab. Daher passt das nicht zu einer dauerhaft kostenlosen Spielhistorie.

Quellen: [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Supabase Preise](https://supabase.com/pricing), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Render Free](https://render.com/docs/free).

## Einmalige Einrichtung

1. Kostenloses Konto bei [Supabase](https://supabase.com/dashboard) und [Cloudflare](https://dash.cloudflare.com/sign-up) anlegen. Kontoanlage, persönliche Daten, Nutzungsbedingungen und Login erledigt der Kontoinhaber. Kein kostenpflichtiger Tarif erforderlich.
2. In Supabase ein Free-Projekt erstellen, möglichst mit EU-Datenbankregion. Im SQL Editor den gesamten Inhalt von `supabase/schema.sql` ausführen. Das legt Spieltabelle, Theme-Validierung, Zugriffsschutz und die öffentliche Projektion ohne persönliche Daten an.
   Für das bereits bestehende Sensou-Projekt ist die Umstellung auf Passwort und bestätigte E-Mail in `supabase/migrations/20261026_email_auth.sql` enthalten und bereits angewendet. Diese Migration erhält Accounts und Spiele.
3. Unter Supabase Authentication die Mindestlänge für Passwörter auf 15 setzen und E-Mail-Bestätigung aktiv lassen. Für Bestätigung und Passwort-Reset einen SMTP-Anbieter konfigurieren. Supabase-Standardmail ist auf Team-Adressen und derzeit zwei Mails pro Stunde beschränkt; damit ist eine offene Community-Registrierung nicht betriebsbereit. Vorhandener SMTP-Zugang ist ausreichend, sonst einen passenden Free-Anbieter einrichten. Dessen Voraussetzungen, Domainkosten und aktuelle Versandlimits gesondert prüfen.
4. Projekt-URL und den **Publishable Key** aus Supabase übernehmen. `.env.example` nach `.env.cloud.local` kopieren und die Werte eintragen. Dies ist öffentliche Browserkonfiguration; niemals `service_role` oder `sb_secret_...` verwenden. Der getrennte Cloud-Modus lässt lokale Builds unverändert.
5. TOTP in Supabase deaktivieren und „Limit duration of AAL1 sessions“ ausschalten, damit bestätigte Passwort-Logins nicht nach 15 Minuten gesperrt werden. Cloudflare Turnstile in Supabase Auth als CAPTCHA konfigurieren. Den öffentlichen Site Key zusätzlich als `VITE_TURNSTILE_SITE_KEY` setzen; der geheime Schlüssel bleibt ausschließlich in Supabase. Die verpflichtenden Einstellungen und Tests stehen in `SECURITY.md`.

6. Cloud-Build erzeugen:

```powershell
npm run build:cloud
```

7. Den Browser bei Cloudflare anmelden und veröffentlichen:

```powershell
npx wrangler login
npm run deploy
```

`deploy` prüft die öffentliche Supabase-Konfiguration, baut die Oberfläche und lädt `dist-cloud/` anhand von `wrangler.jsonc` hoch. Alternativ im vorhandenen Cloudflare-Projekt „sensoutrack“ → New deployment nur den Inhalt von `dist-cloud/` als ZIP hochladen. Keine Quellcode-, Datenbank- oder Schlüsselordner hochladen. Die vorhandene HTTPS-Adresse ist `sensoutrack.the-zj.workers.dev`; eine eigene Domain ist optional. Das Cloudflare-CLI wird bei Bedarf über npm geladen. Die SQLite-Datei und lokale Accounts werden nicht hochgeladen.

8. Die tatsächliche HTTPS-Adresse in Supabase unter Authentication → URL Configuration als Site URL und erlaubte Redirect-URL eintragen, zusätzlich die Adresse mit `/?recovery=1` für Passwort-Reset. Diese beiden exakten Produktionsadressen sind bereits konfiguriert; keine Wildcard. Lokale Cloud-Testadressen nur bei Bedarf separat erlauben.
9. Auf der echten URL einmal Registrierung mit E-Mail-Bestätigung, Logout/Login, Passwort-Reset, Spielmeldung, persönliche Notizen und Spiel-Löschung testen. Mit zwei Accounts prüfen, dass fremde private Notizen unzugänglich bleiben. Danach Installation auf iPhone und Android prüfen.

Alternativ ist Cloudflare Pages mit `npm run build:cloud`, Ausgabeordner `dist-cloud`, denselben Vite-Variablen und der mitgelieferten `_headers`-Datei möglich. Die App nutzt Hash-Navigation und braucht keine Catch-all-Weiterleitung. Eine Regel `/* /index.html 200` wird vom Workers-Upload als mögliche Schleife abgewiesen.

## Mailversand für den kostenlosen Test

Ausgewählt: zunächst kostenlos testen, ohne Domainkauf. Empfehlung: Brevo Free, derzeit bis zu 300 Transaktionsmails pro Tag. Der Kontoinhaber erstellt und bestätigt das Konto selbst. Anschließend den Absender verifizieren und einen SMTP-Schlüssel ausschließlich in Supabase Auth → Emails → SMTP eintragen. Niemals das Brevo-Loginpasswort oder SMTP-Geheimnisse in Vite-Variablen, Quellcode oder Chat kopieren. Ohne eigene authentifizierte Domain ersetzt Brevo den Absender durch eine Provider-Adresse; für den öffentlichen Betrieb eine eigene Absenderdomain mit DKIM/DMARC einplanen. Brevo-Konto und dedizierter SMTP-Schlüssel sind eingerichtet; Supabase nutzt Port587 und Brevo meldet Bestätigungsmails als zugestellt.

Quellen: [Brevo Free](https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans), [Brevo Absenderregeln](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders).

## Vor dem Community-Start

Die App ist ein MVP. Öffentliche Spiele sind selbstgemeldet und unbestätigt; Moderation, Gegnerbestätigung, automatische Erkennung von Doppelmeldungen verschiedener Accounts, Löschung des gesamten Accounts und Regelversionsvergleiche sind noch nicht implementiert. Betreiber-/Kontakt- und Datenschutzhinweise sind auf beiden Websites veröffentlicht; Account-Löschanfragen laufen über die angegebene Kontaktadresse. Keine lokale Testdatenbank veröffentlichen. Im Free-Tarif regelmäßige Datenbank-Exporte als Backup vorsehen.

Schriftarten werden lokal ausgeliefert. Account- und Datenbank-Sicherheit, Betreiber-MFA, Session-Widerruf, CAPTCHA und Wiederherstellung müssen vor dem öffentlichen Start anhand von SECURITY.md im tatsächlichen Hosting geprüft werden. Werbung bleibt deaktiviert.

## Öffentliche Survey und Pages-Worker

Der Top-Level-Switch führt zwischen Game Meta und `/survey/` hin und her. Die Survey veröffentlicht einen datierten Aggregat-Snapshot aus 118 Hauptlauf-Abgaben; keine Rohantworten, IDs, Freitexte oder Tally-Schlüssel. Aktualisierung und verbleibende Startprüfungen: `PUBLIC-RELEASE.md`.

Nur die öffentliche Startseite `/` verwendet einen kleinen Pages-Worker, der pro HTML-Abruf eine neue CSP-Nonce erzeugt. `_routes.json` begrenzt ihn auf diese Route; Survey, Rechtstexte und Assets bleiben statisch. Der Account-Worker bleibt eine separate statische App. Im fertigen Release sind Google-Werbe- und CMP-Skripte deaktiviert. Den Free-Plan nicht automatisch erweitern.
