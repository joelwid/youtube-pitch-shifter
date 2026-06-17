import { getKeyGroupLabel, KEY_GROUPS } from "../shared/key-groups.js";
export function populateTargetKeySelect(targetKeySelect, selectedKeyGroupId) {
    targetKeySelect.replaceChildren(...KEY_GROUPS.map((group) => {
        const option = document.createElement("option");
        option.value = String(group.id);
        option.textContent = group.label;
        option.selected = group.id === selectedKeyGroupId;
        return option;
    }));
}
export function renderPopupState(elements, state) {
    elements.status.textContent = formatStatus(state.status);
    elements.detectedKey.textContent = getKeyGroupLabel(state.detectedKeyGroupId);
    elements.confidence.textContent = formatConfidence(state.confidence);
    elements.targetKey.value = String(state.targetKeyGroupId);
    elements.shift.textContent = formatShift(state.semitoneShift);
    elements.error.textContent = state.errorMessage ?? "";
    const hasDetectedKey = state.detectedKeyGroupId !== null;
    const isBusy = state.status === "capturing" || state.status === "listening" || state.status === "analyzing";
    elements.analyzeButton.disabled = isBusy;
    elements.enableButton.disabled = !hasDetectedKey || state.isPitchShiftEnabled;
    elements.disableButton.disabled = !state.isPitchShiftEnabled;
    elements.targetKey.disabled = isBusy && !hasDetectedKey;
}
function formatStatus(status) {
    return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
function formatConfidence(confidence) {
    if (confidence === null)
        return "—";
    return `${Math.round(confidence * 100)}%`;
}
function formatShift(semitones) {
    if (semitones > 0)
        return `+${semitones}`;
    return String(semitones);
}
