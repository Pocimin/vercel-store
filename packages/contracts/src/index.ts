export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface HealthResponse {
  status: "ok";
  service: string;
  time: string;
}

export * from "@nznt/script-protocol";
