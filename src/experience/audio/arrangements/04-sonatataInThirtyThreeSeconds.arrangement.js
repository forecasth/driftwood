import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassBars = [
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'Ab3', 'C4', 'Eb4'],
  ['E3', 'G3', 'B3', 'D4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['E3', 'G3', 'B3', 'D4'],
]

const bassEvents = bassBars.flatMap((chord, startBar) =>
  buildAscendingSixteenthBar({
    startBar,
    chord,
    velocity: startBar % 2 === 0 ? 0.74 : 0.76,
  }),
)

const melodyEvents = [
  { time: '0:0:0', note: 'C5', duration: '2n.', velocity: 0.26 },
  { time: '0:3:2', note: 'F#5', duration: '16n', velocity: 0.2 },
  { time: '1:0:0', note: 'G5', duration: '8n', velocity: 0.24 },
  { time: '1:1:2', note: 'D#5', duration: '8n.', velocity: 0.23 },
  { time: '1:3:0', note: 'B4', duration: '4n', velocity: 0.22 },
  { time: '2:0:1', note: 'A5', duration: '4n', velocity: 0.26 },
  { time: '2:1:3', note: 'E5', duration: '8n', velocity: 0.22 },
  { time: '2:2:2', note: 'C6', duration: '8n.', velocity: 0.2 },
  { time: '3:0:0', note: 'G5', duration: '2n', velocity: 0.24 },
  { time: '3:2:3', note: 'C#6', duration: '16n', velocity: 0.18 },
  { time: '4:0:0', note: 'Ab5', duration: '2n.', velocity: 0.25 },
  { time: '4:3:1', note: 'B5', duration: '16n', velocity: 0.2 },
  { time: '5:0:2', note: 'D6', duration: '8n', velocity: 0.23 },
  { time: '5:1:2', note: 'A4', duration: '4n', velocity: 0.24 },
  { time: '5:3:0', note: 'F5', duration: '8n', velocity: 0.2 },
  { time: '6:0:0', note: 'C6', duration: '2n', velocity: 0.24 },
  { time: '6:2:2', note: 'E5', duration: '8n.', velocity: 0.22 },
  { time: '7:0:1', note: 'B5', duration: '4n', velocity: 0.23 },
  { time: '7:2:0', note: 'G5', duration: '8n', velocity: 0.2 },
  { time: '7:3:2', note: 'F#5', duration: '16n', velocity: 0.18 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'A5', duration: '1m', velocity: 0.2 },
  { time: '1:2:0', note: 'D6', duration: '2n.', velocity: 0.18 },
  { time: '3:0:0', note: 'G5', duration: '1m', velocity: 0.21 },
  { time: '4:2:0', note: 'Eb6', duration: '2n.', velocity: 0.18 },
  { time: '6:0:0', note: 'B5', duration: '1m', velocity: 0.2 },
  { time: '7:2:0', note: 'F6', duration: '2n', velocity: 0.17 },
]

const sonatataInThirtyThreeSeconds = createArrangement({
  id: '04-sonatataInThirtyThreeSeconds',
  transport: {
    bpm: 58,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '8m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -18,
      gain: 0.7,
    },
    melody: {
      events: melodyEvents,
      volume: -19,
      gain: 0.66,
    },
    whale: {
      events: whaleEvents,
      volume: -22,
      gain: 0.72,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -44,
      filterFrequency: 620,
    },
  },
})

export { sonatataInThirtyThreeSeconds }
export default sonatataInThirtyThreeSeconds
