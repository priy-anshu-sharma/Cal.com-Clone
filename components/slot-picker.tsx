"use client";

import { isLocalSlotStartBeforeNow, localCalendarTodayISO } from "@/lib/date";
import type { SlotRow } from "@/lib/slots";

type Props = {
  slots: SlotRow[];
  loading?: boolean;
  error?: string | null;
  selected: string | null;
  onSelect: (time: string) => void;
  /** YYYY-MM-DD for the selected day (local calendar); used to hide past slots on "today". */
  calendarDateIso?: string;
};

export function SlotPicker({ slots, loading, error, selected, onSelect, calendarDateIso }: Props) {
  if (loading) {
    return <p className="text-sm text-gray-500">Loading times…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (slots.length === 0) {
    return <p className="text-sm text-gray-500">No times available for this day.</p>;
  }

  const isLocked = (s: (typeof slots)[0]) => {
    const pastTodayLocal =
      !!calendarDateIso &&
      calendarDateIso === localCalendarTodayISO() &&
      isLocalSlotStartBeforeNow(calendarDateIso, s.startTime);
    return s.booked || s.past || s.buffered || pastTodayLocal;
  };

  const hasAvailable = slots.some((s) => !isLocked(s));

  return (
    <div className="space-y-3">
      {!hasAvailable && (
        <p className="text-sm text-amber-800">All slots are booked for this day.</p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((s) => {
          const locked = isLocked(s);
          const isSelected = selected === s.startTime && !locked;
          const base =
            "rounded-xl border px-4 py-3 text-base sm:px-3 sm:py-2.5 sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2";
          if (locked) {
            const label = s.booked ? "Booked" : s.buffered ? "Buffer" : "Past";
            return (
              <button
                key={s.startTime}
                type="button"
                disabled
                title={label}
                className={`${base} cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 line-through opacity-50`}
              >
                {s.startTime}
              </button>
            );
          }
          return (
            <button
              key={s.startTime}
              type="button"
              onClick={() => onSelect(s.startTime)}
              className={`${base} ${
                isSelected
                  ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              {s.startTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}
