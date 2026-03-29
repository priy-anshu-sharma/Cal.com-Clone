import { clashesWithBufferedIntervals } from "@/lib/booking-buffer";
import { dateOnlyToUtcMidnight, utcDateTimeFromUtcDateAndHHMM } from "@/lib/date";
import { getEffectiveDay } from "@/lib/booking-slot";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { addMinutes, buildSlotRows, parseTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get("eventTypeId");
    const date = searchParams.get("date");
    const excludeBookingId = searchParams.get("excludeBookingId")?.trim() || undefined;

    if (!eventTypeId || !date) {
      return jsonErr("eventTypeId and date are required", 400);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonErr("date must be YYYY-MM-DD", 400);
    }

    const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!eventType) {
      return jsonErr("Event type not found", 404);
    }

    const dateUtc = dateOnlyToUtcMidnight(date);
    const day = await getEffectiveDay(prisma, eventTypeId, date);

    if (day.blocked) {
      return jsonOk({ slots: [] });
    }

    const bookingWhere: {
      eventTypeId: string;
      date: Date;
      NOT?: { id: string };
    } = { eventTypeId, date: dateUtc };
    if (excludeBookingId) {
      bookingWhere.NOT = { id: excludeBookingId };
    }

    const bookingRows = await prisma.booking.findMany({
      where: bookingWhere,
      select: { startTime: true, endTime: true },
    });

    const bookedStarts = bookingRows.map((b) => b.startTime);
    const intervals = bookingRows.map((b) => ({
      start: parseTime(b.startTime),
      end: parseTime(b.endTime),
    }));
    const bufferMin = Math.max(0, eventType.bufferMinutes ?? 0);
    const nowMs = Date.now();

    const baseSlots = buildSlotRows(day.windows, eventType.duration, bookedStarts);

    const slots = baseSlots.map((row) => {
      const startMs = utcDateTimeFromUtcDateAndHHMM(dateUtc, row.startTime).getTime();
      const past = startMs < nowMs;
      let buffered = false;
      if (!row.booked && bufferMin >= 0) {
        try {
          const ns = parseTime(row.startTime);
          const ne = parseTime(addMinutes(row.startTime, eventType.duration));
          buffered = clashesWithBufferedIntervals(ns, ne, intervals, bufferMin);
        } catch {
          buffered = false;
        }
      }
      return { ...row, past, buffered };
    });

    return jsonOk({ slots });
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
