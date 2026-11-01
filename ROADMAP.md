# Sensou roadmap

## Next major area: Tournament Data

User request,27 October2026: add **Tournament Data** as a third top-level area alongside Game Meta and Meta Survey, using Longshanks Bushido tournament results to estimate faction win rates. This is a long-term item, not an empty navigation tab in the current release.

- Check Longshanks' current official data/export/API options and terms before implementing a crawler. If scraping is appropriate, use bounded requests, caching and conservative refreshes; do not bypass login, private event access or access controls.
- Collect only the event/game/faction fields needed for analysis: stable source/event/game identifiers, event and round dates, faction/theme where actually available, outcome, score type, draw status and rules context. Do not publish player names, account identifiers or other unnecessary personal information.
- Keep tournament results separate from user-submitted games and survey perceptions. Never describe survey opinions as tournament win rates, and do not silently pool duplicate games across sources.
- Document faction aliases, missing faction/theme data, byes, concessions, incomplete games, mirrors, draw treatment and event/game deduplication. Missing data is not a loss or zero win rate.
- Views: faction rankings with games and W/D/L, matchup matrix, event/date/region/rules filters where defensible, sample-size warnings and reproducible aggregate exports. Link back to source events and show refresh dates and coverage limits.
- Start with a small verified set of public events and check parsed results against their original event pages before broader ingestion. Public API/data permissions and an appropriate sustainable refresh design remain research tasks; no scraper has been deployed yet.

## Data access check · 31 October 2026

Longshanks explicitly prohibits unauthorized duplication or reuse, including partial reuse, in [Data usage](https://bushido.longshanks.org/about/). Its ownership section also distinguishes user-submitted event/game data from Longshanks-generated statistics. No crawler was started.

Concrete next step: obtain an authorized API/export or explicit reuse permission, with fields, refresh limits and deletion requirements agreed. No request was sent to anyone. Once available, import the approved export into a separate tournament dataset, verify a small event sample against the source, then enable Tournament Data in the existing sidebar. Cache and deduplicate by event/game identifiers; export aggregates without player identifiers. Keep the current game reports and survey data separate. There is no empty Tournament Data navigation item in the current release.
