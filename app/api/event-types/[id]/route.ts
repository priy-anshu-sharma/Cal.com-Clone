import { Prisma } from "@prisma/client";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getRouteId, type RouteContextWithId } from "@/lib/route-params";
import { assignUniqueEventSlug } from "@/lib/slug";
import { firstZodIssueMessage } from "@/lib/zod-errors";
import { updateEventTypeSchema } from "@/lib/validation";

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

    const parsed = updateEventTypeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr(firstZodIssueMessage(parsed.error), 400);
    }

    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("Not found", 404);
    }

    const nextTitle = parsed.data.title.trim();
    const titleChanged = existing.title !== nextTitle;

    let slug = existing.slug;
    if (titleChanged) {
      slug = await assignUniqueEventSlug(prisma, nextTitle, id);
    }

    const q = parsed.data.questions;
    const updated = await prisma.eventType.update({
      where: { id },
      data: {
        title: nextTitle,
        description: parsed.data.description ?? undefined,
        duration: parsed.data.duration,
        ...(parsed.data.bufferMinutes !== undefined
          ? { bufferMinutes: parsed.data.bufferMinutes }
          : {}),
        slug,
        ...(q !== undefined
          ? {
              questions:
                q === null ? Prisma.JsonNull : (q as Prisma.InputJsonValue),
            }
          : {}),
      },
    });

    return jsonOk(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return jsonErr("Not found", 404);
    }
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}

export async function DELETE(_req: Request, context: RouteContextWithId) {
  try {
    const id = await getRouteId(context);
    if (!id) {
      return jsonErr("Invalid id", 400);
    }

    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing) {
      return jsonErr("Not found", 404);
    }

    await prisma.eventType.delete({ where: { id } });
    return jsonOk({ id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return jsonErr("Not found", 404);
    }
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}
