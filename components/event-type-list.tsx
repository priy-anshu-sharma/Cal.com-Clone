"use client";

import Link from "next/link";
import { useState } from "react";
import { EventTypeEditModal } from "@/components/event-type-edit-modal";
import { readApiEnvelope } from "@/lib/api-client";
import type { EventTypeRow } from "@/lib/event-type";

export type { EventTypeRow };

type Props = {
  items: EventTypeRow[];
  onRefresh: () => void;
};

export function EventTypeList({ items, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventTypeRow | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this event type and all availability and bookings?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/event-types/${encodeURIComponent(id)}`, { method: "DELETE" });
      const parsed = await readApiEnvelope<{ id: string }>(res);
      if (!parsed.success) {
        alert(parsed.error);
        return;
      }
      onRefresh();
    } catch (e) {
      console.error("API Error:", e);
      alert("Request failed");
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        No event types yet. Create one on the left.
      </p>
    );
  }

  return (
    <>
      <EventTypeEditModal
        event={editing}
        onClose={() => setEditing(null)}
        onSaved={onRefresh}
      />
      <ul className="space-y-4">
        {items.map((et) => (
          <li
            key={et.id}
            className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{et.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {et.duration} min
                {(et.bufferMinutes ?? 0) > 0 ? ` · ${et.bufferMinutes} min buffer` : ""} · /book/{et.slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/book/${et.slug}`}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                Public page
              </Link>
              <button
                type="button"
                onClick={() => setEditing(et)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                Edit
              </button>
              <Link
                href={`/dashboard/availability/${et.id}`}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                Availability
              </Link>
              <button
                type="button"
                onClick={() => remove(et.id)}
                disabled={deleting === et.id}
                className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deleting === et.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
