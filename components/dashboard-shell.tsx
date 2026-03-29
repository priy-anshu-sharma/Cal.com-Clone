"use client";

import { useCallback, useState } from "react";
import { EventTypeForm } from "@/components/event-type-form";
import { EventTypeList } from "@/components/event-type-list";
import type { EventTypeRow } from "@/lib/event-type";
import { readApiEnvelope } from "@/lib/api-client";

type Props = {
  initialEventTypes: EventTypeRow[];
};

export function DashboardShell({ initialEventTypes }: Props) {
  const [items, setItems] = useState<EventTypeRow[]>(initialEventTypes);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/event-types");
      const parsed = await readApiEnvelope<EventTypeRow[]>(res);
      if (parsed.success) setItems(parsed.data);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Event types, availability, and public booking links.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Create event type</h2>
          <p className="mt-1 text-xs text-gray-500">Guests book at /book/your-slug</p>
          <div className="mt-4">
            <EventTypeForm onCreated={refresh} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Event types</h2>
          <div className="mt-4">
            <EventTypeList items={items} onRefresh={refresh} />
          </div>
        </section>
      </div>
    </div>
  );
}
