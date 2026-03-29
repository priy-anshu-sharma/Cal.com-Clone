"use client";

import { formatBookingTime } from "@/lib/time";

export type UpcomingBookingItem = {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  eventTitle: string;
};

export function UpcomingBookingsList({ items }: { items: UpcomingBookingItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No upcoming bookings yet. Create an event type and share your booking link.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {items.map((b) => {
        const when = formatBookingTime(new Date(b.date), b.startTime, b.endTime);
        return (
          <li
            key={b.id}
            className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 transition hover:border-gray-200"
          >
            <p className="font-medium text-gray-900">{b.eventTitle}</p>
            <p className="text-sm text-gray-700">{b.name}</p>
            <p className="mt-1 text-xs text-gray-500">{when}</p>
          </li>
        );
      })}
    </ul>
  );
}
