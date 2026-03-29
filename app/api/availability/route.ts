import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { parseTime } from "@/lib/slots";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { availabilityPostSchema } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get("eventTypeId");
    if (!eventTypeId) {
      return jsonErr("eventTypeId is required", 400);
    }

    const rows = await prisma.availability.findMany({
      where: { eventTypeId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return jsonOk(rows);
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

    const parsed = availabilityPostSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const { eventTypeId, slots } = parsed.data;

    const event = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!event) {
      return jsonErr("Event type not found", 404);
    }

    for (const s of slots) {
      try {
        if (parseTime(s.endTime) <= parseTime(s.startTime)) {
          return jsonErr(`endTime must be after startTime for day ${s.dayOfWeek}`, 400);
        }
      } catch {
        return jsonErr("Invalid time range", 400);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { eventTypeId } });
      if (slots.length > 0) {
        await tx.availability.createMany({
          data: slots.map((s) => ({
            eventTypeId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }
    });

    const rows = await prisma.availability.findMany({
      where: { eventTypeId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return jsonOk(rows);
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
