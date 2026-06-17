# YouTube Key Transposer Chrome Extension — Implementation Plan

## 1. Product Summary

Build a Chrome extension that helps musicians play along to YouTube songs.

The extension should:

1. Capture audio from the active YouTube tab.
2. Analyze a short audio sample once.
3. Detect the song’s key group.
4. Let the user select a target key group.
5. Automatically calculate the required semitone shift.
6. Pitch-shift the YouTube audio in real time.
7. Keep all processing local in the browser.

The tool is not intended to be a full music-analysis system. It assumes:

* The YouTube video is a song.
* The song has one stable key.
* The key does not modulate.
* The user wants a practical play-along transposition tool.

---

## 2. Core Design Decision

Internally, represent keys as integers from `0` to `11`.

Do not internally model:

* Major vs minor
* Sharp vs flat spelling
* Enharmonic variants
* Modal ambiguity

All of those are UI concerns.

Internally:

```ts
type KeyGroupId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
```

Each `KeyGroupId` represents one pitch class and its related major/minor/enharmonic aliases.

Example:

```ts
7 = G / Em
8 = G# / A♭ / Fm
```

---

## 3. User Experience

### Main Popup UI

The popup should show:

```text
Status: Idle / Listening / Analyzing / Detected / Error

Detected key:
G / Em

Target key:
[C / Am ▼]

Applied shift:
+5 semitones

Controls:
[Analyze Song]
[Enable Pitch Shift]
[Disable Pitch Shift]
[Reset]
```

### Recommended MVP Flow

```text
1. User opens YouTube video
2. User starts playback
3. User opens extension popup
4. User clicks "Analyze Song"
5. Extension listens for 15–30 seconds
6. Extension detects key group
7. User selects target key group
8. Extension computes semitone shift
9. Extension applies pitch shift
```

### Important UX Rule

The extension should detect the key once and then stop analyzing.

It should not continuously re-detect the key.

Reason:

* The song key is assumed stable.
* Continuous analysis can create false changes.
* Intros, solos, bridges, and breakdowns can confuse key detection.
* The pitch shift should not jump during playback.

---

## 4. Key Group Model

Create a shared module:

```text
src/shared/key-groups.ts
```

```ts
export type KeyGroupId =
  | 0 | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10 | 11;

export interface KeyGroup {
  id: KeyGroupId;
  label: string;
  aliases: string[];
}

export const KEY_GROUPS: readonly KeyGroup[] = [
  {
    id: 0,
    label: "C / Am",
    aliases: ["C major", "A minor", "C", "Am"]
  },
  {
    id: 1,
    label: "C# / D♭ / A#m / B♭m",
    aliases: ["C# major", "Db major", "A# minor", "Bb minor", "C#", "Db", "A#m", "Bbm"]
  },
  {
    id: 2,
    label: "D / Bm",
    aliases: ["D major", "B minor", "D", "Bm"]
  },
  {
    id: 3,
    label: "D# / E♭ / Cm",
    aliases: ["D# major", "Eb major", "C minor", "D#", "Eb", "Cm"]
  },
  {
    id: 4,
    label: "E / C#m",
    aliases: ["E major", "C# minor", "E", "C#m"]
  },
  {
    id: 5,
    label: "F / Dm",
    aliases: ["F major", "D minor", "F", "Dm"]
  },
  {
    id: 6,
    label: "F# / G♭ / D#m / E♭m",
    aliases: ["F# major", "Gb major", "D# minor", "Eb minor", "F#", "Gb", "D#m", "Ebm"]
  },
  {
    id: 7,
    label: "G / Em",
    aliases: ["G major", "E minor", "G", "Em"]
  },
  {
    id: 8,
    label: "G# / A♭ / Fm",
    aliases: ["G# major", "Ab major", "F minor", "G#", "Ab", "Fm"]
  },
  {
    id: 9,
    label: "A / F#m",
    aliases: ["A major", "F# minor", "A", "F#m"]
  },
  {
    id: 10,
    label: "A# / B♭ / Gm",
    aliases: ["A# major", "Bb major", "G minor", "A#", "Bb", "Gm"]
  },
  {
    id: 11,
    label: "B / C♭ / G#m / A♭m",
    aliases: ["B major", "Cb major", "G# minor", "Ab minor", "B", "Cb", "G#m", "Abm"]
  }
] as const;
```

