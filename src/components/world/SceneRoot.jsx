import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { defaultArrangementId, listArrangements } from '../../experience/audio/arrangements/index.js'
import { getSystemDayProgress, sampleDayCycle, wrapDayProgress } from '../../experience/dayCycle.js'
import AmbienceAudio from '../../experience/components/AmbienceAudio.jsx'
import EntryStones from '../../experience/components/EntryStones.jsx'
import SkyDial from '../../experience/components/SkyDial.jsx'
import { worldConfig } from '../../data/worldConfig.js'
import { getSceneConfig } from '../../scenes/common/sceneRegistry.js'
import { getShellPalette } from '../../scenes/common/sceneUtils.js'
import CameraController from '../camera/CameraController.jsx'
import FogController from '../environment/FogController.jsx'
import GroundPlane from '../environment/GroundPlane.jsx'
import LightingRig from '../environment/LightingRig.jsx'
import ParticleField from '../environment/ParticleField.jsx'
import { SceneContext } from './sceneContext.js'
import EntryGrove from './EntryGrove.jsx'
import RingWorld from './RingWorld.jsx'
import './SceneRoot.css'

function resolveRegisteredEntry(intersections, registry) {
  for (const intersection of intersections) {
    let current = intersection.object

    while (current) {
      const entry = registry.get(current.uuid)

      if (entry) {
        return entry
      }

      current = current.parent
    }
  }

  return null
}

function wrapSectionIndex(index) {
  return ((Math.round(index) % worldConfig.sectionCount) + worldConfig.sectionCount) % worldConfig.sectionCount
}

