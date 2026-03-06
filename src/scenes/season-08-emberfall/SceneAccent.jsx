import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.5, 0.18, 0.06))

  const emberMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.86,
    roughness: 0.9,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.2,
  })

  for (let index = 0; index < 4; index += 1) {
    const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + index * 0.03, 0), emberMaterial)
    ember.position.set(index * 0.26 - 0.36, 0.1 + index * 0.04, random() * 0.26 - 0.13)
    ember.rotation.set(random() * 0.8, random() * 0.8, random() * 0.8)
    root.add(ember)
  }

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 14), glowMaterial)
  glow.scale.set(1.16, 0.14, 0.8)
  glow.position.y = 0.12
  root.add(glow)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      glow.scale.x = 1.1 + Math.sin(elapsed * 1.2) * 0.06 + emphasis * 0.12
      glowMaterial.opacity = 0.12 + emphasis * 0.18 + Math.sin(elapsed * 2.4) * 0.02
      root.rotation.y += 0.0008
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
