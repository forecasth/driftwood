import * as THREE from 'three'
import { worldConfig } from '../../data/worldConfig.js'
import {
  computeSegmentEmphasis,
  createColorVariation,
  createSeededRandom,
  disposeObject3D,
  getLateralVector,
  getRingPoint,
  getSectionArc,
  randomRange,
  sampleRange,
  sampleRingRadius,
} from '../../scenes/common/sceneUtils.js'

function createTree({
  trunkGeometry,
  crownGeometry,
  trunkMaterial,
  crownMaterial,
  treeConfig,
  random,
}) {
  const trunkHeight = sampleRange(treeConfig.trunkHeight, random)
  const trunkRadius = sampleRange(treeConfig.trunkRadius, random)
  const crownHeight = sampleRange(treeConfig.crownHeight, random)
  const crownRadius = sampleRange(treeConfig.crownRadius, random)
  const canopyLayers = Math.max(1, Math.round(treeConfig.canopyLayers))
  const tree = new THREE.Group()

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
  trunk.scale.set(trunkRadius, trunkHeight, trunkRadius)
  trunk.position.y = worldConfig.groundLevel + trunkHeight * 0.5
  tree.add(trunk)

  const layerScale = [1, 0.84, 0.68]
  const layerHeight = [0.42, 0.72, 0.94]

  for (let index = 0; index < canopyLayers; index += 1) {
    const crown = new THREE.Mesh(crownGeometry, crownMaterial)
    const scale = layerScale[index] ?? layerScale[layerScale.length - 1]
    const heightOffset = layerHeight[index] ?? 1
    crown.scale.set(
      crownRadius * scale,
      crownHeight * (0.82 + scale * 0.18),
      crownRadius * scale,
    )
    crown.position.y = worldConfig.groundLevel + trunkHeight + crownHeight * heightOffset
    tree.add(crown)
  }

  return {
    tree,
    lean: randomRange(-treeConfig.leanAmount, treeConfig.leanAmount, random),
    swayPhase: randomRange(0, Math.PI * 2, random),
    swaySpeed: treeConfig.swaySpeed * randomRange(0.82, 1.18, random),
    swayAmount: treeConfig.swayAmount * randomRange(0.74, 1.22, random),
  }
}

