import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export function slugifyBase(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "event";
}

/**
 * Resolves a unique slug from a human title. Tries slugify(title) first, then appends
 * a random hex suffix when the base is taken (excluding `excludeId` on update).
 */
export async function assignUniqueEventSlug(
  prisma: PrismaClient,
  title: string,
  excludeId?: string | null,
): Promise<string> {
  const normalized = slugifyBase(title);
  const taken = async (slug: string) => {
    const row = await prisma.eventType.findUnique({ where: { slug } });
    if (!row) return false;
    if (excludeId && row.id === excludeId) return false;
    return true;
  };

  let candidate = normalized;
  if (!(await taken(candidate))) return candidate;

  for (let i = 0; i < 12; i += 1) {
    const suffix = randomBytes(3).toString("hex");
    candidate = `${normalized}-${suffix}`;
    if (!(await taken(candidate))) return candidate;
  }

  let n = 2;
  candidate = `${normalized}-${n}`;
  while (await taken(candidate)) {
    n += 1;
    candidate = `${normalized}-${n}`;
  }
  return candidate;
}
