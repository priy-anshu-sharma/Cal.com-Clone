"use client";

import { useState } from "react";
import { readApiEnvelope } from "@/lib/api-client";

type Props = {
  onCreated: () => void;
};

export function EventTypeForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("Duration must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          duration,
        }),
      });
      const parsed = await readApiEnvelope<unknown>(res);
      if (!parsed.success) {
        setError(parsed.error);
        return;
      }
      setTitle("");
      setDescription("");
      setDuration(30);
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs font-medium text-gray-600">Title</label>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Description (optional)</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={2000}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Duration (minutes)</label>
        <input
          type="number"
          min={1}
          max={1440}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create event type"}
      </button>
    </form>
  );
}
