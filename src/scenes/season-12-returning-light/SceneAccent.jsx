import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.44, 0.24, 0.08))

  const archMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.8,
    roughness: 0.8,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.18,
  })

  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.035, 8, 44, Math.PI * 0.72), archMaterial)
  arch.rotation.set(0.1, Math.PI / 2, -0.14)
  arch.position.y = 0.52

  const base = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.025, 8, 40), glowMaterial)
  base.rotation.x = Math.PI / 2
  base.position.y = 0.08
  base.scale.set(1.24, 1, 0.72)

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), glowMaterial)
  orb.position.set(0.28, 0.48, 0)

  root.add(arch, base, orb)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      root.rotation.y = Math.sin(elapsed * 0.4) * 0.06
      orb.position.y = 0.46 + Math.sin(elapsed * 0.86) * 0.06
      glowMaterial.opacity = 0.12 + emphasis * 0.14
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
