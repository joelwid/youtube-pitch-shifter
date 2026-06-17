import { isKeyGroupId } from "../shared/key-groups.js";
import { populateTargetKeySelect, renderPopupState } from "./render.js";
const elements = {
    status: getElement("status"),
    detectedKey: getElement("detectedKey"),
    confidence: getElement("confidence"),
    targetKey: getElement("targetKey"),
    shift: getElement("shift"),
    error: getElement("error"),
    analyzeButton: getElement("analyzeButton"),
    enableButton: getElement("enableButton"),
    disableButton: getElement("disableButton"),
    resetButton: getElement("resetButton")
};
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing popup element: #${id}`);
    }
    return element;
}
function sendPopupMessage(message) {
    chrome.runtime.sendMessage(message, (response) => {
        if (response)
            render(response);
    });
}
function render(message) {
    if (message.type !== "STATE_UPDATED")
        return;
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
function isBackgroundToPopupMessage(message) {
    return typeof message === "object" && message !== null && message.type === "STATE_UPDATED";
}
