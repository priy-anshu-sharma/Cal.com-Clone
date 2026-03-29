import type { Metadata } from "next";
import Link from "next/link";
import { PwaRegistrar } from "@/components/pwa-registrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scalar — Scheduling",
  description: "Cal-style scheduling: event types, availability, booking, and email notifications.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scalar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <PwaRegistrar />
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-sm font-semibold tracking-tight text-gray-900">
              Scalar
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <Link href="/" className="min-h-[44px] inline-flex items-center hover:text-gray-900">
                Home
              </Link>
              <Link href="/dashboard" className="min-h-[44px] inline-flex items-center hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/bookings" className="min-h-[44px] inline-flex items-center hover:text-gray-900">
                Bookings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
