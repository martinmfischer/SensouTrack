# Advertising checkpoint · 27 October 2026

**No ads or Google CMP bootstrap are enabled in the final visitor release.** The source implementation is prepared but disabled. The public game-meta site, public survey and account app remain usable without advertising.

## Account configuration

- Publisher ca-pub-3641047527711845, site sensoutrack.pages.dev. Ownership verified and ads.txt **Autorisiert**. Site review remains **Wird vorbereitet**; approval is not guaranteed.
- Manual responsive display unit **Sensou - Community meta footer**, slot1048168333. Intended placement: one horizontal block below public game-meta statistics. No ads in reporting, accounts, legal notices or the survey. No filter-triggered ad refreshes.
- Auto ads and automatic optimization off. All13 standard sensitive categories plus restricted alcohol/adult gambling blocked. These filters reduce unwanted content, but classification cannot guarantee every creative is appropriate. Tabletop-specific inventory is not guaranteed.
- Operator/contact notices and English/German privacy pages are published on both origins.
- Google CMP message **Sensou – Community meta – EU consent** is published in English and German, with Kanji wordmark, explicit reject and manage-options choices. Message optimization is off.
- Custom partner selection: **Google Advertising Products only** (IAB755), automatic partner additions off; legitimate interest off; creative-vendor consent checks and DSA transparency preference on. No Google Analytics, Consent Mode, extra publisher purposes or active device scanning.

## Code and runtime verification

The prepared public-only hook initially sets pauseAdRequests=1 and requests non-personalized treatment. Google bootstrap still loads scripts and can read existing Google-domain cookies; this is not a script-free or zero-contact consent flow. The active-build privacy text discloses IP/browser/origin/consent transfers and this existing-cookie limitation.

Ad serving has a separate build flag. It requires explicit Google consent, purposes1/2/7/9/10 and no disallowing publisher restriction. Missing, ambiguous, pending, failed or out-of-region signals deny serving. Legitimate interest is not accepted by the app gate. The account app never imports this module.

A temporary CMP-only public test used a fresh per-request CSP nonce, no unsafe-eval, a strict origin-only referrer and Google-controlled connection/frame allowances. Google scripts and the consent API loaded, but no visible dialog appeared, including the official test URL and reopening control. Top-level console capture showed no errors. This is **not a successful accept/reject/withdrawal test**, and its cause is not established. The final release turns the bootstrap off again and removes Google network allowances. The published CMP remains configured in Google.

Before activating: obtain site approval and finish the visible CMP flow in an ordinary browser. Verify rejection, acceptance, reopening, withdrawal, denied/uncertain signals, no pre-consent ad requests, and one non-personalized unit only after consent. Check mobile sizes and unfilled slots. Do not weaken the account origin's CSP or silently add script unsafe-eval. See PUBLIC-RELEASE.md for the remaining launch work.

References: [paused requests and non-personalized ads](https://support.google.com/adsense/answer/7670312?hl=en), [nonce CSP](https://support.google.com/adsense/answer/16283098?hl=en), [Google CMP API](https://developers.google.com/funding-choices/fc-api-docs), [consent purposes](https://support.google.com/adsense/answer/9804260?hl=en), [official message testing](https://support.google.com/adsense/answer/10924669?hl=en), [message troubleshooting](https://support.google.com/adsense/answer/14660912?hl=en).

## Revenue model: illustrative assumptions, not a forecast

Assume publisher revenue of EUR 0.50–3 per 1,000 **actually served** ad impressions. This is a planning assumption, not a verified Bushido benchmark or a provider guarantee.

| Monthly served impressions | Illustrative monthly revenue before tax |
|---:|---:|
| 1,000 | EUR 0.50–3 |
| 10,000 | EUR 5–30 |
| 50,000 | EUR 25–150 |
| 100,000 | EUR 50–300 |

Example: 500 active users × 10 monthly meta loads × 50% monetizable/filled placements = 2,500 impressions, or EUR 1.25–7.50 in this model. Filter interactions do not automatically count as fresh impressions. Actual outcomes depend on demand, geography, consent, blockers, viewability and layout. Validate after a small live pilot before budgeting around it. AdSense's current EUR payout threshold is EUR 70; an estimated balance is not the same as a payment received.

Sources: [Ad units and placement control](https://support.google.com/adsense/answer/7037624?hl=en-EN), [sensitive-category filters](https://support.google.com/adsense/answer/164131?hl=en-GB), [consent policy](https://www.google.com/intl/en-GB/about/company/user-consent-policy-help/), [earnings uncertainty](https://support.google.com/adsense/answer/9902?hl=en-GB), [RPM definition](https://support.google.com/adsense/answer/190515?hl=en), [payout thresholds](https://support.google.com/adsense/answer/1709871?hl=en), [EthicalAds eligibility](https://www.ethicalads.io/publishers/).
