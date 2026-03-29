import { Prisma } from "@prisma/client";
import { API_GENERIC_ERROR, jsonErr, jsonOk } from "@/lib/api-response";
import { sendBookingCancellationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getRouteId, type RouteContextWithId } from "@/lib/route-params";

/** `context.params` is a Promise in Next.js 15+ — always resolve via getRouteId. */
export async function DELETE(_req: Request, context: RouteContextWithId) {
  try {
    const id = await getRouteId(context);
    if (!id) {
      return jsonErr("Invalid id", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { eventType: true },
    });
    if (!booking) {
      return jsonErr("Not found", 404);
    }

    await prisma.booking.delete({ where: { id } });
    void sendBookingCancellationEmail(booking).catch((e) => {
      console.error("API Error:", e);
    });
    return jsonOk({ id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return jsonErr("Not found", 404);
    }
    console.error("API Error:", e);
    return jsonErr(API_GENERIC_ERROR, 500);
  }
}

