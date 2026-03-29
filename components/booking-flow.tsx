"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingForm } from "@/components/booking-form";
import { MiniCalendar } from "@/components/mini-calendar";
import { SlotPicker } from "@/components/slot-picker";
import type { BookingCreatedPayload } from "@/lib/booking";
import { readApiEnvelope } from "@/lib/api-client";
import type { BookingQuestion } from "@/lib/questions";
import type { SlotRow } from "@/lib/slots";

export type BookableEvent = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  slug: string;
  questions: BookingQuestion[];
};

type Props = {
  event: BookableEvent;
};

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingFlow({ event }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(todayISODate());
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const minDate = useMemo(() => todayISODate(), []);

  const loadSlots = useCallback(async () => {
    if (!date) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    setSelected(null);
    try {
      const res = await fetch(
        `/api/slots?eventTypeId=${encodeURIComponent(event.id)}&date=${encodeURIComponent(date)}`,
      );
      const env = await readApiEnvelope<{ slots: SlotRow[] }>(res);
      if (!env.success) {
        setFetchError(env.error);
        setSlots([]);
        return;
      }
      setSlots(env.data.slots);
    } catch {
      setFetchError("Could not load slots");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date, event.id]);

  const reloadSlotsQuiet = useCallback(async () => {
    if (!date) return;
    try {
      const res = await fetch(
        `/api/slots?eventTypeId=${encodeURIComponent(event.id)}&date=${encodeURIComponent(date)}`,
      );
      const env = await readApiEnvelope<{ slots: SlotRow[] }>(res);
      if (env.success) setSlots(env.data.slots);
    } catch {
      /* ignore */
    }
  }, [date, event.id]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function handleBookedSuccess(booking: BookingCreatedPayload) {
    await reloadSlotsQuiet();
    setSelected(null);
    router.push(`/booking/confirmation?id=${encodeURIComponent(booking.id)}`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
          <h1 className="text-lg font-semibold text-gray-900">{event.title}</h1>
          {event.description && <p className="mt-1 text-sm text-gray-600">{event.description}</p>}
          <p className="mt-2 text-xs text-gray-500">{event.duration} min</p>
        </div>

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r lg:border-gray-100">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Select a date</p>
            <MiniCalendar value={date} minDate={minDate} onChange={setDate} />
            <p className="mt-3 text-xs text-gray-500">
              Dates use your device calendar. Times are shown in your local timezone once selected.
            </p>
          </div>

          <div className="p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Select a time</p>
            <SlotPicker
              slots={slots}
              loading={loading}
              error={fetchError}
              selected={selected}
              onSelect={(t) => setSelected(t)}
              calendarDateIso={date}
            />

            <BookingForm
              eventTypeId={event.id}
              date={date}
              startTime={selected}
              questions={event.questions}
              onSuccess={handleBookedSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
