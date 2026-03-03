import { createArrangement } from './createArrangement.js'
import { buildAscendingSixteenthBar } from './helpers.js'

const bassEvents = [
...buildAscendingSixteenthBar({
startBar: 0,
chord: ['F3', 'A3', 'C4', 'E4'],
velocity: 0.74,
}),
...buildAscendingSixteenthBar({
startBar: 1,
chord: ['E3', 'G3', 'B3', 'D4'],
velocity: 0.74,
}),
]

const melodyEvents = [
// Bar 1 (Fmaj7 color): sustained, with semitone approach + small flourishes
{ time: '0:0:0', note: 'G#4', duration: '16n', velocity: 0.22 },
{ time: '0:0:1', note: 'A4', duration: '2n.', velocity: 0.34 },

{ time: '0:2:0', note: 'B4', duration: '16n', velocity: 0.2 },
{ time: '0:2:1', note: 'C5', duration: '8n', velocity: 0.3 },
{ time: '0:2:3', note: 'E5', duration: '8n', velocity: 0.28 },
{ time: '0:3:0', note: 'F5', duration: '4n', velocity: 0.26 },

// Bar 2 (Em7): sustained, with semitone approach + gentle lift
{ time: '1:0:0', note: 'C#5', duration: '16n', velocity: 0.22 },
{ time: '1:0:1', note: 'D5', duration: '2n', velocity: 0.33 },

{ time: '1:2:0', note: 'F5', duration: '16n', velocity: 0.2 },
{ time: '1:2:1', note: 'E5', duration: '4n', velocity: 0.28 },
{ time: '1:3:0', note: 'G5', duration: '8n', velocity: 0.24 },
{ time: '1:3:2', note: 'B5', duration: '8n', velocity: 0.2 },
]

const fmaj7Em7Fantasia = createArrangement({
id: 'fmaj7Em7Fantasia',
transport: {
bpm: 50,
timeSignature: [4, 4],
loop: true,
loopEnd: '2m',
},
tracks: {
bass: {
events: bassEvents,
volume: -19,
gain: 0.66,
},
melody: {
events: melodyEvents,
volume: -17,
gain: 0.72,
},
},
ambience: {
noise: {
enabled: true,
type: 'pink',
volume: -42,
filterFrequency: 820,
},
},
})

export { fmaj7Em7Fantasia }
export default fmaj7Em7Fantasia