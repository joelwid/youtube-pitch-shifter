import { getKeyGroupLabel, isKeyGroupId, KEY_GROUPS } from "../shared/key-groups.js";
const statusElement = getElement("status");
const detectedKeyElement = getElement("detectedKey");
const confidenceElement = getElement("confidence");
const targetKeySelect = getElement("targetKey");
const shiftElement = getElement("shift");
const errorElement = getElement("error");
const analyzeButton = getElement("analyzeButton");
const enableButton = getElement("enableButton");
const disableButton = getElement("disableButton");
const resetButton = getElement("resetButton");
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
function populateTargetKeySelect(selectedKeyGroupId) {
    targetKeySelect.replaceChildren(...KEY_GROUPS.map((group) => {
        const option = document.createElement("option");
        option.value = String(group.id);
        option.textContent = group.label;
        option.selected = group.id === selectedKeyGroupId;
        return option;
    }));
}
function render(message) {
    if (message.type !== "STATE_UPDATED")
        return;
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
function isBackgroundToPopupMessage(message) {
    return typeof message === "object" && message !== null && message.type === "STATE_UPDATED";
}
