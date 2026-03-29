import { DashboardShell } from "@/components/dashboard-shell";
import type { EventTypeRow } from "@/lib/event-type";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let initialEventTypes: EventTypeRow[] = [];
  try {
    initialEventTypes = await prisma.eventType.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        bufferMinutes: true,
        slug: true,
        questions: true,
      },
    });
  } catch (e) {
    console.error("API Error:", e);
  }

  return <DashboardShell initialEventTypes={initialEventTypes} />;
}
