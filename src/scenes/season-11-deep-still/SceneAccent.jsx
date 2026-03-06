import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.5, 0, 0.08))

  const ringMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.74,
    roughness: 0.8,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.16,
  })

  const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.04, 8, 48), ringMaterial)
  ringOuter.rotation.x = Math.PI / 2
  ringOuter.scale.set(1.14, 1, 0.72)

  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.024, 8, 40), glowMaterial)
  ringInner.rotation.x = Math.PI / 2
  ringInner.position.y = 0.05
  ringInner.scale.set(1.08, 1, 0.78)

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), ringMaterial)
  core.position.y = 0.22

  root.add(ringOuter, ringInner, core)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      ringOuter.rotation.z += 0.0006
      ringInner.rotation.z -= 0.0008
      glowMaterial.opacity = 0.1 + emphasis * 0.1
      root.position.y = 0.05 + Math.sin(elapsed * 0.22) * 0.014
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
