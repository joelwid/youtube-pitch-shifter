export const KEY_GROUPS = [
    { id: 0, label: "C / Am", aliases: ["C major", "A minor", "C", "Am"] },
    { id: 1, label: "C# / D♭ / A#m / B♭m", aliases: ["C# major", "Db major", "A# minor", "Bb minor", "C#", "Db", "A#m", "Bbm"] },
    { id: 2, label: "D / Bm", aliases: ["D major", "B minor", "D", "Bm"] },
    { id: 3, label: "D# / E♭ / Cm", aliases: ["D# major", "Eb major", "C minor", "D#", "Eb", "Cm"] },
    { id: 4, label: "E / C#m", aliases: ["E major", "C# minor", "E", "C#m"] },
    { id: 5, label: "F / Dm", aliases: ["F major", "D minor", "F", "Dm"] },
    { id: 6, label: "F# / G♭ / D#m / E♭m", aliases: ["F# major", "Gb major", "D# minor", "Eb minor", "F#", "Gb", "D#m", "Ebm"] },
    { id: 7, label: "G / Em", aliases: ["G major", "E minor", "G", "Em"] },
    { id: 8, label: "G# / A♭ / Fm", aliases: ["G# major", "Ab major", "F minor", "G#", "Ab", "Fm"] },
    { id: 9, label: "A / F#m", aliases: ["A major", "F# minor", "A", "F#m"] },
    { id: 10, label: "A# / B♭ / Gm", aliases: ["A# major", "Bb major", "G minor", "A#", "Bb", "Gm"] },
    { id: 11, label: "B / C♭ / G#m / A♭m", aliases: ["B major", "Cb major", "G# minor", "Ab minor", "B", "Cb", "G#m", "Abm"] }
];
export function isKeyGroupId(value) {
    return Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 11;
}
export function getKeyGroupLabel(id) {
    if (id === null)
        return "—";
    return KEY_GROUPS.find((group) => group.id === id)?.label ?? "—";
}
