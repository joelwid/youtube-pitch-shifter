import type { KeyGroupId } from "../shared/key-groups.js";

export type ExtensionStatus =
  | "idle"
  | "capturing"
  | "listening"
  | "analyzing"
  | "detected"
  | "pitch_shift_enabled"
  | "error";

export interface ExtensionState {
  status: ExtensionStatus;
  activeTabId: number | null;
  detectedKeyGroupId: KeyGroupId | null;
  targetKeyGroupId: KeyGroupId;
  semitoneShift: number;
  isPitchShiftEnabled: boolean;
  confidence: number | null;
  errorMessage: string | null;
}

export const defaultState: ExtensionState = {
  status: "idle",
  activeTabId: null,
  detectedKeyGroupId: null,
  targetKeyGroupId: 0,
  semitoneShift: 0,
  isPitchShiftEnabled: false,
  confidence: null,
  errorMessage: null
};
