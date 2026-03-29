import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { UpcomingBookingsList } from "@/components/upcoming-bookings-list";
import { utcDateTimeFromUtcDateAndHHMM } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BookingWithEvent = Prisma.BookingGetPayload<{ include: { eventType: true } }>;

export default async function Home() {
  let upcoming: BookingWithEvent[] = [];
  try {
    const all = await prisma.booking.findMany({
      include: { eventType: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
    });
    const now = new Date();
    upcoming = all.filter((b) => utcDateTimeFromUtcDateAndHHMM(b.date, b.startTime) >= now).slice(0, 12);
  } catch (e) {
    console.error("API Error:", e);
  }

  const upcomingItems = upcoming.map((b) => ({
    id: b.id,
    name: b.name,
    date: b.date.toISOString(),
    startTime: b.startTime,
    endTime: b.endTime,
    eventTitle: b.eventType.title,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Scheduling</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
          Create event types, share a link, and let guests book time—no account required.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4 md:justify-start">
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/bookings"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            View all bookings
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold text-gray-900">Upcoming bookings</h2>
        <p className="mt-1 text-xs text-gray-500">Shown in your local timezone. Next meetings across all event types.</p>
        <UpcomingBookingsList items={upcomingItems} />
      </section>
    </div>
  );
}