function SceneRoot() {
  const mountRef = useRef(null)
  const sceneStateRef = useRef(null)
  const frameSubscribersRef = useRef(new Set())
  const clickablesRef = useRef(new Map())
  const hoverTargetsRef = useRef(new Map())
  const pointerInsideRef = useRef(false)
  const hoveredSectionIndexRef = useRef(null)
  const sectionIndexRef = useRef(0)
  const isPlayingRef = useRef(false)
  const arrangementIds = useMemo(() => listArrangements(), [])
  const [arrangementId, setArrangementId] = useState(defaultArrangementId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dayProgress, setDayProgressState] = useState(() => getSystemDayProgress())
  const [isSystemTimeEnabled, setIsSystemTimeEnabled] = useState(true)
  const [sceneToken, setSceneToken] = useState(0)
  const [sectionIndex, setSectionIndexState] = useState(0)
  const [hoveredSectionIndex, setHoveredSectionIndexState] = useState(null)
  const dayCycle = useMemo(() => sampleDayCycle(dayProgress), [dayProgress])
  const activeSceneConfig = useMemo(() => getSceneConfig(sectionIndex), [sectionIndex])

  const applyHoveredSectionIndex = useCallback((nextHoveredSectionIndex) => {
    if (hoveredSectionIndexRef.current === nextHoveredSectionIndex) {
      return
    }

    hoveredSectionIndexRef.current = nextHoveredSectionIndex
    setHoveredSectionIndexState(nextHoveredSectionIndex)
  }, [])

  const shellPalette = useMemo(
    () => getShellPalette(activeSceneConfig, dayCycle),
    [activeSceneConfig, dayCycle],
  )

  const shellStyle = useMemo(
    () => ({
      '--sky-top': shellPalette.skyTop,
      '--sky-mid': shellPalette.skyMid,
      '--sky-bottom': shellPalette.skyBottom,
      '--sky-glow': shellPalette.skyGlow,
      '--sky-shadow': shellPalette.skyShadow,
      '--sky-glow-x': shellPalette.skyGlowX,
      '--sky-glow-y': shellPalette.skyGlowY,
    }),
    [shellPalette],
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

  const registerClickable = useCallback((object, onClick) => {
    if (!object || typeof onClick !== 'function') {
      return () => {}
    }

    clickablesRef.current.set(object.uuid, { object, onClick })

    return () => {
      const current = clickablesRef.current.get(object.uuid)

      if (current?.onClick === onClick) {
        clickablesRef.current.delete(object.uuid)
      }
    }
  }, [])

  const registerHoverTarget = useCallback((object, metadata) => {
    if (!object) {
      return () => {}
    }

    hoverTargetsRef.current.set(object.uuid, { object, ...metadata })

    return () => {
      hoverTargetsRef.current.delete(object.uuid)
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

  const getSectionState = useCallback(
    () => ({
      activeSectionIndex: sectionIndexRef.current,
      hoveredSectionIndex: hoveredSectionIndexRef.current,
      focusedSectionIndex:
        hoveredSectionIndexRef.current ?? sectionIndexRef.current,
      sectionCount: worldConfig.sectionCount,
    }),
    [],
  )

  const togglePlayback = useCallback(() => {
    if (!isPlayingRef.current && Tone.context.state !== 'running') {
      void Tone.start().catch(() => undefined)
    }

    setIsPlaying((playing) => !playing)
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

  const switchArrangement = useCallback(() => {
    if (arrangementIds.length < 2) {
      return
    }

    setArrangementId((currentId) => {
      const currentIndex = arrangementIds.indexOf(currentId)

      if (currentIndex < 0) {
        return arrangementIds[0]
      }

      return arrangementIds[(currentIndex + 1) % arrangementIds.length]
    })
  }, [arrangementIds])

  const setSectionIndex = useCallback((nextIndex) => {
    setSectionIndexState((current) => {
      const resolved =
        typeof nextIndex === 'function' ? nextIndex(current) : nextIndex

      if (!Number.isFinite(resolved)) {
        return current
      }

      const wrappedIndex = wrapSectionIndex(resolved)
      sectionIndexRef.current = wrappedIndex
      return wrappedIndex
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

    setSectionIndexState((current) => {
      const wrappedIndex = wrapSectionIndex(current + roundedDelta)
      sectionIndexRef.current = wrappedIndex
      return wrappedIndex
    })
  }, [])

  const sceneApi = useMemo(
    () => ({
      getScene,
      getCamera,
      getRenderer,
      getPointer,
      getClickableObjects,
      getSectionState,
      registerFrame,
      registerClickable,
      registerHoverTarget,
      arrangementId,
      isPlaying,
      dayProgress,
      dayCycle,
      isSystemTimeEnabled,
      setDayProgress,
      togglePlayback,
      switchArrangement,
      sectionIndex,
      hoveredSectionIndex,
      activeSceneConfig,
      sectionCount: worldConfig.sectionCount,
      setSectionIndex,
      stepSection,
    }),
    [
      activeSceneConfig,
      arrangementId,
      dayCycle,
      dayProgress,
      getCamera,
      getClickableObjects,
      getPointer,
      getRenderer,
      getScene,
      getSectionState,
      hoveredSectionIndex,
      isPlaying,
      isSystemTimeEnabled,
      registerClickable,
      registerFrame,
      registerHoverTarget,
      sectionIndex,
      setDayProgress,
      setSectionIndex,
      stepSection,
      switchArrangement,
      togglePlayback,
    ],
  )

  useEffect(() => {
    const mountElement = mountRef.current
    const frameSubscribers = frameSubscribersRef.current
    const clickables = clickablesRef.current
    const hoverTargets = hoverTargetsRef.current

    if (!mountElement) {
      return undefined
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      44,
      mountElement.clientWidth / mountElement.clientHeight,
      0.1,
      160,
    )
    camera.position.set(
      worldConfig.camera.basePosition.x,
      worldConfig.camera.basePosition.y,
      worldConfig.camera.basePosition.z,
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = getSceneConfig(sectionIndexRef.current).lighting.exposure
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight)
    renderer.setClearAlpha(0)
    renderer.domElement.classList.add('scene-canvas')
    mountElement.appendChild(renderer.domElement)

    const pointer = new THREE.Vector2(0, 0)
    const hoverRayPointer = new THREE.Vector2(0, 0)
    const clickRayPointer = new THREE.Vector2(0, 0)
    const hoverRaycaster = new THREE.Raycaster()
    const clickRaycaster = new THREE.Raycaster()
    const clock = new THREE.Clock()

    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      pointer,
    }

    const readyAnimationFrame = window.requestAnimationFrame(() => {
      setSceneToken((value) => value + 1)
    })

    const handlePointerMove = (event) => {
      const bounds = mountElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
      pointerInsideRef.current = true
    }

    const handlePointerLeave = () => {
      pointer.set(0, 0)
      pointerInsideRef.current = false
      applyHoveredSectionIndex(null)
    }

    const handlePointerDown = (event) => {
      if (clickables.size === 0) {
        return
      }

      const bounds = mountElement.getBoundingClientRect()
      clickRayPointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      clickRayPointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      clickRaycaster.setFromCamera(clickRayPointer, camera)

      const targets = Array.from(clickables.values(), (entry) => entry.object)
      const intersections = clickRaycaster.intersectObjects(targets, true)
      const entry = resolveRegisteredEntry(intersections, clickables)
      entry?.onClick?.(intersections[0])
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

      if (pointerInsideRef.current && hoverTargets.size > 0) {
        hoverRayPointer.set(pointer.x, -pointer.y)
        hoverRaycaster.setFromCamera(hoverRayPointer, camera)
        const targets = Array.from(hoverTargets.values(), (entry) => entry.object)
        const intersections = hoverRaycaster.intersectObjects(targets, true)
        const hoverEntry = resolveRegisteredEntry(intersections, hoverTargets)
        applyHoveredSectionIndex(hoverEntry?.segmentIndex ?? null)
      } else if (hoveredSectionIndexRef.current !== null) {
        applyHoveredSectionIndex(null)
      }

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

      renderer.dispose()

      if (mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement)
      }

      sceneStateRef.current = null
      frameSubscribers.clear()
      clickables.clear()
      hoverTargets.clear()
      pointerInsideRef.current = false
      hoveredSectionIndexRef.current = null
    }
  }, [applyHoveredSectionIndex])

  return (
    <div className="scene-shell" style={shellStyle}>
      <div className="scene-mount" ref={mountRef} />
      <SceneContext.Provider value={sceneApi}>
        {sceneToken > 0 ? (
          <Fragment key={sceneToken}>
            <FogController sceneConfig={activeSceneConfig} />
            <LightingRig sceneConfig={activeSceneConfig} />
            <GroundPlane sceneConfig={activeSceneConfig} />
            <ParticleField sceneConfig={activeSceneConfig} />
            <RingWorld />
            <EntryStones />
            <EntryGrove />
            <SkyDial />
            <CameraController />
            <AmbienceAudio />
          </Fragment>
        ) : null}
      </SceneContext.Provider>
    </div>
  )
}

export default SceneRoot
