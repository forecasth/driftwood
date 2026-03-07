import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassBars = [
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'Ab3', 'C4', 'Eb4'],
  ['E3', 'G3', 'B3', 'D4'],
]

const bassEvents = bassBars.flatMap((chord, startBar) =>
  buildAscendingSixteenthBar({
    startBar,
    chord,
    velocity: startBar === 2 ? 0.72 : 0.75,
  }),
)

const melodyEvents = [
  { time: '0:0:0', note: 'A4', duration: '2n.', velocity: 0.27 },
  { time: '0:3:0', note: 'C5', duration: '8n', velocity: 0.22 },
  { time: '1:0:1', note: 'B4', duration: '2n', velocity: 0.25 },
  { time: '1:2:2', note: 'D5', duration: '8n.', velocity: 0.22 },
  { time: '2:0:0', note: 'Ab4', duration: '2n.', velocity: 0.24 },
  { time: '2:3:1', note: 'C5', duration: '16n', velocity: 0.2 },
  { time: '3:0:0', note: 'G4', duration: '2n', velocity: 0.24 },
  { time: '3:2:3', note: 'B4', duration: '8n', velocity: 0.21 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'A5', duration: '2m', velocity: 0.19 },
  { time: '2:0:0', note: 'G5', duration: '2m', velocity: 0.18 },
]

const tidepoolLament = createArrangement({
  id: '12-tidepoolLament',
  transport: {
    bpm: 48,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '4m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -19,
      gain: 0.64,
    },
    melody: {
      events: melodyEvents,
      volume: -20,
      gain: 0.68,
    },
    whale: {
      events: whaleEvents,
      volume: -23,
      gain: 0.72,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -45,
      filterFrequency: 580,
    },
  },
})

export { tidepoolLament }
export default tidepoolLament
