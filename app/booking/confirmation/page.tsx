import Link from "next/link";
import { notFound } from "next/navigation";
import { formatBookingTime } from "@/lib/time";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function BookingConfirmationPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id?.trim()) notFound();

  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: id.trim() },
      include: { eventType: true },
    });
  } catch (e) {
    console.error("API Error:", e);
    notFound();
  }
  if (!booking) notFound();

  const when = formatBookingTime(booking.date, booking.startTime, booking.endTime);

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-900">
          ✓
        </div>
        <h1 className="mt-4 text-lg font-semibold text-gray-900">You&apos;re scheduled</h1>
        <p className="mt-1 text-sm text-gray-600">Your booking is saved. We&apos;ll use the email you provided for any updates.</p>
      </div>

      <dl className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Event</dt>
          <dd className="mt-1 font-medium text-gray-900">{booking.eventType.title}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">When</dt>
          <dd className="mt-1 text-gray-900">{when}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
          <dd className="mt-1 text-gray-900">{booking.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
          <dd className="mt-1 text-gray-900">{booking.email}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 pt-2">
        <Link
          href={`/book/${booking.eventType.slug}`}
          className="block rounded-xl border border-gray-200 bg-white py-2.5 text-center text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Book another time
        </Link>
        <Link href="/" className="block text-center text-sm text-gray-600 hover:text-gray-900">
          Home
        </Link>
      </div>
    </div>
  );
}
