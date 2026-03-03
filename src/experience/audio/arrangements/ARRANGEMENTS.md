# Driftwood Arrangement Authoring Guide

This document explains how to create new audio arrangements for Driftwood.

## File Location and Naming

- Put each arrangement in `src/experience/audio/arrangements/`.
- File name must end with `.arrangement.js`.
- Example: `myNewMood.arrangement.js`.

The loader in `index.js` auto-imports every `*.arrangement.js` file via `import.meta.glob`.

## Minimal Arrangement File Template

```js
import { createArrangement } from './createArrangement.js'

const bassEvents = [
  { time: '0:0:0', note: 'E2', duration: '4n', velocity: 0.75 },
]

const melodyEvents = [
  { time: '0:0:0', note: 'A5', duration: '2n', velocity: 0.35 },
]

const myNewMood = createArrangement({
  id: 'myNewMood',
  transport: {
    bpm: 52,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '2m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -20,
      gain: 0.62,
    },
    melody: {
      events: melodyEvents,
      volume: -18,
      gain: 0.7,
    },
    // Optional:
    // whale: {
    //   events: whaleEvents,
    //   volume: -21,
    //   gain: 0.7,
    // },
  },
  // Optional per-arrangement synth overrides:
  // instruments: {
  //   bass: {
  //     oscillator: { type: 'square' },
  //     envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.2 },
  //   },
  //   melody: {
  //     oscillator: { type: 'sawtooth' },
  //   },
  //   whale: {
  //     filter: { frequency: 1800, Q: 2.0 },
  //   },
  // },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -40,
      filterFrequency: 750,
    },
  },
})

export { myNewMood }
export default myNewMood
```

## Arrangement Shape

`createArrangement` takes:

- `id` (required, string): unique arrangement id used by the registry.
- `transport` (optional object): merged with defaults.
- `tracks` (optional object): audio tracks.
- `ambience` (optional object): ambience/noise settings.
- `instruments` (optional object): per-arrangement synth overrides.

### Transport Defaults

Defined in `createArrangement.js`:

- `bpm: 50`
- `timeSignature: [4, 4]`
- `loop: true`
- `loopEnd: '2m'`

If you omit a `transport` field, default values are used.

### Track Object

Each track (for example `bass`, `melody`, `whale`) can provide:

- `events`: array of note events.
- `volume`: synth volume in dB (for example `-20`).
- `gain`: bus gain multiplier (for example `0.62`).

### Instruments Object

`instruments` can override synth settings for:

- `bass` (MonoSynth options)
- `melody` (Synth options used by PolySynth voices)
- `whale` (MonoSynth options, only relevant if whale track exists)

Common useful fields:

- `oscillator.type`
- `envelope.attack|decay|sustain|release`
- `filter.frequency|Q`
- `filterEnvelope.*`
- `portamento` (for mono synths)

### Event Object

Each event supports:

- `time` (required): Tone.js transport time, usually bars:quarters:sixteenths, e.g. `'1:2:0'`.
- `note` (required): note name string, e.g. `'E2'`, `'C6'`, `'D#5'`.
- `duration` (optional): Tone duration string, e.g. `'16n'`, `'8n.'`, `'2n'`, `'1m'`.
- `velocity` (optional): number usually between `0` and `1`.

If `duration` is missing, engine default is `'4n'`.
If `velocity` is missing, engine default is `0.8`.

## Tracks Supported by Current Engine

Current `engine.js` behavior:

- `bass`: MonoSynth voice, always created.
- `melody`: PolySynth voice, always created.
- `whale`: optional MonoSynth voice, only created if `tracks.whale` exists.

You can omit `whale` entirely.

## Ambience Settings

`ambience.noise` supports:

- `enabled`: boolean.
- `type`: Tone noise color, used values include `'pink'` and `'brown'`.
- `volume`: dB value.
- `filterFrequency`: low-pass frequency.

If enabled, noise is routed through a low-pass filter to the master chain.

## Utility Functions Available

From `helpers.js`:

- `buildAscendingSixteenthBar({ startBar, chord, velocity = 0.74 })`

It returns 16 note events for one bar:

- times: `${startBar}:0:0` through `${startBar}:0:15`
- notes: cycles through the provided `chord` array
- duration: `'16n'`
- velocity: slightly stepped down, floor at `0.5`

