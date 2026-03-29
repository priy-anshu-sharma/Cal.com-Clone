# Scalar — Scheduling

**Scalar** is a production-style scheduling app inspired by **Cal.com**: share event links, let guests book time, and manage availability from a simple dashboard.

## Features

- **Event types** — Create meetings with title, duration, public slug, and optional custom intake questions.
- **Availability** — Weekly recurring windows; multiple ranges per weekday.
- **Booking system** — Public `/book/[slug]` flow with date + slot picker and double-booking protection.
- **Rescheduling** — Host can move bookings to a new slot; slots respect conflicts and buffers.
- **Email notifications** — Optional SMTP-powered mail for confirmations, cancellations, and reschedules (non-blocking if misconfigured).
- **Date overrides** — Block a full day or set custom hours for specific calendar dates.
- **Buffer time** — Per event type: minimum gap (minutes) between adjacent bookings on the same day.
- **Custom questions** — Extra fields on the booking form, stored with each booking.
- **Timezone-aware display** — Bookings are stored with a consistent UTC-based instant; the UI shows times in the visitor’s **local timezone** (`Intl` / device settings).
- **Past-slot protection** — Slots in the past cannot be booked; enforced in the API and disabled in the slot picker.
- **Responsive UI** — Tailwind-based layout that works on small and large screens.
- **PWA support** — Web app manifest and service worker registration for an installable experience.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- [Prisma](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Prerequisites

- Node.js 20+ (recommended)
- A PostgreSQL database connection string

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set at least:

   - `DATABASE_URL` — PostgreSQL URL  
   - Optional: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` for email

3. **Database**

   Apply migrations:

   ```bash
   npx prisma migrate deploy
   ```

   For local development you can alternatively use:

   ```bash
   npx prisma migrate dev
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start Next.js in dev mode  |
| `npm run build`    | Production build           |
| `npm run start`    | Start production server    |
| `npm run db:migrate` | Prisma migrate dev       |
| `npm run db:push`  | Push schema without migration history |

## Deployment

1. Set environment variables on your host (Vercel, Railway, Fly.io, Docker, etc.): `DATABASE_URL`, and SMTP if you want mail.
2. Run `npx prisma migrate deploy` as part of the release process (or an equivalent migration step).
3. Build with `npm run build` and start with `npm run start`.

For **Vercel**, connect the repo, add env vars, and use a managed Postgres (Neon, Supabase, etc.). Ensure the production build runs `prisma generate` (this project’s `build` script already includes it).

## License

Private / use per your organization’s policy.