---

## 5. Semitone Shift Logic

Create:

```text
src/shared/transposition.ts
```

```ts
import type { KeyGroupId } from "./key-groups";

export function getSemitoneShift(from: KeyGroupId, to: KeyGroupId): number {
  let shift = to - from;

  if (shift > 6) shift -= 12;
  if (shift < -6) shift += 12;

  return shift;
}

export function semitonesToPitchRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}
```

Examples:

```ts
getSemitoneShift(7, 0); // G/Em to C/Am = +5
getSemitoneShift(0, 7); // C/Am to G/Em = -5
getSemitoneShift(11, 0); // B/G#m to C/Am = +1
getSemitoneShift(0, 11); // C/Am to B/G#m = -1
```

---

## 6. Extension Architecture

Use a Manifest V3 Chrome extension.

Architecture:

```text
Popup UI
  ↓ messages
Background Service Worker
  ↓ messages
Offscreen Document
  ↓
Web Audio Graph
```

### Responsibilities

#### Popup

The popup is UI only.

Responsibilities:

* Display current extension state.
* Start analysis.
* Select target key group.
* Enable/disable pitch shifting.
* Reset the session.

The popup should not process audio.

#### Background Service Worker

The background worker coordinates extension state.

Responsibilities:

* Check active tab.
* Ensure the active tab is YouTube.
* Create the offscreen document.
* Start tab capture.
* Pass capture information to the offscreen document.
* Relay messages between popup and offscreen document.
* Store session state.

#### Offscreen Document

The offscreen document owns all audio work.

Responsibilities:

* Create the `AudioContext`.
* Receive captured tab audio.
* Build the Web Audio graph.
* Buffer audio for key detection.
* Run key detection.
* Run pitch shifting.
* Output processed audio.

#### Audio Worklet

The audio worklet runs real-time audio processing.

Responsibilities:

* Receive audio buffers.
* Apply pitch shifting.
* Update pitch shift amount when target key changes.

---

## 7. Proposed File Structure

```text
youtube-key-transposer/
  package.json
  tsconfig.json
  vite.config.ts
  manifest.json

  public/
    offscreen.html
    popup.html

  src/
    background/
      background.ts
      offscreen-manager.ts
      tab-capture.ts
      extension-state.ts

    popup/
      popup.ts
      popup.css
      render.ts

    offscreen/
      offscreen.ts
      audio-graph.ts
      audio-buffer-recorder.ts
      key-detection.ts
      pitch-shifter-controller.ts

    worklets/
      pitch-shifter-worklet.ts

    shared/
      key-groups.ts
      transposition.ts
      messages.ts
      storage.ts
      types.ts
      errors.ts
```

---

## 8. Manifest

Create:

```text
manifest.json
```

```json
{
  "manifest_version": 3,
  "name": "YouTube Key Transposer",
  "version": "0.1.0",
  "description": "Detect the key of a YouTube song and transpose it for play-along practice.",
  "minimum_chrome_version": "116",
  "permissions": [
    "activeTab",
    "tabCapture",
    "offscreen",
    "storage"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://music.youtube.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "YouTube Key Transposer"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  }
}
```

---

## 9. Extension State

Create:

```text
src/background/extension-state.ts
```

```ts
import type { KeyGroupId } from "../shared/key-groups";

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
```

---

## 10. Message Contracts

Create:

```text
src/shared/messages.ts
```

