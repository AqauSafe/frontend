import type {
  ApiFarm,
  ApiFeeding,
  ApiPond,
  ApiReading,
  ApiSimulationState,
  AuthPayload,
  BootstrapData,
  DataResponse,
  ImportSummary,
} from "./types";

export const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

const ACCESS_KEY = "fishlink-access-token";
const REFRESH_KEY = "fishlink-refresh-token";
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 0, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_KEY) || "";
}

export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_KEY) || "";
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function storeSession(auth: AuthPayload): void {
  localStorage.setItem(ACCESS_KEY, auth.access);
  localStorage.setItem(REFRESH_KEY, auth.refresh);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function messageFromResponse(status: number, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    const error = body.error;
    if (error && typeof error === "object") {
      const detail = error as Record<string, unknown>;
      if (typeof detail.message === "string") return detail.message;
    }
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return `Request failed (${status}).`;
}

function errorParts(payload: unknown): { code?: string; details?: unknown } {
  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    const error = body.error;
    if (error && typeof error === "object") {
      const detail = error as Record<string, unknown>;
      return {
        code: typeof detail.code === "string" ? detail.code : undefined,
        details: detail.details ?? body,
      };
    }
    return { details: body };
  }
  return {};
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        signal: controller.signal,
      });
      if (!response.ok) {
        clearSession();
        return null;
      }
      const payload = (await response.json()) as DataResponse<{
        access?: string;
        refresh?: string;
      }>;
      const access = payload.data?.access;
      if (!access) {
        clearSession();
        return null;
      }
      localStorage.setItem(ACCESS_KEY, access);
      if (payload.data.refresh) {
        localStorage.setItem(REFRESH_KEY, payload.data.refresh);
      }
      return access;
    } catch {
      clearSession();
      return null;
    } finally {
      window.clearTimeout(timer);
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The backend did not respond in time.");
    }
    throw new ApiError("Cannot reach the FishLink backend.");
  } finally {
    window.clearTimeout(timer);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      retry &&
      auth &&
      !path.startsWith("/auth/") &&
      getRefreshToken()
    ) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request<T>(path, { ...options, retry: false });
      }
    }
    const { code, details } = errorParts(payload);
    throw new ApiError(
      messageFromResponse(response.status, payload),
      response.status,
      code,
      details
    );
  }

  return payload as T;
}

export const api = {
  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    otherRole?: string;
    language?: string;
  }): Promise<AuthPayload> {
    const response = await request<DataResponse<AuthPayload>>("/auth/register/", {
      method: "POST",
      auth: false,
      body: input,
    });
    storeSession(response.data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthPayload> {
    const response = await request<DataResponse<AuthPayload>>("/auth/login/", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    storeSession(response.data);
    return response.data;
  },

  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await request<undefined>("/auth/logout/", {
          method: "POST",
          auth: false,
          body: { refresh },
        });
      }
    } finally {
      clearSession();
    }
  },

  async bootstrap(): Promise<BootstrapData> {
    const response = await request<DataResponse<BootstrapData>>("/sync/bootstrap/");
    return response.data;
  },

  async importData(payload: unknown): Promise<ImportSummary> {
    const response = await request<DataResponse<ImportSummary>>("/sync/import/", {
      method: "POST",
      body: payload,
    });
    return response.data;
  },

  async createFarm(input: { name: string; location: string }): Promise<ApiFarm> {
    return request<ApiFarm>("/farms/", { method: "POST", body: input });
  },

  async deleteFarm(id: string): Promise<void> {
    await request<void>(`/farms/${id}/`, { method: "DELETE" });
  },

  async createPond(input: {
    farmId: string;
    name: string;
    population: number;
    length: number;
    width: number;
    status: string;
  }): Promise<ApiPond> {
    return request<ApiPond>("/ponds/", { method: "POST", body: input });
  },

  async deletePond(id: string): Promise<void> {
    await request<void>(`/ponds/${id}/`, { method: "DELETE" });
  },

  async createFeeding(input: {
    pondId: string;
    amount: number;
    fedAt: string;
  }): Promise<ApiFeeding> {
    return request<ApiFeeding>("/feedings/", { method: "POST", body: input });
  },

  async createReading(input: {
    pondId: string;
    temperature: number;
    oxygen: number;
    ph: number;
    level: number;
    turbidityNtu?: number | null;
    recordedAt: string;
    clientId: string;
  }): Promise<ApiReading> {
    return request<ApiReading>("/readings/", {
      method: "POST",
      body: { ...input, source: "manual" },
    });
  },

  async latestReading(pondId: string): Promise<ApiReading | null> {
    const response = await request<DataResponse<ApiReading | null>>(
      `/readings/latest/?pondId=${encodeURIComponent(pondId)}`
    );
    return response.data;
  },

  async simulationState(pondId: string): Promise<ApiSimulationState | null> {
    try {
      const response = await request<DataResponse<ApiSimulationState>>(
        `/simulations/state/?pondId=${encodeURIComponent(pondId)}`
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
