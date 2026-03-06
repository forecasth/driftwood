import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.46, -0.28, 0.08))

  const leafMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.8,
    roughness: 0.88,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.14,
  })

  const ribbon = new THREE.Group()

  for (let index = 0; index < 5; index += 1) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.18), leafMaterial)
    leaf.position.set(index * 0.22 - 0.44, 0.18 + index * 0.08, Math.sin(index * 0.7) * 0.22)
    leaf.rotation.set(0.3 + index * 0.08, random() * 0.6, 0.2 + index * 0.14)
    ribbon.add(leaf)
  }

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 14), glowMaterial)
  glow.scale.set(1.1, 0.12, 0.7)
  glow.position.y = 0.12

  root.add(ribbon, glow)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      ribbon.rotation.y = Math.sin(elapsed * 0.44) * 0.12
      glowMaterial.opacity = 0.08 + emphasis * 0.12
      root.position.y = 0.04 + Math.sin(elapsed * 0.56) * 0.03
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
