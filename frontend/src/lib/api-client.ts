/** Shared fetch utilities — timeouts, safe error parsing */

export const API_TIMEOUT_MS = 30_000;
export const STREAM_TIMEOUT_MS = 120_000;

export function createAbortSignal(timeoutMs: number = API_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export async function parseApiError(res: Response): Promise<string> {
  try {
    const err = await res.json();
    if (typeof err.detail === "string") return err.detail;
    if (Array.isArray(err.detail)) return "Invalid request";
    return JSON.stringify(err.detail);
  } catch {
    return res.statusText || "Request failed";
  }
}
