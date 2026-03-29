export type EventTypeRow = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  bufferMinutes: number;
  slug: string;
  questions: unknown | null;
};
