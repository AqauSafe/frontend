import React, { useState } from "react";

/**
 * FishLink pond simulation.
 *
 * The animated pond is a separate web page (pond-sim.html) that is shown inside this page
 * in a "frame" (an <iframe>). FishLink gives it the selected pond's details, and it does the rest.
 *
 * ONE-TIME SETUP
 *   1. Copy pond-sim.html into your project's  public  folder  (so it is available at /pond-sim.html).
 *   2. (Optional) put the address of the live-sensor backend in BACKEND_STREAM_URL below.
 */
export type SimulationFarm = {
  id: string;
  name: string;
  location: string;
};

export type SimulationPond = {
  id: string;
  farmId: string;
  name: string;
  population: number;
  length: number;
  width: number;
  status: string;
};

type Props = {
  farms: SimulationFarm[];
  ponds: SimulationPond[];
};

/** Where the simulation page is. If you put the file in  public/simulation/pond-sim.html  write "/simulation/pond-sim.html". */
const SIMULATION_PAGE = "/pond-sim.html";

/**
 * Live sensor data.
 *  - "" (empty)  -> the simulation listens to the sensors' MQTT broker directly (works with no backend).
 *  - "https://your-backend.onrender.com/stream" -> it listens to your Flask backend instead
 *    (the backend also sends the SMS alerts). Remember to set CORS_ORIGIN on the backend.
 */
const BACKEND_STREAM_URL = "";

export default function PondSimulation({ farms, ponds }: Props) {
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id ?? "");
  const selectedPond = ponds.find((pond) => pond.id === selectedPondId);
  const selectedFarm = farms.find((farm) => farm.id === selectedPond?.farmId);

  // The web address of the simulation, with the selected pond's details added on the end.
  const params = new URLSearchParams();
  if (selectedPond) {
    params.set("population", String(selectedPond.population)); // how many fish to show
    params.set("pond", selectedPond.name);
  }
  if (BACKEND_STREAM_URL) {
    params.set("stream", BACKEND_STREAM_URL);
  }
  const query = params.toString();
  const simulationUrl = query ? `${SIMULATION_PAGE}?${query}` : SIMULATION_PAGE;

  return (
    <div className="pond-sim-page">
      <section className="pond-sim-hero">
        <div className="pond-sim-hero-copy">
          <span className="pond-sim-eyebrow">FISHLINK · INTERACTIVE LAB</span>
          <h2>Live Pond Simulation</h2>
          <p>
            Explore a virtual fish pond and observe its environment. The water, the fish and
            the alerts follow the pond sensors in real time.
          </p>
          <div className="pond-sim-status"><span /> Live simulation connected</div>
        </div>
        <div className="pond-sim-hero-art" aria-hidden="true">🐟</div>
      </section>

      <section className="pond-sim-context panel">
        <div className="pond-sim-section-heading">
          <div>
            <h3>Simulation environment</h3>
            <p>Select a registered pond to provide context to the simulation.</p>
          </div>
          <span className="pond-sim-tag">LIVE SIMULATION</span>
        </div>

        {ponds.length > 0 ? (
          <div className="pond-sim-select-row">
            <label htmlFor="pond-simulation-select">Connected FishLink pond</label>
            <select
              id="pond-simulation-select"
              value={selectedPondId}
              onChange={(event) => setSelectedPondId(event.target.value)}
            >
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>{pond.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="pond-sim-empty-context">
            No registered ponds yet. The simulation still runs with a default pond;
            pond data will appear here when a pond is added in My Farms.
          </div>
        )}

        {selectedPond && (
          <div className="pond-sim-context-grid">
            <div><small>Pond</small><strong>{selectedPond.name}</strong></div>
            <div><small>Farm</small><strong>{selectedFarm?.name ?? "Farm not found"}</strong></div>
            <div><small>Stock population</small><strong>{selectedPond.population.toLocaleString()} fish</strong></div>
            <div><small>Dimensions</small><strong>{selectedPond.length} × {selectedPond.width} m</strong></div>
          </div>
        )}
      </section>

      {/* The animation. Keep this outer section: the page layout depends on it. */}
      <section className="pond-sim-stage" id="fishlink-pond-simulation-stage">
        <iframe
          key={selectedPond?.id ?? "no-pond"} // restarts the simulation when another pond is chosen
          src={simulationUrl}
          title="Live pond simulation"
          loading="lazy"
          allowFullScreen
          style={{
            display: "block",
            width: "100%",
            height: "70vh",
            minHeight: 420,
            border: 0,
            borderRadius: 16,
            background: "#0a1a24",
          }}
        />
      </section>
    </div>
  );
}
