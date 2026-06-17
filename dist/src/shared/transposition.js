export function getSemitoneShift(from, to) {
    let shift = to - from;
    if (shift > 6)
        shift -= 12;
    if (shift < -6)
        shift += 12;
    return shift;
}
export function semitonesToPitchRatio(semitones) {
    return Math.pow(2, semitones / 12);
}
