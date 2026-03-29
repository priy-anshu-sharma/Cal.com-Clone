const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(hhmm: string): number {
  if (!HH_MM.test(hhmm)) {
    throw new Error(`Invalid time "${hhmm}", expected HH:mm`);
  }
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutesSinceMidnight: number): string {
  const h = Math.floor(minutesSinceMidnight / 60);
  const m = minutesSinceMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(hhmm: string, deltaMinutes: number): string {
  const base = parseTime(hhmm);
  return formatTime(base + deltaMinutes);
}

export function generateSlots(input: {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}): string[] {
  const { startTime, endTime, durationMinutes } = input;
  if (durationMinutes <= 0) return [];

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (end <= start) return [];

  const slots: string[] = [];
  for (let t = start; t + durationMinutes <= end; t += durationMinutes) {
    slots.push(formatTime(t));
  }
  return slots;
}

export function filterBookedSlots(slots: string[], bookedStartTimes: Set<string>): string[] {
  return slots.filter((s) => !bookedStartTimes.has(s));
}

/** Normalizes user/API input to zero-padded HH:mm for consistent DB and comparison. */
export function normalizeToHHMM(input: string): string {
  const trimmed = input.trim();
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    throw new Error(`Invalid time "${input}", expected HH:mm`);
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    throw new Error(`Invalid time "${input}"`);
  }
  return formatTime(h * 60 + min);
}

export type SlotRow = {
  startTime: string;
  booked: boolean;
  /** True if slot start is before current server time (same UTC instant model as bookings). */
  past?: boolean;
  /** True if another booking + buffer overlaps this slot. */
  buffered?: boolean;
};

/** Merges availability windows into unique sorted slot starts, marks booked. */
export function buildSlotRows(
  windows: { startTime: string; endTime: string }[],
  durationMinutes: number,
  bookedStartTimesRaw: string[],
): SlotRow[] {
  const merged: string[] = [];
  for (const w of windows) {
    merged.push(
      ...generateSlots({
        startTime: w.startTime,
        endTime: w.endTime,
        durationMinutes,
      }),
    );
  }
  const unique = Array.from(new Set(merged)).sort();
  const booked = new Set(bookedStartTimesRaw.map((t) => normalizeToHHMM(t)));
  return unique.map((startTime) => ({
    startTime,
    booked: booked.has(startTime),
  }));
}
