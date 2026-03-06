import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.5, 0.2, 0.08))

  const podMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.74,
    roughness: 0.9,
  })
  const mistMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.18,
  })

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.76, 18, 14), mistMaterial)
  dome.scale.set(1.15, 0.42, 1)
  dome.position.y = 0.22
  root.add(dome)

  for (let index = 0; index < 4; index += 1) {
    const pod = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), podMaterial)
    const angle = (index / 4) * Math.PI * 2 + random() * 0.5
    const radius = 0.32 + random() * 0.18
    pod.position.set(Math.cos(angle) * radius, 0.14 + random() * 0.32, Math.sin(angle) * radius)
    pod.scale.set(1, 1.2 + random() * 0.5, 1)
    root.add(pod)
  }

  return {
    object: root,
    update({ elapsed, emphasis }) {
      dome.scale.y = 0.38 + Math.sin(elapsed * 0.76) * 0.05 + emphasis * 0.08
      mistMaterial.opacity = 0.12 + emphasis * 0.16
      root.position.y = 0.06 + Math.sin(elapsed * 0.48) * 0.05
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
