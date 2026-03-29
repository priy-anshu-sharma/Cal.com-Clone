export type MinuteInterval = { start: number; end: number };

/** True if [newStart, newEnd] cannot fit with at least `bufferMin` minutes gap vs every existing block. */
export function clashesWithBufferedIntervals(
  newStartMin: number,
  newEndMin: number,
  existing: MinuteInterval[],
  bufferMin: number,
): boolean {
  for (const ex of existing) {
    if (!(newEndMin + bufferMin <= ex.start || ex.end + bufferMin <= newStartMin)) {
      return true;
    }
  }
  return false;
}
