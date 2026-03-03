import { createArrangement } from './createArrangement.js'

const FMAJ7_THIRD_INVERSION_UP = ['E4', 'F4', 'A4', 'C5']
const EM7_THIRD_INVERSION_UP = ['D4', 'E4', 'G4', 'B4']

function buildBluesWalkBar({ startBar, chord, velocity = 0.74 }) {
  const [first, second, third, fourth] = chord

  return [
    { time: `${startBar}:0:0`, note: first, duration: '8n.', velocity },
    { time: `${startBar}:0:3`, note: second, duration: '16n', velocity: velocity - 0.04 },
    { time: `${startBar}:1:0`, note: third, duration: '8n', velocity: velocity - 0.02 },
    { time: `${startBar}:1:2`, note: second, duration: '8n', velocity: velocity - 0.05 },
    { time: `${startBar}:2:0`, note: fourth, duration: '8n.', velocity: velocity - 0.03 },
    { time: `${startBar}:2:3`, note: third, duration: '16n', velocity: velocity - 0.06 },
    { time: `${startBar}:3:0`, note: second, duration: '8n', velocity: velocity - 0.04 },
    { time: `${startBar}:3:2`, note: first, duration: '8n', velocity: velocity - 0.05 },
  ]
}

const bassEvents = [
  ...buildBluesWalkBar({
    startBar: 0,
    chord: FMAJ7_THIRD_INVERSION_UP,
    velocity: 0.76,
  }),
  ...buildBluesWalkBar({
    startBar: 1,
    chord: EM7_THIRD_INVERSION_UP,
    velocity: 0.74,
  }),
]

const melodyEvents = [
  { time: '0:0:0', note: 'C6', duration: '4n.', velocity: 0.31 },
  { time: '0:1:3', note: 'A5', duration: '8n', velocity: 0.28 },
  { time: '0:2:2', note: 'F5', duration: '8n.', velocity: 0.27 },
  { time: '0:3:3', note: 'E5', duration: '8n', velocity: 0.25 },
  { time: '1:0:1', note: 'B5', duration: '4n', velocity: 0.29 },
  { time: '1:1:2', note: 'G5', duration: '8n.', velocity: 0.26 },
  { time: '1:2:3', note: 'E5', duration: '8n', velocity: 0.25 },
  { time: '1:3:2', note: 'D5', duration: '8n', velocity: 0.24 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'A5', duration: '1m', velocity: 0.22 },
  { time: '0:2:0', note: 'C6', duration: '2n', velocity: 0.2 },
  { time: '1:0:0', note: 'G5', duration: '1m', velocity: 0.21 },
  { time: '1:2:0', note: 'B5', duration: '2n', velocity: 0.2 },
]

const whaleBlues = createArrangement({
  id: 'whaleBlues',
  transport: {
    bpm: 54,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '2m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -17,
      gain: 0.6,
    },
    melody: {
      events: melodyEvents,
      volume: -22,
      gain: 0.66,
    },
    whale: {
      events: whaleEvents,
      volume: -21,
      gain: 0.7,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -44,
      filterFrequency: 640,
    },
  },
})

export { whaleBlues }
export default whaleBlues
