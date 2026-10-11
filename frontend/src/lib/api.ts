// Typed fetch layer over the FastAPI backend. Base is the relative "/api" prefix so the
// same code works in dev (Vite proxies /api → :8001) and behind a single origin in prod.
// In the web build this stays "/api" (same origin). In the Android build, VITE_API_BASE holds the
// full backend origin (see .env.android) because the app's own origin is not the backend.
const BASE = `${(import.meta.env.VITE_API_BASE as string | undefined) ?? ""}/api`;

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 150_000);
  // Auth rides the httpOnly session cookie automatically — never add auth headers here.
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError(408, { detail: "Request timed out" });
    throw new ApiError(0, { detail: "Network unavailable" });
  } finally {
    window.clearTimeout(timeout);
  }

  // FastAPI reports request-validation failures as 422 with a {detail: [...]} body.
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);

export interface Tile {
  id: string;
  name: string;
  code: string;
  size: string;
  finish: string;
  category: string;
  image: string;
  price: number | null;
  description: string;
  created_at: string;
}

export interface TileCreate {
  name: string;
  code: string;
  size: string;
  finish: string;
  category: string;
  image: string;
  price: number | null;
  description: string;
}

export interface TileAssignment {
  tile_name: string;
  tile_image: string;
  surface: string;
  size: string;
}

export interface Design {
  id: string;
  area: string;
  room_image: string;
  generated_image: string;
  style: string;
  tile_assignments: TileAssignment[];
  customer_name: string | null;
  showroom_mode: boolean;
  status: "ready";
  generation_mode: "ai_generated" | "mocked_demo";
  created_at: string;
}

export interface DesignGenerateRequest {
  area: string;
  room_image: string;
  generated_image: string;
  style: string;
  tile_assignments: TileAssignment[];
  customer_name: string | null;
  showroom_mode: boolean;
}
