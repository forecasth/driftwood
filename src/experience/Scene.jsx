import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import * as Tone from 'tone'
import { defaultArrangementId, listArrangements } from './audio/arrangements/index.js'
import AmbienceAudio from './components/AmbienceAudio.jsx'
import CameraController from './components/CameraController.jsx'
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
const GROUND_RING_INNER_RADIUS = 24
const GROUND_RING_OUTER_RADIUS = 78

function Scene() {
  const mountRef = useRef(null)
  const sceneStateRef = useRef(null)
  const frameSubscribersRef = useRef(new Set())
  const clickablesRef = useRef(new Map())
  const isPlayingRef = useRef(false)
  const arrangementIds = useMemo(() => listArrangements(), [])
  const [arrangementId, setArrangementId] = useState(defaultArrangementId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dayProgress, setDayProgressState] = useState(() => getSystemDayProgress())
  const [isSystemTimeEnabled, setIsSystemTimeEnabled] = useState(true)
  const [sceneToken, setSceneToken] = useState(0)
  const dayCycle = useMemo(() => sampleDayCycle(dayProgress), [dayProgress])

  const shellStyle = useMemo(
    () => ({
      '--sky-top': dayCycle.skyTop,
      '--sky-mid': dayCycle.skyMid,
      '--sky-bottom': dayCycle.skyBottom,
      '--sky-glow': dayCycle.skyGlow,
      '--sky-shadow': dayCycle.skyShadow,
      '--sky-glow-x': dayCycle.skyGlowX,
      '--sky-glow-y': dayCycle.skyGlowY,
    }),
    [dayCycle],
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
      setDayProgress,
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
      120,
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

    const handlePointerMove = (event) => {
      const bounds = mountElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2
    }

    const handlePointerLeave = () => {
      pointer.set(0, 0)
    }

    const handlePointerDown = (event) => {
      if (clickables.size === 0) {
        return
      }

      const bounds = mountElement.getBoundingClientRect()
      raycastPointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      raycastPointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(raycastPointer, camera)

      const targets = Array.from(clickables.values(), (entry) => entry.object)
      const intersections = raycaster.intersectObjects(targets, true)

      for (const intersection of intersections) {
        let current = intersection.object

        while (current) {
          const entry = clickables.get(current.uuid)

          if (entry) {
            entry.onClick(intersection)
            return
          }

          current = current.parent
        }
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

    if (fog) {
      fog.color.set(dayCycle.fog)
      fog.density = dayCycle.fogDensity
    }

    groundMaterial.color.set(dayCycle.ground)
    groundMaterial.opacity = dayCycle.groundOpacity
    renderer.toneMappingExposure = dayCycle.exposure
  }, [dayCycle])

  return (
    <div className="scene-shell" style={shellStyle}>
      <div className="scene-mount" ref={mountRef} />
      <SceneContext.Provider value={sceneApi}>
        {sceneToken > 0 ? (
          <Fragment key={sceneToken}>
            <Lighting />
            <SkyDial />
            <Particles />
            <EntryStones />
            <Trees />
            <CameraController />
            <AmbienceAudio />
          </Fragment>
        ) : null}
      </SceneContext.Provider>
    </div>
  )
}

export default Scene