export default function createRingSegment({
  sceneConfig,
  segmentIndex,
  worldGroup,
  registerFrame,
  registerHoverTarget,
  getSectionState,
}) {
  const random = createSeededRandom(sceneConfig.id)
  const sectionArc = getSectionArc(
    segmentIndex,
    worldConfig.sectionCount,
    worldConfig.ring.segmentPadding,
  )
  const segmentGroup = new THREE.Group()
  segmentGroup.name = sceneConfig.slug
  worldGroup.add(segmentGroup)

  const groundGeometry = new THREE.RingGeometry(
    worldConfig.ring.groundInnerRadius,
    worldConfig.ring.groundOuterRadius,
    52,
    2,
    sectionArc.thetaStart,
    sectionArc.thetaLength,
  )
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: sceneConfig.ground.color,
    emissive: sceneConfig.ground.emissive,
    emissiveIntensity: 0.08,
    roughness: sceneConfig.ground.roughness,
    metalness: sceneConfig.ground.metalness,
    transparent: true,
    opacity: sceneConfig.ground.opacity,
  })
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.y = worldConfig.groundLevel + sceneConfig.ground.heightOffset
  segmentGroup.add(groundMesh)

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: sceneConfig.accent.color,
    transparent: true,
    opacity: 0.08,
  })
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(groundGeometry, 12),
    outlineMaterial,
  )
  outline.rotation.x = -Math.PI / 2
  outline.position.copy(groundMesh.position)
  segmentGroup.add(outline)

  const mistMaterial = new THREE.MeshBasicMaterial({
    color: sceneConfig.fog.color,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mistMesh = new THREE.Mesh(
    new THREE.RingGeometry(
      worldConfig.ring.groundInnerRadius + 1.2,
      worldConfig.ring.groundOuterRadius - 1.4,
      40,
      1,
      sectionArc.thetaStart,
      sectionArc.thetaLength,
    ),
    mistMaterial,
  )
  mistMesh.rotation.x = -Math.PI / 2
  mistMesh.position.y = worldConfig.groundLevel + 0.14 + sceneConfig.ground.heightOffset
  segmentGroup.add(mistMesh)

  const hitMesh = new THREE.Mesh(
    new THREE.RingGeometry(
      worldConfig.ring.hoverInnerRadius,
      worldConfig.ring.hoverOuterRadius,
      20,
      1,
      sectionArc.thetaStart,
      sectionArc.thetaLength,
    ),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  hitMesh.rotation.x = -Math.PI / 2
  hitMesh.position.y = worldConfig.groundLevel + 0.42
  hitMesh.userData.segmentIndex = segmentIndex
  segmentGroup.add(hitMesh)

  const unregisterHover = registerHoverTarget(hitMesh, { segmentIndex })

  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: createColorVariation(sceneConfig.palette.trunk, random, 0.04),
    roughness: 0.95,
    metalness: 0.02,
  })
  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: createColorVariation(sceneConfig.palette.canopy, random, 0.08),
    emissive: sceneConfig.palette.canopyEmissive,
    emissiveIntensity: sceneConfig.trees.emissiveIntensity,
    roughness: 0.9,
    metalness: 0.02,
    transparent: sceneConfig.trees.canopyOpacity < 0.999,
    opacity: sceneConfig.trees.canopyOpacity,
  })
  const trunkGeometry = new THREE.CylinderGeometry(1, 1, 1, 7)
  const crownGeometry = new THREE.ConeGeometry(1, 1, 8)

  const treeGroup = new THREE.Group()
  treeGroup.name = `${sceneConfig.id}-trees`
  segmentGroup.add(treeGroup)

  const treeEntries = []
  let attempts = 0
  const maxAttempts = sceneConfig.trees.count * 36

  while (treeEntries.length < sceneConfig.trees.count && attempts < maxAttempts) {
    attempts += 1

    const angle =
      sectionArc.centerAngle +
      randomRange(-sectionArc.thetaLength * 0.42, sectionArc.thetaLength * 0.42, random)
    const radius = sampleRingRadius(
      worldConfig.ring.forestInnerRadius,
      worldConfig.ring.forestOuterRadius,
      random,
    )
    const position = getRingPoint(angle, radius)
    const spacing = sceneConfig.trees.spacing + randomRange(-0.4, 0.6, random)
    const blocked = treeEntries.some((entry) => {
      const dx = entry.tree.position.x - position.x
      const dz = entry.tree.position.z - position.z
      return dx * dx + dz * dz < spacing * spacing
    })

    if (blocked) {
      continue
    }

    const treeEntry = createTree({
      trunkGeometry,
      crownGeometry,
      trunkMaterial,
      crownMaterial: canopyMaterial,
      treeConfig: sceneConfig.trees,
      random,
    })
    treeEntry.tree.position.set(position.x, 0, position.z)
    treeEntry.tree.rotation.y = randomRange(0, Math.PI * 2, random)
    treeEntry.baseRotationY = treeEntry.tree.rotation.y
    treeGroup.add(treeEntry.tree)
    treeEntries.push(treeEntry)
  }

  const lateralVector = getLateralVector(sectionArc.centerAngle)
  const getAnchor = (radiusMix = 0.5, lateralOffset = 0, height = 0) => {
    const radius = THREE.MathUtils.lerp(
      worldConfig.ring.forestInnerRadius + 2,
      worldConfig.ring.groundOuterRadius - 8,
      radiusMix,
    )
    const anchor = getRingPoint(
      sectionArc.centerAngle,
      radius,
      worldConfig.groundLevel + height,
    )
    anchor.x += lateralVector.x * lateralOffset
    anchor.z += lateralVector.z * lateralOffset
    return anchor
  }

  const accentInstance = sceneConfig.createAccent?.({
    sceneConfig,
    segmentIndex,
    random,
    getAnchor,
  })

  if (accentInstance?.object) {
    segmentGroup.add(accentInstance.object)
  }

  const initialState = getSectionState()
  let emphasis = computeSegmentEmphasis(
    segmentIndex,
    initialState.activeSectionIndex,
    initialState.hoveredSectionIndex,
    worldConfig.sectionCount,
  )

  const unsubscribe = registerFrame(({ delta, elapsed }) => {
    const { activeSectionIndex, hoveredSectionIndex, sectionCount } = getSectionState()
    const targetEmphasis = computeSegmentEmphasis(
      segmentIndex,
      activeSectionIndex,
      hoveredSectionIndex,
      sectionCount,
    )
    emphasis = THREE.MathUtils.damp(emphasis, targetEmphasis, 4.2, delta)

    groundMaterial.emissiveIntensity =
      0.06 +
      emphasis * (0.16 + sceneConfig.motion.shimmer * 0.48) +
      Math.sin(elapsed * (0.5 + sceneConfig.motion.shimmer * 6)) *
        sceneConfig.motion.shimmer *
        0.04
    groundMaterial.opacity = sceneConfig.ground.opacity - 0.03 + emphasis * 0.05
    outlineMaterial.opacity = 0.04 + emphasis * 0.18
    mistMaterial.opacity = 0.02 + sceneConfig.motion.fogDrift * 0.18 + emphasis * 0.06
    mistMesh.rotation.z =
      Math.sin(elapsed * (0.08 + sceneConfig.motion.fogDrift * 0.18) + segmentIndex) *
      0.04
    canopyMaterial.emissiveIntensity = sceneConfig.trees.emissiveIntensity + emphasis * 0.08

    treeEntries.forEach((treeEntry) => {
      treeEntry.tree.rotation.z =
        treeEntry.lean +
        Math.sin(elapsed * treeEntry.swaySpeed + treeEntry.swayPhase) *
          treeEntry.swayAmount *
          (0.42 + emphasis * 0.86)
      treeEntry.tree.rotation.y =
        treeEntry.baseRotationY +
        Math.sin(elapsed * treeEntry.swaySpeed * 0.32 + treeEntry.swayPhase) * 0.02
    })

    accentInstance?.update?.({
      delta,
      elapsed,
      emphasis,
      active: activeSectionIndex === segmentIndex,
      hovered: hoveredSectionIndex === segmentIndex,
    })
  })

  return () => {
    unregisterHover()
    unsubscribe()
    worldGroup.remove(segmentGroup)
    disposeObject3D(segmentGroup)
    trunkGeometry.dispose()
    crownGeometry.dispose()
    trunkMaterial.dispose()
    canopyMaterial.dispose()
  }
}
