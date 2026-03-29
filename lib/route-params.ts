/**
 * Next.js App Router passes `params` as a Promise (v15+) and may omit it; segment values
 * can be `string | string[] | undefined`. Never use sync `params.id` without awaiting.
 */
export type RouteContextWithId = {
  params?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function normalizeSegmentId(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return "";
}

export async function getRouteId(
  context: RouteContextWithId | undefined,
): Promise<string | undefined> {
  if (!context?.params) return undefined;
  const p = await Promise.resolve(context.params);
  const id = normalizeSegmentId(p?.id);
  return id || undefined;
}
