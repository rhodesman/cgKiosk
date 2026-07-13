# City Garage Kiosk — React Modernization Design

**Date:** 2026-07-13
**Status:** Approved (pending spec review)

## Goal

Modernize a 2018/2019 jQuery + Express + CodeKit kiosk app to a current
React + Vite + TypeScript stack, replacing the deprecated CodeKit build with
Vite's built-in Sass compiler. This is a **faithful port**: the kiosk's look,
layout, and behavior are preserved; the tooling and code structure are
modernized.

## Non-Goals

- No visual redesign. The existing 4-panel layout and styling are reproduced.
- No new features beyond what the current kiosk does.
- No change to the third-party data sources (Nexudus, OpenWeatherMap, MapQuest).

## Current State (what we're replacing)

- **Backend:** `app.js` + `controls/` — Express serves `site/`, proxies the
  Nexudus events API, and serves vendored libs from `node_modules` via `/fw/*`.
- **Frontend:** one procedural jQuery file (`src/js/main.js`), `site/index.html`,
  and SCSS in `src/scss/`, compiled to `site/dist/` by **CodeKit 3** (a
  deprecated macOS GUI app; `config.codekit3` is its project file).
- **Panels:** welcome/logo, weather, traffic, events, floor map, directory.
- **Data sources:** OpenWeatherMap (weather), MapQuest (traffic), Nexudus
  (events + room bookings), and `businesses.csv` (directory).
- **Known issues being fixed:** CodeKit is deprecated; weather/traffic API keys
  are hardcoded in client JS; backend `throw new Error` crashes the process on
  upstream failure; runtime CSV parsing; no tests, lint, or `.gitignore`.

## Target Architecture

npm-workspaces monorepo with two packages:

```
cgKiosk/
├── package.json            # workspaces + scripts (dev / build / start / test / lint / format)
├── .gitignore              # node_modules, .env, build output  (new — repo has none today)
├── client/                 # Vite + React + TypeScript
│   ├── index.html
│   ├── vite.config.ts      # Sass built in; dev proxy /api → server
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── components/      # WelcomePanel, WeatherPanel, TrafficPanel,
│       │                    #   EventsPanel, FloorMap, DirectoryPanel,
│       │                    #   AlertModal, ScrollList
│       ├── hooks/           # usePolling, useAutoScrollReset
│       ├── lib/             # pure ported logic (weather/date/traffic/suite)
│       ├── api/             # typed fetch wrappers for /api/*
│       ├── types/           # interfaces for weather/traffic/events/business
│       ├── data/            # businesses.ts (typed directory data)
│       └── styles/          # migrated SCSS partials + assets
└── server/                 # Express proxy in TypeScript (run via tsx)
    ├── src/index.ts + routes/
    ├── .env.example         # documents required config
    └── .env                 # git-ignored, real keys
```

**Dev flow** (`npm run dev`): `concurrently` runs the Express proxy and the Vite
dev server; Vite proxies `/api/*` to Express and hot-reloads React + SCSS.
Replaces CodeKit + browser-refresh.

**Prod flow** (`npm run build` → `npm start`): Vite builds `client` to static
assets; Express serves those assets *and* the `/api` routes on one port
(`PORT` or 8089, unchanged).

## Backend (Express proxy, TypeScript)

Single job: proxy third-party APIs so no keys or CORS issues reach the browser.
The `/fw/*` vendored-file routes are removed (npm + Vite replace them). Routes:

| Route | Proxies to | Notes |
|-------|-----------|-------|
| `GET /api/events` | Nexudus events | ported from `controller.js` |
| `GET /api/space/:date` | Nexudus bookings | ported from `controller.js` |
| `GET /api/weather` | OpenWeatherMap | new — key + city id from `.env` |
| `GET /api/traffic` | MapQuest incidents | new — key + bounding box from `.env` |

Changes from today's backend:
- **TypeScript**, run with `tsx` in dev, compiled/run for prod.
- **`unirest` (unmaintained) → native `fetch`** (Node 18+).
- **Real error handling:** routes catch upstream failures and return a proper
  status code + JSON error, so a flaky API degrades one panel instead of
  crashing the server.
- **Config via `.env`:** API keys, MapQuest bounding box, OpenWeatherMap city id,
  `PORT`. `.env.example` documents all of them.
- The weather/traffic **computation stays on the client**; the server relays raw
  upstream JSON (matching how events already work).

## Frontend (React, TypeScript)

The procedural `main.js` becomes typed components. Each panel fetches its own
data via a shared `usePolling(fetchFn, 60_000)` hook, preserving the current
60-second refresh.

