import nodemailer from "nodemailer";
import { formatBookingTime } from "@/lib/time";

type BookingWithEvent = {
  name: string;
  email: string;
  date: Date;
  startTime: string;
  endTime: string;
  eventType: { title: string };
};

let transporter: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter === undefined) {
    const host = process.env.SMTP_HOST?.trim();
    if (!host) {
      transporter = null;
      return null;
    }
    const port = Number(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS;
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: user && pass !== undefined && pass !== "" ? { user, pass } : undefined,
    });
  }
  return transporter;
}

function defaultFrom(): string {
  return process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER?.trim() || "noreply@localhost";
}

/** Sends one message. Never throws; logs on missing or invalid config / transport errors. */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const recipient = to?.trim();
  if (!recipient) {
    console.warn("[email] No recipient; skipping send");
    return;
  }
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn("[email] SMTP_HOST not set; skipping send");
      return;
    }
    await transport.sendMail({
      from: defaultFrom(),
      to: recipient,
      subject: subject.trim() || "Notification",
      text,
    });
  } catch (e) {
    console.error("Email failed:", e);
  }
}

export async function sendBookingConfirmationEmail(booking: BookingWithEvent): Promise<void> {
  try {
    const when = formatBookingTime(booking.date, booking.startTime, booking.endTime);
    const text = [
      `Hi ${booking.name},`,
      "",
      "Your meeting is confirmed.",
      "",
      `Event: ${booking.eventType.title}`,
      `When: ${when}`,
      "",
      "We look forward to seeing you.",
    ].join("\n");
    await sendEmail(booking.email, `Confirmed: ${booking.eventType.title}`, text);
  } catch (e) {
    console.error("Email failed:", e);
  }
}

export async function sendBookingCancellationEmail(booking: BookingWithEvent): Promise<void> {
  try {
    const when = formatBookingTime(booking.date, booking.startTime, booking.endTime);
    const text = [
      `Hi ${booking.name},`,
      "",
      "Your booking has been cancelled.",
      "",
      `Event: ${booking.eventType.title}`,
      `When: ${when}`,
      "",
      "If you did not request this, please contact the host.",
    ].join("\n");
    await sendEmail(booking.email, `Cancelled: ${booking.eventType.title}`, text);
  } catch (e) {
    console.error("Email failed:", e);
  }
}

export async function sendBookingRescheduledEmail(
  booking: BookingWithEvent,
  previous: { date: Date; startTime: string; endTime: string },
): Promise<void> {
  try {
    const newWhen = formatBookingTime(booking.date, booking.startTime, booking.endTime);
    const previousWhen = formatBookingTime(previous.date, previous.startTime, previous.endTime);
    const text = [
      `Hi ${booking.name},`,
      "",
      "Your booking time has been updated.",
      "",
      `Event: ${booking.eventType.title}`,
      `New time: ${newWhen}`,
      `Previous time: ${previousWhen}`,
      "",
      "See you then.",
    ].join("\n");
    await sendEmail(booking.email, `Rescheduled: ${booking.eventType.title}`, text);
  } catch (e) {
    console.error("Email failed:", e);
  }
}
