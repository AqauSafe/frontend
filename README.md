# FishLink Frontend

React 18 + TypeScript frontend for the FishLink/AquaSafe aquaculture platform.

## Contents

- `fishlink/`: the React application, API client and embedded live pond view.
- `fish_pond-live.html`: canonical ESP32/MQTT pond simulation. Do not edit this
  copy; the app uses `fishlink/public/fish_pond-live.html`.
- `Fish Simulation` and `Hackathon.zip`: original project assets, left unchanged.

## Run locally

Start the backend from `../backend` first, including migrations. Then:

```bash
cd fishlink
npm install
npm start
```

Open `http://localhost:3000`. The frontend connects to the backend at
`http://localhost:8000/api/v1` by default.

To use a different API URL:

```bash
REACT_APP_API_URL=http://localhost:8000/api/v1 npm start
```

## Verify

```bash
cd fishlink
npx tsc --noEmit
CI=true npm run build
```

## Documentation

See [fishlink/README.md](fishlink/README.md) for application structure, local-data
import, live pond polling, the embedded iframe bridge and known limitations.

Backend contracts are documented in
[../backend/docs/simulations.md](../backend/docs/simulations.md) and
[../backend/docs/mqtt.md](../backend/docs/mqtt.md).