```ts
import type { KeyGroupId } from "./key-groups";
import type { ExtensionState } from "../background/extension-state";

export type PopupToBackgroundMessage =
  | { type: "GET_STATE" }
  | { type: "START_ANALYSIS" }
  | { type: "SET_TARGET_KEY"; keyGroupId: KeyGroupId }
  | { type: "ENABLE_PITCH_SHIFT" }
  | { type: "DISABLE_PITCH_SHIFT" }
  | { type: "RESET" };

export type BackgroundToPopupMessage =
  | { type: "STATE_UPDATED"; state: ExtensionState };

export type BackgroundToOffscreenMessage =
  | { type: "START_AUDIO_SESSION"; streamId: string }
  | { type: "START_KEY_ANALYSIS"; durationSeconds: number }
  | { type: "SET_PITCH_SHIFT"; semitones: number }
  | { type: "ENABLE_PITCH_SHIFT" }
  | { type: "DISABLE_PITCH_SHIFT" }
  | { type: "STOP_AUDIO_SESSION" };

export type OffscreenToBackgroundMessage =
  | {
      type: "KEY_DETECTED";
      keyGroupId: KeyGroupId;
      confidence: number;
      rawResult?: unknown;
    }
  | {
      type: "KEY_DETECTION_FAILED";
      reason: string;
    }
  | {
      type: "AUDIO_SESSION_READY";
    }
  | {
      type: "AUDIO_ERROR";
      reason: string;
    };
```

---

## 11. Background Worker Implementation

Create:

```text
src/background/background.ts
```

Responsibilities:

1. Listen for popup messages.
2. Query the active tab.
3. Validate that the tab is YouTube.
4. Create offscreen document if needed.
5. Get a tab capture stream ID.
6. Send stream ID to offscreen document.
7. Update and broadcast state.

Pseudo-flow for `START_ANALYSIS`:

```ts
async function startAnalysis() {
  const tab = await getActiveTab();

  if (!tab.id || !isYouTubeUrl(tab.url)) {
    setError("Open a YouTube video first.");
    return;
  }

  await ensureOffscreenDocument();

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  });

  sendToOffscreen({
    type: "START_AUDIO_SESSION",
    streamId
  });

  sendToOffscreen({
    type: "START_KEY_ANALYSIS",
    durationSeconds: 25
  });

  updateState({
    status: "listening",
    activeTabId: tab.id
  });
}
```

Implement helper:

```ts
function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}
```

---

## 12. Offscreen Document Management

Create:

```text
src/background/offscreen-manager.ts
```

```ts
const OFFSCREEN_URL = "offscreen.html";

export async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
  });

  if (existingContexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Process and play captured YouTube tab audio."
  });
}
```

---

## 13. Offscreen Audio Session

Create:

```text
src/offscreen/offscreen.ts
```

Responsibilities:

* Listen for background messages.
* Create an audio session from a stream ID.
* Start analysis.
* Update pitch shift.

High-level structure:

```ts
let audioGraph: AudioGraph | null = null;

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case "START_AUDIO_SESSION":
      startAudioSession(message.streamId);
      break;

    case "START_KEY_ANALYSIS":
      audioGraph?.analyzeKey(message.durationSeconds);
      break;

    case "SET_PITCH_SHIFT":
      audioGraph?.setPitchShift(message.semitones);
      break;

    case "ENABLE_PITCH_SHIFT":
      audioGraph?.enablePitchShift();
      break;

    case "DISABLE_PITCH_SHIFT":
      audioGraph?.disablePitchShift();
      break;

    case "STOP_AUDIO_SESSION":
      audioGraph?.dispose();
      audioGraph = null;
      break;
  }
});
```

---

## 14. Creating the Captured Audio Stream

Inside the offscreen document:

```ts
async function createStreamFromId(streamId: string): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    } as MediaTrackConstraints,
    video: false
  });
}
```

Note: TypeScript may complain about the `mandatory` object because these Chrome-specific constraints are not part of the standard DOM typings. Use a narrow type override locally.

---

## 15. Audio Graph

Create:

```text
src/offscreen/audio-graph.ts
```

Suggested graph:

```text
MediaStreamSource
  ↓
GainNode
  ↓
Pitch Shifter Node
  ↓
AudioContext.destination
```

Analysis path:

```text
MediaStreamSource
  ↓
Audio Buffer Recorder
  ↓
Key Detection
```

Implementation skeleton:

