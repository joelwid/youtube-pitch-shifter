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
