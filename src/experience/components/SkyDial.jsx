import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  progressToSunAngle,
  shortestAngleDelta,
  sunAngleToProgress,
} from '../dayCycle.js'
import { useSceneContext } from '../sceneContext.js'

const ORBIT_RADIUS = 17
const ORBIT_CENTER = new THREE.Vector3(0, -7.8, -24)
const BODY_OFFSETS = Object.freeze({
  sun: 0,
  moon: (Math.PI * 2) / 3,
  planet: (Math.PI * 4) / 3,
})

const raycastPointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const orbitPlane = new THREE.Plane()
const orbitPlaneNormal = new THREE.Vector3(0, 0, 1)
const worldIntersection = new THREE.Vector3()
const localIntersection = new THREE.Vector3()

function findDialBody(object) {
  let current = object

  while (current) {
    if (typeof current.userData?.dialBodyOffset === 'number') {
      return current
    }

    current = current.parent
  }

  return null
}

function setBodyPosition(body, orbitAngle, offset) {
  if (!body) {
    return
  }

  const angle = orbitAngle + offset
  body.position.set(Math.cos(angle) * ORBIT_RADIUS, Math.sin(angle) * ORBIT_RADIUS, 0)
}

function setDialBodies(bodyMap, orbitAngle) {
  setBodyPosition(bodyMap.get('sun'), orbitAngle, BODY_OFFSETS.sun)
  setBodyPosition(bodyMap.get('moon'), orbitAngle, BODY_OFFSETS.moon)
  setBodyPosition(bodyMap.get('planet'), orbitAngle, BODY_OFFSETS.planet)
}

function setRayFromPointer(event, element, camera) {
  const bounds = element.getBoundingClientRect()

  raycastPointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
  raycastPointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
  raycaster.setFromCamera(raycastPointer, camera)
}

function getPointerOrbitAngle(event, element, camera, orbitGroup) {
  setRayFromPointer(event, element, camera)
  orbitPlane.set(orbitPlaneNormal, -orbitGroup.position.z)

  if (!raycaster.ray.intersectPlane(orbitPlane, worldIntersection)) {
    return null
  }

  localIntersection.copy(worldIntersection)
  orbitGroup.worldToLocal(localIntersection)
  return Math.atan2(localIntersection.y, localIntersection.x)
}

