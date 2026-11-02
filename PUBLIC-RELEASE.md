# Current release · 2 November 2026

## Live applications

- Game Stats: https://sensoutrack.pages.dev/
- Meta Survey: https://sensoutrack.pages.dev/survey/
- Accounts and reporting: https://app.sensoutrack.pages.dev/
- Shared navigation also links https://sensoucalc.pages.dev/ (separate project).
- Old Workers links redirect to the account app with path and query intact. The former survey preview redirects to the canonical public site.
- Accounts use password, confirmed email and CAPTCHA. End-user TOTP remains disabled.

## Data and publication

The survey is closed:165 submissions,144 valid satisfaction ratings (mean4.57/7),214 reviewed written answers. Public files are fixed under public/survey/. There is no live Tally/Supabase download in the survey browser entry. The hourly cron is inactive; the retained Edge Function returns410. Historical refresh/publication helpers remain for reference and future work; the snapshot exporter refuses to overwrite the frozen edition.

Game Stats continues to fetch anonymous player-reported game results from Supabase on page load. This dataset is separate from the survey. Account sessions and private game notes stay in the account app. Public numeric groups need five responses; matchup disclosure uses five respondents per faction row. Written answers have independent document IDs and no numeric respondent profile.

Private survey responses and the matching review ledger are archived in survey-dashboard/private/frozen-2026-11-02/. These files, account data, keys, environment files and QA artifacts are excluded from Git and deployment. Retention/deletion duties apply to archives, cloud storage copies and backups as well as active files.

## Build and deployment

- npm run build: local game tracker, dist/; local loopback server only.
- npm run build:cloud: account app, dist-cloud/; Pages project sensoutrack, Preview branch app. npm run deploy publishes this alias.
- npm run build:meta: public Stats and Survey, dist-meta/; publish to Production, branch main. Contains only the reviewed public dataset.
- npm run survey:build: full local survey dashboard, survey-dashboard/dist/, port5174. Requires the private archive to view individual numeric responses. Never upload this build.
- npm run deploy:legacy-redirect: old sensoutrack Worker, redirect only.

Only upload the selected build directory. Preserve the separation between Production and the app branch. Wrangler currently has Worker script publishing permission; Pages upload is performed through the signed-in dashboard.

## Advertising and outstanding operations

Advertising and Google CMP bootstrap remain disabled. Last dashboard check2 November: AdSense site review “Wird vorbereitet”, ads.txt “Autorisiert”. The prepared manual unit is limited to public Game Stats; the account app contains no advertising code. Site approval and an accept/reject/withdrawal test remain prerequisites for activation.

The real hosted confirmation/recovery flow and two-account session checks need a final pass on the new app hostname. Operator MFA, private database backups and a restore drill remain open. See SECURITY.md and PROJECT-REVIEW-2026-11-02.md. Longshanks Tournament Data requires an authorized source/export; no crawler is deployed (ROADMAP.md).

## Survey closed and frozen · 2 November 2026

165 submissions and214 reviewed text answers are fixed under public/survey/. Their24 data-file hashes are recorded in freeze.json and checked on every public/local survey build. Publication no longer depends on Supabase storage, Tally or periodic browser checks. The participation button is disabled; the sidebar shows Survey closed. Group filters, tables, charts, source links and exports continue to use the same final snapshot. Source snapshot:2026-11-02T09:17:03.113Z; frozen:2026-11-02T10:17:27.001Z.

Supabase cron job1 sensou-survey-hourly was disabled through cron.alter_job and read back active=false. The deployed Edge Function was replaced with a closed-survey response; a real HTTP request returned410 and Survey closed. Data is frozen. The local survey server has no refresh timer and rejects writes while closed; private raw responses, raw Tally data and review ledger are archived in private/frozen-2026-11-02/.

Synthesis, all faction profiles, comparison-chart labels, public home copy and both privacy notices were reviewed. Abstract headings and repeated qualifications were replaced with short explanations using model, theme, Ki, OpKi, Fear, camouflage, Sixth Sense, pass and scenario terms. Public texts and quoted respondent wording were kept intact.

## Shared navigation and account domain · 2 November 2026

The account app is live at https://app.sensoutrack.pages.dev/ (Pages branch alias `app`). Public Stats and Survey stay on Production. Shared sidebar links cover Game Stats, Meta Survey, Report a Game and SensouCalc. Account branding and public links return to the public website. Legal pages use the new app address. Existing Supabase accounts and games were retained.

Supabase Site URL and exact root/recovery redirect URLs use the new app origin. Turnstile accepts its hostname; legacy provider entries remain for existing email links. The old `sensoutrack` Worker now runs `scripts/legacy-account-redirect.mjs`: 302, no-store, no-referrer, preserving path and query. Wrangler version deployed:84b96150-77be-4adb-91ce-6bdd4605486a. Browser navigation verified fragment preservation and public → report → survey return navigation. HTTP checks verified root, recovery query and legal-page redirects. A complete signed-in login/recovery test on the new hostname still requires the account holder.

Validation:24 app/security/navigation tests and52 survey tests pass. Both cloud and public builds pass. Bundle checks confirm that account assets contain no Google advertising code, public assets contain no account auth methods, and visitor JS contains no former Workers hostname. Both Pages builds are live. AdSense remains awaiting review; advertising and CMP bootstrap stay disabled.

## Matchup quick rankings · 2 November 2026

The survey Matchups view now opens with the ten most favourable and ten least favourable directional matchups, ranked by the existing good-minus-bad nomination share. Rows show both factions, net percentage points, good/bad counts and the row respondent denominator. Mirrors, neutral scores and rows with fewer than five respondents are excluded. Rankings follow the selected respondent group; the existing low-n setting marks small samples. The matrix and its metric selector remain below the lists. Desktop and390px layouts were inspected; mobile tables wrap faction names to keep all columns visible. Survey tests:53 passing; public build and frozen-data integrity check pass.

## Repository audit · 2 November 2026

The account UI now clears private detail dialogs and drafts on sign-out/account changes; stored drafts are bound to an account. Personal history has an independent loading/retry path, deletion requires a returned row, and completed/dismissed recovery URLs lose their reset marker. Public advertising flags cannot affect account notices. The old survey preview root redirects to /survey/ instead of Game Stats. Windows line endings and two accidentally ignored source/test entry files no longer break clean Git builds. See PROJECT-REVIEW-2026-11-02.md for findings, verification and remaining operational checks.
