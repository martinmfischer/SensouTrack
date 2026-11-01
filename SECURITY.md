# Security model and launch requirements

Updated 26 October 2026. This is application hardening with reproducible tests, not a penetration-test certification or a guarantee against compromise.

## Implemented locally

- Local server binds only to loopback and rejects unexpected Host headers, including DNS-rebinding attempts. Do not put this development account backend behind a public reverse proxy.
- Passwords use random salts and scrypt N=131072, r=8, p=1 (128 MiB), with a bounded number of concurrent hashes. New passwords/passphrases require 15–128 characters; obvious repeated/common patterns are rejected. Legacy hashes upgrade on successful login. There is no claim of a complete breached-password blocklist.
- Sign-in uses email and password. Hosted accounts must confirm their email before accessing private games. Authenticator setup and codes are removed at the user’s request. Local password changes require the current password and revoke every session; hosted recovery uses a verified email link.
- Sessions use random 256-bit opaque tokens; only their hashes enter the database. Cookies are HttpOnly and SameSite=Strict. HTTP is limited to loopback; the online service uses HTTPS and managed Auth instead of these local cookies.
- Local sessions expire after 30 minutes without API activity or 12 hours absolutely. Login rotates the token. Logout-all revokes all database sessions. The UI clears private data when its session expires or a sign-out is broadcast.
- Mutations require a matching signed CSRF cookie/header pair and the expected Origin. Credentials are never placed in URLs. Request size/time limits and per-IP/account verification limits constrain abuse.
- Local emails are looked up using a keyed HMAC. Profiles and personal notes use AES-256-GCM with random IVs and record-specific authenticated context. Encryption and MAC keys are separately derived using HKDF. Password hashes remain one-way hashes.
- The master key is separate from SQLite in `.local-secrets/master.key`. Windows stores it wrapped by DPAPI for the current Windows user; it is not a plaintext key file. POSIX systems use a 0600 key file. No directory ACLs are rewritten. DPAPI needs the original Windows account/profile; copying the file to a fresh machine/profile alone does not guarantee recovery.
- Migration first writes an authenticated encrypted SQLite snapshot, preserves account/game IDs and revokes old sessions. A missing or wrong encryption key fails closed instead of silently creating replacement keys for encrypted data.
- Secret/database paths, encoded variants and Vite `/@fs/` attempts are blocked. Production only serves files inside `dist/`, with real-path checks. Authentication/API responses are not cached. The service worker never caches accounts, API responses or submitted games.
- Production CSP blocks arbitrary scripts, inline scripts/eval, framing and objects. External fonts have been removed. Private notes render as text, not HTML. Cloud build headers allow only the configured Supabase origin and the explicit CAPTCHA provider.

## Prepared online architecture

- Supabase handles passwords, email verification, token signatures, refresh-token rotation and verified email recovery. Browser sessions use `persistSession:false`: access/refresh tokens are held in memory, not localStorage/sessionStorage. A reload requires a new cloud sign-in. This is a SPA, not a backend-for-frontend with HttpOnly cloud cookies.
- Database RLS requires ownership, a confirmed email in auth.users, and a matching live managed Auth session less than 12 hours old. Existing or absent MFA factors do not change access. Signing out therefore revokes private-data access even if an old JWT has not yet expired.
- The public projection uses an explicit allowlist of game fields. It has no email, player name, account ID or personal notes. Game details are intentionally public and may still be recognizable to someone who knows the match.
- Browser builds reject Supabase secret/service-role keys and require the public Turnstile site key. A publishable/anon key is designed to be visible; authorization depends on Auth/RLS, not on hiding that key.
- Turnstile is wired into cloud registration, login and email recovery. Its secret belongs only in Supabase Auth's CAPTCHA configuration.
- The separate public site https://sensoutrack.pages.dev/ has no Auth client, account session or private drafts. Public games use omitted credentials and an allowlisted projection. The survey uses aggregate snapshots only; a release audit checks that private response values and account methods do not enter public files. Account/reporting pages remain on their Workers origin.
- The public root gets a fresh per-request CSP nonce from a small route-limited Pages Worker. Survey and legal pages retain static CSP; the account app's Google-free policy is unchanged. A disabled Google CMP/ad hook is prepared only for the public game-meta entry. The final visitor release loads neither Google bootstrap nor ad scripts. Google CMP is published, but visible accept/reject/withdrawal testing did not succeed, and site approval remains pending. Never silently relax script protections to get ads working. See ADS-OPTIONS.md and PUBLIC-RELEASE.md.

