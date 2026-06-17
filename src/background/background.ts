import type { PopupToBackgroundMessage, BackgroundToPopupMessage } from "../shared/messages";

const initialState = {
  status: "idle" as const
};

function isPopupMessage(message: unknown): message is PopupToBackgroundMessage {
  return typeof message === "object" && message !== null && "type" in message;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPopupMessage(message)) return;

  if (message.type === "GET_STATE") {
    const response: BackgroundToPopupMessage = {
      type: "STATE_UPDATED",
      state: initialState
    };

    sendResponse(response);
  }
});
