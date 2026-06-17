import type { KeyGroupId } from "./key-groups.js";

export function getSemitoneShift(from: KeyGroupId, to: KeyGroupId): number {
  let shift = to - from;

  if (shift > 6) shift -= 12;
  if (shift < -6) shift += 12;

  return shift;
}

export function semitonesToPitchRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}
