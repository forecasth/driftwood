import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'
import { palette } from '../theme.js'

function Lighting() {
  const { getScene } = useSceneContext()

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const ambientLight = new THREE.AmbientLight(palette.ambient, 0.68)

    const distantLight = new THREE.DirectionalLight(palette.directional, 0.31)
    distantLight.position.set(-14, 16, -12)
    distantLight.target.position.set(0, 0.4, -6)

    scene.add(ambientLight)
    scene.add(distantLight)
    scene.add(distantLight.target)

    return () => {
      scene.remove(ambientLight)
      scene.remove(distantLight)
      scene.remove(distantLight.target)
    }
  }, [getScene])

  return null
}

export default Lighting