```ts
export class AudioGraph {
  private ctx: AudioContext;
  private source: MediaStreamAudioSourceNode;
  private inputGain: GainNode;
  private pitchShifter: PitchShifterController;
  private recorder: AudioBufferRecorder;
  private stream: MediaStream;

  constructor(stream: MediaStream) {
    this.stream = stream;
    this.ctx = new AudioContext();

    this.source = this.ctx.createMediaStreamSource(stream);
    this.inputGain = this.ctx.createGain();

    this.pitchShifter = new PitchShifterController(this.ctx);
    this.recorder = new AudioBufferRecorder(this.ctx);

    this.source.connect(this.inputGain);

    this.inputGain.connect(this.recorder.input);
    this.inputGain.connect(this.pitchShifter.input);

    this.pitchShifter.output.connect(this.ctx.destination);
  }

  async analyzeKey(durationSeconds: number): Promise<void> {
    const audioBuffer = await this.recorder.record(durationSeconds);
    const result = await detectKeyGroup(audioBuffer);

    chrome.runtime.sendMessage({
      type: "KEY_DETECTED",
      keyGroupId: result.keyGroupId,
      confidence: result.confidence,
      rawResult: result.raw
    });
  }

  setPitchShift(semitones: number): void {
    this.pitchShifter.setSemitones(semitones);
  }

  enablePitchShift(): void {
    this.pitchShifter.setEnabled(true);
  }

  disablePitchShift(): void {
    this.pitchShifter.setEnabled(false);
  }

  dispose(): void {
    this.stream.getTracks().forEach(track => track.stop());
    this.ctx.close();
  }
}
```

---

## 16. Audio Buffer Recorder

Create:

```text
src/offscreen/audio-buffer-recorder.ts
```

The recorder should collect a mono buffer for a fixed duration.

Requirements:

* Record 15–30 seconds.
* Convert stereo to mono.
* Return an `AudioBuffer` or `Float32Array`.
* Avoid storing audio after detection is complete.

Possible implementation options:

1. Use an `AudioWorkletProcessor` to collect samples.
2. Use a `ScriptProcessorNode` for MVP only, despite deprecation.
3. Use `MediaRecorder`, then decode audio back into an `AudioBuffer`.

Recommended MVP:

* Use `ScriptProcessorNode` first for speed of implementation.
* Replace with `AudioWorklet` later.

Skeleton:

```ts
export class AudioBufferRecorder {
  public input: GainNode;

  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
  }

  async record(durationSeconds: number): Promise<AudioBuffer> {
    const sampleRate = this.ctx.sampleRate;
    const targetSamples = sampleRate * durationSeconds;

    const chunks: Float32Array[] = [];
    let collected = 0;

    const processor = this.ctx.createScriptProcessor(4096, 2, 1);

    this.input.connect(processor);
    processor.connect(this.ctx.destination);

    return new Promise((resolve, reject) => {
      processor.onaudioprocess = event => {
        const left = event.inputBuffer.getChannelData(0);
        const right =
          event.inputBuffer.numberOfChannels > 1
            ? event.inputBuffer.getChannelData(1)
            : left;

        const mono = new Float32Array(left.length);

        for (let i = 0; i < left.length; i++) {
          mono[i] = (left[i] + right[i]) / 2;
        }

        chunks.push(mono);
        collected += mono.length;

        if (collected >= targetSamples) {
          processor.disconnect();
          this.input.disconnect(processor);

          const merged = new Float32Array(collected);
          let offset = 0;

          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          const trimmed = merged.slice(0, targetSamples);

          const buffer = this.ctx.createBuffer(
            1,
            trimmed.length,
            sampleRate
          );

          buffer.copyToChannel(trimmed, 0);
          resolve(buffer);
        }
      };
    });
  }
}
```

Note: Connecting the recorder processor to `ctx.destination` may create unintended output. If needed, connect it through a muted gain node.

---

## 17. Key Detection

Create:

```text
src/offscreen/key-detection.ts
```

The key detection module should return a normalized `KeyGroupId`.

Output:

