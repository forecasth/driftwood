import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { worldConfig } from '../../data/worldConfig.js'
import {
  getRingPoint,
  getSectionAngle,
  mixHex,
} from '../../scenes/common/sceneUtils.js'
import { useSceneContext } from '../world/sceneContext.js'

const orbitCenter = new THREE.Vector3(
  worldConfig.camera.orbitCenter.x,
  worldConfig.camera.orbitCenter.y,
  worldConfig.camera.orbitCenter.z,
)
const targetPoint = new THREE.Vector3()

function LightingRig({ sceneConfig }) {
  const {
    getScene,
    getRenderer,
    registerFrame,
    dayCycle,
    sectionIndex,
    sectionCount,
  } = useSceneContext()
  const ambientTargetColorRef = useRef(new THREE.Color(sceneConfig.lighting.ambientColor))
  const keyTargetColorRef = useRef(new THREE.Color(sceneConfig.lighting.directionalColor))
  const fillTargetColorRef = useRef(new THREE.Color(sceneConfig.lighting.fillColor))
  const fillGroundColorRef = useRef(new THREE.Color(sceneConfig.palette.skyShadow))
  const ambientTargetIntensityRef = useRef(sceneConfig.lighting.ambientIntensity)
  const keyTargetIntensityRef = useRef(sceneConfig.lighting.directionalIntensity)
  const fillTargetIntensityRef = useRef(sceneConfig.lighting.fillIntensity)
  const exposureTargetRef = useRef(sceneConfig.lighting.exposure)
  const sunAngleRef = useRef(dayCycle.sunAngle)
  const sectionIndexRef = useRef(sectionIndex)
  const sectionCountRef = useRef(sectionCount)

  useEffect(() => {
    sunAngleRef.current = dayCycle.sunAngle
  }, [dayCycle.sunAngle])

  useEffect(() => {
    sectionIndexRef.current = sectionIndex
    sectionCountRef.current = sectionCount
  }, [sectionCount, sectionIndex])

  useEffect(() => {
    ambientTargetColorRef.current.set(
      mixHex(sceneConfig.lighting.ambientColor, dayCycle.ambient, 0.34),
    )
    keyTargetColorRef.current.set(
      mixHex(sceneConfig.lighting.directionalColor, dayCycle.directional, 0.44),
    )
    fillTargetColorRef.current.set(
      mixHex(sceneConfig.lighting.fillColor, sceneConfig.accent.emissive, 0.28),
    )
    fillGroundColorRef.current.set(sceneConfig.palette.skyShadow)
    ambientTargetIntensityRef.current =
      sceneConfig.lighting.ambientIntensity * (0.74 + dayCycle.daylight * 0.5)
    keyTargetIntensityRef.current =
      sceneConfig.lighting.directionalIntensity * (0.42 + dayCycle.daylight * 0.92)
    fillTargetIntensityRef.current =
      sceneConfig.lighting.fillIntensity * (0.7 + (1 - dayCycle.daylight) * 0.26)
    exposureTargetRef.current =
      sceneConfig.lighting.exposure + (dayCycle.daylight - 0.5) * 0.08
  }, [dayCycle, sceneConfig])

  useEffect(() => {
    const scene = getScene()
    const renderer = getRenderer()

    if (!scene || !renderer) {
      return undefined
    }

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
    const keyLight = new THREE.DirectionalLight('#ffffff', 0.3)
    const fillLight = new THREE.HemisphereLight('#ffffff', '#182029', 0.16)
    keyLight.target.position.copy(orbitCenter)
    keyLight.position.set(orbitCenter.x - 12, 14, orbitCenter.z - 14)

    scene.add(ambientLight, keyLight, keyLight.target, fillLight)

    const unsubscribe = registerFrame(({ delta }) => {
      ambientLight.color.lerp(ambientTargetColorRef.current, 1 - Math.exp(-delta * 2.4))
      ambientLight.intensity = THREE.MathUtils.damp(
        ambientLight.intensity,
        ambientTargetIntensityRef.current,
        2.4,
        delta,
      )

      keyLight.color.lerp(keyTargetColorRef.current, 1 - Math.exp(-delta * 2.4))
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        keyTargetIntensityRef.current,
        2.6,
        delta,
      )

      fillLight.color.lerp(fillTargetColorRef.current, 1 - Math.exp(-delta * 2.2))
      fillLight.groundColor.lerp(fillGroundColorRef.current, 1 - Math.exp(-delta * 2.2))
      fillLight.intensity = THREE.MathUtils.damp(
        fillLight.intensity,
        fillTargetIntensityRef.current,
        2.2,
        delta,
      )

      const activeSectionAngle = getSectionAngle(
        sectionIndexRef.current,
        Math.max(sectionCountRef.current, 1),
      )
      const sunAzimuth = sunAngleRef.current - Math.PI * 0.08
      const sunHeight = Math.sin(sunAngleRef.current)
      const horizonLift = 8 + sunHeight * 15

      getRingPoint(
        activeSectionAngle,
        worldConfig.camera.orbitRadius + 18,
        0.38,
        targetPoint,
      )

      keyLight.position.set(
        orbitCenter.x + Math.cos(sunAzimuth) * 24 + targetPoint.x * 0.18,
        horizonLift,
        orbitCenter.z - Math.sin(sunAngleRef.current * 0.5) * 10 + targetPoint.z * 0.18,
      )
      keyLight.target.position.set(
        orbitCenter.x + targetPoint.x,
        targetPoint.y,
        orbitCenter.z + targetPoint.z,
      )
      keyLight.target.updateMatrixWorld()

      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        exposureTargetRef.current,
        2.2,
        delta,
      )
    })

    return () => {
      unsubscribe()
      scene.remove(ambientLight, keyLight, keyLight.target, fillLight)
    }
  }, [getRenderer, getScene, registerFrame])

  return null
}

export default LightingRig
