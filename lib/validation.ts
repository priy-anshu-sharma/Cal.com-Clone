import { z } from "zod";

export const bookingQuestionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(500),
  required: z.boolean().optional(),
});

export const createEventTypeSchema = z.object({
  title: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  duration: z.coerce.number().int().positive("Duration must be greater than 0").max(24 * 60),
  bufferMinutes: z.coerce.number().int().min(0).max(24 * 60).optional(),
  questions: z.array(bookingQuestionSchema).max(20).optional().nullable(),
});

export const updateEventTypeSchema = createEventTypeSchema;

export const availabilityPostSchema = z.object({
  eventTypeId: z.string().cuid(),
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    }),
  ),
});

export const createBookingSchema = z.object({
  eventTypeId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email required").max(320),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().min(1, "Start time required"),
  /** Local wall-clock instant for date + startTime (from client Date(y,m,d,h,min).getTime()). */
  slotStartUtcMs: z.number().finite().optional(),
  answers: z.record(z.string(), z.string()).optional().nullable(),
});

export const rescheduleBookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().min(1, "Start time required"),
  slotStartUtcMs: z.number().finite().optional(),
});

const overrideRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  isUnavailable: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
});

export const dateOverridesPostSchema = z.object({
  eventTypeId: z.string().cuid(),
  overrides: z.array(overrideRowSchema).max(366),
});
