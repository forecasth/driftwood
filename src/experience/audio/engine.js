import * as Tone from 'tone'

const DEFAULT_BASS_OPTIONS = Object.freeze({
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

const DEFAULT_LEAD_OPTIONS = Object.freeze({
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

const DEFAULT_WHALE_OPTIONS = Object.freeze({
  oscillator: {
    type: 'sine',
  },
  filter: {
    type: 'lowpass',
    frequency: 1300,
    rolloff: -24,
    Q: 1.1,
  },
  envelope: {
    attack: 1.4,
    decay: 0.8,
    sustain: 0.78,
    release: 4.8,
  },
  filterEnvelope: {
    attack: 1.6,
    decay: 0.9,
    sustain: 0.72,
    release: 4.2,
    baseFrequency: 260,
    octaves: 3.1,
  },
  portamento: 0.42,
})

function mergeInstrumentOptions(defaults, overrides = {}) {
  const merged = {
    ...defaults,
    ...overrides,
  }

  if (defaults.oscillator || overrides.oscillator) {
    merged.oscillator = {
      ...(defaults.oscillator ?? {}),
      ...(overrides.oscillator ?? {}),
    }
  }

  if (defaults.filter || overrides.filter) {
    merged.filter = {
      ...(defaults.filter ?? {}),
      ...(overrides.filter ?? {}),
    }
  }

  if (defaults.envelope || overrides.envelope) {
    merged.envelope = {
      ...(defaults.envelope ?? {}),
      ...(overrides.envelope ?? {}),
    }
  }

  if (defaults.filterEnvelope || overrides.filterEnvelope) {
    merged.filterEnvelope = {
      ...(defaults.filterEnvelope ?? {}),
      ...(overrides.filterEnvelope ?? {}),
    }
  }

  return merged
}

function createBassSynth(overrides = {}) {
  return new Tone.MonoSynth(
    mergeInstrumentOptions(DEFAULT_BASS_OPTIONS, overrides),
  )
}

function createLeadSynth(overrides = {}) {
  return new Tone.PolySynth(
    Tone.Synth,
    mergeInstrumentOptions(DEFAULT_LEAD_OPTIONS, overrides),
  )
}

function createWhaleSynth(overrides = {}) {
  return new Tone.MonoSynth(
    mergeInstrumentOptions(DEFAULT_WHALE_OPTIONS, overrides),
  )
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

function clampVolume(value) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(1, Math.max(0, value))
}

export function createAudioEngine(arrangement, options = {}) {
  const initialVolume = clampVolume(options.volume ?? 0.8)

  Tone.Transport.cancel(0)
  Tone.Transport.bpm.value = arrangement.transport.bpm
  Tone.Transport.timeSignature = arrangement.transport.timeSignature
  Tone.Transport.loop = arrangement.transport.loop
  Tone.Transport.loopEnd = arrangement.transport.loopEnd

  const outputLimiter = new Tone.Limiter(-2).toDestination()
  const masterGain = new Tone.Gain(initialVolume).connect(outputLimiter)
  const space = new Tone.Reverb({
    decay: 8,
    preDelay: 0.04,
    wet: 0.2,
  }).connect(masterGain)

  const bassBus = new Tone.Gain(arrangement.tracks.bass?.gain ?? 1).connect(space)
  const leadBus = new Tone.Gain(arrangement.tracks.melody?.gain ?? 1).connect(space)
  const whaleBus = new Tone.Gain(arrangement.tracks.whale?.gain ?? 1).connect(space)
  const whaleEcho = new Tone.FeedbackDelay({
    delayTime: '8n.',
    feedback: 0.38,
    wet: 0.28,
  }).connect(space)
  whaleBus.connect(whaleEcho)

  const bassSynth = createBassSynth(arrangement.instruments?.bass).connect(bassBus)
  bassSynth.volume.value = arrangement.tracks.bass?.volume ?? -12

  const leadSynth = createLeadSynth(arrangement.instruments?.melody).connect(leadBus)
  leadSynth.volume.value = arrangement.tracks.melody?.volume ?? -18

  const hasWhaleTrack = Boolean(arrangement.tracks.whale)
  const whaleSynth = hasWhaleTrack
    ? createWhaleSynth(arrangement.instruments?.whale).connect(whaleBus)
    : null

  if (whaleSynth) {
    whaleSynth.volume.value = arrangement.tracks.whale?.volume ?? -24
  }

  const bassPart = createTrackPart(bassSynth, arrangement.tracks.bass ?? {})
  const melodyPart = createTrackPart(leadSynth, arrangement.tracks.melody ?? {})
  const whalePart =
    whaleSynth && arrangement.tracks.whale
      ? createTrackPart(whaleSynth, arrangement.tracks.whale)
      : null

  bassPart.loopEnd = arrangement.transport.loopEnd
  melodyPart.loopEnd = arrangement.transport.loopEnd
  if (whalePart) {
    whalePart.loopEnd = arrangement.transport.loopEnd
  }

  bassPart.start(0)
  melodyPart.start(0)
  whalePart?.start(0)

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

  let ambienceStarted = false

  return {
    async start() {
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      if (ambienceNoise && !ambienceStarted) {
        ambienceNoise.start()
        ambienceStarted = true
      }

      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start('+0.03')
      }
    },
    pause() {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause()
      }
    },
    setVolume(nextVolume) {
      const volume = clampVolume(nextVolume)
      masterGain.gain.rampTo(volume, 0.08)
    },
    dispose() {
      if (
        Tone.Transport.state === 'started' ||
        Tone.Transport.state === 'paused'
      ) {
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
      whalePart?.dispose()
      bassSynth.dispose()
      leadSynth.dispose()
      whaleSynth?.dispose()
      bassBus.dispose()
      leadBus.dispose()
      whaleBus.dispose()
      whaleEcho.dispose()
      space.dispose()
      masterGain.dispose()
      outputLimiter.dispose()
    },
  }
}
