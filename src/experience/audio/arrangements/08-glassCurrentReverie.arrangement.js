import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassBars = [
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
]

const bassEvents = bassBars.flatMap((chord, startBar) =>
  buildAscendingSixteenthBar({
    startBar,
    chord,
    velocity: startBar % 2 === 0 ? 0.73 : 0.75,
  }),
)

const melodyEvents = [
  { time: '0:0:0', note: 'A5', duration: '2n', velocity: 0.3 },
  { time: '0:2:2', note: 'C6', duration: '8n', velocity: 0.25 },
  { time: '1:0:1', note: 'B5', duration: '2n.', velocity: 0.29 },
  { time: '1:3:1', note: 'D6', duration: '16n', velocity: 0.22 },
  { time: '2:0:0', note: 'F6', duration: '2n', velocity: 0.28 },
  { time: '2:2:3', note: 'E6', duration: '8n', velocity: 0.24 },
  { time: '3:0:0', note: 'G5', duration: '2n.', velocity: 0.27 },
  { time: '3:3:2', note: 'B5', duration: '8n', velocity: 0.22 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'C6', duration: '1m', velocity: 0.18 },
  { time: '1:2:0', note: 'B5', duration: '1m', velocity: 0.17 },
  { time: '3:0:0', note: 'A5', duration: '1m', velocity: 0.18 },
]

const glassCurrentReverie = createArrangement({
  id: '08-glassCurrentReverie',
  transport: {
    bpm: 63,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '4m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -19,
      gain: 0.62,
    },
    melody: {
      events: melodyEvents,
      volume: -21,
      gain: 0.67,
    },
    whale: {
      events: whaleEvents,
      volume: -24,
      gain: 0.72,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -41,
      filterFrequency: 980,
    },
  },
})

export { glassCurrentReverie }
export default glassCurrentReverie