```ts
export interface KeyDetectionResult {
  keyGroupId: KeyGroupId;
  confidence: number;
  raw: unknown;
}
```

### Recommended MVP Strategy

Use a library such as Essentia.js if practical.

The adapter should:

1. Accept an `AudioBuffer`.
2. Convert it to the library’s expected format.
3. Run key detection.
4. Receive a raw key result, such as:

   * `"G major"`
   * `"E minor"`
   * `"Ab major"`
5. Normalize that result into a `KeyGroupId`.

### Adapter Boundary

Do not let library-specific data leak into the rest of the extension.

Only return:

```ts
{
  keyGroupId: 7,
  confidence: 0.82,
  raw: rawLibraryResult
}
```

### Alias Normalization

Create:

```text
src/shared/key-normalization.ts
```

```ts
import { KEY_GROUPS, type KeyGroupId } from "./key-groups";

const ALIAS_TO_KEY_GROUP_ID = new Map<string, KeyGroupId>();

for (const group of KEY_GROUPS) {
  for (const alias of group.aliases) {
    ALIAS_TO_KEY_GROUP_ID.set(normalizeAlias(alias), group.id);
  }
}

function normalizeAlias(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace("♭", "b")
    .replace("♯", "#")
    .replace(/\s+/g, " ");
}

export function normalizeDetectedKeyToGroupId(value: string): KeyGroupId | null {
  return ALIAS_TO_KEY_GROUP_ID.get(normalizeAlias(value)) ?? null;
}
```

---

## 18. Pitch Shifting

Create:

```text
src/offscreen/pitch-shifter-controller.ts
```

The pitch shifter should expose:

```ts
export interface PitchShifterController {
  input: AudioNode;
  output: AudioNode;

  setSemitones(semitones: number): void;
  setEnabled(enabled: boolean): void;
  dispose(): void;
}
```

### MVP Recommendation

Use the simplest pitch-shifting library that can run in the browser and connect to Web Audio.

Potential options:

* SoundTouchJS-style implementation
* AudioWorklet phase vocoder
* Rubber Band compiled to WebAssembly

### Important Product Priority

For this project, pitch-shifting quality is the highest technical risk.

Before spending too much time on key detection, first prove:

```text
YouTube audio → captured stream → pitch shifted +5 semitones → acceptable sound and latency
```

### Fallback MVP

If real-time pitch shifting takes longer than expected, implement Version 0.1 with a semitone slider and manual shift first.

Then add detection later.

---

## 19. Popup Implementation

Create:

```text
src/popup/popup.html
src/popup/popup.ts
src/popup/popup.css
```

### Popup HTML

```html
<div class="app">
  <h1>YouTube Key Transposer</h1>

  <section>
    <div>Status: <span id="status">Idle</span></div>
    <div>Detected: <span id="detectedKey">—</span></div>
    <div>Confidence: <span id="confidence">—</span></div>
  </section>

  <section>
    <label for="targetKey">Transpose to</label>
    <select id="targetKey"></select>
  </section>

  <section>
    <div>Applied shift: <span id="shift">0</span> semitones</div>
  </section>

  <section class="controls">
    <button id="analyzeButton">Analyze Song</button>
    <button id="enableButton">Enable Pitch Shift</button>
    <button id="disableButton">Disable Pitch Shift</button>
    <button id="resetButton">Reset</button>
  </section>

  <p id="error" class="error"></p>
</div>
```

### Popup Behavior

On load:

1. Populate the target key dropdown from `KEY_GROUPS`.
2. Request state from background.
3. Render state.
4. Listen for state updates.

When target changes:

```ts
chrome.runtime.sendMessage({
  type: "SET_TARGET_KEY",
  keyGroupId: Number(select.value)
});
```

---

## 20. Storage

Use `chrome.storage.local`.

Store only user preferences.

```ts
interface StoredPreferences {
  preferredTargetKeyGroupId: KeyGroupId;
  enablePitchShiftByDefault: boolean;
  fineTuneCents: number;
}
```

Do not store audio.

Do not store YouTube video contents.

Do not send audio anywhere.

