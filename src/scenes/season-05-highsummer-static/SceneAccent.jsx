import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.48, -0.2, 0.08))

  const ringMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.68,
    roughness: 0.84,
  })
  const hazeMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.14,
  })

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.05, 8, 54), ringMaterial)
  ring.rotation.x = Math.PI / 2
  ring.scale.set(1.28, 1, 0.74)
  root.add(ring)

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), ringMaterial)
  core.position.y = 0.28
  root.add(core)

  const haze = new THREE.Mesh(new THREE.SphereGeometry(0.9, 18, 14), hazeMaterial)
  haze.scale.set(1.22, 0.14, 0.72)
  haze.position.y = 0.14
  root.add(haze)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      root.position.y = 0.04 + Math.sin(elapsed * 0.32) * 0.02
      core.position.y = 0.28 + Math.sin(elapsed * 0.48) * 0.04
      hazeMaterial.opacity = 0.1 + emphasis * 0.12
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
