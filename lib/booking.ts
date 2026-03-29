/** Shape returned by POST /api/bookings (Prisma JSON serialization). */
export type BookingCreatedPayload = {
  id: string;
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: { title: string };
};
