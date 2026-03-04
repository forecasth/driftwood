import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const GROUND_LEVEL = -1.28
const ENTRY_CAMERA_Z = 8.4
const ENTRY_FORWARD_OFFSET = 16.4
const ENTRY_LATERAL_OFFSET = 0.75

const stoneLayout = [
  { x: 0, z: 0, y: 0.02, sx: 0.55, sy: 0.35, sz: 0.5, ry: 0.3, moss: 0.78 },
  { x: -0.52, z: 0.16, y: 0.01, sx: 0.42, sy: 0.3, sz: 0.4, ry: 1.1, moss: 0.72 },
  { x: 0.5, z: 0.28, y: 0.01, sx: 0.44, sy: 0.32, sz: 0.43, ry: -0.7, moss: 0.7 },
  { x: -0.22, z: -0.41, y: 0, sx: 0.34, sy: 0.24, sz: 0.3, ry: 0.5, moss: 0.65 },
  { x: 0.36, z: -0.35, y: 0, sx: 0.31, sy: 0.22, sz: 0.32, ry: -0.25, moss: 0.62 },
  { x: 0.86, z: 0.12, y: 0, sx: 0.25, sy: 0.18, sz: 0.22, ry: -1.3, moss: 0.6 },
  { x: -0.82, z: -0.05, y: 0, sx: 0.23, sy: 0.17, sz: 0.24, ry: 0.8, moss: 0.6 },
  { x: 0.13, z: 0.58, y: 0, sx: 0.2, sy: 0.15, sz: 0.2, ry: -0.2, moss: 0.58 },
]

function EntryStones() {
  const { getScene } = useSceneContext()

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const pile = new THREE.Group()
    pile.name = 'entry-stones'
    pile.position.set(ENTRY_LATERAL_OFFSET, 0, ENTRY_CAMERA_Z - ENTRY_FORWARD_OFFSET)
    pile.rotation.y = 0.22
    pile.scale.setScalar(1.35)
    scene.add(pile)

    const stoneGeometry = new THREE.DodecahedronGeometry(1, 0)
    const mossGeometry = new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56)

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: '#676b64',
      emissive: '#151915',
      emissiveIntensity: 0.12,
      roughness: 0.97,
      metalness: 0.02,
    })

    const mossMaterial = new THREE.MeshStandardMaterial({
      color: '#3f6942',
      emissive: '#1f3121',
      emissiveIntensity: 0.16,
      roughness: 0.98,
      metalness: 0,
    })

    stoneLayout.forEach((stone) => {
      const stoneMesh = new THREE.Mesh(stoneGeometry, stoneMaterial)
      stoneMesh.scale.set(stone.sx, stone.sy, stone.sz)
      stoneMesh.position.set(stone.x, GROUND_LEVEL + stone.sy * 0.5 + stone.y, stone.z)
      stoneMesh.rotation.set(0.1, stone.ry, -0.08)
      pile.add(stoneMesh)

      const mossPatch = new THREE.Mesh(mossGeometry, mossMaterial)
      mossPatch.scale.set(stone.sx * stone.moss, stone.sy * 0.42, stone.sz * stone.moss)
      mossPatch.position.set(
        stone.x,
        GROUND_LEVEL + stone.sy + stone.y + 0.035,
        stone.z - 0.02,
      )
      mossPatch.rotation.set(Math.PI, stone.ry * 0.4, 0)
      pile.add(mossPatch)
    })

    return () => {
      scene.remove(pile)
      stoneGeometry.dispose()
      mossGeometry.dispose()
      stoneMaterial.dispose()
      mossMaterial.dispose()
    }
  }, [getScene])

  return null
}

export default EntryStones
