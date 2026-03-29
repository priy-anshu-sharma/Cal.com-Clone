"use client";

import { useEffect, useState } from "react";
import { readApiEnvelope } from "@/lib/api-client";
import { getLocalSlotStartUtcMs } from "@/lib/date";
import type { BookingCreatedPayload } from "@/lib/booking";
import type { BookingQuestion } from "@/lib/questions";

type Props = {
  eventTypeId: string;
  date: string;
  startTime: string | null;
  questions: BookingQuestion[];
  onSuccess: (booking: BookingCreatedPayload) => void | Promise<void>;
};

export function BookingForm({ eventTypeId, date, startTime, questions, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({});
  }, [questions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !date) return;
    setLoading(true);
    setError(null);
    try {
      const ms = getLocalSlotStartUtcMs(date, startTime);
      const body: Record<string, unknown> = {
        eventTypeId,
        name,
        email,
        date,
        startTime,
      };
      if (Number.isFinite(ms)) {
        body.slotStartUtcMs = ms;
      }
      if (questions.length > 0) {
        body.answers = answers;
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const env = await readApiEnvelope<BookingCreatedPayload>(res);
      if (!env.success) {
        setError(env.error);
        return;
      }
      await onSuccess(env.data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!startTime) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-gray-900">Enter your details</h3>
      <div>
        <label className="block text-xs font-medium text-gray-600">Name</label>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          autoComplete="name"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={320}
          autoComplete="email"
        />
      </div>
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-xs font-medium text-gray-600">
            {q.label}
            {q.required ? <span className="text-red-600"> *</span> : null}
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            required={!!q.required}
            maxLength={2000}
          />
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Scheduling…" : "Schedule event"}
      </button>
    </form>
  );
}
