export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  primaryRole?: string;
  otherRole?: string;
  language?: string;
  isGuest?: boolean;
};

export type AuthPayload = {
  user: ApiUser;
  access: string;
  refresh: string;
};

export type ApiFarm = {
  id: string;
  name: string;
  location: string;
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiPond = {
  id: string;
  farmId: string;
  name: string;
  population: number;
  length: string | number;
  width: string | number;
  depth?: string | number;
  species?: string;
  status: string;
  clientId?: string;
};

export type ApiFeeding = {
  id: string;
  pondId: string;
  amount: string | number;
  fedAt?: string;
  date: string;
  note?: string;
};

export type ApiReading = {
  id: string;
  pondId: string;
  source: string;
  temperature: string | number | null;
  oxygen: string | number | null;
  ph: string | number | null;
  level: string | number | null;
  turbidityNtu?: string | number | null;
  recordedAt?: string;
  date: string;
  clientId?: string;
  messageId?: string;
};

export type ApiSimulationState = {
  id: string;
  farmId: string;
  pondId: string;
  isActive: boolean;
  state: {
    temperature?: number | null;
    oxygen?: number | null;
    ph?: number | null;
    level?: number | null;
    turbidityNtu?: number | null;
    recordedAt?: string;
  };
  lastStateAt?: string;
};

export type BootstrapData = {
  user: ApiUser;
  language: string;
  farms: ApiFarm[];
  ponds: ApiPond[];
  feedings: ApiFeeding[];
  readings: ApiReading[];
  devices?: unknown[];
  alerts?: unknown[];
  listings?: unknown[];
  messages?: unknown[];
  serverTime?: string;
};

export type ImportSummary = {
  farms: { created: number; updated: number };
  ponds: { created: number; updated: number };
  feedings: { created: number; updated: number };
  readings: { created: number; updated: number };
  ignored: Record<string, number>;
  errors: Array<{ section: string; index: number; detail: unknown }>;
};

export type DataResponse<T> = {
  data: T;
};

export type ListResponse<T> = {
  data: T[];
  meta?: Record<string, unknown>;
};