## Must be verified in the actual cloud projects before launch

1. Create only the intended Free projects. Use an EU database region, disable default exposure of new tables, and enable automatic RLS. Apply the complete generated `supabase/schema.sql`; expose only the `public` API schema, never `private` or `auth`.
2. Enable email confirmation. Disable app TOTP and the provider’s 15-minute AAL1/MFA timeout. Set the provider password minimum to 15. Set JWT lifetime to 900 seconds and retain refresh-token reuse detection. Do not disable confirmations to work around mail delivery failures. Advanced provider session timeout options may require a paid plan; our RLS imposes its own 12-hour ceiling.
3. Configure Turnstile in Supabase Auth, with its secret only in the provider dashboard. Restrict allowed hostnames to the actual deployment and needed local tests. A public site key alone does not prove server-side CAPTCHA verification is configured.
4. Configure a real SMTP sender and exact Site/Redirect URLs, including `/?recovery=1`. Supabase's default mail service is not sufficient for an open community launch.
5. Enable MFA on both operator accounts personally. Cloudflare operator MFA was explicitly deferred by the user on 26 October; remind them to add it later. End-user sign-in uses password and confirmed email. Do not share authenticator seeds or recovery codes. Rotate any operator passwords shared in chat. Project/service-role credentials must never be committed or shipped to browsers.
6. Test with two disposable accounts: email confirmation, password sign-in, email password recovery, logout-all, session revocation, malicious/unauthenticated inserts, foreign-owner reads/deletes, and public-note privacy. Test actual iPhone/Android installs separately.
7. Configure private backups and a restore drill. Review provider Auth/security logs and rate limits. Remove disposable test records after verification. There is no custom incident-audit dashboard in this MVP.

These provider settings and hosted integrations are **not** certified by passing local tests. Until they are configured and verified, do not announce a public launch.

## Backup and recovery

Keep `.local-secrets/` and `data/` private and out of Git, web assets and source uploads. Keep a protected backup of both the database and its key/Windows user profile. Losing the required key/profile can make encrypted fields unrecoverable. Disk encryption and account/device protection remain the operator's responsibility.

The pre-migration snapshot is `data/pre-security-<uuid>.enc`. It can contain the old plaintext schema internally, so decrypt it only into a private location on the original Windows profile:

```powershell
node scripts/restore-local-backup.mjs data/pre-security-EXAMPLE.enc data/restored-check.sqlite
```

The restore helper refuses an existing target or the live database path and checks SQLite integrity. It does not automatically replace a running database. Treat the decrypted file as sensitive and remove it after a controlled recovery. Back up a running SQLite database using its backup mechanism or a consistent `VACUUM INTO` snapshot; do not copy only a live WAL main file.

## Reproducible verification

```powershell
npm ci
npm audit --audit-level=moderate
npm test
npm run build
```

Tests cover password/account/session lifecycles, legacy-MFA database compatibility, confirmed-email enforcement, ownership, CSRF/origin/Host checks, brute-force limits, private file access, authenticated encryption/tampering, legacy migration and encrypted restore, missing/wrong keys, password hashing, cloud configuration guards and real PostgreSQL RLS/session revocation via PGlite.

GitHub Actions and Dependabot configuration are provided with minimal permissions and pinned Actions. They become operational only after this repository is hosted on GitHub and those features are enabled. A clean dependency audit means no known advisory was reported at that time; it is not proof that every dependency is safe.

## Limits

Email/password sign-in relies on password and mailbox security. A compromised device, operating-system account, provider administrator account, dependency or script execution in the app can still compromise data or sessions. DPAPI does not protect against malicious processes already acting as the same Windows user. Local field encryption is not full-database or full-disk encryption. Cloud at-rest protection is the provider's responsibility. Public match details remain self-reported and intentionally public.

References: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords), [Supabase session revocation](https://supabase.com/docs/guides/auth/sessions), [Microsoft DPAPI](https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection).
