import { getKeyGroupLabel, isKeyGroupId, KEY_GROUPS, type KeyGroupId } from "../shared/key-groups.js";
import type { BackgroundToPopupMessage, PopupToBackgroundMessage } from "../shared/messages.js";

const statusElement = getElement<HTMLSpanElement>("status");
const detectedKeyElement = getElement<HTMLSpanElement>("detectedKey");
const confidenceElement = getElement<HTMLSpanElement>("confidence");
const targetKeySelect = getElement<HTMLSelectElement>("targetKey");
const shiftElement = getElement<HTMLSpanElement>("shift");
const errorElement = getElement<HTMLParagraphElement>("error");
const analyzeButton = getElement<HTMLButtonElement>("analyzeButton");
const enableButton = getElement<HTMLButtonElement>("enableButton");
const disableButton = getElement<HTMLButtonElement>("disableButton");
const resetButton = getElement<HTMLButtonElement>("resetButton");

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing popup element: #${id}`);
  }

  return element as T;
}

function sendPopupMessage(message: PopupToBackgroundMessage): void {
  chrome.runtime.sendMessage<BackgroundToPopupMessage>(message, (response) => {
    if (response) render(response);
  });
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

function populateTargetKeySelect(selectedKeyGroupId: KeyGroupId): void {
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

function render(message: BackgroundToPopupMessage): void {
  if (message.type !== "STATE_UPDATED") return;

  const { state } = message;

  statusElement.textContent = formatStatus(state.status);
  detectedKeyElement.textContent = getKeyGroupLabel(state.detectedKeyGroupId);
  confidenceElement.textContent = formatConfidence(state.confidence);
  targetKeySelect.value = String(state.targetKeyGroupId);
  shiftElement.textContent = formatShift(state.semitoneShift);
  errorElement.textContent = state.errorMessage ?? "";
  enableButton.disabled = state.isPitchShiftEnabled;
  disableButton.disabled = !state.isPitchShiftEnabled;
}

populateTargetKeySelect(0);

chrome.runtime.onMessage.addListener((message) => {
  if (isBackgroundToPopupMessage(message)) {
    render(message);
  }
});

targetKeySelect.addEventListener("change", () => {
  const value = Number(targetKeySelect.value);

  if (isKeyGroupId(value)) {
    sendPopupMessage({ type: "SET_TARGET_KEY", keyGroupId: value });
  }
});

analyzeButton.addEventListener("click", () => sendPopupMessage({ type: "START_ANALYSIS" }));
enableButton.addEventListener("click", () => sendPopupMessage({ type: "ENABLE_PITCH_SHIFT" }));
disableButton.addEventListener("click", () => sendPopupMessage({ type: "DISABLE_PITCH_SHIFT" }));
resetButton.addEventListener("click", () => sendPopupMessage({ type: "RESET" }));

sendPopupMessage({ type: "GET_STATE" });

function isBackgroundToPopupMessage(message: unknown): message is BackgroundToPopupMessage {
  return typeof message === "object" && message !== null && (message as { type?: unknown }).type === "STATE_UPDATED";
}
