import React, { useEffect, useRef, useState } from "react";

import { usePondLive } from "./usePondLive";
import type { LiveStatus } from "./usePondLive";

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

const statusLabel: Record<LiveStatus, string> = {
  idle: "No pond selected",
  waiting: "Waiting for readings",
  live: "Live",
  stale: "Stale data",
  offline: "Sensor offline",
  error: "Telemetry unavailable",
};

export default function PondSimulation({ farms, ponds }: Props) {
  const [selectedPondId, setSelectedPondId] = useState(ponds[0]?.id ?? "");
  const [frameReady, setFrameReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedPond = ponds.find((pond) => pond.id === selectedPondId);
  const selectedFarm = farms.find((farm) => farm.id === selectedPond?.farmId);
  const live = usePondLive(selectedPondId, Boolean(selectedPondId));
  const reading =
    live.reading && live.reading.pondId === selectedPondId ? live.reading : null;
  const liveStatus: LiveStatus = reading
    ? live.status
    : live.status === "error"
      ? "error"
      : selectedPondId
        ? "waiting"
        : "idle";

  useEffect(() => {
    if (!ponds.some((pond) => pond.id === selectedPondId)) {
      setFrameReady(false);
      setSelectedPondId(ponds[0]?.id ?? "");
    }
  }, [ponds, selectedPondId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string; pondId?: string } | null;
      if (data?.type === "fishlink:ready" && data.pondId === selectedPondId) {
        setFrameReady(true);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectedPondId]);

  useEffect(() => {
    if (!frameReady) return;
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;

    frame.postMessage(
      {
        type: "fishlink:status",
        status: liveStatus,
        lastFetchedAt: live.lastFetchedAt,
      },
      window.location.origin
    );

    if (reading) {
      frame.postMessage(
        { type: "fishlink:reading", reading },
        window.location.origin
      );
    }
  }, [frameReady, live.lastFetchedAt, liveStatus, reading]);

  const iframeSrc = `${process.env.PUBLIC_URL || ""}/fish_pond-live.html?embedded=1&pondId=${encodeURIComponent(
    selectedPondId
  )}`;
  const recordedAt = reading?.recordedAt
    ? new Date(reading.recordedAt).toLocaleString()
    : "No reading received yet";

  return (
    <div className="pond-sim-page">
      <section className="pond-sim-hero">
        <div className="pond-sim-hero-copy">
          <span className="pond-sim-eyebrow">FISHLINK · LIVE POND</span>
          <h2>Live Pond Visualization</h2>
          <p>
            The pond animation follows the latest telemetry saved for the selected
            pond. Older readings remain visible but are marked stale or offline so
            they are never presented as live.
          </p>
          <div className={`pond-sim-status ${liveStatus}`}>
            <span />
            {statusLabel[liveStatus]}
          </div>
        </div>
        <div className="pond-sim-hero-art" aria-hidden="true">
          🐟
        </div>
      </section>

      <section className="pond-sim-context panel">
        <div className="pond-sim-section-heading">
          <div>
            <h3>Live pond</h3>
            <p>Select a registered pond to receive its latest backend readings.</p>
          </div>
          <span className="pond-sim-tag">BACKEND LIVE DATA</span>
        </div>

        {ponds.length > 0 ? (
          <div className="pond-sim-select-row">
            <label htmlFor="pond-simulation-select">Connected FishLink pond</label>
            <select
              id="pond-simulation-select"
              value={selectedPondId}
              onChange={(event) => {
                setFrameReady(false);
                setSelectedPondId(event.target.value);
              }}
            >
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="pond-sim-empty-context">
            No registered ponds yet. Add a farm and pond in My Farms to begin
            receiving live water-quality readings.
          </div>
        )}

        {selectedPond && (
          <div className="pond-sim-context-grid">
            <div>
              <small>Pond</small>
              <strong>{selectedPond.name}</strong>
            </div>
            <div>
              <small>Farm</small>
              <strong>{selectedFarm?.name ?? "Farm not found"}</strong>
            </div>
            <div>
              <small>Last reading</small>
              <strong>{recordedAt}</strong>
            </div>
            <div>
              <small>Source</small>
              <strong>{reading?.source ?? "Waiting"}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="pond-sim-stage" id="fishlink-pond-simulation-stage">
        {selectedPond ? (
          <div className="pond-sim-frame-wrap">
            <div className={`pond-sim-live-strip ${liveStatus}`}>
              <span>{statusLabel[liveStatus]}</span>
              <small>{live.error || recordedAt}</small>
            </div>
            <iframe
              key={selectedPondId}
              ref={iframeRef}
              className="pond-sim-frame"
              src={iframeSrc}
              title={`Live pond visualization for ${selectedPond.name}`}
            />
          </div>
        ) : (
          <div className="pond-sim-stage-inner">
            <div className="pond-sim-stage-icon">◉</div>
            <span className="pond-sim-stage-label">LIVE VIEWPORT</span>
            <h3>Add a pond to begin</h3>
            <p>
              The pond visualization starts automatically when the selected pond
              has backend telemetry.
            </p>
          </div>
        )}
      </section>

      <section className="pond-sim-integration-note">
        <span>↗</span>
        <div>
          <strong>Live data bridge</strong>
          <p>
            The animation is embedded locally and receives readings from this
            page. It does not connect to the public MQTT broker while embedded.
          </p>
        </div>
      </section>
    </div>
  );
}
