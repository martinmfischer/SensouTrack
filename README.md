# Sensou

Bushido game tracker: React app for browser, Android and iPhone, installable as a PWA.

## Run locally

Requires Node.js 22.13+ (24 LTS recommended).

```powershell
npm install
npm run dev
```

Open http://localhost:5173. The local Node API stores accounts, sessions and games in `data/sensou.sqlite`. Create an account in the app. No external account or environment variables are needed locally. `npm run build` followed by `npm start` runs the production build at the same address.

## Included

- Registration, password login, email confirmation/recovery (hosted), session expiry, logout-all and account-security settings. Cloud sessions stay in memory and require a fresh login after reload.
- Game reports: both factions and themes, scenario, date, Rice, game type and VPs. Private optional notes. Drafts survive navigation and reloads within the same browser session.
- Community stats: sortable faction and theme tables, matchup matrix with sample sizes, filters, representation chart, cumulative game chart and CSV export.
- Personal history, wins/draws/losses, win rate, average VPs, favourite faction, private notes and deletion of your own games.
- Explicitly separated synthetic demo dataset. Demo records are never inserted into the database.
- Responsive navigation and tables; web manifest, icons, service worker and an explicit offline screen. Reading and submitting games requires a connection.

UI is English for the international Bushido community. The look uses muted greens, a restrained red seal, seigaiha waves and geometric landscape art. No official faction artwork is copied.

## Statistics

Win rate is wins / games. Draws stay in the denominator and count as zero wins. Community faction stats exclude mirrors; theme stats exclude identical faction + theme mirrors. Personal stats include all of your games. Play rate uses the corresponding eligible faction/theme appearances as denominator. Matchups are read from row faction against column faction. Empty and insufficient samples are shown as `—`. Minimum sample is adjustable.

These are descriptive, self-reported outcomes, not estimates adjusted for player skill or repeated opponents. Only one participant should report a battle. Identical submissions by one account are rejected; matching reports from two accounts are not automatically reconciled.

## Test

```powershell
npm test
npm run build
```

Tests cover score validation, both match perspectives, draws/mirrors, filtering, CSV privacy, account/session lifecycle, persistence across restart, ownership and private-note protection. Cloud SQL runs in real PostgreSQL via PGlite for local RLS, verified-email, revocation and trigger checks. Security tests also cover migration, encrypted backup/restore and missing-key failure. This does not replace a hosted Supabase integration test.

For browser QA at a 390px viewport, open http://localhost:5173/tests/responsive.html while the dev server is running.

## Hosting and installation

See [HOSTING.md](HOSTING.md) for the free Cloudflare + Supabase setup. The Free projects exist and the app is deployed. Brevo SMTP is connected and confirmation delivery has been observed. Full hosted account/recovery integration verification is still pending. See `hosting-status.json` for the verified checkpoint.

Android: Chrome → Install app. iPhone: Safari → Share → Add to Home Screen. Desktop: Chrome/Edge install icon. HTTPS is required outside localhost. These are PWA installs; App Store/Google Play listings and native binaries are not included. The responsive React interface can later be wrapped with Capacitor if store distribution becomes necessary.

See [SECURITY.md](SECURITY.md) for security controls, key backup and online launch requirements. Advertising is deferred; see [ADS-OPTIONS.md](ADS-OPTIONS.md) for the requested comparison and illustrative revenue model.

## Storage and operation

- The local API is restricted to loopback development use. Do not expose it through a public reverse proxy. Passwords use scrypt, session cookies are HttpOnly/SameSite, session tokens are stored hashed, and auth/report endpoints have rate limits. Local mode does not verify email or send recovery messages.
- For online operation, use Supabase Auth/Postgres with RLS. Set the three public Vite variables in `.env.cloud.local` and run `npm run build:cloud`. Cloud assets go to `dist-cloud/`; local assets stay in `dist/`. Never expose a Supabase secret/service-role key. Public views deliberately omit user IDs and personal notes; the base table only permits owners to read/delete their own records.
- Back up local SQLite while the app is stopped, or use SQLite's online backup API; do not copy a live WAL database file alone. Cloud backups/exports must be configured separately.
- Local accounts and hosted accounts are separate. There is no automatic migration of passwords or game records.
- `HOST` defaults to `127.0.0.1`, `PORT` to `5173`, and `DATA_DIR` to `./data`. Network host bindings are refused. Use the prepared managed cloud deployment for public access.

## Bushido catalogue

`src/catalogue.json` copies the existing project's JwarCards snapshot of 23 October 2026: 15 factions, faction themes and shared Ronin themes. Catalogue presence is not proof of tournament legality. Ronin is not treated as an independent faction. Scenarios and the combined maximum of 3 VPs follow [GCT Studios Tournament Pack 2510.1](https://gctstudios.com/pages/rules-resources), retrieved 25 October 2026. The downloaded source and extracted text are under `survey/2026-10/`.

To update themes, edit the catalogue and regenerate cloud SQL:

```powershell
node scripts/generate-cloud-schema.mjs
```

The generated SQL is for initial setup and additive catalogue updates. If a previously allowed theme is removed, apply an explicit database migration rather than silently altering historical results.
