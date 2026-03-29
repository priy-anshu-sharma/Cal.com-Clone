"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(y: number, m0: number, d: number) {
  return `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
}

function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
}

type Props = {
  value: string;
  minDate: string;
  onChange: (iso: string) => void;
};

export function MiniCalendar({ value, minDate, onChange }: Props) {
  const initial = parseISODate(value);
  const [cursor, setCursor] = useState(() => new Date(initial.y, initial.m, 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const { daysInMonth, startWeekday, year: cy, month: cm } = useMemo(() => {
    const first = new Date(year, month, 1);
    const dim = new Date(year, month + 1, 0).getDate();
    const sw = first.getDay();
    return { daysInMonth: dim, startWeekday: sw, year, month };
  }, [year, month]);

  function go(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  const cells = useMemo(() => {
    const out: { day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < startWeekday; i += 1) {
      out.push({ day: null, iso: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      out.push({ day: d, iso: toISODate(cy, cm, d) });
    }
    return out;
  }, [startWeekday, daysInMonth, cy, cm]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-900">
          {new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 font-medium">
            {w}
          </div>
        ))}
        {cells.map((c, idx) => {
          if (c.day === null || !c.iso) {
            return <div key={`e-${idx}`} className="py-2" />;
          }
          const disabled = c.iso < minDate;
          const isSelected = c.iso === value;
          return (
            <button
              key={c.iso}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled && c.iso) onChange(c.iso);
              }}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                disabled
                  ? "cursor-not-allowed text-gray-300"
                  : isSelected
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
