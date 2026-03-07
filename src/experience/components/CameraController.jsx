import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const basePosition = new THREE.Vector3(0, 1.7, 8.4)
const ORBIT_RADIUS = 38
const ORBIT_CENTER = new THREE.Vector3(0, basePosition.y, basePosition.z + ORBIT_RADIUS)
const TAU = Math.PI * 2
const LOOK_DISTANCE = 14
const SECTION_TRANSITION_DAMP = 1.85

const targetPosition = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
const outward = new THREE.Vector3()
const smoothedLookTarget = new THREE.Vector3()

function wrapSectionIndex(index, sectionCount) {
  const rounded = Math.round(index)
  return ((rounded % sectionCount) + sectionCount) % sectionCount
}

function resolveNearestStep(wrappedSection, referenceStep, sectionCount) {
  const wrapOffset = Math.round((referenceStep - wrappedSection) / sectionCount)
  const candidateA = wrappedSection + wrapOffset * sectionCount
  const candidateB = candidateA + sectionCount
  const candidateC = candidateA - sectionCount

  let nearest = candidateA
  let nearestDistance = Math.abs(candidateA - referenceStep)

  const distanceB = Math.abs(candidateB - referenceStep)

  if (distanceB < nearestDistance) {
    nearest = candidateB
    nearestDistance = distanceB
  }

  const distanceC = Math.abs(candidateC - referenceStep)

  if (distanceC < nearestDistance) {
    nearest = candidateC
  }

  return nearest
}

function CameraController() {
  const {
    getCamera,
    getPointer,
    registerFrame,
    sectionIndex,
    sectionCount,
  } = useSceneContext()
  const sectionIndexRef = useRef(sectionIndex)
  const safeSectionCount = Math.max(1, Math.round(sectionCount || 1))

  useEffect(() => {
    sectionIndexRef.current = sectionIndex
  }, [sectionIndex])

  useEffect(() => {
    const camera = getCamera()

    if (!camera) {
      return undefined
    }

    const initialWrappedSection = wrapSectionIndex(
      sectionIndexRef.current || 0,
      safeSectionCount,
    )
    const sectionAngle = TAU / safeSectionCount
    const smoothPointer = new THREE.Vector2(0, 0)
    const smoothedPosition = camera.position.clone()
    const sectionStepState = {
      wrapped: initialWrappedSection,
      target: initialWrappedSection,
    }
    const orbitAngleState = {
      current: initialWrappedSection * sectionAngle,
      target: initialWrappedSection * sectionAngle,
    }

    const unsubscribe = registerFrame(({ delta, elapsed }) => {
      const pointer = getPointer()

      if (!pointer) {
        return
      }

      const requestedWrappedSection = wrapSectionIndex(
        sectionIndexRef.current || 0,
        safeSectionCount,
      )

      if (requestedWrappedSection !== sectionStepState.wrapped) {
        sectionStepState.target = resolveNearestStep(
          requestedWrappedSection,
          sectionStepState.target,
          safeSectionCount,
        )
        sectionStepState.wrapped = requestedWrappedSection
      }

      orbitAngleState.target = sectionStepState.target * sectionAngle
      smoothPointer.lerp(pointer, 0.045)
      orbitAngleState.current = THREE.MathUtils.damp(
        orbitAngleState.current,
        orbitAngleState.target,
        SECTION_TRANSITION_DAMP,
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
    }
  }, [
    getCamera,
    getPointer,
    registerFrame,
    safeSectionCount,
  ])

  return null
}

export default CameraController