---

## 21. Error Handling

Handle these cases explicitly:

### Not YouTube

Message:

```text
Open a YouTube video first.
```

### No audio detected

Message:

```text
No audio detected. Start playback and try again.
```

### Capture failed

Message:

```text
Could not capture tab audio. Try reloading the YouTube tab.
```

### Detection confidence too low

Message:

```text
Could not detect a stable key. Try analyzing during the chorus.
```

### Pitch shifter failed

Message:

```text
Pitch shifting failed to start. Try disabling and enabling it again.
```

### Offscreen document failed

Message:

```text
Audio engine failed to start. Try restarting the extension.
```

---

## 22. Acceptance Criteria

### Version 0.1 — Audio Capture and Manual Pitch Shift

Must support:

* Extension loads in Chrome.
* Popup opens.
* User can capture YouTube tab audio.
* Captured audio is played back through extension.
* User can apply a manual semitone shift.
* Pitch shift is audible.
* No backend is used.

Acceptance test:

```text
Given a YouTube song is playing
When the user opens the extension and enables pitch shift
Then the user hears the same song through the extension
And changing the semitone amount changes the pitch
```

### Version 0.2 — Key Group UI

Must support:

* Target key dropdown with 12 key groups.
* Internal `KeyGroupId` model.
* Semitone calculation using `getSemitoneShift`.
* Display of applied shift.

Acceptance test:

```text
Given detectedKeyGroupId is 7
When targetKeyGroupId is 0
Then the displayed shift is +5 semitones
```

### Version 0.3 — One-Shot Key Detection

Must support:

* User clicks “Analyze Song”.
* Extension records 15–30 seconds.
* Extension detects one key group.
* Extension displays detected key group.
* Extension stops analysis after detection.

Acceptance test:

```text
Given a stable-key YouTube song is playing
When the user clicks Analyze Song
Then the extension displays a detected key group
And does not keep re-analyzing continuously
```

### Version 0.4 — Automatic Transposition

Must support:

* Detected key group plus target key group produces semitone shift.
* Pitch shifter updates automatically.
* Changing target key updates the shift live.

Acceptance test:

```text
Given detected key group is G / Em
When the user selects C / Am
Then the extension applies +5 semitones
```

---

## 23. Implementation Milestones

### Milestone 1: Project Setup

Tasks:

* Create Vite TypeScript project.
* Add Manifest V3 config.
* Add popup HTML/CSS/TS.
* Add background service worker.
* Add offscreen HTML/TS.
* Add shared message types.

Deliverable:

```text
Extension loads in Chrome without errors.
```

---

### Milestone 2: Popup and State

Tasks:

* Implement `ExtensionState`.
* Implement popup rendering.
* Implement message passing.
* Implement target key dropdown.
* Implement state update broadcast.

Deliverable:

```text
Popup can display state and change target key.
```

---

### Milestone 3: Tab Capture

Tasks:

* Detect active YouTube tab.
* Create offscreen document.
* Get stream ID.
* Pass stream ID to offscreen document.
* Convert stream ID to `MediaStream`.

Deliverable:

```text
Offscreen document receives YouTube tab audio.
```

---

### Milestone 4: Audio Playback

Tasks:

* Create `AudioContext`.
* Create `MediaStreamSource`.
* Route source to destination.
* Confirm YouTube audio is audible through extension.

Deliverable:

```text
Captured YouTube audio plays through extension unchanged.
```

---

### Milestone 5: Pitch Shift Proof of Concept

Tasks:

* Add pitch shifter.
* Apply hardcoded `+5` semitone shift.
* Test latency and quality.
* Add enable/disable controls.

Deliverable:

```text
YouTube audio can be shifted up or down in real time.
```

---

### Milestone 6: Key Group Transposition

Tasks:

* Add `KEY_GROUPS`.
* Add `getSemitoneShift`.
* Connect target dropdown to pitch shifter.
* Use fake detected key group for testing.

Deliverable:

```text
Changing target key changes pitch shift automatically.
```

---

### Milestone 7: Audio Recording for Analysis

