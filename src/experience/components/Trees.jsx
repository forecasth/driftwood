import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'
import { palette } from '../theme.js'

const GROUND_LEVEL = -1.28
const TREE_COUNT = 58

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function createTree({
  trunkGeometry,
  crownGeometry,
  trunkMaterial,
  crownMaterial,
  trunkHeight,
  trunkRadius,
  crownHeight,
  crownRadius,
}) {
  const tree = new THREE.Group()

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.scale.set(trunkRadius, trunkHeight, trunkRadius)
  trunk.position.y = GROUND_LEVEL + trunkHeight * 0.5

  const lowerCrown = new THREE.Mesh(crownGeometry, crownMaterial)
  lowerCrown.scale.set(crownRadius, crownHeight, crownRadius)
  lowerCrown.position.y = GROUND_LEVEL + trunkHeight + crownHeight * 0.44

  const midCrown = new THREE.Mesh(crownGeometry, crownMaterial)
  midCrown.scale.set(crownRadius * 0.85, crownHeight * 0.82, crownRadius * 0.85)
  midCrown.position.y = GROUND_LEVEL + trunkHeight + crownHeight * 0.72
  
  const upperCrown = new THREE.Mesh(crownGeometry, crownMaterial)
  upperCrown.scale.set(crownRadius * 0.72, crownHeight * 0.76, crownRadius * 0.72)
  upperCrown.position.y = GROUND_LEVEL + trunkHeight + crownHeight * 0.92


  tree.add(trunk, lowerCrown, midCrown, upperCrown)
  return tree
}

function Trees() {
  const {
    getScene,
    registerFrame,
    registerClickable,
    togglePlayback,
    switchArrangement,
  } = useSceneContext()

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const treeGroup = new THREE.Group()
    treeGroup.name = 'tree-group'
    scene.add(treeGroup)

    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 1, 7)
    const crownGeometry = new THREE.ConeGeometry(1, 1, 8)

    const darkTrunkMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.treeTrunk),
      roughness: 0.95,
      metalness: 0.02,
    })
    const darkCrownMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.treeCanopy),
      emissive: new THREE.Color(palette.treeCanopyEmissive),
      emissiveIntensity: 0.12,
      roughness: 0.9,
      metalness: 0.01,
    })

    const amberTrunkMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.amberTreeBark),
      emissive: new THREE.Color(palette.amberTreeGlow),
      emissiveIntensity: 0.1,
      roughness: 0.9,
      metalness: 0.03,
    })
    const playTreeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.amberTree),
      emissive: new THREE.Color(palette.amberTreeGlow),
      emissiveIntensity: 0.3,
      roughness: 0.88,
      metalness: 0.04,
    })
    const arrangementTreeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.amberTree),
      emissive: new THREE.Color(palette.amberTreeGlow),
      emissiveIntensity: 0.28,
      roughness: 0.87,
      metalness: 0.04,
    })

    for (let i = 0; i < TREE_COUNT; i += 1) {
      const x = randomRange(-24, 24)
      const z = randomRange(-52, -6)

      if (Math.abs(x) < 5.4 && z > -14) {
        continue
      }

      const tree = createTree({
        trunkGeometry,
        crownGeometry,
        trunkMaterial: darkTrunkMaterial,
        crownMaterial: darkCrownMaterial,
        trunkHeight: randomRange(2.3, 4.9),
        trunkRadius: randomRange(0.09, 0.19),
        crownHeight: randomRange(1.9, 4.2),
        crownRadius: randomRange(0.68, 1.45),
      })

      tree.position.set(x, 0, z)
      tree.rotation.y = randomRange(0, Math.PI * 2)
      treeGroup.add(tree)
    }

    const playTree = createTree({
      trunkGeometry,
      crownGeometry,
      trunkMaterial: amberTrunkMaterial,
      crownMaterial: playTreeMaterial,
      trunkHeight: 2.7,
      trunkRadius: 0.15,
      crownHeight: 2.6,
      crownRadius: 1.08,
    })
    playTree.position.set(-2.35, 0, -3.7)
    playTree.rotation.y = -0.2
    treeGroup.add(playTree)

    const arrangementTree = createTree({
      trunkGeometry,
      crownGeometry,
      trunkMaterial: amberTrunkMaterial,
      crownMaterial: arrangementTreeMaterial,
      trunkHeight: 2.9,
      trunkRadius: 0.16,
      crownHeight: 2.75,
      crownRadius: 1.12,
    })
    arrangementTree.position.set(2.45, 0, -3.55)
    arrangementTree.rotation.y = 0.18
    treeGroup.add(arrangementTree)

    const unregisterPlay = registerClickable(playTree, () => {
      togglePlayback()
    })
    const unregisterArrangement = registerClickable(arrangementTree, () => {
      switchArrangement()
    })

    const unsubscribePulse = registerFrame(({ elapsed }) => {
      playTreeMaterial.emissiveIntensity = 0.27 + Math.sin(elapsed * 1.2) * 0.06
      arrangementTreeMaterial.emissiveIntensity =
        0.25 + Math.sin(elapsed * 1.05 + 1.4) * 0.05
    })

    return () => {
      unregisterPlay()
      unregisterArrangement()
      unsubscribePulse()

      scene.remove(treeGroup)

      trunkGeometry.dispose()
      crownGeometry.dispose()
      darkTrunkMaterial.dispose()
      darkCrownMaterial.dispose()
      amberTrunkMaterial.dispose()
      playTreeMaterial.dispose()
      arrangementTreeMaterial.dispose()
    }
  }, [
    getScene,
    registerClickable,
    registerFrame,
    switchArrangement,
    togglePlayback,
  ])

  return null
}

export default Trees