function SkyDial() {
  const {
    getScene,
    getCamera,
    getRenderer,
    dayProgress,
    dayCycle,
    setDayProgress,
  } = useSceneContext()

  const orbitGroupRef = useRef(null)
  const orbitMaterialRef = useRef(null)
  const bodyMapRef = useRef(new Map())
  const materialMapRef = useRef(new Map())
  const orbitAngleRef = useRef(progressToSunAngle(dayProgress))
  const dragStateRef = useRef(null)

  useEffect(() => {
    if (!orbitGroupRef.current) {
      return
    }

    orbitAngleRef.current = progressToSunAngle(dayProgress)
    setDialBodies(bodyMapRef.current, orbitAngleRef.current)
  }, [dayProgress])

  useEffect(() => {
    const orbitMaterial = orbitMaterialRef.current
    const materials = materialMapRef.current

    if (!orbitMaterial || materials.size === 0) {
      return
    }

    const daylight = dayCycle.daylight
    const sunMaterial = materials.get('sun')
    const moonMaterial = materials.get('moon')
    const planetMaterial = materials.get('planet')

    orbitMaterial.opacity = 0.14 + daylight * 0.24
    sunMaterial.emissiveIntensity = 0.34 + daylight * 0.72
    moonMaterial.emissiveIntensity = 0.16 + (1 - daylight) * 0.52
    planetMaterial.emissiveIntensity = 0.18 + Math.abs(daylight - 0.5) * 0.34
  }, [dayCycle.daylight])

  useEffect(() => {
    const scene = getScene()
    const camera = getCamera()
    const renderer = getRenderer()

    if (!scene || !camera || !renderer) {
      return undefined
    }

    const orbitGroup = new THREE.Group()
    orbitGroup.name = 'sky-dial'
    orbitGroup.position.copy(ORBIT_CENTER)
    scene.add(orbitGroup)
    orbitGroupRef.current = orbitGroup

    const orbitMesh = new THREE.Mesh(
      new THREE.TorusGeometry(ORBIT_RADIUS, 0.05, 8, 180),
      new THREE.MeshBasicMaterial({
        color: '#9cb0cf',
        transparent: true,
        opacity: 0.22,
      }),
    )
    orbitGroup.add(orbitMesh)
    orbitMaterialRef.current = orbitMesh.material

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.86, 24, 24),
      new THREE.MeshStandardMaterial({
        color: '#ffd58d',
        emissive: '#ffb957',
        emissiveIntensity: 0.7,
        roughness: 0.5,
        metalness: 0.08,
      }),
    )
    sun.userData.dialBodyOffset = BODY_OFFSETS.sun

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 20, 20),
      new THREE.MeshStandardMaterial({
        color: '#d9e4ff',
        emissive: '#5a74bd',
        emissiveIntensity: 0.34,
        roughness: 0.74,
        metalness: 0.04,
      }),
    )
    moon.userData.dialBodyOffset = BODY_OFFSETS.moon

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 18, 18),
      new THREE.MeshStandardMaterial({
        color: '#d89f73',
        emissive: '#8f4f36',
        emissiveIntensity: 0.34,
        roughness: 0.7,
        metalness: 0.06,
      }),
    )
    planet.userData.dialBodyOffset = BODY_OFFSETS.planet

    const planetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.028, 8, 36),
      new THREE.MeshBasicMaterial({
        color: '#eac7a6',
        transparent: true,
        opacity: 0.58,
      }),
    )
    planetRing.rotation.x = Math.PI / 2.8
    planet.add(planetRing)

    orbitGroup.add(sun, moon, planet)

    const bodyMap = bodyMapRef.current
    bodyMap.set('sun', sun)
    bodyMap.set('moon', moon)
    bodyMap.set('planet', planet)

    const materialMap = materialMapRef.current
    materialMap.set('sun', sun.material)
    materialMap.set('moon', moon.material)
    materialMap.set('planet', planet.material)

    setDialBodies(bodyMap, orbitAngleRef.current)

    const dragTargets = [sun, moon, planet]
    const canvasElement = renderer.domElement

    const setCanvasCursor = (cursorValue) => {
      if (canvasElement.style.cursor !== cursorValue) {
        canvasElement.style.cursor = cursorValue
      }
    }

    const applyOrbitAngle = (nextOrbitAngle, syncDayProgress) => {
      orbitAngleRef.current = nextOrbitAngle
      setDialBodies(bodyMap, nextOrbitAngle)

      if (syncDayProgress) {
        setDayProgress(sunAngleToProgress(nextOrbitAngle))
      }
    }

    const handlePointerDown = (event) => {
      setRayFromPointer(event, canvasElement, camera)
      const intersections = raycaster.intersectObjects(dragTargets, true)

      if (intersections.length === 0) {
        return
      }

      const body = findDialBody(intersections[0].object)

      if (!body) {
        return
      }

      const pointerAngle = getPointerOrbitAngle(event, canvasElement, camera, orbitGroup)

      if (pointerAngle === null) {
        return
      }

      const bodyOffset = body.userData.dialBodyOffset
      const bodyAngle = orbitAngleRef.current + bodyOffset

      dragStateRef.current = {
        pointerId: event.pointerId,
        bodyOffset,
        dragOffset: bodyAngle - pointerAngle,
        continuousPointerAngle: pointerAngle,
        lastPointerAngle: pointerAngle,
      }

      canvasElement.setPointerCapture(event.pointerId)
      setCanvasCursor('grabbing')
      event.preventDefault()
      event.stopPropagation()
    }

    const handlePointerMove = (event) => {
      const dragState = dragStateRef.current

      if (dragState && dragState.pointerId === event.pointerId) {
        const pointerAngle = getPointerOrbitAngle(event, canvasElement, camera, orbitGroup)

        if (pointerAngle === null) {
          return
        }

        const delta = shortestAngleDelta(pointerAngle, dragState.lastPointerAngle)
        dragState.continuousPointerAngle += delta
        dragState.lastPointerAngle = pointerAngle

        const nextBodyAngle = dragState.continuousPointerAngle + dragState.dragOffset
        applyOrbitAngle(nextBodyAngle - dragState.bodyOffset, true)

        event.preventDefault()
        event.stopPropagation()
        return
      }

      setRayFromPointer(event, canvasElement, camera)
      const intersections = raycaster.intersectObjects(dragTargets, true)
      const hovered = intersections.length > 0 ? findDialBody(intersections[0].object) : null
      setCanvasCursor(hovered ? 'grab' : '')
    }

    const handlePointerRelease = (event) => {
      const dragState = dragStateRef.current

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return
      }

      dragStateRef.current = null

      if (canvasElement.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId)
      }

      setCanvasCursor('')
      event.preventDefault()
      event.stopPropagation()
    }

    const handlePointerLeave = () => {
      if (!dragStateRef.current) {
        setCanvasCursor('')
      }
    }

    canvasElement.addEventListener('pointerdown', handlePointerDown)
    canvasElement.addEventListener('pointermove', handlePointerMove)
    canvasElement.addEventListener('pointerup', handlePointerRelease)
    canvasElement.addEventListener('pointercancel', handlePointerRelease)
    canvasElement.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      canvasElement.removeEventListener('pointerdown', handlePointerDown)
      canvasElement.removeEventListener('pointermove', handlePointerMove)
      canvasElement.removeEventListener('pointerup', handlePointerRelease)
      canvasElement.removeEventListener('pointercancel', handlePointerRelease)
      canvasElement.removeEventListener('pointerleave', handlePointerLeave)
      setCanvasCursor('')
      dragStateRef.current = null
      bodyMap.clear()
      materialMap.clear()
      orbitMaterialRef.current = null
      orbitGroupRef.current = null

      scene.remove(orbitGroup)
      orbitGroup.traverse((child) => {
        if (!child.isMesh) {
          return
        }

        child.geometry.dispose()

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose())
          return
        }

        child.material.dispose()
      })
    }
  }, [getCamera, getRenderer, getScene, setDayProgress])

  return null
}

export default SkyDial
