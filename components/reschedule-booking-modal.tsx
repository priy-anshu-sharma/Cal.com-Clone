"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readApiEnvelope } from "@/lib/api-client";
import { getLocalSlotStartUtcMs } from "@/lib/date";
import type { SlotRow } from "@/lib/slots";
import { MiniCalendar } from "@/components/mini-calendar";
import { SlotPicker } from "@/components/slot-picker";

type BookingRef = {
  id: string;
  eventTypeId: string;
  date: string;
  startTime: string;
};

type Props = {
  booking: BookingRef | null;
  onClose: () => void;
  onSaved: () => void;
};

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RescheduleBookingModal({ booking, onClose, onSaved }: Props) {
  const [date, setDate] = useState(todayISODate());
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = useMemo(() => todayISODate(), []);

  useEffect(() => {
    if (!booking) return;
    const d = new Date(booking.date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    setDate(`${y}-${m}-${day}`);
    setSelected(null);
    setError(null);
    setFetchError(null);
  }, [booking]);

  const loadSlots = useCallback(async () => {
    if (!booking || !date) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    setSelected(null);
    try {
      const q = new URLSearchParams({
        eventTypeId: booking.eventTypeId,
        date,
        excludeBookingId: booking.id,
      });
      const res = await fetch(`/api/slots?${q.toString()}`);
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
  }, [booking, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function save() {
    if (!booking || !selected) return;
    setSaving(true);
    setError(null);
    try {
      const slotStartUtcMs = getLocalSlotStartUtcMs(date, selected);
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime: selected,
          ...(Number.isFinite(slotStartUtcMs) ? { slotStartUtcMs } : {}),
        }),
      });
      const env = await readApiEnvelope<unknown>(res);
      if (!env.success) {
        setError(env.error);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Reschedule</h2>
          <p className="mt-1 text-xs text-gray-500">Pick a new date and time. Your current slot stays free until you confirm.</p>
        </div>
        <div className="grid flex-1 gap-0 overflow-y-auto lg:grid-cols-2">
          <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">New date</p>
            <MiniCalendar value={date} minDate={minDate} onChange={setDate} />
          </div>
          <div className="p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">New time</p>
            <SlotPicker
              slots={slots}
              loading={loading}
              error={fetchError}
              selected={selected}
              onSelect={(t) => setSelected(t)}
              calendarDateIso={date}
            />
          </div>
        </div>
        {error && <p className="border-t border-gray-100 px-6 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected || saving}
            onClick={save}
            className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Confirm reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
