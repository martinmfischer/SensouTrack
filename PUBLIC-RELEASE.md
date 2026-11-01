# Public release · 1 November 2026

## Live applications

- Game Meta: https://sensoutrack.pages.dev/
- Meta Survey: https://sensoutrack.pages.dev/survey/
- Accounts and reporting: https://sensoutrack.the-zj.workers.dev/
- The former survey.sensoutrack.pages.dev preview redirects to the canonical site, preserving paths and browser fragments.
- Account login uses a password and confirmed email. Email recovery, CAPTCHA, ownership policies and session controls remain enabled. Player TOTP is disabled as requested.

## Survey updates

The public survey now reads the public Supabase publication. The survey-refresh Edge Function retrieves the main Tally survey hourly at minute17 UTC via pg_cron/pg_net. It computes all public projections and uploads a complete immutable revision before committing publication.json. Browsers pin every file to that revision, check every five minutes while visible and offer a Refresh button. The timestamp shows the server's last successful Tally fetch. A publication older than24 hours is marked overdue.

Current verified publication:165 main-survey submissions;21 predefined faction, experience or day groups;214 privacy-reviewed written answers, including6 edited answers. New or changed text stays withheld until reviewed. Numeric aggregates update automatically. Satisfaction now includes40 answers labelled “4 (neutral)”:139 valid ratings, mean4.62/7. The old parser had dropped these labels.

All original public analysis areas remain: Overview, Factions, Explore perceptions (consensus, paired duels, reciprocal matchups, nomination network), Cross-analysis, Themes, Matchups, Written responses, Text synthesis and Data & methods. Navigation uses a left sidebar and mobile drawer. Fully withheld matchup groups show one short empty state. Shiho now has8 matchup respondents; Ataka and Imperial remain below the five-response publication minimum.

The local full dashboard remains survey-dashboard/main.jsx on port5174, with its existing private Tally connection. The public entry is survey-dashboard/public.jsx. Build commands remain npm run survey:build (local), npm run build:meta (public), npm run build:cloud (account).

## Private/public boundary and operation

- Tally's existing API key and the dedicated job token are Supabase Edge secrets. The same job token is referenced through Vault by the cron job. Neither is included in browser bundles, SQL text or public objects.
- The private bucket sensou-survey-review contains ledger.json, the exact-source text approvals. The bucket sensou-survey contains only explicit public projections. Anonymous/authenticated clients have no storage-write policies.
- Raw Tally responses are processed in server memory. Respondent IDs, numeric response vectors and text-profile links are excluded from public projections. Numeric groups need at least5 responses; matchup publication uses5 respondents per faction row.
- Texts have independent document IDs and no faction, experience or submission-time profile. Review edits are marked. Original participant retention/deletion promises also apply to the private ledger and backups.
- To review new text: refresh the private local dashboard, read each new/changed answer, update survey-dashboard/private/public-text-review.json, and replace ledger.json in the PRIVATE sensou-survey-review bucket. The next scheduled refresh publishes eligible text. Local ledger edits alone do not update cloud approvals.
- The publication keeps the current and previous complete revision. A failed upload leaves the previous pointer intact. Inspect function logs and cron.job_run_details for failures; net._http_response contains the request outcome. Never include keys or raw text in logs.
- supabase/survey-sync.sql documents bucket creation and the existing schedule; supabase/functions/survey-refresh/index.ts is the entry point. The dashboard deployment bundle can be generated with esbuild as recorded in qa/WEBSITE-REVIEW-2026-10-31.md.
- npm run survey:publish-snapshot still generates a local static release for inspection/backup. The current public UI uses public Supabase storage directly. Static same-origin JSON files in dist-meta are build-time snapshots.
- Deploy only dist-meta/ or dist-cloud/. Never deploy environment files, private directories, SQLite data, DPAPI material or the local full dashboard build.

## Review and verification

23 app tests and48 survey tests pass. Public, account and local survey builds passed. Dependency audits found0 vulnerabilities. The public release audit matched214 texts to the private approvals with6 edits and found no source respondent IDs, profile fields, email/handle patterns, auth implementation or Google ad bootstrap.

The actual scheduled refresh returned HTTP200 with159 submissions,211 reviewed texts,0 pending texts and cleanupPending:false. Subsequent hourly runs were visible in the Supabase dashboard; the measured159-response run used about1,085ms CPU and12.1s wall time. Recheck CPU as the survey grows; Supabase Free currently allows2s CPU per invocation.

Live browser checks covered API freshness, old preview redirects, all survey views, representative group/threshold changes, faction duels, reciprocal matchups, network selection, text search and empty results. Mobile390px checks covered menu focus, Escape, keyboard wrapping and page overflow. An isolated disposable local account covered sign-up, report validation, successful save, private history/stats/search, escaped notes, deletion and logout. Real accounts and games were preserved.

