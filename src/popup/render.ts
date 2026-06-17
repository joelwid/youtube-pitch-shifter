import type { ExtensionState } from "../background/extension-state.js";
import { getKeyGroupLabel, KEY_GROUPS, type KeyGroupId } from "../shared/key-groups.js";

export interface PopupElements {
  status: HTMLSpanElement;
  detectedKey: HTMLSpanElement;
  confidence: HTMLSpanElement;
  targetKey: HTMLSelectElement;
  shift: HTMLSpanElement;
  error: HTMLParagraphElement;
  analyzeButton: HTMLButtonElement;
  enableButton: HTMLButtonElement;
  disableButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
}

export function populateTargetKeySelect(targetKeySelect: HTMLSelectElement, selectedKeyGroupId: KeyGroupId): void {
  targetKeySelect.replaceChildren(
    ...KEY_GROUPS.map((group) => {
      const option = document.createElement("option");
      option.value = String(group.id);
      option.textContent = group.label;
      option.selected = group.id === selectedKeyGroupId;
      return option;
    })
  );
}

export function renderPopupState(elements: PopupElements, state: ExtensionState): void {
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

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatConfidence(confidence: number | null): string {
  if (confidence === null) return "—";
  return `${Math.round(confidence * 100)}%`;
}

function formatShift(semitones: number): string {
  if (semitones > 0) return `+${semitones}`;
  return String(semitones);
}
