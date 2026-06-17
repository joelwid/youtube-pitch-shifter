import { defaultState } from "./extension-state.js";
import { isKeyGroupId } from "../shared/key-groups.js";
import { getSemitoneShift } from "../shared/transposition.js";
let state = { ...defaultState };
function isPopupMessage(message) {
    if (typeof message !== "object" || message === null || !("type" in message))
        return false;
    const { type } = message;
    if (type === "SET_TARGET_KEY") {
        return isKeyGroupId(message.keyGroupId);
    }
    return (type === "GET_STATE" ||
        type === "START_ANALYSIS" ||
        type === "ENABLE_PITCH_SHIFT" ||
        type === "DISABLE_PITCH_SHIFT" ||
        type === "RESET");
}
function getNextShift(nextState) {
    if (nextState.detectedKeyGroupId === null)
        return 0;
    return getSemitoneShift(nextState.detectedKeyGroupId, nextState.targetKeyGroupId);
}
function updateState(patch) {
    const nextState = { ...state, ...patch };
    state = {
        ...nextState,
        semitoneShift: getNextShift(nextState)
    };
    broadcastState();
    return state;
}
function createStateMessage() {
    return {
        type: "STATE_UPDATED",
        state
    };
}
function broadcastState() {
    chrome.runtime.sendMessage(createStateMessage());
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isPopupMessage(message))
        return;
    switch (message.type) {
        case "GET_STATE":
            sendResponse(createStateMessage());
            return;
        case "SET_TARGET_KEY":
            sendResponse({ type: "STATE_UPDATED", state: updateState({ targetKeyGroupId: message.keyGroupId }) });
            return;
        case "ENABLE_PITCH_SHIFT":
            sendResponse({ type: "STATE_UPDATED", state: updateState({ isPitchShiftEnabled: true, status: "pitch_shift_enabled" }) });
            return;
        case "DISABLE_PITCH_SHIFT":
            sendResponse({ type: "STATE_UPDATED", state: updateState({ isPitchShiftEnabled: false, status: state.detectedKeyGroupId === null ? "idle" : "detected" }) });
            return;
        case "START_ANALYSIS":
            sendResponse({ type: "STATE_UPDATED", state: updateState({ status: "listening", errorMessage: null }) });
            return;
        case "RESET":
            state = { ...defaultState };
            broadcastState();
            sendResponse(createStateMessage());
            return;
    }
});
