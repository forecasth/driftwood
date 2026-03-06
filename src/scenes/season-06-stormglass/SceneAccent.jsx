import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.54, 0.12, 0.08))

  const shardMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.78,
    roughness: 0.66,
    metalness: 0.12,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.16,
  })

  const shardGroup = new THREE.Group()

  for (let index = 0; index < 3; index += 1) {
    const shard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4 + index * 0.3, 0.08), shardMaterial)
    shard.position.set(index * 0.32 - 0.28, 0.7 + index * 0.14, random() * 0.24 - 0.12)
    shard.rotation.set(random() * 0.18, random() * 0.4 - 0.2, index * 0.18 - 0.12)
    shardGroup.add(shard)
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 8, 40), glowMaterial)
  halo.rotation.x = Math.PI / 2
  halo.scale.set(1.3, 1, 0.68)
  halo.position.y = 0.12

  root.add(shardGroup, halo)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      shardGroup.rotation.y = Math.sin(elapsed * 0.58) * 0.08 * (0.4 + emphasis)
      halo.rotation.z += 0.002
      glowMaterial.opacity = 0.1 + emphasis * 0.14
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
