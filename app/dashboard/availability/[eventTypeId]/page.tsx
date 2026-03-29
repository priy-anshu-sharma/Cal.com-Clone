import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityEditor } from "@/components/availability-editor";
import { DateOverrideEditor } from "@/components/date-override-editor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ eventTypeId: string }> };

export default async function AvailabilityPage({ params }: Props) {
  const { eventTypeId } = await params;
  const event = await prisma.eventType.findUnique({
    where: { id: eventTypeId },
    select: { id: true, title: true, slug: true },
  });
  if (!event) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">Availability</h1>
        <p className="mt-1 text-sm text-gray-600">
          {event.title} · <span className="text-gray-500">/book/{event.slug}</span>
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AvailabilityEditor eventTypeId={event.id} />
        <DateOverrideEditor eventTypeId={event.id} />
      </div>
    </div>
  );
}