Tasks:

* Add `AudioBufferRecorder`.
* Record 15–30 seconds of captured audio.
* Convert to mono.
* Return buffer for analysis.
* Release buffer after analysis.

Deliverable:

```text
Extension can collect a temporary audio sample for detection.
```

---

### Milestone 8: Key Detection Adapter

Tasks:

* Integrate key detection library.
* Create detection adapter.
* Normalize raw result to `KeyGroupId`.
* Return confidence.

Deliverable:

```text
Extension can detect key group from captured audio.
```

---

### Milestone 9: Full MVP

Tasks:

* Connect detected key to target key calculation.
* Update pitch shift automatically.
* Render status and confidence.
* Add error handling.
* Persist preferred target key.

Deliverable:

```text
User can analyze a YouTube song, select a target key, and hear transposed audio.
```

---

## 24. Testing Plan

### Unit Tests

Test:

* `getSemitoneShift`
* `semitonesToPitchRatio`
* key alias normalization
* message type guards if implemented

Example cases:

```ts
expect(getSemitoneShift(7, 0)).toBe(5);
expect(getSemitoneShift(0, 7)).toBe(-5);
expect(getSemitoneShift(11, 0)).toBe(1);
expect(getSemitoneShift(0, 11)).toBe(-1);
expect(getSemitoneShift(6, 0)).toBe(-6);
```

### Manual Tests

Test on YouTube:

* Acoustic song
* Pop song
* Song with intro before vocals
* Song in minor key
* Song in sharp/flat key
* Long video
* Paused video
* Muted video

### Audio Quality Tests

Check:

* Latency
* Artifacts
* CPU usage
* Stability over several minutes
* Behavior after seeking YouTube video
* Behavior after switching tabs

---

## 25. Privacy Requirements

The extension must be local-only.

Requirements:

* Do not upload audio.
* Do not use a backend server.
* Do not call external music recognition APIs.
* Do not store captured audio.
* Do not persist raw analysis buffers.
* Only store preferences.

Suggested privacy statement:

```text
This extension processes YouTube tab audio locally in your browser. Audio is not uploaded, stored, or sent to any server.
```

---

## 26. Non-Goals

Do not implement these in the MVP:

* Chord detection
* BPM detection
* Continuous key tracking
* Multi-key songs
* Stem separation
* Vocal/instrument isolation
* Cloud recognition
* Saving processed audio
* Exporting audio
* Support for every streaming site

---

## 27. Known Technical Risks

### 1. Real-Time Pitch Shifting Quality

This is the biggest risk.

Mitigation:

* Prototype pitch shifting before polishing key detection.
* Try multiple libraries if needed.
* Accept some artifacts for MVP.

### 2. Audio Latency

For play-along use, latency matters.

Mitigation:

* Use `AudioWorklet` for production.
* Avoid unnecessary buffering in the live audio path.
* Keep key detection on a separate analysis path.

### 3. YouTube Capture Behavior

Captured tab audio behavior can vary.

Mitigation:

* Test on regular YouTube and YouTube Music.
* Handle reloads and tab changes.
* Provide clear reset behavior.

### 4. Key Detection Accuracy

Detection can fail on intros, sparse sections, or ambiguous harmony.

Mitigation:

* Recommend analyzing during chorus.
* Show confidence.
* Let user re-analyze.
* Optionally allow manual override of detected key group.

---

## 28. Recommended Build Strategy

Build in this order:

```text
1. Extension shell
2. Popup state
3. Tab capture
4. Raw audio playback
5. Pitch shifting
6. Key group model
7. Automatic transposition
8. One-shot key detection
9. Polish and error handling
```

Do not start with key detection.

Start with pitch shifting, because it is the highest-risk part.

---

## 29. Final MVP Definition

The MVP is complete when:

```text
A user can open a YouTube song, click Analyze Song, get a detected key group, choose a target key group, and hear the song transposed in real time.
```

The MVP should be:

* Local-only
* Browser-only
* One-shot analysis
* Integer-based internally
* Musician-friendly in the UI
* Simple enough to maintain
