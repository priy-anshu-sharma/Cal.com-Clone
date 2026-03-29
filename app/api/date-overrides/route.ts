import { Prisma } from "@prisma/client";
import { dateOnlyToUtcMidnight } from "@/lib/date";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { parseTime } from "@/lib/slots";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { dateOverridesPostSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get("eventTypeId")?.trim();
    if (!eventTypeId) {
      return jsonErr("eventTypeId is required", 400);
    }

    const event = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!event) {
      return jsonErr("Event type not found", 404);
    }

    const rows = await prisma.dateOverride.findMany({
      where: { eventTypeId },
      orderBy: { date: "asc" },
    });

    const overrides = rows.map((r) => ({
      id: r.id,
      date: dateOnlyToUtcMidnightString(r.date),
      isUnavailable: r.isUnavailable,
      startTime: r.startTime,
      endTime: r.endTime,
    }));

    return jsonOk({ overrides });
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}

function dateOnlyToUtcMidnightString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonErr("Invalid JSON", 400);
    }

    const parsed = dateOverridesPostSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const { eventTypeId, overrides: rawOverrides } = parsed.data;

    const event = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
    if (!event) {
      return jsonErr("Event type not found", 404);
    }

    const normalized: {
      dateUtc: Date;
      isUnavailable: boolean;
      startTime: string | null;
      endTime: string | null;
    }[] = [];

    const seen = new Set<string>();
    for (const row of rawOverrides) {
      let dateUtc: Date;
      try {
        dateUtc = dateOnlyToUtcMidnight(row.date);
      } catch {
        return jsonErr(`Invalid date: ${row.date}`, 400);
      }
      const key = dateUtc.toISOString();
      if (seen.has(key)) {
        return jsonErr("Duplicate date in overrides", 400);
      }
      seen.add(key);

      if (row.isUnavailable) {
        normalized.push({ dateUtc, isUnavailable: true, startTime: null, endTime: null });
        continue;
      }

      if (!row.startTime || !row.endTime) {
        return jsonErr("Custom hours require startTime and endTime", 400);
      }

      try {
        if (parseTime(row.startTime) >= parseTime(row.endTime)) {
          return jsonErr("End time must be after start time", 400);
        }
      } catch {
        return jsonErr("Invalid time range", 400);
      }

      normalized.push({
        dateUtc,
        isUnavailable: false,
        startTime: row.startTime,
        endTime: row.endTime,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.dateOverride.deleteMany({ where: { eventTypeId } });
      for (const n of normalized) {
        await tx.dateOverride.create({
          data: {
            eventTypeId,
            date: n.dateUtc,
            isUnavailable: n.isUnavailable,
            startTime: n.startTime,
            endTime: n.endTime,
          },
        });
      }
    });

    return jsonOk({ saved: normalized.length });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("API Error:", e);
      return jsonErr("Could not save overrides", 400);
    }
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
