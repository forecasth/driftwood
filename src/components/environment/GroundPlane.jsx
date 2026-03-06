import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { worldConfig } from '../../data/worldConfig.js'
import { mixHex } from '../../scenes/common/sceneUtils.js'
import { useSceneContext } from '../world/sceneContext.js'

const orbitCenter = new THREE.Vector3(
  worldConfig.camera.orbitCenter.x,
  worldConfig.camera.orbitCenter.y,
  worldConfig.camera.orbitCenter.z,
)

function GroundPlane({ sceneConfig }) {
  const { getScene, registerFrame, dayCycle } = useSceneContext()
  const colorTargetRef = useRef(new THREE.Color(sceneConfig.ground.color))
  const emissiveTargetRef = useRef(new THREE.Color(sceneConfig.ground.emissive))
  const shadowColorTargetRef = useRef(new THREE.Color(sceneConfig.palette.skyShadow))
  const opacityTargetRef = useRef(0.92)
  const shadowOpacityTargetRef = useRef(0.28)

  useEffect(() => {
    colorTargetRef.current.set(mixHex(sceneConfig.ground.color, dayCycle.ground, 0.22))
    emissiveTargetRef.current.set(
      mixHex(sceneConfig.ground.emissive, sceneConfig.palette.skyShadow, 0.24),
    )
    shadowColorTargetRef.current.set(sceneConfig.palette.skyShadow)
    opacityTargetRef.current = 0.84 + dayCycle.daylight * 0.08
    shadowOpacityTargetRef.current = 0.22 + (1 - dayCycle.daylight) * 0.08
  }, [dayCycle.daylight, dayCycle.ground, sceneConfig])

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: colorTargetRef.current,
      emissive: emissiveTargetRef.current,
      emissiveIntensity: 0.08,
      roughness: 0.98,
      metalness: 0.02,
      transparent: true,
      opacity: opacityTargetRef.current,
    })
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(
        worldConfig.ring.baseInnerRadius,
        worldConfig.ring.baseOuterRadius,
        320,
        3,
      ),
      baseMaterial,
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(orbitCenter.x, worldConfig.groundLevel - 0.08, orbitCenter.z)

    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: shadowColorTargetRef.current,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(worldConfig.ring.baseInnerRadius + 5, 160),
      shadowMaterial,
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(orbitCenter.x, worldConfig.groundLevel - 0.16, orbitCenter.z)

    scene.add(shadow, ring)

    const unsubscribe = registerFrame(({ delta }) => {
      baseMaterial.color.lerp(colorTargetRef.current, 1 - Math.exp(-delta * 2.2))
      baseMaterial.emissive.lerp(emissiveTargetRef.current, 1 - Math.exp(-delta * 2))
      baseMaterial.opacity = THREE.MathUtils.damp(
        baseMaterial.opacity,
        opacityTargetRef.current,
        2.4,
        delta,
      )
      shadowMaterial.color.lerp(shadowColorTargetRef.current, 1 - Math.exp(-delta * 2))
      shadowMaterial.opacity = THREE.MathUtils.damp(
        shadowMaterial.opacity,
        shadowOpacityTargetRef.current,
        2.2,
        delta,
      )
    })

    return () => {
      unsubscribe()
      scene.remove(shadow, ring)
      shadow.geometry.dispose()
      ring.geometry.dispose()
      shadowMaterial.dispose()
      baseMaterial.dispose()
    }
  }, [getScene, registerFrame])

  return null
}

export default GroundPlane
