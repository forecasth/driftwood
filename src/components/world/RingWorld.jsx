import { useEffect } from 'react'
import * as THREE from 'three'
import { worldConfig } from '../../data/worldConfig.js'
import { sceneRegistry } from '../../scenes/common/sceneRegistry.js'
import { useSceneContext } from './sceneContext.js'
import createRingSegment from './RingSegment.jsx'

function RingWorld() {
  const { getScene, getSectionState, registerFrame, registerHoverTarget } = useSceneContext()

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const worldGroup = new THREE.Group()
    worldGroup.name = 'ring-world'
    worldGroup.position.set(
      worldConfig.camera.orbitCenter.x,
      0,
      worldConfig.camera.orbitCenter.z,
    )
    scene.add(worldGroup)

    const cleanups = sceneRegistry.map((sceneConfig, segmentIndex) =>
      createRingSegment({
        sceneConfig,
        segmentIndex,
        worldGroup,
        registerFrame,
        registerHoverTarget,
        getSectionState,
      }),
    )

    return () => {
      cleanups.forEach((cleanup) => {
        cleanup()
      })
      scene.remove(worldGroup)
    }
  }, [getScene, getSectionState, registerFrame, registerHoverTarget])

  return null
}

export default RingWorld
