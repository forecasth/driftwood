import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const basePosition = new THREE.Vector3(0, 1.7, 8.4)
const targetPosition = new THREE.Vector3()
const lookTarget = new THREE.Vector3()

function CameraController() {
  const { getCamera, getPointer, registerFrame } = useSceneContext()

  useEffect(() => {
    const camera = getCamera()

    if (!camera) {
      return undefined
    }

    const smoothPointer = new THREE.Vector2(0, 0)
    const smoothedPosition = camera.position.clone()

    const unsubscribe = registerFrame(({ elapsed }) => {
      const pointer = getPointer()

      if (!pointer) {
        return
      }

      smoothPointer.lerp(pointer, 0.045)

      const breathing = Math.sin(elapsed * 0.34) * 0.12
      targetPosition.set(
        basePosition.x + smoothPointer.x * 0.45,
        basePosition.y + breathing + smoothPointer.y * 0.2,
        basePosition.z - smoothPointer.x * 0.22,
      )

      smoothedPosition.lerp(targetPosition, 0.05)
      camera.position.copy(smoothedPosition)

      lookTarget.set(
        smoothPointer.x * 0.35,
        0.56 + breathing * 0.36,
        -1.7 + smoothPointer.y * 0.2,
      )
      camera.lookAt(lookTarget)
    })

    return () => {
      unsubscribe()
    }
  }, [getCamera, getPointer, registerFrame])

  return null
}

export default CameraController
