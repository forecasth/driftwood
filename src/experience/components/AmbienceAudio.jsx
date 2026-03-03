import { useEffect } from 'react'
import { getArrangement } from '../audio/arrangements/index.js'
import { createAudioEngine } from '../audio/engine.js'

function AmbienceAudio() {
  useEffect(() => {
    const arrangement = getArrangement()

    if (!arrangement) {
      return undefined
    }

    const engine = createAudioEngine(arrangement)
    let disposed = false
    let started = false

    const removeGestureListeners = () => {
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }

    // Browsers require a user gesture before audio can start.
    const handleGesture = async () => {
      if (started || disposed) {
        return
      }

      started = true

      try {
        await engine.start()
        removeGestureListeners()
      } catch {
        started = false
      }
    }

    window.addEventListener('pointerdown', handleGesture, { passive: true })
    window.addEventListener('keydown', handleGesture)

    return () => {
      disposed = true
      removeGestureListeners()
      engine.dispose()
    }
  }, [])

  return null
}

export default AmbienceAudio
