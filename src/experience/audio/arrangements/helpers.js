export function buildAscendingSixteenthBar({ startBar, chord, velocity = 0.74 }) {
  return Array.from({ length: 16 }, (_, step) => ({
    time: `${startBar}:0:${step}`,
    note: chord[step % chord.length],
    duration: '16n',
    velocity: Math.max(0.5, velocity - (step % chord.length) * 0.03),
  }))
}
