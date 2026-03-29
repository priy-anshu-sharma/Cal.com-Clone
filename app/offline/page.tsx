"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">You are offline</h1>
        <p className="mt-2 text-sm text-gray-600">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
