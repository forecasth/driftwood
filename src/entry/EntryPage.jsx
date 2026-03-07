import { useEffect, useRef } from 'react'
import './EntryPage.css'

const MIN_PARTICLE_COUNT = 52
const MAX_PARTICLE_COUNT = 142
const PARTICLE_DENSITY = 0.000045
const PARTICLE_WRAP_PADDING = 52

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha
}

function createAmbientParticle(width, height, spawnAtBottom = false) {
  const hue = lerp(34, 322, Math.random())
  const saturation = randomRange(80, 100)
  const lightness = randomRange(62, 78)

  return {
    baseX: randomRange(-PARTICLE_WRAP_PADDING, width + PARTICLE_WRAP_PADDING),
    y: spawnAtBottom
      ? height + randomRange(0, height * 0.28)
      : randomRange(-PARTICLE_WRAP_PADDING, height + PARTICLE_WRAP_PADDING),
    driftX: randomRange(-10, 10),
    driftY: randomRange(-28, -10),
    waveAmplitude: randomRange(8, 34),
    waveSpeed: randomRange(0.2, 0.78),
    wavePhase: randomRange(0, Math.PI * 2),
    twinkleSpeed: randomRange(0.9, 2.2),
    twinklePhase: randomRange(0, Math.PI * 2),
    radius: randomRange(1, 3.6),
    alpha: randomRange(0.2, 0.5),
    hue,
    saturation,
    lightness,
  }
}

function EntryPage({ onEnter }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return undefined
    }

    let width = 0
    let height = 0
    let dpr = 1
    let frameId = 0
    let lastTime = 0
    let reducedMotion = false
    const particles = []

    const hydrateParticles = () => {
      const targetCount = Math.max(
        MIN_PARTICLE_COUNT,
        Math.min(MAX_PARTICLE_COUNT, Math.round(width * height * PARTICLE_DENSITY)),
      )

      while (particles.length < targetCount) {
        particles.push(createAmbientParticle(width, height))
      }

      while (particles.length > targetCount) {
        particles.pop()
      }
    }

    const resizeCanvas = () => {
      const nextWidth = Math.max(1, canvas.clientWidth)
      const nextHeight = Math.max(1, canvas.clientHeight)
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2)

      width = nextWidth
      height = nextHeight
      dpr = nextDpr

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      hydrateParticles()
    }

    const drawParticles = (elapsed, deltaSeconds) => {
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      particles.forEach((particle) => {
        if (!reducedMotion) {
          particle.baseX += particle.driftX * deltaSeconds
          particle.y += particle.driftY * deltaSeconds

          if (particle.baseX > width + PARTICLE_WRAP_PADDING) {
            particle.baseX = -PARTICLE_WRAP_PADDING
          }

          if (particle.baseX < -PARTICLE_WRAP_PADDING) {
            particle.baseX = width + PARTICLE_WRAP_PADDING
          }

          if (particle.y < -PARTICLE_WRAP_PADDING) {
            const nextParticle = createAmbientParticle(width, height, true)
            Object.assign(particle, nextParticle)
          }
        }

        const waveOffset = Math.sin(elapsed * particle.waveSpeed + particle.wavePhase)
        const twinkle =
          0.74 + Math.sin(elapsed * particle.twinkleSpeed + particle.twinklePhase) * 0.26
        const drawX = particle.baseX + waveOffset * particle.waveAmplitude
        const drawY = particle.y
        const glowRadius = particle.radius * (3.8 + twinkle * 2.1)
        const coreAlpha = Math.min(1, particle.alpha * (0.68 + twinkle * 0.42))
        const glowAlpha = coreAlpha * 0.62

        const gradient = context.createRadialGradient(
          drawX,
          drawY,
          0,
          drawX,
          drawY,
          glowRadius,
        )
        gradient.addColorStop(
          0,
          `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness + 12}%, ${coreAlpha})`,
        )
        gradient.addColorStop(
          0.42,
          `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${glowAlpha})`,
        )
        gradient.addColorStop(
          1,
          `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness - 6}%, 0)`,
        )

        context.fillStyle = gradient
        context.beginPath()
        context.arc(drawX, drawY, glowRadius, 0, Math.PI * 2)
        context.fill()
      })

      context.globalCompositeOperation = 'source-over'
    }

    const render = (timestamp) => {
      const elapsed = timestamp * 0.001
      const deltaSeconds = Math.min((timestamp - lastTime) * 0.001, 0.05)
      lastTime = timestamp
      drawParticles(elapsed, deltaSeconds)

      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(render)
      }
    }

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    reducedMotion = motionQuery?.matches ?? false

    const handleMotionPreferenceChange = (event) => {
      reducedMotion = event.matches

      if (reducedMotion) {
        if (frameId) {
          window.cancelAnimationFrame(frameId)
          frameId = 0
        }

        drawParticles(0, 0)
      } else if (!frameId) {
        lastTime = performance.now()
        frameId = window.requestAnimationFrame(render)
      }
    }

    resizeCanvas()
    drawParticles(0, 0)

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
      drawParticles(0, 0)
    })
    resizeObserver.observe(canvas)

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', handleMotionPreferenceChange)
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(handleMotionPreferenceChange)
      }
    }

    if (!reducedMotion) {
      lastTime = performance.now()
      frameId = window.requestAnimationFrame(render)
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      resizeObserver.disconnect()

      if (motionQuery) {
        if (typeof motionQuery.removeEventListener === 'function') {
          motionQuery.removeEventListener('change', handleMotionPreferenceChange)
        } else if (typeof motionQuery.removeListener === 'function') {
          motionQuery.removeListener(handleMotionPreferenceChange)
        }
      }
    }
  }, [])

  return (
    <section className="entry-page">
      <canvas
        ref={canvasRef}
        className="entry-page__particles"
        aria-hidden="true"
      />
      <div className="entry-page__veil" aria-hidden="true" />
      <div className="entry-page__content">
        <h1 className="entry-page__title">Driftwood</h1>
        <button
          type="button"
          className="entry-page__enter-button"
          onClick={onEnter}
        >
          Enter Driftwood
        </button>
      </div>
    </section>
  )
}

export default EntryPage
