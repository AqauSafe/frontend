import { useEffect, useState } from "react";

import { api } from "./api/client";
import type { ApiReading, ApiSimulationState } from "./api/types";

export type LiveStatus = "idle" | "waiting" | "live" | "stale" | "offline" | "error";

export type LivePondReading = {
  pondId: string;
  temperature: number | null;
  oxygen: number | null;
  ph: number | null;
  level: number | null;
  turbidityNtu: number | null;
  recordedAt: string;
  source: string;
};

type LiveSnapshot = {
  reading: LivePondReading | null;
  status: LiveStatus;
  lastFetchedAt: number;
  error: string;
};

const POLL_INTERVAL_MS = 5000;
const LIVE_WINDOW_MS = 15000;
const STALE_WINDOW_MS = 60000;

const toNullableNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const timestamp = (value: string | undefined | null): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const fromReading = (reading: ApiReading): LivePondReading => ({
  pondId: reading.pondId,
  temperature: toNullableNumber(reading.temperature),
  oxygen: toNullableNumber(reading.oxygen),
  ph: toNullableNumber(reading.ph),
  level: toNullableNumber(reading.level),
  turbidityNtu: toNullableNumber(reading.turbidityNtu),
  recordedAt: reading.recordedAt || reading.date,
  source: reading.source,
});

const fromState = (
  pondId: string,
  simulation: ApiSimulationState
): LivePondReading | null => {
  const state = simulation.state || {};
  const hasValue =
    state.temperature !== null && state.temperature !== undefined ||
    state.oxygen !== null && state.oxygen !== undefined ||
    state.ph !== null && state.ph !== undefined ||
    state.level !== null && state.level !== undefined ||
    state.turbidityNtu !== null && state.turbidityNtu !== undefined;
  if (!hasValue) return null;
  return {
    pondId,
    temperature: toNullableNumber(state.temperature),
    oxygen: toNullableNumber(state.oxygen),
    ph: toNullableNumber(state.ph),
    level: toNullableNumber(state.level),
    turbidityNtu: toNullableNumber(state.turbidityNtu),
    recordedAt:
      state.recordedAt || simulation.lastStateAt || new Date().toISOString(),
    source: "simulation",
  };
};

const statusFor = (recordedAt: string | undefined, now: number): LiveStatus => {
  const time = timestamp(recordedAt);
  if (!time) return "waiting";
  const age = Math.max(0, now - time);
  if (age <= LIVE_WINDOW_MS) return "live";
  if (age <= STALE_WINDOW_MS) return "stale";
  return "offline";
};

export function usePondLive(
  pondId: string | undefined,
  enabled: boolean
): LiveSnapshot {
  const [reading, setReading] = useState<LivePondReading | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setReading(null);
    setLastFetchedAt(0);
    setError("");

    if (!pondId || !enabled) return;

    let cancelled = false;
    let timer = 0;

    const load = async () => {
      const [readingResult, stateResult] = await Promise.all([
        api
          .latestReading(pondId)
          .then((value): { ok: true; value: ApiReading | null } => ({ ok: true, value }))
          .catch((reason: unknown): { ok: false; reason: unknown } => ({ ok: false, reason })),
        api
          .simulationState(pondId)
          .then(
            (value): { ok: true; value: ApiSimulationState | null } => ({ ok: true, value })
          )
          .catch((reason: unknown): { ok: false; reason: unknown } => ({ ok: false, reason })),
      ]);

      if (cancelled) return;

      const liveReading = readingResult.ok && readingResult.value
        ? fromReading(readingResult.value)
        : null;
      const simulatedReading =
        stateResult.ok && stateResult.value
          ? fromState(pondId, stateResult.value)
          : null;
      const next = liveReading || simulatedReading;

      if (next) {
        setReading(next);
        setLastFetchedAt(Date.now());
        setError("");
      } else if (!readingResult.ok && !stateResult.ok) {
        setError("Live telemetry is temporarily unavailable.");
      } else {
        setError("");
      }
    };

    void load();
    timer = window.setInterval(() => void load(), POLL_INTERVAL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearInterval(clock);
    };
  }, [enabled, pondId]);

  let status: LiveStatus;
  if (!pondId || !enabled) status = "idle";
  else if (error && !reading) status = "error";
  else if (!reading) status = "waiting";
  else status = statusFor(reading.recordedAt, now);

  return {
    reading,
    status,
    lastFetchedAt,
    error,
  };
}
