import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.42, -0.35, 0.06))

  const stalkMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.88,
    roughness: 0.84,
  })
  const bloomMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.22,
  })

  const stalks = []

  for (let index = 0; index < 3; index += 1) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.2, 10), stalkMaterial)
    stalk.position.set(index * 0.32 - 0.32, 0.6 + index * 0.08, random() * 0.28 - 0.14)
    stalk.rotation.z = random() * 0.18 - 0.09
    root.add(stalk)
    stalks.push(stalk)

    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), bloomMaterial)
    bloom.position.set(stalk.position.x, stalk.position.y + 0.62, stalk.position.z)
    bloom.scale.set(1.2, 1, 1.2)
    root.add(bloom)
    stalks.push(bloom)
  }

  return {
    object: root,
    update({ elapsed, emphasis }) {
      root.position.y = 0.04 + Math.sin(elapsed * 0.72) * 0.05 * (0.48 + emphasis)
      bloomMaterial.opacity = 0.14 + emphasis * 0.16
      stalks.forEach((mesh, index) => {
        mesh.rotation.z += Math.sin(elapsed * 0.7 + index) * 0.0008
      })
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
