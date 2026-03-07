import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { defaultArrangementId, listArrangements } from './audio/arrangements/index.js'
import AmbienceAudio from './components/AmbienceAudio.jsx'
import CameraController from './components/CameraController.jsx'
import EntryOverlay from './components/EntryOverlay.jsx'
import EntryStones from './components/EntryStones.jsx'
import Lighting from './components/Lighting.jsx'
import Particles from './components/Particles.jsx'
import SkyDial from './components/SkyDial.jsx'
import Trees from './components/Trees.jsx'
import { getSystemDayProgress, sampleDayCycle, wrapDayProgress } from './dayCycle.js'
import { SceneContext } from './sceneContext.js'
import './Scene.css'

const GROUND_LEVEL = -1.28
const CAMERA_ORBIT_RADIUS = 38
const CAMERA_ORBIT_CENTER_Z = 8.4 + CAMERA_ORBIT_RADIUS
const GROUND_RING_INNER_RADIUS = 44
const GROUND_RING_OUTER_RADIUS = 78
const CAMERA_SECTION_COUNT = 12
const PHONE_HINT_MAX_SHORTEST_SIDE = 500
const ENTRY_OVERLAY_FADE_MS = 1500
const ENTRY_SHELL_STYLE = Object.freeze({
  '--sky-top': '#ffbe5d',
  '--sky-mid': '#d16a88',
  '--sky-bottom': '#a347a6',
  '--sky-glow': 'rgba(255, 225, 164, 0.52)',
  '--sky-shadow': 'rgba(145, 42, 103, 0.22)',
  '--sky-glow-x': '18%',
  '--sky-glow-y': '16%',
})

function wrapSectionIndex(index, sectionCount) {
  if (!Number.isFinite(index) || sectionCount <= 0) {
    return 0
  }

  const roundedIndex = Math.round(index)
  return ((roundedIndex % sectionCount) + sectionCount) % sectionCount
}