Detailed findings and remaining acceptance checks: qa/WEBSITE-REVIEW-2026-10-31.md. No Git commit was created; this folder is not a Git checkout.

## Advertising

AdSense dashboard checked31 October: sensoutrack.pages.dev is “Wird vorbereitet”; ads.txt is “Autorisiert”. Manual horizontal unit and category blocks remain configured; Auto ads and automatic optimization are off. Google-only English/German consent messages remain published.

Google ad and CMP scripts stay disabled in the visitor build. Earlier CMP-only tests loaded the API but did not show the consent dialog. The TCF event API now uses version2. Before activation: Google site approval, a visible consent dialog, reject/accept/reopen/withdraw checks, no ad requests before consent or after rejection, then one non-personalized manual unit and mobile/unfilled-slot checks. Never click real ads for testing. Account/reporting remains ad-free.

## Still open

1. Hosted password-reset completion and two-account cross-access acceptance; physical Android/iPhone PWA installation and reporting.
2. Cloud database export/restore drill and retention operations. Preserve the real local SQLite database, DPAPI backup and Windows profile.
3. Cloudflare operator2FA, explicitly deferred by the owner; owner rotation of passwords previously shared in chat.
4. The first substantive text-analysis edition is live. It covers214 documents at a164-submission cutoff, with17 individually coded themes,5 chapters,15 faction perspectives, counterpoints and linked full-text evidence. New editions use the modular workflow in survey-dashboard/synthesis/README.md.
5. Tournament Data from Longshanks remains a roadmap item. Its published reuse terms require an authorized data/export route before collection; no scraper is deployed. See ROADMAP.md.
6. Google approval and the consent acceptance checks above. No paid services, domain purchases or upgrades were made.


## Text analysis and group deviations · 1 November 2026

The substantive first pass is at /survey/#synthesis. Its dated edition covers214 reviewed answer documents (208 substantive,4 declined/skipped,2 brief), from102 submissions with reviewed text at a164-submission cutoff. The live numeric survey had165 submissions at verification. All214 current source hashes match. Sources can be opened by theme, chapter, overlap or faction reading, searched and filtered by question, or linked individually. Source references derive from independent public document IDs and carry no submission order.

Definitions, individual assignments and authored interpretations are separate modules. npm run survey:synthesis:build recalculates counts and intersections; --check detects stale output; survey:synthesis:prepare creates a private queue for new/changed/removed texts. Sources come from the current reviewed publication, with word-for-word hashes and validated quote ranges. Coding boundaries and AI-assisted preparation are disclosed under Method. No private profile joins were added.

Cross-analysis now offers Absolute ratings / Deviation from faction average for the group matrix. A deviation is the group mean minus that same faction’s valid-rating mean in the current selection. It uses a symmetric diverging scale, preserves suppressed cells as dashes and retains the raw means, n and original histogram in the detail. Nomination percentages retain their existing display.

Current public survey bundle: survey-CNy8GHaS.js; public root main-C8lJzgiK.js. Local full survey build also passed. Account app and ad settings are unchanged. Evidence and remaining acceptance details: qa/synthesis/RELEASE-2026-11-01.md.


Background refresh correction: the group display and cohort controls remain mounted while the same selection refreshes. Switching cohorts still waits for the matching dataset. The text viewer retains source/search state when an identical reviewed corpus is fetched again. Browser checks confirm deviation/grouping survive Refresh; the real SynthesisReport component retained the models search (48 of93 results) across138 simulated one-second source updates. Fixture: qa/synthesis/refresh-fixture.html.


Written responses navigation update (1 November): #comments now opens the full Synthesis as the default. #comments/topics holds a compact keyword explorer with source answers, filters and CSV. #comments/factions provides the requested layout-only analysis by respondent main faction, with all 15 choices and shareable faction URLs. No faction-level findings or source-profile links were published. Legacy #synthesis evidence URLs remain supported. Verification: 23 app tests and 49 survey tests passed; public/local builds, release privacy audit, HTTPS asset checks, desktop/mobile navigation and linked evidence verified. Details: qa/synthesis/WRITTEN-RESPONSES-2026-11-01.md.

Deviation colour update (1 November): current survey bundle survey-AbbjBro0.js. Robust symmetric 90th-percentile colour range, saturated endpoint colours and contrast-aware black/white labels; full numeric deviations retained. 50 survey tests, both builds and privacy audit passed. Live legend and bundle verified. Evidence: qa/synthesis/DEVIATION-COLOURS-2026-11-01.md and deviation-colours-live.png.
