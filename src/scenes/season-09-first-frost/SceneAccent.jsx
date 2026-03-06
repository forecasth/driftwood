import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.47, -0.16, 0.08))

  const crystalMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.78,
    roughness: 0.74,
    metalness: 0.12,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.14,
  })

  for (let index = 0; index < 4; index += 1) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.18 + index * 0.03, 0), crystalMaterial)
    crystal.position.set(index * 0.22 - 0.3, 0.22 + index * 0.18, random() * 0.2 - 0.1)
    crystal.scale.set(0.7, 1.4 + index * 0.18, 0.7)
    crystal.rotation.y = index * 0.42
    root.add(crystal)
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.026, 8, 40), glowMaterial)
  halo.rotation.x = Math.PI / 2
  halo.scale.set(1.22, 1, 0.7)
  halo.position.y = 0.08
  root.add(halo)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      halo.rotation.z += 0.0018
      glowMaterial.opacity = 0.08 + emphasis * 0.12
      root.position.y = 0.04 + Math.sin(elapsed * 0.42) * 0.02
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
