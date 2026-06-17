import type { ExtensionState } from "../background/extension-state.js";
import type { KeyGroupId } from "./key-groups.js";

export type PopupToBackgroundMessage =
  | { type: "GET_STATE" }
  | { type: "START_ANALYSIS" }
  | { type: "SET_TARGET_KEY"; keyGroupId: KeyGroupId }
  | { type: "ENABLE_PITCH_SHIFT" }
  | { type: "DISABLE_PITCH_SHIFT" }
  | { type: "RESET" };

export type BackgroundToPopupMessage = {
  type: "STATE_UPDATED";
  state: ExtensionState;
};

export type BackgroundToOffscreenMessage =
  | { type: "START_AUDIO_SESSION"; streamId: string }
  | { type: "START_KEY_ANALYSIS"; durationSeconds: number }
  | { type: "SET_PITCH_SHIFT"; semitones: number }
  | { type: "ENABLE_PITCH_SHIFT" }
  | { type: "DISABLE_PITCH_SHIFT" }
  | { type: "STOP_AUDIO_SESSION" };

export type OffscreenToBackgroundMessage =
  | { type: "AUDIO_SESSION_READY" }
  | { type: "AUDIO_ERROR"; reason: string }
  | { type: "KEY_DETECTED"; keyGroupId: KeyGroupId; confidence: number; rawResult?: unknown }
  | { type: "KEY_DETECTION_FAILED"; reason: string };