Example:

```js
import { buildAscendingSixteenthBar } from './helpers.js'

const bar0 = buildAscendingSixteenthBar({
  startBar: 0,
  chord: ['E2', 'F2', 'A2', 'C3'],
  velocity: 0.76,
})
```

## Registry and Discovery Rules

Defined in `index.js`:

- Any `*.arrangement.js` file is loaded automatically.
- Registry key is the arrangement `id`.
- `defaultArrangementId` prefers `'duskArpeggio'` if present; otherwise first loaded arrangement.

Export pattern that works best:

- `export default myArrangement`
- `export { myArrangement }`

## Authoring Rules for Other LLMs

- Keep `id` unique and stable.
- Keep times inside `loopEnd` (or intentionally allow overlap if desired).
- Always provide at least `tracks.bass.events` and `tracks.melody.events`.
- Use conservative velocities and volumes; this project targets subtle ambience.
- If adding `whale`, keep note density low and use long durations.
- Do not change engine internals unless explicitly asked.

## LLM Prompt Contract (Strict)

Use this contract when asking another LLM to generate a new arrangement file.

### Input Contract

Provide these fields to the LLM:

- `arrangementId`: unique id string (also used as variable/export identity).
- `mood`: short text style direction.
- `bpm`: number.
- `loopEnd`: Tone transport loop length (usually `'2m'`).
- `timeSignature`: usually `[4, 4]`.
- `chordProgression`: ordered chord-note arrays by bar (for example `[['E2','F2','A2','C3'], ['D2','E2','G2','B2']]`).
- `includeWhaleTrack`: boolean.
- `noiseType`: `'pink'` or `'brown'`.
- `noiseVolume`: dB number.
- `noiseFilterFrequency`: number in Hz.

### Output Contract

The LLM output must:

- Return only JavaScript file content for one `*.arrangement.js` file.
- Not include markdown fences or explanations.
- Import `createArrangement` from `./createArrangement.js`.
- Optionally import helper(s) from `./helpers.js`.
- Export both named and default arrangement:
  `export { <arrangementVar> }` and `export default <arrangementVar>`.
- Set `id` exactly equal to `arrangementId`.
- Include `tracks.bass.events` and `tracks.melody.events`.
- Include `tracks.whale` only if `includeWhaleTrack` is `true`.
- Optionally include `instruments` overrides for `bass`, `melody`, and `whale`.
- Keep event `velocity` values in `[0, 1]`.
- Use Tone-compatible `time` and `duration` strings.

### Hard Constraints

- Do not edit any file other than the new arrangement file.
- Do not modify engine behavior.
- Do not introduce new dependencies.
- Keep musical density moderate; Driftwood is ambient and restrained.
- Keep event times aligned with the configured loop.

### Copy-Paste Prompt Template

Use this prompt with another LLM:

```text
Create exactly one new arrangement file for Driftwood.

Target path:
src/experience/audio/arrangements/{{fileName}}.arrangement.js

Requirements:
1. Return ONLY raw JavaScript content for that file (no markdown, no explanation).
2. Import createArrangement from './createArrangement.js'.
3. Optionally import helper(s) from './helpers.js' if useful.
4. Use arrangement id '{{arrangementId}}' exactly.
5. Export both named and default exports for the arrangement object.
6. Include tracks.bass and tracks.melody with events, volume, and gain.
7. Include tracks.whale only if includeWhaleTrack is true.
8. Use transport:
   - bpm: {{bpm}}
   - timeSignature: {{timeSignature}}
   - loop: true
   - loopEnd: '{{loopEnd}}'
9. Use this chord progression as harmonic source:
   {{chordProgression}}
10. Ambience noise config:
   - enabled: true
   - type: '{{noiseType}}'
   - volume: {{noiseVolume}}
   - filterFrequency: {{noiseFilterFrequency}}
11. Optionally include instruments overrides if a special timbre is requested.
12. Keep style/mood: {{mood}}
13. Keep velocity values between 0 and 1.
14. Keep the arrangement subtle/atmospheric, not busy.

Output only the file code.
```

## Quick Validation Checklist

- File is named `*.arrangement.js`.
- Uses `createArrangement`.
- Has a unique `id`.
- Exports default arrangement object.
- Runs with `npm run lint` and `npm run build`.
