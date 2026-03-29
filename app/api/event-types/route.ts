import { Prisma } from "@prisma/client";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { assignUniqueEventSlug } from "@/lib/slug";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { createEventTypeSchema } from "@/lib/validation";

export async function GET() {
  try {
    const items = await prisma.eventType.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        bufferMinutes: true,
        slug: true,
        questions: true,
        createdAt: true,
      },
    });
    return jsonOk(items);
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

    const parsed = createEventTypeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const { title, description, duration, bufferMinutes, questions } = parsed.data;

    const titleTrimmed = title.trim();
    const durationInt = Math.trunc(Number(duration));
    if (!Number.isFinite(durationInt) || durationInt <= 0) {
      return jsonErr("Duration must be greater than 0", 400);
    }

    const slug = await assignUniqueEventSlug(prisma, titleTrimmed, null);

    const data: Prisma.EventTypeCreateInput = {
      title: titleTrimmed,
      duration: durationInt,
      bufferMinutes: bufferMinutes ?? 0,
      slug,
    };
    if (description != null && String(description).trim() !== "") {
      data.description = String(description).trim();
    }
    if (questions !== undefined && questions !== null) {
      data.questions = questions as Prisma.InputJsonValue;
    }

    const created = await prisma.eventType.create({ data });

    return jsonOk(created, 201);
  } catch (e) {
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
