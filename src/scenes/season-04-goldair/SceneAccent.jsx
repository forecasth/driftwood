import * as THREE from 'three'
import {
  createAccentMaterial,
  createGlowMaterial,
  disposeObject3D,
} from '../common/sceneUtils.js'

export default function createSceneAccent({ sceneConfig, getAnchor, random }) {
  const root = new THREE.Group()
  root.position.copy(getAnchor(0.44, 0.42, 0.1))

  const beamMaterial = createAccentMaterial({
    color: sceneConfig.accent.color,
    emissive: sceneConfig.accent.emissive,
    opacity: 0.7,
    roughness: 0.78,
  })
  const haloMaterial = createGlowMaterial({
    color: sceneConfig.accent.emissive,
    opacity: 0.2,
  })

  const shafts = []

  for (let index = 0; index < 3; index += 1) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 2.2, 10), beamMaterial)
    shaft.position.set(index * 0.36 - 0.36, 1.1 + index * 0.1, random() * 0.24 - 0.12)
    shaft.rotation.z = random() * 0.1 - 0.05
    shafts.push(shaft)
    root.add(shaft)
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 8, 48), haloMaterial)
  halo.rotation.x = Math.PI / 2
  halo.position.y = 0.08
  halo.scale.set(1.16, 1, 0.8)
  root.add(halo)

  return {
    object: root,
    update({ elapsed, emphasis }) {
      halo.rotation.z += 0.0014
      haloMaterial.opacity = 0.12 + emphasis * 0.16
      shafts.forEach((shaft, index) => {
        shaft.position.y = 1 + index * 0.12 + Math.sin(elapsed * 0.82 + index) * 0.06
      })
    },
    dispose() {
      disposeObject3D(root)
    },
  }
}
