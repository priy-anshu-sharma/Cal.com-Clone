"use client";

import { useEffect, useState } from "react";
import { readApiEnvelope } from "@/lib/api-client";

const DAYS = [
  { v: 0, label: "Sun" },
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

type Slot = { dayOfWeek: number; startTime: string; endTime: string };
type Range = { id: string; startTime: string; endTime: string };

type Props = {
  eventTypeId: string;
};

export function AvailabilityEditor({ eventTypeId }: Props) {
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});
  const [slotsByDay, setSlotsByDay] = useState<Record<number, Range[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/availability?eventTypeId=${encodeURIComponent(eventTypeId)}`);
        const envelope = await readApiEnvelope<{ dayOfWeek: number; startTime: string; endTime: string }[]>(
          res,
        );
        if (!envelope.success || cancelled) return;
        
        const rows = envelope.data;
        const en: Record<number, boolean> = {};
        const sb: Record<number, Range[]> = {};
        
        // Initialize default empty structure
        for (const d of DAYS) {
          en[d.v] = false;
          sb[d.v] = [{ id: Math.random().toString(36).slice(2), startTime: "09:00", endTime: "17:00" }];
        }
        
        // Group rows that come from the database
        const grouped: Record<number, typeof rows> = {};
        for (const r of rows) {
          if (!grouped[r.dayOfWeek]) grouped[r.dayOfWeek] = [];
          grouped[r.dayOfWeek].push(r);
        }

        // Apply to state
        for (const [dayStr, dayRows] of Object.entries(grouped)) {
          const d = Number(dayStr);
          en[d] = true;
          sb[d] = dayRows.map((r) => ({ 
            id: Math.random().toString(36).slice(2), 
            startTime: r.startTime, 
            endTime: r.endTime 
          }));
        }
        
        setEnabled(en);
        setSlotsByDay(sb);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventTypeId]);

  function toggleDay(day: number) {
    setEnabled((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  function addRange(day: number) {
    setSlotsByDay((prev) => {
      const existing = prev[day] || [];
      return {
        ...prev,
        [day]: [...existing, { id: Math.random().toString(36).slice(2), startTime: "09:00", endTime: "17:00" }],
      };
    });
  }

  function removeRange(day: number, id: string) {
    setSlotsByDay((prev) => {
      const existing = prev[day] || [];
      const filtered = existing.filter((r) => r.id !== id);
      if (filtered.length === 0) {
        // Uncheck the day and provide a default empty slot back
        setEnabled((e) => ({ ...e, [day]: false }));
        return { 
          ...prev, 
          [day]: [{ id: Math.random().toString(36).slice(2), startTime: "09:00", endTime: "17:00" }] 
        };
      }
      return { ...prev, [day]: filtered };
    });
  }

  function updateRange(day: number, id: string, field: "startTime" | "endTime", val: string) {
    setSlotsByDay((prev) => {
      const existing = prev[day] || [];
      return {
        ...prev,
        [day]: existing.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
      };
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const slots: Slot[] = [];
    
    // Flatten multiple slots back into the 1D expected DB format
    for (const d of DAYS) {
      if (enabled[d.v] && slotsByDay[d.v]) {
        for (const r of slotsByDay[d.v]) {
          slots.push({
            dayOfWeek: d.v,
            startTime: r.startTime,
            endTime: r.endTime,
          });
        }
      }
    }
    
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventTypeId, slots }),
      });
      const parsed = await readApiEnvelope<unknown>(res);
      if (!parsed.success) {
        setMessage(parsed.error);
        return;
      }
      setMessage("Saved.");
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading availability…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Days use 0 = Sunday … 6 = Saturday (Date.getDay()).</p>
      <div className="space-y-3">
        {DAYS.map((d) => (
          <div
            key={d.v}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-start"
          >
            <label className="flex w-24 shrink-0 items-center gap-2 pt-2 text-sm">
              <input
                type="checkbox"
                checked={!!enabled[d.v]}
                onChange={() => toggleDay(d.v)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="font-medium text-gray-800">{d.label}</span>
            </label>
            
            <div className="flex flex-1 flex-col gap-3">
              {!enabled[d.v] && (
                <p className="pt-2 text-sm text-gray-500">Unavailable</p>
              )}
              {enabled[d.v] &&
                slotsByDay[d.v]?.map((range, idx) => (
                  <div key={range.id} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={range.startTime}
                      onChange={(e) => updateRange(d.v, range.id, "startTime", e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={range.endTime}
                      onChange={(e) => updateRange(d.v, range.id, "endTime", e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => removeRange(d.v, range.id)}
                      className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-900"
                      aria-label="Remove time range"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
              {enabled[d.v] && (
                <button
                  type="button"
                  onClick={() => addRange(d.v)}
                  className="mt-1 w-max rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                >
                  + Add time
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {message && (
        <p className={`text-sm ${message === "Saved." ? "text-gray-700" : "text-red-600"}`}>{message}</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save availability"}
      </button>
    </div>
  );
}
