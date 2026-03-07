import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassBars = [
  ['F2', 'Ab2', 'B2', 'D3'],
  ['E2', 'G2', 'B2', 'D3'],
  ['F2', 'A2', 'C3', 'E3'],
  ['E2', 'G2', 'Bb2', 'D3'],
]

const bassEvents = bassBars.flatMap((chord, startBar) =>
  buildAscendingSixteenthBar({
    startBar,
    chord,
    velocity: startBar % 2 === 0 ? 0.73 : 0.76,
  }),
)

const melodyEvents = [
  { time: '0:0:2', note: 'C5', duration: '8n', velocity: 0.24 },
  { time: '0:1:3', note: 'B4', duration: '8n', velocity: 0.22 },
  { time: '0:2:3', note: 'F5', duration: '8n.', velocity: 0.25 },
  { time: '0:3:3', note: 'Ab5', duration: '16n', velocity: 0.2 },
  { time: '1:0:0', note: 'G5', duration: '4n', velocity: 0.26 },
  { time: '1:1:2', note: 'D5', duration: '8n.', velocity: 0.23 },
  { time: '1:3:0', note: 'B4', duration: '8n', velocity: 0.21 },
  { time: '2:0:1', note: 'A5', duration: '4n', velocity: 0.26 },
  { time: '2:2:0', note: 'E5', duration: '8n', velocity: 0.23 },
  { time: '2:3:2', note: 'C6', duration: '16n', velocity: 0.2 },
  { time: '3:0:0', note: 'Bb5', duration: '2n', velocity: 0.24 },
  { time: '3:2:3', note: 'D6', duration: '8n', velocity: 0.2 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'G5', duration: '2m', velocity: 0.17 },
  { time: '2:0:0', note: 'F5', duration: '2m', velocity: 0.17 },
]

const moonlitSwitchyard = createArrangement({
  id: '09-moonlitSwitchyard',
  transport: {
    bpm: 60,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '4m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -17,
      gain: 0.65,
    },
    melody: {
      events: melodyEvents,
      volume: -20,
      gain: 0.68,
    },
    whale: {
      events: whaleEvents,
      volume: -24,
      gain: 0.7,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'brown',
      volume: -45,
      filterFrequency: 560,
    },
  },
})

export { moonlitSwitchyard }
export default moonlitSwitchyard
