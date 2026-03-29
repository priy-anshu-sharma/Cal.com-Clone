/** Calendar day of week for YYYY-MM-DD in local timezone (0 = Sunday … 6 = Saturday). */
export function dayOfWeekFromISODate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date "${dateStr}"`);
  return new Date(y, m - 1, d).getDay();
}

/** Store booking date as UTC midnight for the calendar day (matches YYYY-MM-DD). */
export function dateOnlyToUtcMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date "${dateStr}"`);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function isSameDateOnly(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Interprets HH:mm on the UTC calendar day of `dateUtcMidnight` (consistent with stored bookings). */
export function utcDateTimeFromUtcDateAndHHMM(dateUtcMidnight: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(
    Date.UTC(
      dateUtcMidnight.getUTCFullYear(),
      dateUtcMidnight.getUTCMonth(),
      dateUtcMidnight.getUTCDate(),
      h,
      m,
    ),
  );
}

/** YYYY-MM-DD for a booking `date` stored as UTC midnight for that calendar day. */
export function bookingCalendarDayISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function utcTodayCalendarISO(): string {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(n.getUTCDate()).padStart(2, "0")}`;
}

/** YYYY-MM-DD for "today" in the user's local calendar (matches MiniCalendar / booking flow). */
export function localCalendarTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Epoch ms for local wall-clock `dateISO` + `hh:mm` (same construction as MiniCalendar + slot labels). */
export function getLocalSlotStartUtcMs(dateISO: string, hhmm: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(min)) return NaN;
  return new Date(y, m - 1, d, h, min, 0, 0).getTime();
}

/**
 * True when local wall-clock start on `dateISO` is before now.
 * Used so past slots for "today" match the device calendar (avoids UTC vs local mismatch in the slot list).
 */
export function isLocalSlotStartBeforeNow(dateISO: string, hhmm: string): boolean {
  const t = getLocalSlotStartUtcMs(dateISO, hhmm);
  return Number.isFinite(t) && t < Date.now();
}
