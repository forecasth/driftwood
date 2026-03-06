import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.56, 0.22, 0.08))

  const monolithMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.72,
    roughness: 0.68,
    metalness: 0.12,
  })
  const haloMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.1,
  })

  const monolithA = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.8, 0.18), monolithMaterial)
  monolithA.position.set(-0.12, 0.9, 0)
  monolithA.rotation.z = -0.08
  const monolithB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), monolithMaterial)
  monolithB.position.set(0.22, 0.56, -0.06)
  monolithB.rotation.z = 0.06

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.03, 8, 44), haloMaterial)
  halo.rotation.x = Math.PI / 2
  halo.scale.set(1.18, 1, 0.64)
  halo.position.y = 0.08

  root.add(monolithA, monolithB, halo)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      root.position.y = 0.03 + Math.sin(elapsed * 0.28) * 0.016
      haloMaterial.opacity = 0.05 + emphasis * 0.08
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
