import { Prisma } from "@prisma/client";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { validateSlotBookable } from "@/lib/booking-slot";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { parseEventQuestions, pickBookingAnswers } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { createBookingSchema } from "@/lib/validation";
import { utcDateTimeFromUtcDateAndHHMM } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    const bookings = await prisma.booking.findMany({
      include: { eventType: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const now = new Date();
    let filtered = bookings;
    if (scope === "upcoming") {
      filtered = bookings.filter((b) => utcDateTimeFromUtcDateAndHHMM(b.date, b.startTime) >= now);
    } else if (scope === "past") {
      filtered = bookings.filter((b) => utcDateTimeFromUtcDateAndHHMM(b.date, b.startTime) < now);
    }

    return jsonOk(filtered);
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonErr("Invalid JSON", 400);
    }

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const { eventTypeId, name, email, date } = parsed.data;

    const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!eventType) {
      return jsonErr("Event type not found", 404);
    }

    const questions = parseEventQuestions(eventType.questions);
    const rawAnswers = parsed.data.answers ?? {};
    for (const q of questions) {
      if (!q.required) continue;
      const v = rawAnswers[q.id];
      if (v === undefined || String(v).trim() === "") {
        return jsonErr(`Please answer: ${q.label}`, 400);
      }
    }

    const answersToStore = pickBookingAnswers(questions, rawAnswers);

    const slot = await validateSlotBookable({
      db: prisma,
      eventTypeId,
      dateISO: date,
      startTime: parsed.data.startTime,
      clientSlotStartUtcMs: parsed.data.slotStartUtcMs,
    });
    if (!slot.ok) {
      return jsonErr(slot.error, slot.status ?? 400);
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          eventTypeId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          date: slot.dateUtc,
          startTime: slot.startTimeNorm,
          endTime: slot.endTime,
          ...(answersToStore !== undefined
            ? { answers: answersToStore as Prisma.InputJsonValue }
            : {}),
        },
        include: { eventType: true },
      });
      void sendBookingConfirmationEmail(booking);
      return jsonOk(booking, 201);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return jsonErr("Slot already booked", 409);
      }
      throw e;
    }
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
