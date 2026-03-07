import { createArrangement } from './createArrangement.js'

const bassEvents = [
  { time: '0:0:0', note: 'F2', duration: '4n', velocity: 0.73 },
  { time: '0:1:0', note: 'A2', duration: '4n', velocity: 0.7 },
  { time: '0:2:0', note: 'C3', duration: '4n', velocity: 0.68 },
  { time: '0:3:0', note: 'E3', duration: '4n', velocity: 0.66 },
  { time: '1:0:0', note: 'E2', duration: '4n', velocity: 0.72 },
  { time: '1:1:0', note: 'G2', duration: '4n', velocity: 0.69 },
  { time: '1:2:0', note: 'B2', duration: '4n', velocity: 0.67 },
  { time: '1:3:0', note: 'D3', duration: '4n', velocity: 0.65 },
]

const melodyEvents = [
  { time: '0:0:0', note: 'C5', duration: '4n.', velocity: 0.26 },
  { time: '0:1:3', note: 'A4', duration: '8n', velocity: 0.23 },
  { time: '0:2:2', note: 'F4', duration: '8n', velocity: 0.22 },
  { time: '0:3:2', note: 'E4', duration: '8n', velocity: 0.21 },
  { time: '1:0:1', note: 'B4', duration: '4n.', velocity: 0.25 },
  { time: '1:2:0', note: 'G4', duration: '8n', velocity: 0.23 },
  { time: '1:3:0', note: 'D5', duration: '8n', velocity: 0.22 },
]

const morningAshNocturne = createArrangement({
  id: '10-morningAshNocturne',
  transport: {
    bpm: 52,
    timeSignature: [4, 4],
    loop: true,
    loopEnd: '2m',
  },
  tracks: {
    bass: {
      events: bassEvents,
      volume: -19,
      gain: 0.61,
    },
    melody: {
      events: melodyEvents,
      volume: -20,
      gain: 0.66,
    },
  },
  instruments: {
    bass: {
      oscillator: { type: 'square' },
      filter: {
        frequency: 190,
        Q: 1.1,
      },
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -43,
      filterFrequency: 700,
    },
  },
})

export { morningAshNocturne }
export default morningAshNocturne
