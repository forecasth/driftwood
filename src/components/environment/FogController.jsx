import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mixHex } from '../../scenes/common/sceneUtils.js'
import { useSceneContext } from '../world/sceneContext.js'

function FogController({ sceneConfig }) {
  const { getScene, registerFrame, dayCycle } = useSceneContext()
  const targetColorRef = useRef(new THREE.Color(sceneConfig.fog.color))
  const targetDensityRef = useRef(sceneConfig.fog.density)

  useEffect(() => {
    targetColorRef.current.set(mixHex(sceneConfig.fog.color, dayCycle.fog, 0.32))
    targetDensityRef.current =
      sceneConfig.fog.density * (0.88 + (1 - dayCycle.daylight) * 0.36)
  }, [dayCycle.daylight, dayCycle.fog, sceneConfig])

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const fog = new THREE.FogExp2(
      `#${targetColorRef.current.getHexString()}`,
      targetDensityRef.current,
    )
    scene.fog = fog

    const unsubscribe = registerFrame(({ delta }) => {
      fog.color.lerp(targetColorRef.current, 1 - Math.exp(-delta * 2.4))
      fog.density = THREE.MathUtils.damp(fog.density, targetDensityRef.current, 2.8, delta)
    })

    return () => {
      unsubscribe()

      if (scene.fog === fog) {
        scene.fog = null
      }
    }
  }, [getScene, registerFrame])

  return null
}

export default FogController