**Component tree:**
```
App                       # layout (container-fluid rows) + shared state
├── WelcomePanel          # static logo
├── WeatherPanel          # /api/weather → averaging → today/tomorrow/weekend tiles
├── TrafficPanel          # /api/traffic → incident list; click → open alert
├── EventsPanel           # /api/events → event list; click → alert; today's events → highlight map
├── FloorMap              # suite/conf divs; renders highlighted suites
├── DirectoryPanel        # businesses list; click → highlight map
└── AlertModal            # React modal (replaces Bootstrap/jQuery modal), auto-closes 30s
```

**Shared state** in `App` (lightweight `useState`, no external store):
- `selectedAlert` — traffic incident or event shown in the modal (`null` = closed).
- `highlightedSuites` — floor-map suites that glow; set by directory clicks,
  event clicks, and today's events. Timers clear highlights (5s) and auto-close
  the modal (30s), matching current behavior.

**Ported logic → pure functions** (`lib/`, unit-tested):
- weather forecast averaging + icon selection,
- event date/time formatting + month parsing,
- traffic incident → list-item mapping (incl. "Baltimore Washington Pkwy →
  MD-295" label rule and long-name truncation),
- suite-number → CSS-selector mapping (e.g. `100–199` → `.suite.o-<n>`, else
  `.suite.s-<n>`).

**Reusable pieces** extracted from tangled jQuery:
- `ScrollList` — scrollable panel list with top/bottom shadow indicators.
- `useAutoScrollReset` — scrolls lists back to top after 30s idle.

**Directory data:** the runtime `businesses.csv` fetch + hand-rolled parser is
replaced by a typed `businesses.ts` module (same columns: suite, company,
company2, logo1, logo2), imported at build time. Still a single editable file,
now type-checked with no fragile client parsing. Logos move into client assets.

**Error/empty states:** each panel handles fetch failure independently — showing
its existing empty state (e.g. the "No Traffic!" row) or last-known data — so one
dead API doesn't blank the whole kiosk.

## Styling

- **`src/scss/` → `client/src/styles/`**, partials mostly unchanged
  (`inc/_globals`, `_colors`, `_fonts`; `parts/_weather`, `_traffic`, `_map`,
  `_dir`, `_events`, `_welcome`, `_modal`). `main.tsx` imports `main.scss`;
  Vite's built-in Sass compiles it. No CodeKit, no gulp.
- **Bootstrap** from npm (grid only, `bootstrap-grid`, matching current
  `@import`). Vendored Bootstrap and FontAwesome source folders deleted.
- **Deprecation cleanup:** convert `@import` → `@use`/`@forward` and swap
  deprecated Sass color functions so the modern Dart Sass compiler builds
  warning-free with identical output. (This is the "modern SCSS compiler" ask.)
- **Modal:** `_modal.scss` styling stays but is driven by the React `AlertModal`
  (state-based show/hide) instead of `data-dismiss`/jQuery. Visually identical.
- **Assets** (logos, `webfonts/`, favicon) move into `client/` for Vite to
  fingerprint and serve.

## Testing & Tooling

- **Vitest + React Testing Library.** Primary targets: the pure `lib/` functions
  (weather averaging, date/time formatting, traffic mapping, suite→selector),
  where the original had subtle date/index logic. Smoke tests confirm each panel
  renders items and that a click opens the modal. (Project currently has no real
  tests — `npm test` ran a debugger.)
- **TypeScript** strict mode across client and server; shared API-response types
  in `client/src/types/`.
- **Prettier + lean ESLint** (typescript-eslint + react-hooks). Replaces the
  nonexistent lint step.
- **Root scripts:** `dev`, `build`, `start`, `test`, `lint`, `format`.

## Migration / Cutover

1. Stand up the new `client/` + `server/` alongside the existing app.
2. Port backend routes, then each panel, verifying against the old behavior.
3. Once verified, remove legacy `app.js`, `controls/`, `site/`, `src/`,
   `config.codekit3`, and the `.browser-refresh-ignore` / gulp/CodeKit remnants.
4. Update `CLAUDE.md` to describe the new stack and commands.

## Open Questions / Risks

- **Real API keys:** the current keys are hardcoded in `main.js`. They'll move to
  `.env`; the user needs to confirm they're still valid or provide fresh ones.
- **Nexudus/MapQuest/OpenWeatherMap response shapes** are inferred from the
  existing client code and the captured `traffic_response*.json` samples; live
  responses should be checked during porting in case the APIs have drifted since
  2019.
```
