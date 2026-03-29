import { Prisma } from "@prisma/client";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { validateSlotBookable } from "@/lib/booking-slot";
import { sendBookingRescheduledEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getRouteId, type RouteContextWithId } from "@/lib/route-params";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { rescheduleBookingSchema } from "@/lib/validation";

export async function PUT(req: Request, context: RouteContextWithId) {
  try {
    const id = await getRouteId(context);
    if (!id) {
      return jsonErr("Invalid id", 400);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonErr("Invalid JSON", 400);
    }

    const parsed = rescheduleBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!booking) {
      return jsonErr("Not found", 404);
    }

    const previous = {
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    };

    const { date: newDate, startTime } = parsed.data;

    const slot = await validateSlotBookable({
      db: prisma,
      eventTypeId: booking.eventTypeId,
      dateISO: newDate,
      startTime,
      excludeBookingId: id,
      clientSlotStartUtcMs: parsed.data.slotStartUtcMs,
    });
    if (!slot.ok) {
      return jsonErr(slot.error, slot.status ?? 400);
    }

    try {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          date: slot.dateUtc,
          startTime: slot.startTimeNorm,
          endTime: slot.endTime,
        },
        include: { eventType: true },
      });
      void sendBookingRescheduledEmail(updated, previous);
      return jsonOk(updated);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return jsonErr("Slot already booked", 409);
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return jsonErr("Not found", 404);
    }
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
