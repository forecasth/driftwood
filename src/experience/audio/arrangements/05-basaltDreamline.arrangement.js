import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassBars = [
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'Bb3', 'D4'],
]

const bassEvents = bassBars.flatMap((chord, startBar) =>
  buildAscendingSixteenthBar({
    startBar,
    chord,
    velocity: startBar === 3 ? 0.71 : 0.74,
  }),
)

const melodyEvents = [
  { time: '0:0:0', note: 'A4', duration: '2n', velocity: 0.27 },
  { time: '0:2:2', note: 'C5', duration: '8n', velocity: 0.22 },
  { time: '0:3:2', note: 'E5', duration: '8n', velocity: 0.2 },
  { time: '1:0:1', note: 'B4', duration: '2n.', velocity: 0.26 },
  { time: '1:3:0', note: 'D5', duration: '8n', velocity: 0.21 },
  { time: '2:0:0', note: 'F5', duration: '2n', velocity: 0.27 },
  { time: '2:2:3', note: 'E5', duration: '16n', velocity: 0.19 },
  { time: '3:0:0', note: 'G4', duration: '2n.', velocity: 0.25 },
  { time: '3:3:1', note: 'Bb4', duration: '8n', velocity: 0.2 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'F5', duration: '2m', velocity: 0.18 },
  { time: '2:0:0', note: 'E5', duration: '2m', velocity: 0.17 },
]

const basaltDreamline = createArrangement({
  id: '05-basaltDreamline',
  transport: {
    bpm: 55,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '4m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -18,
      gain: 0.64,
    },
    melody: {
      events: melodyEvents,
      volume: -21,
      gain: 0.67,
    },
    whale: {
      events: whaleEvents,
      volume: -23,
      gain: 0.73,
    },
  },
  instruments: {
    whale: {
      filter: {
        frequency: 1120,
        Q: 1.4,
      },
      envelope: {
        attack: 1.7,
        decay: 0.9,
        sustain: 0.76,
        release: 5.2,
      },
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -44,
      filterFrequency: 610,
    },
  },
})

export { basaltDreamline }
export default basaltDreamline
