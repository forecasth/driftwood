import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

// Duplicate this file as `*.arrangement.js` with a new `id` to add another arrangement.
const FMAJ7_THIRD_INVERSION = ['E2', 'F2', 'A2', 'C3']
const EM7_THIRD_INVERSION = ['D2', 'E2', 'G2', 'B2']

const bassEvents = [
  ...buildAscendingSixteenthBar({
    startBar: 0,
    chord: FMAJ7_THIRD_INVERSION,
    velocity: 0.76,
  }),
  ...buildAscendingSixteenthBar({
    startBar: 1,
    chord: EM7_THIRD_INVERSION,
    velocity: 0.74,
  }),
]

const melodyEvents = [
  { time: '0:0:0', note: 'A5', duration: '2n', velocity: 0.38 },
  { time: '0:2:0', note: 'Eb6', duration: '2n', velocity: 0.34 },
  { time: '1:0:0', note: 'F6', duration: '2n', velocity: 0.36 },
  { time: '1:2:0', note: 'D#6', duration: '4n', velocity: 0.31 },
  { time: '1:3:0', note: 'B5', duration: '4n', velocity: 0.34 },
]

const duskArpeggio = createArrangement({
  id: '03-duskArpeggio',
  transport: {
    bpm: 50,
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
      volume: -18,
      gain: 0.7,
    },
  },
  ambience: {
    noise: {
      enabled: true,
      type: 'pink',
      volume: -40,
      filterFrequency: 750,
    },
  },
})

export { duskArpeggio }
export default duskArpeggio
