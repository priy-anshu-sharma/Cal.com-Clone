export type BookingQuestion = { id: string; label: string; required?: boolean };

/** Parses stored JSON into a safe list of custom questions (max 20). */
export function parseEventQuestions(raw: unknown): BookingQuestion[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: BookingQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    const label = (item as { label?: unknown }).label;
    if (typeof id !== "string" || typeof label !== "string") continue;
    if (id.length === 0 || id.length > 64 || label.length === 0 || label.length > 500) continue;
    out.push({
      id,
      label,
      required: Boolean((item as { required?: unknown }).required),
    });
  }
  return out.slice(0, 20);
}

/** Maps answers to question ids; ignores unknown keys. */
export function pickBookingAnswers(
  questions: BookingQuestion[],
  raw: Record<string, unknown> | undefined | null,
): Record<string, string> | undefined {
  if (!questions.length) return undefined;
  const out: Record<string, string> = {};
  const src = raw && typeof raw === "object" ? raw : {};
  const ids = new Set(questions.map((q) => q.id));
  for (const id of ids) {
    const v = src[id];
    if (v === undefined || v === null) continue;
    const s = String(v).trim().slice(0, 2000);
    if (s.length) out[id] = s;
  }
  return Object.keys(out).length ? out : undefined;
}
