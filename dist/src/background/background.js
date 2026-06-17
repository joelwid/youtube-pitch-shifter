import { defaultState } from "./extension-state.js";
import { ensureOffscreenDocument } from "./offscreen-manager.js";
import { getActiveTab, getTabCaptureStreamId, isYouTubeUrl } from "./tab-capture.js";
import { isKeyGroupId } from "../shared/key-groups.js";
import { getSemitoneShift } from "../shared/transposition.js";
const ANALYSIS_DURATION_SECONDS = 25;
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
function isOffscreenMessage(message) {
    if (typeof message !== "object" || message === null || !("type" in message))
        return false;
    const { type } = message;
    return type === "AUDIO_SESSION_READY" || type === "AUDIO_ERROR" || type === "KEY_DETECTED" || type === "KEY_DETECTION_FAILED";
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
    syncPitchShiftState();
    return state;
}
function setError(errorMessage) {
    return updateState({
        status: "error",
        errorMessage,
        isPitchShiftEnabled: false
    });
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
function sendToOffscreen(message) {
    chrome.runtime.sendMessage(message);
}
function syncPitchShiftState() {
    if (state.activeTabId === null)
        return;
    sendToOffscreen({
        type: "SET_PITCH_SHIFT",
        semitones: state.isPitchShiftEnabled ? state.semitoneShift : 0
    });
}
async function startAnalysis() {
    updateState({ status: "capturing", errorMessage: null });
    const tab = await getActiveTab();
    if (!tab || !isYouTubeUrl(tab.url)) {
        return setError("Open a YouTube video first.");
    }
    updateState({ activeTabId: tab.id });
    try {
        await ensureOffscreenDocument();
        const streamId = await getTabCaptureStreamId(tab.id);
        sendToOffscreen({
            type: "START_AUDIO_SESSION",
            streamId
        });
        sendToOffscreen({
            type: "START_KEY_ANALYSIS",
            durationSeconds: ANALYSIS_DURATION_SECONDS
        });
        sendToOffscreen({
            type: state.isPitchShiftEnabled ? "ENABLE_PITCH_SHIFT" : "DISABLE_PITCH_SHIFT"
        });
        return updateState({
            status: "listening",
            activeTabId: tab.id
        });
    }
    catch (error) {
        console.error("Failed to start analysis", error);
        return setError("Could not capture tab audio. Try reloading the YouTube tab.");
    }
}
function handleOffscreenMessage(message) {
    switch (message.type) {
        case "AUDIO_SESSION_READY":
            updateState({ status: "listening", errorMessage: null });
            return;
        case "AUDIO_ERROR":
            setError(message.reason);
            return;
        case "KEY_DETECTED":
            updateState({
                status: "detected",
                detectedKeyGroupId: message.keyGroupId,
                confidence: message.confidence,
                errorMessage: null
            });
            return;
        case "KEY_DETECTION_FAILED":
            setError(message.reason);
            return;
    }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (isOffscreenMessage(message)) {
        handleOffscreenMessage(message);
        return;
    }
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
            sendToOffscreen({ type: "ENABLE_PITCH_SHIFT" });
            sendResponse({ type: "STATE_UPDATED", state: updateState({ isPitchShiftEnabled: true, status: "pitch_shift_enabled" }) });
            return;
        case "DISABLE_PITCH_SHIFT":
            sendToOffscreen({ type: "DISABLE_PITCH_SHIFT" });
            sendResponse({ type: "STATE_UPDATED", state: updateState({ isPitchShiftEnabled: false, status: state.detectedKeyGroupId === null ? "idle" : "detected" }) });
            return;
        case "START_ANALYSIS":
            startAnalysis()
                .then((nextState) => sendResponse({ type: "STATE_UPDATED", state: nextState }))
                .catch((error) => {
                console.error("Unexpected analysis error", error);
                sendResponse({ type: "STATE_UPDATED", state: setError("Could not capture tab audio. Try reloading the YouTube tab.") });
            });
            return true;
        case "RESET":
            sendToOffscreen({ type: "STOP_AUDIO_SESSION" });
            state = { ...defaultState };
            broadcastState();
            sendResponse(createStateMessage());
            return;
    }
});
