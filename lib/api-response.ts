import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string };

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>, { status });
}

/** Use for unexpected server failures (5xx). */
export const API_GENERIC_ERROR = "Something went wrong";

export function jsonErr(error: string, status: number) {
  return NextResponse.json({ success: false, error } satisfies ApiFailure, { status });
}
