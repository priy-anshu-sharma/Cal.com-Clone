"use client";

import { useCallback, useEffect, useState } from "react";
import { readApiEnvelope } from "@/lib/api-client";

type ApiOverride = {
  id: string;
  date: string;
  isUnavailable: boolean;
  startTime: string | null;
  endTime: string | null;
};

type Draft = {
  key: string;
  date: string;
  mode: "block" | "custom";
  startTime: string;
  endTime: string;
};

type Props = {
  eventTypeId: string;
};

function toDraft(o: ApiOverride): Draft {
  return {
    key: o.id,
    date: o.date,
    mode: o.isUnavailable ? "block" : "custom",
    startTime: o.startTime ?? "09:00",
    endTime: o.endTime ?? "17:00",
  };
}

function newDraft(): Draft {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    key: `new-${Math.random().toString(36).slice(2)}`,
    date: iso,
    mode: "block",
    startTime: "09:00",
    endTime: "17:00",
  };
}

export function DateOverrideEditor({ eventTypeId }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/date-overrides?eventTypeId=${encodeURIComponent(eventTypeId)}`);
      const env = await readApiEnvelope<{ overrides: ApiOverride[] }>(res);
      if (!env.success) {
        setMessage(env.error);
        setDrafts([]);
        return;
      }
      setDrafts(env.data.overrides.map(toDraft));
    } catch {
      setMessage("Could not load overrides");
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [eventTypeId]);

  useEffect(() => {
    void load();
  }, [load]);

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function remove(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const seen = new Set<string>();
    const overrides: {
      date: string;
      isUnavailable: boolean;
      startTime?: string | null;
      endTime?: string | null;
    }[] = [];

    for (const d of drafts) {
      const day = d.date.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        setMessage(`Invalid date: ${day}`);
        setSaving(false);
        return;
      }
      if (seen.has(day)) {
        setMessage("Each date can only appear once.");
        setSaving(false);
        return;
      }
      seen.add(day);
      if (d.mode === "block") {
        overrides.push({ date: day, isUnavailable: true });
      } else {
        overrides.push({
          date: day,
          isUnavailable: false,
          startTime: d.startTime,
          endTime: d.endTime,
        });
      }
    }

    try {
      const res = await fetch("/api/date-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventTypeId, overrides }),
      });
      const parsed = await readApiEnvelope<{ saved: number }>(res);
      if (!parsed.success) {
        setMessage(parsed.error);
        return;
      }
      setMessage(`Saved ${parsed.data.saved} override(s).`);
      await load();
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading date overrides…</p>;
  }

  return (
    <div className="mt-8 space-y-4 border-t border-gray-100 pt-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Date overrides</h2>
        <p className="mt-1 text-xs text-gray-500">
          Block a full day or set custom hours for a specific date. Weekly availability above still applies on other days.
        </p>
      </div>

      <ul className="space-y-3">
        {drafts.map((d) => (
          <li
            key={d.key}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={d.date}
                onChange={(e) => update(d.key, { date: e.target.value })}
                className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Type</label>
              <select
                value={d.mode}
                onChange={(e) => update(d.key, { mode: e.target.value as Draft["mode"] })}
                className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="block">Blocked (no slots)</option>
                <option value="custom">Custom hours</option>
              </select>
            </div>
            {d.mode === "custom" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600">From</label>
                  <input
                    type="time"
                    value={d.startTime}
                    onChange={(e) => update(d.key, { startTime: e.target.value })}
                    className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">To</label>
                  <input
                    type="time"
                    value={d.endTime}
                    onChange={(e) => update(d.key, { endTime: e.target.value })}
                    className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => remove(d.key)}
              className="rounded-lg px-2 py-2 text-xs font-medium text-red-700 hover:bg-red-50 sm:ml-auto"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setDrafts((prev) => [...prev, newDraft()])}
        className="rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        + Add override
      </button>

      {message && (
        <p className={`text-sm ${message.startsWith("Saved") ? "text-gray-700" : "text-red-600"}`}>{message}</p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save date overrides"}
      </button>
    </div>
  );
}
