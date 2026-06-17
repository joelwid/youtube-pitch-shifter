const OFFSCREEN_URL = "offscreen.html";
export async function ensureOffscreenDocument() {
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_URL);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl]
    });
    if (existingContexts.length > 0)
        return;
    await chrome.offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Process and play captured YouTube tab audio."
    });
}
