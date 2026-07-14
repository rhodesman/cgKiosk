# cgKiosk — Post-Modernization Follow-ups

Recorded 2026-07-14, after the React/Vite/TS modernization landed on
`react-modernization`. None of these block merge; the final whole-branch review
triaged them all as acceptable follow-ups. See the design spec and plan in this
directory for the full context.

## Operational (needed for live data, not a code fix)

The three third-party integrations are stale (they date from the 2018/2019 build)
and currently fail — the proxy returns clean `502 {error}` and each panel degrades
to its empty state:

- **OpenWeatherMap** (`/api/weather`) → upstream **401** (key expired). Also confirm
  the `/data/2.5/forecast` endpoint is still on the account's plan.
- **MapQuest traffic** (`/api/traffic`) → upstream **401** (key expired).
- **Nexudus/Betamore events** (`/api/events`) → upstream **404** (the space URL
  `betamore.spaces.nexudus.com/en` likely no longer exists).

To restore: set fresh values in `server/.env` (git-ignored; see `server/.env.example`)
and decide the fate of the events source (current Nexudus space, another provider,
or drop it).

## Code follow-ups (backlog)

- **Client tsconfig split** — adopt the official Vite 3-tsconfig layout
  (`tsconfig.app.json` + `tsconfig.node.json`, both `noEmit`) so the composite build
  stops emitting the git-ignored `client/vite.config.js` / `client/vite.config.d.ts`.
- **`eventFormat` midnight** — renders `0:00 AM`; should be `12:00 AM`. Add a test.
  (Noon was already corrected to PM vs. the legacy bug.)
- **`ScrollList` tests** — the scroll-shadow class toggling and 30s idle-reset
  behavior are untested (only render is covered).
- **Events room-highlight parity** — `EventsPanel` calls `onRoomsForToday` per
  today-event (last wins); the legacy `drawMap` was additive. `DirectoryPanel` and
  `EventsPanel` also share one `highlighted` array and overwrite each other. Fine for
  the current single-highlight kiosk; revisit if multi-highlight is wanted.
- **Faithfully-copied legacy SCSS quirks** — `_weather.scss` selector typo `&612m`
  (never matches), duplicate `align-items` in `_dir.scss`, a dead comment block in
  `_traffic.scss`, and a dead `url('/img/cg-logo.svg')` in `_map.scss` (on an unused
  `.no-svg` Modernizr class; the real logo `cg_logo-1.svg` is used correctly).
- **`usePolling.test`** — restore fake timers in `afterEach` for throw-safety.
- **`App` nits** — the directory-highlight `setTimeout` handle is untracked, and
  `onSelectIncident` / `onSelectEvent` aren't `useCallback`. Both harmless on the
  always-mounted root component.
