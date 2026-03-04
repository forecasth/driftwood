import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const basePosition = new THREE.Vector3(0, 1.7, 8.4)
const ORBIT_RADIUS = 38
const ORBIT_CENTER = new THREE.Vector3(0, basePosition.y, basePosition.z + ORBIT_RADIUS)
const DRAG_SENSITIVITY = 0.00135
const DRAG_DIRECTION = -1
const LOOK_DISTANCE = 14

const targetPosition = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
const outward = new THREE.Vector3()
const smoothedLookTarget = new THREE.Vector3()
const raycastPointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

function toRayPointer(event, element, result) {
  const bounds = element.getBoundingClientRect()
  result.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
  result.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
}

function CameraController() {
  const {
    getCamera,
    getRenderer,
    getScene,
    getPointer,
    getClickableObjects,
    registerFrame,
  } = useSceneContext()

  useEffect(() => {
    const camera = getCamera()
    const renderer = getRenderer()
    const scene = getScene()

    if (!camera || !renderer || !scene) {
      return undefined
    }

    const smoothPointer = new THREE.Vector2(0, 0)
    const smoothedPosition = camera.position.clone()
    const orbitAngleState = { current: 0, target: 0 }
    const dragState = { pointerId: null, startX: 0, startAngle: 0 }
    const canvasElement = renderer.domElement

    const isInteractivePointerDown = (event) => {
      const clickableObjects = getClickableObjects()

      toRayPointer(event, canvasElement, raycastPointer)
      raycaster.setFromCamera(raycastPointer, camera)

      if (
        clickableObjects.length > 0 &&
        raycaster.intersectObjects(clickableObjects, true).length > 0
      ) {
        return true
      }

      const sceneHits = raycaster.intersectObjects(scene.children, true)

      return sceneHits.some((hit) => {
        let current = hit.object

        while (current) {
          if (typeof current.userData?.dialBodyOffset === 'number') {
            return true
          }

          current = current.parent
        }

        return false
      })
    }

    const handlePointerDown = (event) => {
      if (event.button !== 0 || event.defaultPrevented || dragState.pointerId !== null) {
        return
      }

      if (isInteractivePointerDown(event)) {
        return
      }

      dragState.pointerId = event.pointerId
      dragState.startX = event.clientX
      dragState.startAngle = orbitAngleState.target
      canvasElement.setPointerCapture(event.pointerId)
      canvasElement.style.cursor = 'grabbing'
      event.preventDefault()
    }

    const handlePointerMove = (event) => {
      if (dragState.pointerId !== event.pointerId) {
        return
      }

      const dragDistance = event.clientX - dragState.startX
      orbitAngleState.target =
        dragState.startAngle + dragDistance * DRAG_SENSITIVITY * DRAG_DIRECTION
      event.preventDefault()
    }

    const handlePointerRelease = (event) => {
      if (dragState.pointerId !== event.pointerId) {
        return
      }

      dragState.pointerId = null

      if (canvasElement.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId)
      }

      canvasElement.style.cursor = ''
      event.preventDefault()
    }

    canvasElement.addEventListener('pointerdown', handlePointerDown)
    canvasElement.addEventListener('pointermove', handlePointerMove)
    canvasElement.addEventListener('pointerup', handlePointerRelease)
    canvasElement.addEventListener('pointercancel', handlePointerRelease)

    const unsubscribe = registerFrame(({ delta, elapsed }) => {
      const pointer = getPointer()

      if (!pointer) {
        return
      }

      smoothPointer.lerp(pointer, 0.045)
      orbitAngleState.current = THREE.MathUtils.damp(
        orbitAngleState.current,
        orbitAngleState.target,
        dragState.pointerId === null ? 3.8 : 11,
        delta,
      )

      const breathing = Math.sin(elapsed * 0.34) * 0.12
      outward.set(
        Math.sin(orbitAngleState.current),
        0,
        -Math.cos(orbitAngleState.current),
      )

      targetPosition.set(
        ORBIT_CENTER.x + outward.x * ORBIT_RADIUS,
        basePosition.y + breathing + smoothPointer.y * 0.2,
        ORBIT_CENTER.z + outward.z * ORBIT_RADIUS,
      )

      smoothedPosition.lerp(targetPosition, 0.08)
      camera.position.copy(smoothedPosition)

      lookTarget.set(
        smoothedPosition.x + outward.x * LOOK_DISTANCE,
        0.56 + breathing * 0.36 + smoothPointer.y * 0.2,
        smoothedPosition.z + outward.z * LOOK_DISTANCE,
      )
      smoothedLookTarget.lerp(lookTarget, 0.1)
      camera.lookAt(smoothedLookTarget)
    })

    return () => {
      unsubscribe()
      canvasElement.removeEventListener('pointerdown', handlePointerDown)
      canvasElement.removeEventListener('pointermove', handlePointerMove)
      canvasElement.removeEventListener('pointerup', handlePointerRelease)
      canvasElement.removeEventListener('pointercancel', handlePointerRelease)
      canvasElement.style.cursor = ''
    }
  }, [getCamera, getClickableObjects, getPointer, getRenderer, getScene, registerFrame])

  return null
}

export default CameraController
