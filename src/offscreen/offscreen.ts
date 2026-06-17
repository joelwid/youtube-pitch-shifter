import type { BackgroundToOffscreenMessage, OffscreenToBackgroundMessage } from "../shared/messages.js";

type TabAudioConstraints = MediaTrackConstraints & {
  mandatory: {
    chromeMediaSource: "tab";
    chromeMediaSourceId: string;
  };
};

let capturedStream: MediaStream | null = null;

function isBackgroundToOffscreenMessage(message: unknown): message is BackgroundToOffscreenMessage {
  if (typeof message !== "object" || message === null || !("type" in message)) return false;

  const { type } = message as { type: unknown };
  return (
    type === "START_AUDIO_SESSION" ||
    type === "START_KEY_ANALYSIS" ||
    type === "SET_PITCH_SHIFT" ||
    type === "ENABLE_PITCH_SHIFT" ||
    type === "DISABLE_PITCH_SHIFT" ||
    type === "STOP_AUDIO_SESSION"
  );
}

function sendToBackground(message: OffscreenToBackgroundMessage): void {
  chrome.runtime.sendMessage(message);
}

async function createStreamFromId(streamId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    } as TabAudioConstraints,
    video: false
  });
}

async function startAudioSession(streamId: string): Promise<void> {
  stopAudioSession();

  try {
    capturedStream = await createStreamFromId(streamId);
    sendToBackground({ type: "AUDIO_SESSION_READY" });
  } catch (error) {
    console.error("Failed to create offscreen audio stream", error);
    sendToBackground({
      type: "AUDIO_ERROR",
      reason: "Audio engine failed to start. Try restarting the extension."
    });
  }
}

function stopAudioSession(): void {
  capturedStream?.getTracks().forEach((track) => track.stop());
  capturedStream = null;
}

chrome.runtime.onMessage.addListener((message) => {
  if (!isBackgroundToOffscreenMessage(message)) return;

  switch (message.type) {
    case "START_AUDIO_SESSION":
      void startAudioSession(message.streamId);
      return;
    case "STOP_AUDIO_SESSION":
      stopAudioSession();
      return;
    case "START_KEY_ANALYSIS":
    case "SET_PITCH_SHIFT":
    case "ENABLE_PITCH_SHIFT":
    case "DISABLE_PITCH_SHIFT":
      return;
  }
});
