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
- **Marketplace and community:** these screens remain local-only. Community has
  General, Farmers, Veterinary, Sellers and Enthusiasts groups. Marketplace
  listings, buyer inquiries and messages are saved in browser localStorage under
  `fishlink-local-content-v1`, including while a backend user is signed in.

The backend is authoritative for farms and telemetry in backend mode. Backend farm
data is not written back into the guest localStorage cache.

## Marketplace, sellers and customer service

- Sellers can publish listings with a WhatsApp number, mark items sold or
  available, delete listings, and review buyer inquiries.
- Buyers can contact a seller through WhatsApp when a number is available, or send
  an inquiry that the seller sees in **Seller Tools**.
- Demo listings without a seller number route buyers to FishLink customer service.
- Customer Service is available from the top bar, profile and footer, with
  WhatsApp, phone and email actions.

Customer-service details are configurable with Create React App environment
variables:

```bash
REACT_APP_CUSTOMER_SERVICE_WHATSAPP=2348012345678
REACT_APP_CUSTOMER_SERVICE_PHONE="+234 801 234 5678"
REACT_APP_CUSTOMER_SERVICE_EMAIL=support@example.com
REACT_APP_CUSTOMER_SERVICE_HOURS="Mon-Sat, 8:00-18:00 WAT"
```

The built-in values are demo placeholders and the support dialog labels them as
such. Set the WhatsApp and phone variables before launch.

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
- `src/contact.ts`: WhatsApp helpers and configurable customer-service details
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
- Marketplace listings and buyer inquiries are not persisted to the backend.
- Seller WhatsApp contact and customer-service links open external apps; no
  message delivery or payment flow runs inside FishLink yet.
- Live WebSocket delivery requires Redis; this UI intentionally uses REST polling.
