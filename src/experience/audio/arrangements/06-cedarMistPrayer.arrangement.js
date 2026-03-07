import { createArrangement } from './createArrangement.js'

const bassEvents = [
  { time: '0:0:0', note: 'F2', duration: '2n', velocity: 0.69 },
  { time: '0:2:0', note: 'C3', duration: '2n', velocity: 0.63 },
  { time: '1:0:0', note: 'E2', duration: '2n', velocity: 0.67 },
  { time: '1:2:0', note: 'B2', duration: '2n', velocity: 0.61 },
]

const melodyEvents = [
  { time: '0:0:0', note: 'A5', duration: '2n.', velocity: 0.24 },
  { time: '0:3:0', note: 'C6', duration: '8n', velocity: 0.2 },
  { time: '1:0:0', note: 'G5', duration: '2n.', velocity: 0.23 },
  { time: '1:3:0', note: 'B5', duration: '8n', velocity: 0.19 },
]

const whaleEvents = [
  { time: '0:0:0', note: 'F5', duration: '1m', velocity: 0.17 },
  { time: '1:0:0', note: 'E5', duration: '1m', velocity: 0.17 },
]

const cedarMistPrayer = createArrangement({
  id: '06-cedarMistPrayer',
  transport: {
    bpm: 44,
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
      volume: -19,
      gain: 0.66,
    },
    whale: {
      events: whaleEvents,
      volume: -24,
      gain: 0.74,
    },
  },
  instruments: {
    bass: {
      envelope: {
        attack: 0.08,
        decay: 0.28,
        sustain: 0.5,
        release: 2.4,
      },
    },
    melody: {
      envelope: {
        attack: 0.62,
        decay: 0.52,
        sustain: 0.5,
        release: 3.8,
      },
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -42,
      filterFrequency: 720,
    },
  },
})

export { cedarMistPrayer }
export default cedarMistPrayer
