import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const basePosition = new THREE.Vector3(0, 1.7, 8.4)
const ORBIT_RADIUS = 38
const ORBIT_CENTER = new THREE.Vector3(0, basePosition.y, basePosition.z + ORBIT_RADIUS)
const TAU = Math.PI * 2
const LOOK_DISTANCE = 14
const SECTION_TRANSITION_DAMP = 1.85
const INTRO_DURATION = 4.8
const INTRO_OUTWARD_OFFSET = 50
const INTRO_LATERAL_OFFSET = -180
const INTRO_HEIGHT_OFFSET = 24

const targetPosition = new THREE.Vector3()
const lookTarget = new THREE.Vector3()
const outward = new THREE.Vector3()
const smoothedLookTarget = new THREE.Vector3()
const lateral = new THREE.Vector3()
const introStartPosition = new THREE.Vector3()
const introStartLookTarget = new THREE.Vector3()
const introCameraPosition = new THREE.Vector3()
const introLookTarget = new THREE.Vector3()

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

function easeOutCubic(value) {
  const clamped = Math.min(1, Math.max(0, value))
  return 1 - (1 - clamped) ** 3
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
    const introState = {
      active: true,
      elapsed: 0,
    }

    outward.set(
      Math.sin(orbitAngleState.current),
      0,
      -Math.cos(orbitAngleState.current),
    )
    lateral.set(Math.cos(orbitAngleState.current), 0, Math.sin(orbitAngleState.current))

    targetPosition.set(
      ORBIT_CENTER.x + outward.x * ORBIT_RADIUS,
      basePosition.y,
      ORBIT_CENTER.z + outward.z * ORBIT_RADIUS,
    )
    lookTarget.set(
      targetPosition.x + outward.x * LOOK_DISTANCE,
      0.56,
      targetPosition.z + outward.z * LOOK_DISTANCE,
    )
    smoothedPosition.copy(targetPosition)
    smoothedLookTarget.copy(lookTarget)

    introStartPosition
      .copy(targetPosition)
      .addScaledVector(outward, INTRO_OUTWARD_OFFSET)
      .addScaledVector(lateral, INTRO_LATERAL_OFFSET)
      .setY(targetPosition.y + INTRO_HEIGHT_OFFSET)
    introStartLookTarget.set(ORBIT_CENTER.x, 0.74, ORBIT_CENTER.z)
    camera.position.copy(introStartPosition)
    camera.lookAt(introStartLookTarget)

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

      if (introState.active) {
        introState.elapsed += delta
        const progress = easeOutCubic(introState.elapsed / INTRO_DURATION)

        introCameraPosition.lerpVectors(introStartPosition, smoothedPosition, progress)
        introLookTarget.lerpVectors(introStartLookTarget, smoothedLookTarget, progress)
        camera.position.copy(introCameraPosition)
        camera.lookAt(introLookTarget)

        if (progress >= 1) {
          introState.active = false
        }

        return
      }

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
