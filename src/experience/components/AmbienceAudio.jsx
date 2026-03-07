import { useEffect, useRef } from 'react'
import { getArrangement } from '../audio/arrangements/index.js'
import { createAudioEngine } from '../audio/engine.js'
import { useSceneContext } from '../sceneContext.js'

function AmbienceAudio({ volume = 0.8 }) {
  const { arrangementId, isPlaying } = useSceneContext()
  const engineRef = useRef(null)

  useEffect(() => {
    const arrangement = getArrangement(arrangementId)

    if (!arrangement) {
      return undefined
    }

    const engine = createAudioEngine(arrangement)
    engineRef.current = engine

    return () => {
      if (engineRef.current === engine) {
        engineRef.current = null
      }
      engine.dispose()
    }
  }, [arrangementId])

  useEffect(() => {
    const engine = engineRef.current

    if (!engine) {
      return undefined
    }

    if (isPlaying) {
      engine.start().catch(() => undefined)
    } else {
      engine.pause()
    }

    return undefined
  }, [arrangementId, isPlaying])

  useEffect(() => {
    const engine = engineRef.current

    if (!engine) {
      return undefined
    }

    engine.setVolume(volume)
    return undefined
  }, [arrangementId, volume])

  return null
}

export default AmbienceAudio
