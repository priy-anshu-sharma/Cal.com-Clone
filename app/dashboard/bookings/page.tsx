"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RescheduleBookingModal } from "@/components/reschedule-booking-modal";
import { bookingCalendarDayISO, utcTodayCalendarISO } from "@/lib/date";
import { formatBookingTime } from "@/lib/time";
import { readApiEnvelope } from "@/lib/api-client";

type BookingRow = {
  id: string;
  eventTypeId: string;
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  answers?: unknown;
  eventType: { title: string };
};

export default function BookingsDashboardPage() {
  const [all, setAll] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [query, setQuery] = useState("");
  const [reschedule, setReschedule] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const parsed = await readApiEnvelope<BookingRow[]>(res);
      if (parsed.success) setAll(parsed.data);
    } catch (e) {
      console.error("API Error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const today = utcTodayCalendarISO();
    const u: BookingRow[] = [];
    const p: BookingRow[] = [];
    for (const b of all) {
      const day = bookingCalendarDayISO(new Date(b.date));
      if (day >= today) u.push(b);
      else p.push(b);
    }
    return { upcoming: u, past: p };
  }, [all]);

  const displayed = useMemo(() => {
    const list = tab === "upcoming" ? upcoming : past;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) => b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q),
    );
  }, [tab, upcoming, past, query]);

  async function cancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    if (!id?.trim()) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
      const parsed = await readApiEnvelope<{ id: string }>(res);
      if (!parsed.success) {
        alert(parsed.error);
        return;
      }
      await load();
    } catch (e) {
      console.error("API Error:", e);
      alert("Request failed");
    } finally {
      setDeleting(null);
    }
  }

  function formatWhen(b: BookingRow): string {
    return formatBookingTime(new Date(b.date), b.startTime, b.endTime);
  }

  return (
    <div className="space-y-8">
      <RescheduleBookingModal
        booking={
          reschedule
            ? {
                id: reschedule.id,
                eventTypeId: reschedule.eventTypeId,
                date: reschedule.date,
                startTime: reschedule.startTime,
              }
            : null
        }
        onClose={() => setReschedule(null)}
        onSaved={load}
      />

      <div>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">Filter by tab and search by name or email.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-medium text-gray-600">Search</label>
        <input
          type="search"
          placeholder="Name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full max-w-md rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div className="flex gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "upcoming" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setTab("past")}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "past" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Past
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <BookingTable
            items={displayed}
            deleting={deleting}
            onCancel={cancel}
            onReschedule={(b) => setReschedule(b)}
            formatWhen={formatWhen}
            showCancel={tab === "upcoming"}
            showReschedule={tab === "upcoming"}
          />
        </section>
      )}
    </div>
  );
}

function formatAnswers(answers: unknown): { key: string; value: string }[] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return [];
  const out: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(answers as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    out.push({ key: k, value: String(v) });
  }
  return out;
}

function BookingTable({
  items,
  deleting,
  onCancel,
  onReschedule,
  formatWhen,
  showCancel,
  showReschedule,
}: {
  items: BookingRow[];
  deleting: string | null;
  onCancel?: (id: string) => void;
  onReschedule?: (b: BookingRow) => void;
  formatWhen: (b: BookingRow) => string;
  showCancel?: boolean;
  showReschedule?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No bookings match.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((b) => {
        const extra = formatAnswers(b.answers);
        return (
          <li key={b.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">{b.eventType.title}</p>
            <p className="text-gray-700">{b.name}</p>
            <p className="text-xs text-gray-500">{b.email}</p>
            <p className="mt-1 text-xs text-gray-500">{formatWhen(b)}</p>
            {extra.length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2 text-xs text-gray-600">
                {extra.map((e) => (
                  <li key={e.key}>
                    <span className="font-medium text-gray-700">{e.key}:</span> {e.value}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {showReschedule && onReschedule && (
                <button
                  type="button"
                  onClick={() => onReschedule(b)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50"
                >
                  Reschedule
                </button>
              )}
              {showCancel && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(b.id)}
                  disabled={deleting === b.id}
                  className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === b.id ? "Cancelling…" : "Cancel"}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
