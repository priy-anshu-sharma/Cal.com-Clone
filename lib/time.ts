/**
 * Single canonical display string for a booking: UTC calendar day label + stored HH:mm range.
 * Fixed locale and timezone so UI, SSR, and emails match.
 */
export function formatBookingTime(date: Date, startTime: string, endTime: string): string {
  const d = new Date(date);

  const formattedDate = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formattedDate} · ${startTime}–${endTime}`;
}
