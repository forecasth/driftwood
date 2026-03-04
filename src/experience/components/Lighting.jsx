import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

function Lighting() {
  const { getScene, dayCycle } = useSceneContext()
  const ambientRef = useRef(null)
  const directionalRef = useRef(null)
  const targetRef = useRef(null)

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
    const distantLight = new THREE.DirectionalLight('#ffffff', 0.4)
    distantLight.position.set(-12, 14, -10)
    distantLight.target.position.set(0, 0.35, -6)

    ambientRef.current = ambientLight
    directionalRef.current = distantLight
    targetRef.current = distantLight.target

    scene.add(ambientLight)
    scene.add(distantLight)
    scene.add(distantLight.target)

    return () => {
      ambientRef.current = null
      directionalRef.current = null
      targetRef.current = null
      scene.remove(ambientLight)
      scene.remove(distantLight)
      scene.remove(distantLight.target)
    }
  }, [getScene])

  useEffect(() => {
    const ambientLight = ambientRef.current
    const distantLight = directionalRef.current
    const lightTarget = targetRef.current

    if (!ambientLight || !distantLight || !lightTarget) {
      return
    }

    ambientLight.color.set(dayCycle.ambient)
    ambientLight.intensity = dayCycle.ambientIntensity

    distantLight.color.set(dayCycle.directional)
    distantLight.intensity = dayCycle.directionalIntensity

    const sunAzimuth = dayCycle.sunAngle - Math.PI * 0.08
    const sunHeight = Math.sin(dayCycle.sunAngle)
    const horizonLift = 5.5 + sunHeight * 12.5

    distantLight.position.set(
      Math.cos(sunAzimuth) * 22,
      horizonLift,
      -10 - Math.sin(dayCycle.sunAngle * 0.5) * 7,
    )
    lightTarget.position.set(0, -0.2 + sunHeight * 0.4, -6)
    lightTarget.updateMatrixWorld()
  }, [dayCycle])

  return null
}

export default Lighting
