# FishLink React Frontend

React 18 + TypeScript app for the FishLink/AquaSafe aquaculture platform. It runs
as a local-first demo by default and connects to the Django backend when the API
is available.

## Requirements

- Node.js and npm
- The backend running at `http://localhost:8000` for authenticated/backend mode

## Setup

```bash
npm install
REACT_APP_API_URL=http://localhost:8000/api/v1 npm start
```

If `REACT_APP_API_URL` is not set, the app uses
`http://localhost:8000/api/v1`. The backend must have its migrations applied.
`REACT_APP_API_URL` is a Create React App environment variable, so it must be set
before starting or building.

## Commands

```bash
npm start              # development server
npx tsc --noEmit       # type check
CI=true npm run build  # production build with warnings treated as errors
```

## Data modes

- **Guest/local mode:** authentication, farm records and water readings stay in
  `localStorage` under `fishlink-data-v2`. No backend is required.
- **Backend mode:** login/register stores JWT tokens, `/sync/bootstrap` hydrates
  farms, ponds, feedings and readings, and authenticated mutations go to the API.
- **Local import:** when a browser has guest records and the user signs in, the
  profile page can import them into the backend. The import is idempotent and
  warns that legacy readings recorded in metres cannot be converted without pond
  depth.
- **Marketplace and community:** these screens remain local-only; they are not yet
  backend-backed.

The backend is authoritative in backend mode. Backend data is not written back into
the guest localStorage cache.

## Live pond visualization

The simulation tab loads `public/fish_pond-live.html` in an iframe with
`?embedded=1&pondId=<uuid>`. The canonical `../fish_pond-live.html` is not edited.

The embedded page:

1. Posts `{"type":"fishlink:ready","pondId":"<uuid>"}` to the parent.
2. Receives `fishlink:status` and `fishlink:reading` messages from the parent.
3. Maps water level to `0–1`, turbidity to `0–1`, pH by `14`, oxygen by `12`, and
   temperature directly.
4. Does not load `mqtt.js` or connect to the public HiveMQ broker.

The parent polls `GET /readings/latest/?pondId=...` and
`GET /simulations/state/?pondId=...` every five seconds. Readings up to 15 seconds
old are live, up to 60 seconds old are stale, and older readings are marked
offline. A stale reading is never labelled live. Redis/WebSocket delivery is
optional; the REST polling path remains functional without it.

See `../../backend/docs/simulations.md` for the backend contract and bridge
details.

## Source map

- `src/App.tsx`: mounted application, auth, farms, readings, profile and import UI
- `src/api/client.ts`: fetch client, JWT storage/refresh, API methods
- `src/api/types.ts`: backend response types
- `src/usePondLive.ts`: five-second live telemetry polling and status thresholds
- `src/PondSimulation.tsx`: embedded iframe and `postMessage` bridge
- `src/test1.tsx`: unwired duplicate kept for compatibility; do not delete without
  explicit approval
- `public/fish_pond-live.html`: editable embedded simulation copy

## Toolchain note

The project uses `react-scripts` 5 and TypeScript 4.4.4. The installed global
`@types/node` can be newer than that TypeScript version, so `tsconfig.json` limits
automatic type inclusion to `react` and `react-dom` and enables `skipLibCheck`.
Avoid removing those settings unless the TypeScript version is upgraded.

## Known limitations

- No frontend unit test suite or browser-based visual regression tests yet.
- No offline mutation queue or automatic retry for failed backend writes.
- Marketplace and community data are not persisted to the backend.
- Live WebSocket delivery requires Redis; this UI intentionally uses REST polling.
