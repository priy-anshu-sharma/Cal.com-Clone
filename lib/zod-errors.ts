import type { ZodError } from "zod";

export function firstZodIssueMessage(error: ZodError): string {
  const first = error.issues[0];
  return first?.message ?? "Validation failed";
}
