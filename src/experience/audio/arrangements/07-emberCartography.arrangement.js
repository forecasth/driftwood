import { createArrangement } from './createArrangement.js'

const FMAJ7_THIRD_INVERSION_UP = ['E4', 'F4', 'A4', 'C5']
const EM7_THIRD_INVERSION_UP = ['D4', 'E4', 'G4', 'B4']

function buildSmolderWalkBar({ startBar, chord, velocity = 0.74 }) {
  const [first, second, third, fourth] = chord

  return [
    { time: `${startBar}:0:0`, note: first, duration: '8n', velocity },
    { time: `${startBar}:0:2`, note: second, duration: '8n.', velocity: velocity - 0.03 },
    { time: `${startBar}:1:2`, note: third, duration: '8n', velocity: velocity - 0.02 },
    { time: `${startBar}:2:0`, note: fourth, duration: '8n', velocity: velocity - 0.04 },
    { time: `${startBar}:2:2`, note: third, duration: '8n.', velocity: velocity - 0.05 },
    { time: `${startBar}:3:2`, note: second, duration: '16n', velocity: velocity - 0.06 },
    { time: `${startBar}:3:3`, note: first, duration: '16n', velocity: velocity - 0.06 },
  ]
}

const bassEvents = [
  ...buildSmolderWalkBar({
    startBar: 0,
    chord: FMAJ7_THIRD_INVERSION_UP,
    velocity: 0.75,
  }),
  ...buildSmolderWalkBar({
    startBar: 1,
    chord: EM7_THIRD_INVERSION_UP,
    velocity: 0.73,
  }),
]

const melodyEvents = [
  { time: '0:0:0', note: 'C6', duration: '4n', velocity: 0.29 },
  { time: '0:1:2', note: 'A5', duration: '8n.', velocity: 0.27 },
  { time: '0:2:3', note: 'G5', duration: '8n', velocity: 0.24 },
  { time: '0:3:2', note: 'E5', duration: '8n', velocity: 0.23 },
  { time: '1:0:1', note: 'B5', duration: '4n', velocity: 0.28 },
  { time: '1:1:3', note: 'G5', duration: '8n', velocity: 0.25 },
  { time: '1:2:2', note: 'E5', duration: '8n.', velocity: 0.24 },
  { time: '1:3:3', note: 'D5', duration: '16n', velocity: 0.22 },
]

const emberCartography = createArrangement({
  id: '07-emberCartography',
  transport: {
    bpm: 56,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '2m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -18,
      gain: 0.63,
    },
    melody: {
      events: melodyEvents,
      volume: -21,
      gain: 0.67,
    },
  },
  instruments: {
    melody: {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.24,
        decay: 0.45,
        sustain: 0.5,
        release: 2.8,
      },
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -41,
      filterFrequency: 860,
    },
  },
})

export { emberCartography }
export default emberCartography
