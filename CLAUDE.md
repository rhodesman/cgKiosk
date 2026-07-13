# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-screen touchscreen kiosk for the City Garage coworking building. It shows weather, local traffic incidents, an event schedule, a floor map, and a company directory. This is a React + Vite + TypeScript SPA (`client/`) served by and proxied through a small Express + TypeScript backend (`server/`), in an npm-workspaces monorepo. Replaces the original jQuery + CodeKit build.

## Commands (run from repo root)

- `npm run dev` — concurrently starts the Express proxy server (port 8089) + Vite dev server (port 5173); Vite proxies `/api` → `localhost:8089`.
- `npm run build` — `tsc -b && vite build` (client) then `tsc` (server); outputs to `client/dist/` and `server/dist/`.
- `npm start` — `node server/dist/index.js` — serves the built SPA out of `client/dist/` and exposes `/api` routes.
- `npm test` — runs Vitest in both workspaces (client: ~36 tests, server: ~12 tests).
- `npm run lint` — ESLint 9 flat config (`eslint.config.js`).
- `npm run format` — Prettier over `**/*.{ts,tsx,scss,json,md}`.

Server listens on `PORT` env var or `8089`.

## Layout

```
client/          Vite + React 18 + TypeScript SPA
  src/
    api/         Typed fetch wrappers (kiosk.ts) — hit /api/* routes
    components/  Panel components: WeatherPanel, TrafficPanel, EventsPanel,
                 FloorMap, DirectoryPanel, ScrollList, AlertModal, WelcomePanel
    hooks/       usePolling (60 s data refresh), useAutoScrollReset
    lib/         Pure tested logic: weather.ts, traffic.ts, suites.ts, eventFormat.ts
    types/       Shared TypeScript interfaces
    data/        businesses.ts — typed company directory (replaces runtime CSV)
    styles/      SCSS compiled by Vite (not CodeKit)
    test/        Vitest + React Testing Library setup

server/          Express + TypeScript proxy
  src/
    index.ts     Entry point — starts server on PORT|8089
    app.ts       createApp(): registers routes, /api JSON-404 fallback, static SPA serve
    routes.ts    /api/events, /api/space/:date, /api/weather, /api/traffic, /api/health
    proxy.ts     proxyJson() — fetches upstream APIs and pipes JSON to the response
    config.ts    loadConfig() — reads env vars with defaults
```

## Backend / API routes

All third-party API calls are proxied server-side so keys are never in the client bundle:

- `GET /api/events` — Nexudus/Betamore events feed
- `GET /api/space/:date` — Nexudus/Betamore room bookings for a date (drives floor-map highlights)
- `GET /api/weather` — OpenWeatherMap `/data/2.5/forecast` (city id 4347820 = Baltimore)
- `GET /api/traffic` — MapQuest Traffic Incidents v2
- `GET /api/health` — `{ status: "ok" }` health check
- Unknown `/api/*` → JSON `404`
- Everything else → serves `client/dist/index.html` (SPA fallback)

**Config and keys** live in `server/.env` (git-ignored). Copy `server/.env.example` and fill in:
- `OPENWEATHER_API_KEY`
- `MAPQUEST_API_KEY` / `MAPQUEST_BOUNDING_BOX`
- `NEXUDUS_BASE` (defaults to `https://betamore.spaces.nexudus.com/en`)

## Front end

Each panel (`WeatherPanel`, `TrafficPanel`, `EventsPanel`, `FloorMap`, `DirectoryPanel`) polls its `/api/*` endpoint via the `usePolling` hook (60 s interval). Shared App-level state drives:

- **AlertModal** — React component (replaced the legacy Bootstrap/jQuery modal); opens when a traffic incident, event, or directory entry is clicked; auto-dismisses on a timer.
- **Floor-map suite highlighting** — a clicked item's suite id is converted to a CSS selector (`.suite.s-<n>` or `.suite.o-<n>`) via `suiteSelector()` in `lib/suites.ts`; the `.show` class is applied and auto-removed.

Directory data is a static typed module (`client/src/data/businesses.ts`), not a runtime CSV fetch. FontAwesome Pro icons render from committed webfonts in `client/public/webfonts/`.

## Known operational note

The third-party API keys (OpenWeatherMap, MapQuest) and the Nexudus/Betamore space originate from 2018-2019 and are currently stale/expired (return 401/404). Each panel degrades gracefully to its empty state. Fresh keys and/or a current Nexudus space URL are needed for live data. Keys are never in source — set them in `server/.env`.