function Scene() {
  const mountRef = useRef(null)
  const sceneStateRef = useRef(null)
  const frameSubscribersRef = useRef(new Set())
  const clickablesRef = useRef(new Map())
  const isPlayingRef = useRef(false)
  const arrangementIds = useMemo(() => listArrangements(), [])
  const [arrangementId, setArrangementId] = useState(defaultArrangementId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [musicVolume, setMusicVolume] = useState(0.8)
  const [dayProgress, setDayProgressState] = useState(() => getSystemDayProgress())
  const [isSystemTimeEnabled, setIsSystemTimeEnabled] = useState(true)
  const [sceneToken, setSceneToken] = useState(0)
  const [sectionIndex, setSectionIndexState] = useState(0)
  const [showRotateHint, setShowRotateHint] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [showEntryOverlay, setShowEntryOverlay] = useState(true)
  const dayCycle = useMemo(() => sampleDayCycle(dayProgress), [dayProgress])

  const shellStyle = useMemo(
    () =>
      showEntryOverlay
        ? ENTRY_SHELL_STYLE
        : {
            '--sky-top': dayCycle.skyTop,
            '--sky-mid': dayCycle.skyMid,
            '--sky-bottom': dayCycle.skyBottom,
            '--sky-glow': dayCycle.skyGlow,
            '--sky-shadow': dayCycle.skyShadow,
            '--sky-glow-x': dayCycle.skyGlowX,
            '--sky-glow-y': dayCycle.skyGlowY,
          },
    [dayCycle, showEntryOverlay],
  )

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const registerFrame = useCallback((subscriber) => {
    frameSubscribersRef.current.add(subscriber)

    return () => {
      frameSubscribersRef.current.delete(subscriber)
    }
  }, [])

  const registerClickable = useCallback((object, onClick, options = undefined) => {
    if (!object || typeof onClick !== 'function') {
      return () => {}
    }

    clickablesRef.current.set(object.uuid, {
      object,
      onClick,
      cursor: typeof options?.cursor === 'string' ? options.cursor : '',
    })

    return () => {
      const current = clickablesRef.current.get(object.uuid)

      if (current?.onClick === onClick) {
        clickablesRef.current.delete(object.uuid)
      }
    }
  }, [])

  const getScene = useCallback(() => sceneStateRef.current?.scene ?? null, [])
  const getCamera = useCallback(() => sceneStateRef.current?.camera ?? null, [])
  const getRenderer = useCallback(() => sceneStateRef.current?.renderer ?? null, [])
  const getPointer = useCallback(() => sceneStateRef.current?.pointer ?? null, [])
  const getClickableObjects = useCallback(
    () => Array.from(clickablesRef.current.values(), (entry) => entry.object),
    [],
  )

  const togglePlayback = useCallback(() => {
    if (!isPlayingRef.current && Tone.context.state !== 'running') {
      void Tone.start().catch(() => undefined)
    }

    setIsPlaying((playing) => !playing)
  }, [])

  const handleEnter = useCallback(() => {
    if (hasEntered) {
      return
    }

    void Tone.start().catch(() => undefined)
    setIsPlaying(true)
    setHasEntered(true)
  }, [hasEntered])

  const handleVolumeChange = useCallback((event) => {
    const nextValue = Number(event.target.value)

    if (!Number.isFinite(nextValue)) {
      return
    }

    setMusicVolume(Math.min(1, Math.max(0, nextValue / 100)))
  }, [])

  const setDayProgress = useCallback((nextProgress) => {
    setIsSystemTimeEnabled(false)

    setDayProgressState((current) => {
      const value =
        typeof nextProgress === 'function' ? nextProgress(current) : nextProgress

      if (!Number.isFinite(value)) {
        return current
      }

      return wrapDayProgress(value)
    })
  }, [])

  useEffect(() => {
    if (!hasEntered || !showEntryOverlay) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setShowEntryOverlay(false)
    }, ENTRY_OVERLAY_FADE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [hasEntered, showEntryOverlay])

  useEffect(() => {
    if (!isSystemTimeEnabled) {
      return undefined
    }

    const syncToClock = () => {
      setDayProgressState(getSystemDayProgress())
    }

    syncToClock()
    const intervalId = window.setInterval(syncToClock, 30000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isSystemTimeEnabled])

  useEffect(() => {
    const checkRotateHint = () => {
      const viewportWidth = window.innerWidth || 0
      const viewportHeight = window.innerHeight || 0
      const shortestSide = Math.min(viewportWidth, viewportHeight)
      const isPortrait = viewportHeight > viewportWidth
      const isCoarsePointer =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(pointer: coarse)').matches
          : false
      const isLikelyPhone =
        isCoarsePointer && shortestSide > 0 && shortestSide <= PHONE_HINT_MAX_SHORTEST_SIDE

      setShowRotateHint(isLikelyPhone && isPortrait)
    }

    checkRotateHint()
    window.addEventListener('resize', checkRotateHint)
    window.addEventListener('orientationchange', checkRotateHint)

    return () => {
      window.removeEventListener('resize', checkRotateHint)
      window.removeEventListener('orientationchange', checkRotateHint)
    }
  }, [])

  const switchArrangement = useCallback((step = 1) => {
    if (arrangementIds.length < 2) {
      return
    }

    const stepValue = Math.trunc(step)

    if (!Number.isFinite(stepValue) || stepValue === 0) {
      return
    }

    setArrangementId((currentId) => {
      const currentIndex = arrangementIds.indexOf(currentId)

      if (currentIndex < 0) {
        return arrangementIds[0]
      }

      const wrappedIndex =
        ((currentIndex + stepValue) % arrangementIds.length + arrangementIds.length) %
        arrangementIds.length
      return arrangementIds[wrappedIndex]
    })
  }, [arrangementIds])

  const setSectionIndex = useCallback((nextIndex) => {
    setSectionIndexState((current) => {
      const resolved =
        typeof nextIndex === 'function' ? nextIndex(current) : nextIndex

      if (!Number.isFinite(resolved)) {
        return current
      }

      return wrapSectionIndex(resolved, CAMERA_SECTION_COUNT)
    })
  }, [])

  const stepSection = useCallback((delta) => {
    if (!Number.isFinite(delta)) {
      return
    }

    const roundedDelta = Math.round(delta)

    if (roundedDelta === 0) {
      return
    }

    setSectionIndexState((current) =>
      wrapSectionIndex(current + roundedDelta, CAMERA_SECTION_COUNT),
    )
  }, [])

  const sceneApi = useMemo(
    () => ({
      getScene,
      getCamera,
      getRenderer,
      getPointer,
      getClickableObjects,
      registerFrame,
      registerClickable,
      arrangementId,
      isPlaying,
      dayProgress,
      dayCycle,
      isSystemTimeEnabled,
      setDayProgress,
      togglePlayback,
      switchArrangement,
      sectionIndex,
      sectionCount: CAMERA_SECTION_COUNT,
      setSectionIndex,
      stepSection,
    }),
    [
      arrangementId,
      dayCycle,
      dayProgress,
      getCamera,
      getPointer,
      getRenderer,
      getScene,
      getClickableObjects,
      isSystemTimeEnabled,
      isPlaying,
      registerClickable,
      registerFrame,
      sectionIndex,
      setSectionIndex,
      setDayProgress,
      stepSection,
      switchArrangement,
      togglePlayback,
    ],
  )

  useEffect(() => {
    const mountElement = mountRef.current
    const frameSubscribers = frameSubscribersRef.current
    const clickables = clickablesRef.current

    if (!mountElement) {
      return undefined
    }

    const initialCycle = sampleDayCycle(getSystemDayProgress())
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(initialCycle.fog, initialCycle.fogDensity)

    const camera = new THREE.PerspectiveCamera(
      44,
      mountElement.clientWidth / mountElement.clientHeight,
      0.1,
      420,
    )
    camera.position.set(0, 1.7, 8.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = initialCycle.exposure
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight)
    renderer.setClearAlpha(0)
    renderer.domElement.classList.add('scene-canvas')
    mountElement.appendChild(renderer.domElement)

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initialCycle.ground),
      roughness: 0.96,
      metalness: 0.02,
      transparent: true,
      opacity: initialCycle.groundOpacity,
    })
    const ground = new THREE.Mesh(
      new THREE.RingGeometry(
        GROUND_RING_INNER_RADIUS,
        GROUND_RING_OUTER_RADIUS,
        320,
        3,
      ),
      groundMaterial,
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, GROUND_LEVEL, CAMERA_ORBIT_CENTER_Z)
    scene.add(ground)

    const pointer = new THREE.Vector2(0, 0)
    const raycastPointer = new THREE.Vector2(0, 0)
    const raycaster = new THREE.Raycaster()
    const clock = new THREE.Clock()

    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      pointer,
      groundMaterial,
    }

    const readyAnimationFrame = window.requestAnimationFrame(() => {
      setSceneToken((value) => value + 1)
    })

    const resolveClickableIntersection = (clientX, clientY) => {
      if (clickables.size === 0) {
        return null
      }

      const bounds = mountElement.getBoundingClientRect()
      raycastPointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1
      raycastPointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(raycastPointer, camera)

      const targets = Array.from(clickables.values(), (entry) => entry.object)
      const intersections = raycaster.intersectObjects(targets, true)

      for (const intersection of intersections) {
        let current = intersection.object

        while (current) {
          const entry = clickables.get(current.uuid)

          if (entry) {
            return { entry, intersection }
          }

          current = current.parent
        }
      }

      return null
    }

    const handlePointerMove = (event) => {
      const bounds = mountElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2

      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
        mountElement.style.cursor = ''
        return
      }

      const hoverResult = resolveClickableIntersection(event.clientX, event.clientY)
      mountElement.style.cursor = hoverResult?.entry.cursor ?? ''
    }

    const handlePointerLeave = () => {
      pointer.set(0, 0)
      mountElement.style.cursor = ''
    }

    const handlePointerDown = (event) => {
      const clickResult = resolveClickableIntersection(event.clientX, event.clientY)

      if (clickResult) {
        clickResult.entry.onClick(clickResult.intersection)
      }
    }

    const handleResize = () => {
      const width = mountElement.clientWidth
      const height = mountElement.clientHeight

      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(mountElement)

    mountElement.addEventListener('pointermove', handlePointerMove)
    mountElement.addEventListener('pointerleave', handlePointerLeave)
    mountElement.addEventListener('pointerdown', handlePointerDown)

    let rafId = 0
    const animate = () => {
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime

      frameSubscribers.forEach((subscriber) => {
        subscriber({ delta, elapsed })
      })

      renderer.render(scene, camera)
      rafId = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(rafId)
      window.cancelAnimationFrame(readyAnimationFrame)
      resizeObserver.disconnect()
      mountElement.removeEventListener('pointermove', handlePointerMove)
      mountElement.removeEventListener('pointerleave', handlePointerLeave)
      mountElement.removeEventListener('pointerdown', handlePointerDown)
      mountElement.style.cursor = ''

      scene.remove(ground)
      ground.geometry.dispose()
      groundMaterial.dispose()

      renderer.dispose()
      mountElement.removeChild(renderer.domElement)

      sceneStateRef.current = null
      frameSubscribers.clear()
      clickables.clear()
    }
  }, [])

  useEffect(() => {
    const state = sceneStateRef.current

    if (!state) {
      return
    }

    const { scene, renderer, groundMaterial } = state
    const fog = scene.fog
    const isEntryVisualState = showEntryOverlay

    if (fog) {
      fog.color.set(dayCycle.fog)
      fog.density = isEntryVisualState ? dayCycle.fogDensity * 0.18 : dayCycle.fogDensity
    }

    groundMaterial.color.set(dayCycle.ground)
    groundMaterial.opacity = dayCycle.groundOpacity
    renderer.toneMappingExposure = isEntryVisualState
      ? dayCycle.exposure + 0.18
      : dayCycle.exposure
  }, [dayCycle, showEntryOverlay])

  return (
    <div className="scene-shell" style={shellStyle}>
      <div className="scene-mount" ref={mountRef} />
      <div className="scene-ui">
        {showEntryOverlay ? (
          <EntryOverlay onEnter={handleEnter} isExiting={hasEntered} />
        ) : null}
        {hasEntered ? (
          <div className="scene-audio-controls">
            <button
              type="button"
              className="scene-audio-button"
              onClick={togglePlayback}
              aria-pressed={isPlaying}
            >
              {isPlaying ? 'Pause Music' : 'Play Music'}
            </button>
            <input
              id="scene-volume-slider"
              className="scene-volume-slider"
              type="range"
              min="0"
              max="100"
              value={Math.round(musicVolume * 100)}
              onChange={handleVolumeChange}
              aria-label="Music volume"
            />
          </div>
        ) : null}
        {hasEntered && showRotateHint ? (
          <div className="scene-rotate-hint" aria-hidden="true">
            <svg
              className="scene-rotate-hint-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="8" width="12" height="8" rx="2" />
              <path d="M8.2 4.8a8 8 0 0 1 10.4 2.6" />
              <path d="M18.2 7.4V3.8l-3.2.8" />
            </svg>
          </div>
        ) : null}
      </div>
      <SceneContext.Provider value={sceneApi}>
        {sceneToken > 0 ? (
          <Fragment key={sceneToken}>
            <Lighting />
            <SkyDial />
            <Particles />
            <EntryStones />
            <Trees />
            <CameraController introStarted={hasEntered} />
            <AmbienceAudio volume={musicVolume} />
          </Fragment>
        ) : null}
      </SceneContext.Provider>
    </div>
  )
}

export default Scene
