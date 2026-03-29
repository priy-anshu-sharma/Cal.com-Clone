# 🚀 Scalar — Scheduling Platform

**Scalar** is a production-ready scheduling application inspired by Cal.com.  
It allows users to create event types, manage availability, and share booking links — enabling seamless meeting scheduling with a modern, responsive experience.

---

## 🌐 Live Demo

🔗 https://cal-com-clone-beige.vercel.app/

---

## 📂 GitHub Repository

🔗 https://github.com/priy-anshu-sharma/Cal.com-Clone

---

## ✨ Features

### 📅 Event Types
- Create meetings with:
  - Title, description, duration
  - Unique public booking URL (slug)
  - Optional custom booking questions
- Edit and delete events easily

---

### ⏰ Availability Management
- Weekly recurring availability
- Multiple time ranges per day
- Flexible scheduling windows

---

### 📆 Booking System
- Public booking page (`/book/[slug]`)
- Real-time slot generation
- Prevents double booking (DB-level + API validation)
- Booking confirmation flow

---

### 🔄 Rescheduling
- Reschedule existing bookings
- Old slot automatically freed
- Conflict-safe slot validation

---

### ❌ Cancellation
- Cancel bookings from dashboard
- Availability updates instantly

---

### 📊 Dashboard
- View upcoming bookings
- View past bookings
- Search bookings (name/email)
- Clean and intuitive UI

---

### 📧 Email Notifications
- Booking confirmation emails
- Cancellation emails
- Reschedule updates
- Non-blocking implementation (app never crashes on email failure)

---

### 🚫 Date Overrides
- Block specific dates (holidays, unavailable days)
- Set custom hours for specific dates
- Overrides take priority over default schedule

---

### ⏱ Buffer Time
- Configurable buffer between meetings
- Prevents back-to-back bookings

---

### 📝 Custom Booking Questions
- Dynamic form fields per event
- Stored with each booking

---

### 🌍 Timezone Handling
- All data stored in UTC
- Displayed in user's local timezone
- Consistent time across UI and email

---

### 🚫 Past Slot Protection
- Prevents booking past time slots
- Enforced both in UI and backend

---

### 📱 Responsive Design
- Fully responsive:
  - Mobile 📱
  - Tablet 📲
  - Desktop 💻

---

### ⚡ PWA Support
- Installable web app
- Offline fallback
- App-like experience

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS  
- **Backend:** Next.js API Routes  
- **Database:** PostgreSQL (Neon)  
- **ORM:** Prisma  
- **Email:** Nodemailer (SMTP)  
- **Deployment:** Vercel  

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
2. Configure environment

Create .env:

DATABASE_URL=your_database_url

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_app_password
EMAIL_FROM=your_email

NEXT_PUBLIC_APP_URL=http://localhost:3000
3. Setup database
npx prisma migrate dev
4. Run app
npm run dev

🚀 Deployment
Deploy using Vercel (recommended)
Add environment variables in dashboard
Ensure Prisma migrations run in production

🧠 Key Highlights
Production-grade scheduling system
Strong validation & error handling
Clean architecture with scalable structure
Real-world feature completeness
Fully responsive + PWA-ready
📌 Future Enhancements
OAuth (Google login)
Google Calendar integration
Team scheduling
Payments (Stripe)


📧 Contact
GitHub: https://github.com/priy-anshu-sharma
