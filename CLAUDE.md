# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A full-screen touchscreen kiosk for the City Garage coworking building. It shows weather, local traffic incidents, an event schedule, a floor map, and a company directory. It's a single-page jQuery front end served by a thin Express backend that mainly exists to proxy third-party APIs and serve vendored framework files.

## Commands

- `npm start` — run the server with nodemon (auto-restart on backend file changes).
- `npm run serve` — run under `browser-refresh` (live-reloads the browser; pairs with the `/fw/refresh` route below).
- `npm test` — runs `node --inspect app.js` (a debugger session, not a test suite; there are no tests).

Server listens on `PORT` or `8089`. There is no lint step.

## Front-end build (important)

Source assets live in `src/` but the server only serves `site/`. Editing `src/` files has **no effect** until they are compiled into `site/dist/`:

- `src/js/main.js` → `site/dist/main-min.js`
- `src/scss/main.scss` (+ `inc/`, `parts/`) → `site/dist/main.css`

Compilation is done by **CodeKit 3** (a macOS GUI app; `config.codekit3` is its project file). There is no gulpfile despite `gulp` being a devDependency, and no npm build script. When changing front-end behavior, edit the `src/` source, then rebuild via CodeKit — or, if CodeKit isn't available, hand-edit the corresponding `site/dist/` output as well so the change is actually served.

## Architecture

**Backend** (`app.js` + `controls/`)
- `app.js` — Express setup, `express.static('site')`, registers routes, 404 fallback.
- `controls/routes.js` — route table:
  - `/api/events/` and `/api/space/:date` → proxy the Nexudus (Betamore) coworking API via `controller.js`.
  - `/fw/:name` — serves vendored libs out of `node_modules` (`jquery`, `bootsjs`, `bootscss`, `popper`) and redirects `refresh` to `BROWSER_REFRESH_URL`. `index.html` loads all framework assets through these `/fw/*` aliases, not directly.
  - Note: the `/` route calls `res.render('index')` but no view engine is configured — in practice `/` is served as static `site/index.html`.
- `controls/controller.js` — the only real backend logic: `unirest` GETs against `betamore.spaces.nexudus.com` for events and daily room bookings.

**Front end** (`site/index.html` + `src/js/main.js`)

`main.js` is one procedural jQuery file. On load it fetches four data sources and renders each into a fixed section of `index.html`, then polls every 60s:
- **Weather** — OpenWeatherMap forecast API (city id + APPID hardcoded in `getWeather`), averaged into today/tomorrow/weekend tiles.
- **Traffic** — MapQuest incidents API (key + bounding box hardcoded in `getTraffic`) for the Baltimore area.
- **Events** — via the `/api/events` proxy; today's events also drive room highlighting on the map through `/api/space/:date`.
- **Directory** — parsed client-side from `site/dist/businesses.csv` (columns: `Suite,Company,Company2,Logo1,Logo2`; logos resolve to `site/img/logos/`).

The floor map (`#cgMap .city-garage`) is a set of positioned `.suite`/`.conf` divs styled entirely in SCSS. Suite numbers link the pieces together: a directory row's suite id (or an event's booked room) is turned into a CSS selector like `.suite.s-700` and given the `.show`/highlight class. Clicking a traffic, event, or directory item opens the shared Bootstrap modal (`#alertDetails`); modals and highlights auto-dismiss on timers.

**API keys** for OpenWeatherMap and MapQuest are hardcoded in `src/js/main.js` (and the compiled `main-min.js`) — they ship to the client by design.

## Data / reference files

`site/dist/traffic_response*.json` are captured MapQuest samples used for offline development (swap the `restAPIurl` in `getTraffic` to `localhost` to use them). `site/dist/businesses.csv` is the live directory data and is safe to edit directly.
