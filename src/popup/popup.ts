import type { BackgroundToPopupMessage, PopupToBackgroundMessage } from "../shared/messages";

const statusElement = document.querySelector<HTMLParagraphElement>("#status");

function render(message: BackgroundToPopupMessage): void {
  if (message.type === "STATE_UPDATED" && statusElement) {
    statusElement.textContent = `Status: ${message.state.status}`;
  }
}

const message: PopupToBackgroundMessage = { type: "GET_STATE" };
chrome.runtime.sendMessage(message, render);
