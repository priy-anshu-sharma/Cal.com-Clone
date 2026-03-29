"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { readApiEnvelope } from "@/lib/api-client";
import type { EventTypeRow } from "@/lib/event-type";
import { bookingQuestionSchema } from "@/lib/validation";

const questionsPayloadSchema = z.array(bookingQuestionSchema).max(20);

type Props = {
  event: EventTypeRow | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EventTypeEditModal({ event, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [questionsJson, setQuestionsJson] = useState("[]");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDescription(event.description ?? "");
    setDuration(event.duration);
    setBufferMinutes(event.bufferMinutes ?? 0);
    setQuestionsJson(JSON.stringify(event.questions ?? [], null, 2));
    setError(null);
  }, [event]);

  if (!event) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setLoading(true);
    setError(null);
    try {
      let questionsPayload: unknown;
      const trimmed = questionsJson.trim();
      if (!trimmed) {
        questionsPayload = [];
      } else {
        try {
          questionsPayload = JSON.parse(trimmed);
        } catch {
          setError("Custom questions must be valid JSON.");
          setLoading(false);
          return;
        }
      }
      const qParsed = questionsPayloadSchema.safeParse(questionsPayload);
      if (!qParsed.success) {
        setError("Invalid custom questions format. Use an array of { id, label, optional required }.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/event-types/${encodeURIComponent(event.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          duration,
          bufferMinutes,
          questions: qParsed.data,
        }),
      });
      const parsed = await readApiEnvelope<EventTypeRow>(res);
      if (!parsed.success) {
        setError(parsed.error);
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error("API Error:", e);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">Edit event type</h2>
        <p className="mt-1 text-xs text-gray-500">Changing the title may update the public URL slug.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
          <div>
            <label className="block text-xs font-medium text-gray-600">Buffer after meetings (minutes)</label>
            <input
              type="number"
              min={0}
              max={1440}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum gap before the next booking can start on the same day.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Custom booking questions (JSON)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={questionsJson}
              onChange={(e) => setQuestionsJson(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder='[{"id":"company","label":"Company","required":true}]'
            />
            <p className="mt-1 text-xs text-gray-500">Optional. Shown on the public booking page after a time is selected.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
