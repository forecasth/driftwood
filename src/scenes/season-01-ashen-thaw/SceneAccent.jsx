import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.46, 0, 0.08))

  const coreMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.82,
    roughness: 0.92,
  })
  const glowMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.18,
  })

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 8, 48), coreMaterial)
  ringA.rotation.x = Math.PI / 2
  ringA.rotation.z = random() * Math.PI
  ringA.scale.set(1.2, 1, 0.82)

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 8, 40), coreMaterial)
  ringB.rotation.x = Math.PI / 2
  ringB.rotation.z = random() * Math.PI
  ringB.position.set(0.26, 0.03, -0.18)
  ringB.scale.set(1.1, 1, 0.72)

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12), glowMaterial)
  glow.scale.set(1.3, 0.18, 0.84)
  glow.position.set(0.08, 0.08, -0.06)

  const stone = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.22), coreMaterial)
  stone.position.set(-0.42, 0.06, 0.24)
  stone.rotation.set(0.08, 0.46, 0.1)

  root.add(ringA, ringB, glow, stone)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      ringA.rotation.z += 0.0006
      ringB.rotation.z -= 0.0004
      glowMaterial.opacity = 0.1 + emphasis * 0.12 + Math.sin(elapsed * 0.9) * 0.02
      root.position.y = 0.02 + Math.sin(elapsed * 0.55) * 0.04 * (0.4 + emphasis)
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
