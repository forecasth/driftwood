import { createArrangement } from './createArrangement.js'

const FMAJ7_ROOT_UP = ['F3', 'A3', 'C4', 'E4']
const EM7_ROOT_UP = ['E3', 'G3', 'B3', 'D4']

function buildLanternBar({ startBar, chord, velocity = 0.74 }) {
  const [first, second, third, fourth] = chord

  return [
    { time: `${startBar}:0:0`, note: first, duration: '8n.', velocity },
    { time: `${startBar}:0:3`, note: second, duration: '16n', velocity: velocity - 0.03 },
    { time: `${startBar}:1:0`, note: third, duration: '8n', velocity: velocity - 0.02 },
    { time: `${startBar}:1:2`, note: fourth, duration: '8n', velocity: velocity - 0.04 },
    { time: `${startBar}:2:0`, note: third, duration: '8n.', velocity: velocity - 0.05 },
    { time: `${startBar}:2:3`, note: second, duration: '16n', velocity: velocity - 0.06 },
    { time: `${startBar}:3:0`, note: first, duration: '8n', velocity: velocity - 0.04 },
    { time: `${startBar}:3:2`, note: second, duration: '8n', velocity: velocity - 0.06 },
  ]
}

const bassEvents = [
  ...buildLanternBar({
    startBar: 0,
    chord: FMAJ7_ROOT_UP,
    velocity: 0.76,
  }),
  ...buildLanternBar({
    startBar: 1,
    chord: EM7_ROOT_UP,
    velocity: 0.74,
  }),
]

const melodyEvents = [
  { time: '0:0:2', note: 'C6', duration: '8n', velocity: 0.3 },
  { time: '0:1:2', note: 'A5', duration: '8n.', velocity: 0.27 },
  { time: '0:2:3', note: 'F5', duration: '16n', velocity: 0.25 },
  { time: '0:3:2', note: 'E5', duration: '8n', velocity: 0.24 },
  { time: '1:0:1', note: 'B5', duration: '8n', velocity: 0.29 },
  { time: '1:1:2', note: 'G5', duration: '8n.', velocity: 0.26 },
  { time: '1:2:3', note: 'E5', duration: '16n', velocity: 0.24 },
  { time: '1:3:2', note: 'D5', duration: '8n', velocity: 0.23 },
]

const siltLanternSwing = createArrangement({
  id: '11-siltLanternSwing',
  transport: {
    bpm: 57,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '2m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -18,
      gain: 0.62,
    },
    melody: {
      events: melodyEvents,
      volume: -20,
      gain: 0.69,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -43,
      filterFrequency: 670,
    },
  },
})

export { siltLanternSwing }
export default siltLanternSwing
