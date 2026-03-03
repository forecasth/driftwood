const DEFAULT_TRANSPORT = Object.freeze({
  bpm: 50,
  timeSignature: [4, 4],
  loop: true,
  loopEnd: '2m',
})

export function createArrangement({
  id,
  transport = {},
  tracks = {},
  ambience = {},
  instruments = {},
}) {
  if (!id) {
    throw new Error('Arrangement requires an id')
  }

  return {
    id,
    transport: {
      ...DEFAULT_TRANSPORT,
      ...transport,
    },
    tracks,
    ambience,
    instruments,
  }
}
