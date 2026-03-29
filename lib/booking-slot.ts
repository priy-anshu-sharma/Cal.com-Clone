import type { PrismaClient } from "@prisma/client";
import { clashesWithBufferedIntervals } from "@/lib/booking-buffer";
import { dateOnlyToUtcMidnight, dayOfWeekFromISODate, utcDateTimeFromUtcDateAndHHMM } from "@/lib/date";
import { addMinutes, buildSlotRows, normalizeToHHMM, parseTime } from "@/lib/slots";

export type EffectiveDayResult =
  | { blocked: true }
  | { blocked: false; windows: { startTime: string; endTime: string }[] };

/** Weekly availability + date overrides: blocked day, custom hours, or default weekly windows. */
export async function getEffectiveDay(
  db: PrismaClient,
  eventTypeId: string,
  dateISO: string,
): Promise<EffectiveDayResult> {
  let dateUtc: Date;
  try {
    dateUtc = dateOnlyToUtcMidnight(dateISO);
  } catch {
    return { blocked: true };
  }

  const override = await db.dateOverride.findUnique({
    where: {
      eventTypeId_date: { eventTypeId, date: dateUtc },
    },
  });

  if (override?.isUnavailable) {
    return { blocked: true };
  }

  if (override?.startTime && override?.endTime && !override.isUnavailable) {
    return {
      blocked: false,
      windows: [{ startTime: override.startTime, endTime: override.endTime }],
    };
  }

  const dow = dayOfWeekFromISODate(dateISO);
  const rows = await db.availability.findMany({
    where: { eventTypeId, dayOfWeek: dow },
  });
  return {
    blocked: false,
    windows: rows.map((r) => ({ startTime: r.startTime, endTime: r.endTime })),
  };
}

export type ValidateSlotResult =
  | {
      ok: true;
      startTimeNorm: string;
      endTime: string;
      dateUtc: Date;
    }
  | { ok: false; error: string; status?: number };

/** Ensures the slot exists in effective availability and is not double-booked. */
export async function validateSlotBookable(params: {
  db: PrismaClient;
  eventTypeId: string;
  dateISO: string;
  startTime: string;
  excludeBookingId?: string;
  /** Client-computed epoch ms for local calendar + slot time (optional; blocks past times in user's TZ). */
  clientSlotStartUtcMs?: number;
}): Promise<ValidateSlotResult> {
  const { db, eventTypeId, dateISO, startTime, excludeBookingId, clientSlotStartUtcMs } = params;

  const eventType = await db.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType) {
    return { ok: false, error: "Event type not found", status: 404 };
  }

  let startTimeNorm: string;
  try {
    startTimeNorm = normalizeToHHMM(startTime);
  } catch {
    return { ok: false, error: "Invalid start time", status: 400 };
  }

  let dateUtc: Date;
  try {
    dateUtc = dateOnlyToUtcMidnight(dateISO);
  } catch {
    return { ok: false, error: "Invalid date", status: 400 };
  }

  const day = await getEffectiveDay(db, eventTypeId, dateISO);
  if (day.blocked) {
    return { ok: false, error: "Date not available", status: 400 };
  }

  if (day.windows.length === 0) {
    return { ok: false, error: "No availability for this date", status: 400 };
  }

  const rows = buildSlotRows(day.windows, eventType.duration, []);
  const allowed = new Set(rows.map((r) => r.startTime));
  if (!allowed.has(startTimeNorm)) {
    return { ok: false, error: "Invalid time slot", status: 400 };
  }

  if (
    typeof clientSlotStartUtcMs === "number" &&
    Number.isFinite(clientSlotStartUtcMs) &&
    clientSlotStartUtcMs < Date.now()
  ) {
    return { ok: false, error: "Cannot book past time", status: 400 };
  }

  const startInstant = utcDateTimeFromUtcDateAndHHMM(dateUtc, startTimeNorm);
  if (startInstant.getTime() < Date.now()) {
    return { ok: false, error: "Cannot book past time", status: 400 };
  }

  const endTimeNorm = addMinutes(startTimeNorm, eventType.duration);
  let newStartMin: number;
  let newEndMin: number;
  try {
    newStartMin = parseTime(startTimeNorm);
    newEndMin = parseTime(endTimeNorm);
  } catch {
    return { ok: false, error: "Invalid time slot", status: 400 };
  }

  const bufferMin = Math.max(0, eventType.bufferMinutes ?? 0);

  const dayBookings = await db.booking.findMany({
    where: {
      eventTypeId,
      date: dateUtc,
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  let intervals: { start: number; end: number }[];
  try {
    intervals = dayBookings.map((b) => ({
      start: parseTime(b.startTime),
      end: parseTime(b.endTime),
    }));
  } catch {
    return { ok: false, error: "Invalid time slot", status: 400 };
  }

  if (clashesWithBufferedIntervals(newStartMin, newEndMin, intervals, bufferMin)) {
    return { ok: false, error: "Slot already booked or too close to another meeting", status: 409 };
  }

  return {
    ok: true,
    startTimeNorm,
    endTime: endTimeNorm,
    dateUtc,
  };
}
