import { API_GENERIC_ERROR } from "@/lib/api-response";

export type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: string };

export function parseApiEnvelope<T>(json: unknown): ApiEnvelope<T> {
  if (!json || typeof json !== "object") {
    return { success: false, error: "Invalid response" };
  }
  const o = json as Record<string, unknown>;
  if (o.success === true && "data" in o) {
    return { success: true, data: o.data as T };
  }
  if (o.success === false && typeof o.error === "string") {
    return { success: false, error: o.error };
  }
  return { success: false, error: "Unexpected response" };
}

export async function readApiEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  try {
    const json = await res.json();
    const parsed = parseApiEnvelope<T>(json);
    if (!res.ok && parsed.success) {
      return { success: false, error: API_GENERIC_ERROR };
    }
    return parsed;
  } catch {
    return { success: false, error: !res.ok ? API_GENERIC_ERROR : "Invalid response" };
  }
}
