import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import AmbienceAudio from './components/AmbienceAudio.jsx'
import CameraController from './components/CameraController.jsx'
import Lighting from './components/Lighting.jsx'
import Particles from './components/Particles.jsx'
import { SceneContext } from './sceneContext.js'
import { palette } from './theme.js'
import './Scene.css'

function Scene() {
  const mountRef = useRef(null)
  const sceneStateRef = useRef(null)
  const frameSubscribersRef = useRef(new Set())
  const [sceneToken, setSceneToken] = useState(0)

  const registerFrame = useCallback((subscriber) => {
    frameSubscribersRef.current.add(subscriber)

    return () => {
      frameSubscribersRef.current.delete(subscriber)
    }
  }, [])

  const sceneApi = useMemo(
    () => ({
      getScene: () => sceneStateRef.current?.scene ?? null,
      getCamera: () => sceneStateRef.current?.camera ?? null,
      getRenderer: () => sceneStateRef.current?.renderer ?? null,
      getPointer: () => sceneStateRef.current?.pointer ?? null,
      registerFrame,
    }),
    [registerFrame],
  )

  useEffect(() => {
    const mountElement = mountRef.current
    const frameSubscribers = frameSubscribersRef.current

    if (!mountElement) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(palette.fog, 0.032)

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
    renderer.toneMappingExposure = 0.56
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setSize(mountElement.clientWidth, mountElement.clientHeight)
    renderer.setClearAlpha(0)
    renderer.domElement.classList.add('scene-canvas')
    mountElement.appendChild(renderer.domElement)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120, 1, 1),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.ground),
        roughness: 0.96,
        metalness: 0.02,
        transparent: true,
        opacity: 0.88,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.28
    scene.add(ground)

    const pointer = new THREE.Vector2(0, 0)
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
    }

    const handlePointerLeave = () => {
      pointer.set(0, 0)
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

      scene.remove(ground)
      ground.geometry.dispose()
      ground.material.dispose()

      renderer.dispose()
      mountElement.removeChild(renderer.domElement)

      sceneStateRef.current = null
      frameSubscribers.clear()
    }
  }, [])

  return (
    <div className="scene-shell">
      <div className="scene-mount" ref={mountRef} />
      <SceneContext.Provider value={sceneApi}>
        {sceneToken > 0 ? (
          <Fragment key={sceneToken}>
            <Lighting />
            <Particles />
            <CameraController />
            <AmbienceAudio />
          </Fragment>
        ) : null}
      </SceneContext.Provider>
    </div>
  )
}

export default Scene
