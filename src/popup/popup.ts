import { isKeyGroupId } from "../shared/key-groups.js";
import type { BackgroundToPopupMessage, PopupToBackgroundMessage } from "../shared/messages.js";
import { populateTargetKeySelect, renderPopupState, type PopupElements } from "./render.js";

const elements: PopupElements = {
  status: getElement<HTMLSpanElement>("status"),
  detectedKey: getElement<HTMLSpanElement>("detectedKey"),
  confidence: getElement<HTMLSpanElement>("confidence"),
  targetKey: getElement<HTMLSelectElement>("targetKey"),
  shift: getElement<HTMLSpanElement>("shift"),
  error: getElement<HTMLParagraphElement>("error"),
  analyzeButton: getElement<HTMLButtonElement>("analyzeButton"),
  enableButton: getElement<HTMLButtonElement>("enableButton"),
  disableButton: getElement<HTMLButtonElement>("disableButton"),
  resetButton: getElement<HTMLButtonElement>("resetButton")
};

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

function render(message: BackgroundToPopupMessage): void {
  if (message.type !== "STATE_UPDATED") return;
  renderPopupState(elements, message.state);
}

populateTargetKeySelect(elements.targetKey, 0);

chrome.runtime.onMessage.addListener((message) => {
  if (isBackgroundToPopupMessage(message)) {
    render(message);
  }
});

elements.targetKey.addEventListener("change", () => {
  const value = Number(elements.targetKey.value);

  if (isKeyGroupId(value)) {
    sendPopupMessage({ type: "SET_TARGET_KEY", keyGroupId: value });
  }
});

elements.analyzeButton.addEventListener("click", () => sendPopupMessage({ type: "START_ANALYSIS" }));
elements.enableButton.addEventListener("click", () => sendPopupMessage({ type: "ENABLE_PITCH_SHIFT" }));
elements.disableButton.addEventListener("click", () => sendPopupMessage({ type: "DISABLE_PITCH_SHIFT" }));
elements.resetButton.addEventListener("click", () => sendPopupMessage({ type: "RESET" }));

sendPopupMessage({ type: "GET_STATE" });

function isBackgroundToPopupMessage(message: unknown): message is BackgroundToPopupMessage {
  return typeof message === "object" && message !== null && (message as { type?: unknown }).type === "STATE_UPDATED";
}
