import * as Tone from 'tone'

function createBassSynth() {
  return new Tone.MonoSynth({
    oscillator: {
      type: 'triangle',
    },
    filter: {
      type: 'lowpass',
      frequency: 240,
      rolloff: -24,
      Q: 1.3,
    },
    envelope: {
      attack: 0.03,
      decay: 0.2,
      sustain: 0.55,
      release: 1.8,
    },
    filterEnvelope: {
      attack: 0.05,
      decay: 0.28,
      sustain: 0.32,
      release: 1.4,
      baseFrequency: 120,
      octaves: 1.4,
    },
    portamento: 0.01,
  })
}

function createLeadSynth() {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.35,
      decay: 0.5,
      sustain: 0.52,
      release: 2.4,
    },
  })
}

function createTrackPart(synth, track) {
  const part = new Tone.Part((time, event) => {
    synth.triggerAttackRelease(
      event.note,
      event.duration ?? '4n',
      time,
      event.velocity ?? 0.8,
    )
  }, track.events ?? [])

  part.loop = true
  return part
}

export function createAudioEngine(arrangement) {
  Tone.Transport.cancel(0)
  Tone.Transport.bpm.value = arrangement.transport.bpm
  Tone.Transport.timeSignature = arrangement.transport.timeSignature
  Tone.Transport.loop = arrangement.transport.loop
  Tone.Transport.loopEnd = arrangement.transport.loopEnd

  const outputLimiter = new Tone.Limiter(-2).toDestination()
  const masterGain = new Tone.Gain(0.8).connect(outputLimiter)
  const space = new Tone.Reverb({
    decay: 8,
    preDelay: 0.04,
    wet: 0.2,
  }).connect(masterGain)

  const bassBus = new Tone.Gain(arrangement.tracks.bass?.gain ?? 1).connect(space)
  const leadBus = new Tone.Gain(arrangement.tracks.melody?.gain ?? 1).connect(space)

  const bassSynth = createBassSynth().connect(bassBus)
  bassSynth.volume.value = arrangement.tracks.bass?.volume ?? -12

  const leadSynth = createLeadSynth().connect(leadBus)
  leadSynth.volume.value = arrangement.tracks.melody?.volume ?? -18

  const bassPart = createTrackPart(bassSynth, arrangement.tracks.bass ?? {})
  const melodyPart = createTrackPart(leadSynth, arrangement.tracks.melody ?? {})

  bassPart.loopEnd = arrangement.transport.loopEnd
  melodyPart.loopEnd = arrangement.transport.loopEnd

  bassPart.start(0)
  melodyPart.start(0)

  let ambienceNoise = null
  let ambienceFilter = null
  const noiseConfig = arrangement.ambience.noise

  if (noiseConfig?.enabled) {
    ambienceFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: noiseConfig.filterFrequency ?? 900,
      rolloff: -24,
      Q: 0.7,
    }).connect(masterGain)

    ambienceNoise = new Tone.Noise(noiseConfig.type ?? 'pink').connect(ambienceFilter)
    ambienceNoise.volume.value = noiseConfig.volume ?? -40
  }

  let started = false

  return {
    async start() {
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      if (!started) {
        started = true

        if (ambienceNoise) {
          ambienceNoise.start()
        }

        Tone.Transport.start('+0.05')
      }
    },
    dispose() {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop()
      }

      Tone.Transport.cancel(0)

      if (ambienceNoise?.state === 'started') {
        ambienceNoise.stop()
      }

      if (ambienceNoise) {
        ambienceNoise.dispose()
      }

      ambienceFilter?.dispose()
      bassPart.dispose()
      melodyPart.dispose()
      bassSynth.dispose()
      leadSynth.dispose()
      bassBus.dispose()
      leadBus.dispose()
      space.dispose()
      masterGain.dispose()
      outputLimiter.dispose()
    },
  }
}
