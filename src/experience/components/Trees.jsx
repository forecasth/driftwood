import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'
import { palette } from '../theme.js'

const GROUND_LEVEL = -1.28
const TREE_COUNT = 220
const CAMERA_ORBIT_RADIUS = 38
const CAMERA_ORBIT_CENTER_X = 0
const CAMERA_ORBIT_CENTER_Z = 8.4 + CAMERA_ORBIT_RADIUS
const DEFAULT_SECTION_COUNT = 12
const FOREST_INNER_RADIUS = CAMERA_ORBIT_RADIUS + 12
const FOREST_OUTER_RADIUS = CAMERA_ORBIT_RADIUS + 38
const ENTRY_CLEARING_CENTER_X = 0
const ENTRY_CLEARING_CENTER_Z = -3.7
const ENTRY_CLEARING_RADIUS = 8
const SECTION_SIGN_RADIUS = CAMERA_ORBIT_RADIUS + 18.5
const SECTION_SIGN_SIDE_OFFSET = 8.1
const SECTION_SIGN_HEIGHT = 0
const SECTION_SIGN_FOCUS_Y = 0.56
const SECTION_ARROW_CENTER_Y = GROUND_LEVEL + 0.94
const SECTION_SIGN_PULSE_SPEED = 2.16
const SECTION_SIGN_FACE_BASE = 0.42
const SECTION_SIGN_FACE_PULSE = 0.78
const SECTION_SIGN_EDGE_BASE = 0.74
const SECTION_SIGN_EDGE_PULSE = 1.08
const PLAY_LIGHT_PAUSED_COLOR = '#b8ff45'
const PLAY_LIGHT_ACTIVE_COLOR = '#ffb24a'
const ARRANGEMENT_LIGHT_AMBER = '#ffaf59'
const ARRANGEMENT_LIGHT_MAGENTA = '#df42ff'
const PLAY_LIGHT_INTERVAL_MIN = 10
const PLAY_LIGHT_INTERVAL_MAX = 15
const ARRANGEMENT_LIGHT_INTERVAL_MIN = 5
const ARRANGEMENT_LIGHT_INTERVAL_MAX = 7
const BLINK_PULSE_DURATION = 0.34
const BLINK_PULSE_GAP = 0.16
const PLAY_LIGHT_INTENSITY = 2.4
const ARRANGEMENT_LIGHT_INTENSITY = 2.2
const ARRANGEMENT_CLICK_INTENSITY = 2.7

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomRingRadius(innerRadius, outerRadius) {
  return Math.sqrt(randomRange(innerRadius ** 2, outerRadius ** 2))
}

function getSequenceDuration(pulseCount, pulseDuration, pulseGap) {
  return pulseCount * pulseDuration + (pulseCount - 1) * pulseGap
}

function getPulseStrength(normalizedTime) {
  if (normalizedTime <= 0 || normalizedTime >= 1) {
    return 0
  }

  const wave = Math.sin(normalizedTime * Math.PI)
  return wave * wave
}

function getSequenceStrength(elapsed, sequenceStart, pulseCount, pulseDuration, pulseGap) {
  if (sequenceStart === null) {
    return 0
  }

  const sinceStart = elapsed - sequenceStart
  const duration = getSequenceDuration(pulseCount, pulseDuration, pulseGap)

  if (sinceStart < 0 || sinceStart > duration) {
    return 0
  }

  let strongestPulse = 0

  for (let pulseIndex = 0; pulseIndex < pulseCount; pulseIndex += 1) {
    const pulseStart = pulseIndex * (pulseDuration + pulseGap)
    const normalizedTime = (sinceStart - pulseStart) / pulseDuration
    strongestPulse = Math.max(strongestPulse, getPulseStrength(normalizedTime))
  }

  return strongestPulse
}

function updateScheduledBlink(elapsed, scheduler, config) {
  const { intervalMin, intervalMax, pulseCount, pulseDuration, pulseGap } = config
  const duration = getSequenceDuration(pulseCount, pulseDuration, pulseGap)

  if (
    scheduler.sequenceStart !== null &&
    elapsed - scheduler.sequenceStart > duration
  ) {
    scheduler.sequenceStart = null
    scheduler.nextStart = elapsed + randomRange(intervalMin, intervalMax)
  }

  if (scheduler.sequenceStart === null && elapsed >= scheduler.nextStart) {
    scheduler.sequenceStart = elapsed
  }

  return getSequenceStrength(
    elapsed,
    scheduler.sequenceStart,
    pulseCount,
    pulseDuration,
    pulseGap,
  )
}

function createGroundPulseLights({
  tree,
  color,
  trunkHeight,
  crownHeight,
  crownRadius,
}) {
  const ringLights = []
  const ringLightCount = 6
  const ringRadius = crownRadius * 0.96
  const ringHeight = GROUND_LEVEL + trunkHeight - crownHeight * 0.03

  for (let lightIndex = 0; lightIndex < ringLightCount; lightIndex += 1) {
    const angle = (lightIndex / ringLightCount) * Math.PI * 2
    const x = Math.cos(angle) * ringRadius
    const z = Math.sin(angle) * ringRadius
    const beam = new THREE.SpotLight(color, 0, 6.9, Math.PI * 0.5, 1, 2.2)
    const target = new THREE.Object3D()

    beam.position.set(x, ringHeight, z)
    target.position.set(x * 0.35, GROUND_LEVEL + 0.02, z * 0.35)
    tree.add(beam)
    tree.add(target)
    beam.target = target

    ringLights.push({
      beam,
      intensityScale: 0.88 + Math.sin(angle * 3 + 0.4) * 0.12,
    })
  }

  return ringLights
}

function setLightRig(lights, color, intensity) {
  lights.forEach(({ beam, intensityScale }) => {
    beam.color.set(color)
    beam.intensity = intensity * intensityScale
  })
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

function createArrowSignShape() {
  const shape = new THREE.Shape()
  shape.moveTo(-1.24, 0.32)
  shape.lineTo(0.2, 0.32)
  shape.lineTo(0.2, 0.62)
  shape.lineTo(1.08, 0)
  shape.lineTo(0.2, -0.62)
  shape.lineTo(0.2, -0.32)
  shape.lineTo(-1.24, -0.32)
  shape.lineTo(-1.24, 0.32)
  return shape
}

function createArrowOmbreTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const context = canvas.getContext('2d')

  if (context) {
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
    gradient.addColorStop(0, '#8f4a13')
    gradient.addColorStop(0.45, '#d2842e')
    gradient.addColorStop(1, '#ffd188')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function createSectionSign({
  direction,
  arrowGeometry,
  edgeMaterial,
  faceMaterial,
}) {
  const sign = new THREE.Group()

  const arrowPivot = new THREE.Group()
  arrowPivot.position.set(0, SECTION_ARROW_CENTER_Y, 0.18)
  arrowPivot.scale.x = direction
  sign.add(arrowPivot)

  const edge = new THREE.Mesh(arrowGeometry, edgeMaterial)
  edge.position.z = -0.02
  edge.scale.set(1.12, 1.12, 1.08)
  arrowPivot.add(edge)

  const face = new THREE.Mesh(arrowGeometry, faceMaterial)
  face.position.z = 0.015
  arrowPivot.add(face)

  return sign
}

function Trees() {
  const {
    getScene,
    registerFrame,
    registerClickable,
    togglePlayback,
    switchArrangement,
    isPlaying,
    sectionCount,
    stepSection,
  } = useSceneContext()
  const isPlayingRef = useRef(isPlaying)
  const safeSectionCount = Math.max(1, Math.round(sectionCount || DEFAULT_SECTION_COUNT))

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

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
    const playTreeTrunkHeight = 2.7
    const playTreeTrunkRadius = 0.15
    const playTreeCrownHeight = 2.6
    const playTreeCrownRadius = 1.08
    const arrangementTreeTrunkHeight = 2.9
    const arrangementTreeTrunkRadius = 0.16
    const arrangementTreeCrownHeight = 2.75
    const arrangementTreeCrownRadius = 1.12
    const arrowShape = createArrowSignShape()
    const arrowGeometry = new THREE.ExtrudeGeometry(arrowShape, {
      depth: 0.14,
      bevelEnabled: false,
    })
    arrowGeometry.center()
    const arrowOmbreTexture = createArrowOmbreTexture()

    const signFaceColorMin = new THREE.Color('#c57520')
    const signFaceColorMax = new THREE.Color('#ffd48d')
    const signFaceEmissiveMin = new THREE.Color('#6d3309')
    const signFaceEmissiveMax = new THREE.Color('#f4a33f')
    const signEdgeColorMin = new THREE.Color('#a65814')
    const signEdgeColorMax = new THREE.Color('#ffca72')
    const signEdgeEmissiveMin = new THREE.Color('#7a360a')
    const signEdgeEmissiveMax = new THREE.Color('#ffaf4d')
    const signFaceMaterial = new THREE.MeshStandardMaterial({
      color: signFaceColorMin,
      emissive: signFaceEmissiveMin,
      emissiveIntensity: SECTION_SIGN_FACE_BASE,
      map: arrowOmbreTexture,
      roughness: 0.64,
      metalness: 0.04,
    })
    const signEdgeMaterial = new THREE.MeshStandardMaterial({
      color: signEdgeColorMin,
      emissive: signEdgeEmissiveMin,
      emissiveIntensity: SECTION_SIGN_EDGE_BASE,
      roughness: 0.36,
      metalness: 0.08,
    })

    let plantedTrees = 0
    let attempts = 0
    const maxAttempts = TREE_COUNT * 20

    while (plantedTrees < TREE_COUNT && attempts < maxAttempts) {
      attempts += 1

      const angle = randomRange(0, Math.PI * 2)
      const radius = randomRingRadius(FOREST_INNER_RADIUS, FOREST_OUTER_RADIUS)
      const x = CAMERA_ORBIT_CENTER_X + Math.cos(angle) * radius
      const z = CAMERA_ORBIT_CENTER_Z + Math.sin(angle) * radius

      const entryDx = x - ENTRY_CLEARING_CENTER_X
      const entryDz = z - ENTRY_CLEARING_CENTER_Z

      if (entryDx * entryDx + entryDz * entryDz < ENTRY_CLEARING_RADIUS ** 2) {
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
      plantedTrees += 1
    }

    const playTree = createTree({
      trunkGeometry,
      crownGeometry,
      trunkMaterial: amberTrunkMaterial,
      crownMaterial: playTreeMaterial,
      trunkHeight: playTreeTrunkHeight,
      trunkRadius: playTreeTrunkRadius,
      crownHeight: playTreeCrownHeight,
      crownRadius: playTreeCrownRadius,
    })
    playTree.position.set(-2.35, 0, -3.7)
    playTree.rotation.y = -0.2
    treeGroup.add(playTree)

    const arrangementTree = createTree({
      trunkGeometry,
      crownGeometry,
      trunkMaterial: amberTrunkMaterial,
      crownMaterial: arrangementTreeMaterial,
      trunkHeight: arrangementTreeTrunkHeight,
      trunkRadius: arrangementTreeTrunkRadius,
      crownHeight: arrangementTreeCrownHeight,
      crownRadius: arrangementTreeCrownRadius,
    })
    arrangementTree.position.set(2.45, 0, -3.55)
    arrangementTree.rotation.y = 0.18
    treeGroup.add(arrangementTree)

    const signUp = new THREE.Vector3(0, 1, 0)
    const outward = new THREE.Vector3()
    const lateral = new THREE.Vector3()
    const focusTarget = new THREE.Vector3()
    const targetMatrix = new THREE.Matrix4()
    const targetQuaternion = new THREE.Quaternion()
    const sectionSignUnsubscribers = []
    const signSideConfigs = [
      { side: -1, direction: 1, name: 'section-sign-left', sectionDelta: -1 },
      { side: 1, direction: -1, name: 'section-sign-right', sectionDelta: 1 },
    ]

    for (let section = 0; section < safeSectionCount; section += 1) {
      const sectionAngle = (section / safeSectionCount) * Math.PI * 2
      outward.set(Math.sin(sectionAngle), 0, -Math.cos(sectionAngle))
      lateral.set(Math.cos(sectionAngle), 0, Math.sin(sectionAngle))
      focusTarget.set(
        CAMERA_ORBIT_CENTER_X + outward.x * CAMERA_ORBIT_RADIUS,
        SECTION_SIGN_FOCUS_Y,
        CAMERA_ORBIT_CENTER_Z + outward.z * CAMERA_ORBIT_RADIUS,
      )

      signSideConfigs.forEach(({ side, direction, name, sectionDelta }) => {
        const sectionSign = createSectionSign({
          direction,
          arrowGeometry,
          edgeMaterial: signEdgeMaterial,
          faceMaterial: signFaceMaterial,
        })

        sectionSign.name = `${name}-${section}`
        sectionSign.position.set(
          CAMERA_ORBIT_CENTER_X +
            outward.x * SECTION_SIGN_RADIUS +
            lateral.x * SECTION_SIGN_SIDE_OFFSET * side,
          SECTION_SIGN_HEIGHT,
          CAMERA_ORBIT_CENTER_Z +
            outward.z * SECTION_SIGN_RADIUS +
            lateral.z * SECTION_SIGN_SIDE_OFFSET * side,
        )
        targetMatrix.lookAt(sectionSign.position, focusTarget, signUp)
        targetQuaternion.setFromRotationMatrix(targetMatrix)
        sectionSign.quaternion.copy(targetQuaternion)
        treeGroup.add(sectionSign)

        sectionSignUnsubscribers.push(
          registerClickable(sectionSign, () => {
            stepSection(sectionDelta)
          }),
        )
      })
    }

    const playTreeLights = createGroundPulseLights({
      tree: playTree,
      color: PLAY_LIGHT_PAUSED_COLOR,
      trunkHeight: playTreeTrunkHeight,
      crownHeight: playTreeCrownHeight,
      crownRadius: playTreeCrownRadius,
    })
    const arrangementTreeLights = createGroundPulseLights({
      tree: arrangementTree,
      color: ARRANGEMENT_LIGHT_AMBER,
      trunkHeight: arrangementTreeTrunkHeight,
      crownHeight: arrangementTreeCrownHeight,
      crownRadius: arrangementTreeCrownRadius,
    })

    const playBlinkScheduler = {
      mode: isPlayingRef.current ? 'playing' : 'paused',
      nextStart: randomRange(PLAY_LIGHT_INTERVAL_MIN, PLAY_LIGHT_INTERVAL_MAX),
      sequenceStart: null,
    }
    const arrangementBlinkScheduler = {
      nextStart: randomRange(
        ARRANGEMENT_LIGHT_INTERVAL_MIN,
        ARRANGEMENT_LIGHT_INTERVAL_MAX,
      ),
      sequenceStart: null,
    }
    const arrangementClickFlash = {
      pending: false,
      sequenceStart: null,
    }

    const unregisterPlay = registerClickable(playTree, () => {
      togglePlayback()
    })
    const unregisterArrangement = registerClickable(arrangementTree, () => {
      arrangementClickFlash.pending = true
      arrangementClickFlash.sequenceStart = null
      switchArrangement()
    })
    const unsubscribePulse = registerFrame(({ elapsed }) => {
      const playMode = isPlayingRef.current ? 'playing' : 'paused'

      if (playMode !== playBlinkScheduler.mode) {
        playBlinkScheduler.mode = playMode
        playBlinkScheduler.sequenceStart = null
        playBlinkScheduler.nextStart =
          elapsed + randomRange(PLAY_LIGHT_INTERVAL_MIN, PLAY_LIGHT_INTERVAL_MAX)
        arrangementBlinkScheduler.sequenceStart = null
        arrangementBlinkScheduler.nextStart =
          elapsed +
          randomRange(
            ARRANGEMENT_LIGHT_INTERVAL_MIN,
            ARRANGEMENT_LIGHT_INTERVAL_MAX,
          )
      }

      const playPulseCount = playMode === 'playing' ? 1 : 2
      const playStrength = updateScheduledBlink(elapsed, playBlinkScheduler, {
        intervalMin: PLAY_LIGHT_INTERVAL_MIN,
        intervalMax: PLAY_LIGHT_INTERVAL_MAX,
        pulseCount: playPulseCount,
        pulseDuration: BLINK_PULSE_DURATION,
        pulseGap: BLINK_PULSE_GAP,
      })
      const playLightColor =
        playMode === 'playing' ? PLAY_LIGHT_ACTIVE_COLOR : PLAY_LIGHT_PAUSED_COLOR
      const playFlicker = 0.9 + Math.sin(elapsed * 17.8) * 0.1
      setLightRig(
        playTreeLights,
        playLightColor,
        playStrength * PLAY_LIGHT_INTENSITY * playFlicker,
      )

      let arrangementStrength = 0

      if (playMode === 'playing') {
        arrangementStrength = updateScheduledBlink(elapsed, arrangementBlinkScheduler, {
          intervalMin: ARRANGEMENT_LIGHT_INTERVAL_MIN,
          intervalMax: ARRANGEMENT_LIGHT_INTERVAL_MAX,
          pulseCount: 2,
          pulseDuration: BLINK_PULSE_DURATION,
          pulseGap: BLINK_PULSE_GAP,
        })
      } else {
        arrangementBlinkScheduler.sequenceStart = null
      }

      if (arrangementClickFlash.pending) {
        arrangementClickFlash.pending = false
        arrangementClickFlash.sequenceStart = elapsed
      }

      const arrangementClickDuration = getSequenceDuration(
        2,
        BLINK_PULSE_DURATION * 0.86,
        BLINK_PULSE_GAP * 0.92,
      )
      const arrangementClickStrength = getSequenceStrength(
        elapsed,
        arrangementClickFlash.sequenceStart,
        2,
        BLINK_PULSE_DURATION * 0.86,
        BLINK_PULSE_GAP * 0.92,
      )

      if (
        arrangementClickFlash.sequenceStart !== null &&
        elapsed - arrangementClickFlash.sequenceStart > arrangementClickDuration
      ) {
        arrangementClickFlash.sequenceStart = null
      }

      if (arrangementClickStrength > 0.0001) {
        const magentaFlicker = 0.93 + Math.sin(elapsed * 20.2) * 0.07
        setLightRig(
          arrangementTreeLights,
          ARRANGEMENT_LIGHT_MAGENTA,
          arrangementClickStrength * ARRANGEMENT_CLICK_INTENSITY * magentaFlicker,
        )
      } else if (arrangementStrength > 0.0001) {
        const amberFlicker = 0.9 + Math.sin(elapsed * 16.4 + 0.9) * 0.1
        setLightRig(
          arrangementTreeLights,
          ARRANGEMENT_LIGHT_AMBER,
          arrangementStrength * ARRANGEMENT_LIGHT_INTENSITY * amberFlicker,
        )
      } else {
        setLightRig(arrangementTreeLights, ARRANGEMENT_LIGHT_AMBER, 0)
      }

      playTreeMaterial.emissiveIntensity =
        0.24 + Math.sin(elapsed * 1.2) * 0.04 + playStrength * 0.22
      arrangementTreeMaterial.emissiveIntensity =
        0.22 +
        Math.sin(elapsed * 1.05 + 1.4) * 0.04 +
        Math.max(arrangementStrength, arrangementClickStrength) * 0.2

      const signPulse = 0.5 + Math.sin(elapsed * SECTION_SIGN_PULSE_SPEED) * 0.5
      signFaceMaterial.color.lerpColors(signFaceColorMin, signFaceColorMax, signPulse)
      signFaceMaterial.emissive.lerpColors(
        signFaceEmissiveMin,
        signFaceEmissiveMax,
        signPulse,
      )
      signFaceMaterial.emissiveIntensity =
        SECTION_SIGN_FACE_BASE + signPulse * SECTION_SIGN_FACE_PULSE
      signEdgeMaterial.color.lerpColors(signEdgeColorMin, signEdgeColorMax, signPulse)
      signEdgeMaterial.emissive.lerpColors(
        signEdgeEmissiveMin,
        signEdgeEmissiveMax,
        signPulse,
      )
      signEdgeMaterial.emissiveIntensity =
        SECTION_SIGN_EDGE_BASE + signPulse * SECTION_SIGN_EDGE_PULSE
    })

    return () => {
      unregisterPlay()
      unregisterArrangement()
      sectionSignUnsubscribers.forEach((unregister) => {
        unregister()
      })
      unsubscribePulse()

      scene.remove(treeGroup)

      trunkGeometry.dispose()
      crownGeometry.dispose()
      arrowGeometry.dispose()
      arrowOmbreTexture.dispose()
      darkTrunkMaterial.dispose()
      darkCrownMaterial.dispose()
      amberTrunkMaterial.dispose()
      playTreeMaterial.dispose()
      arrangementTreeMaterial.dispose()
      signFaceMaterial.dispose()
      signEdgeMaterial.dispose()
    }
  }, [
    getScene,
    registerClickable,
    registerFrame,
    safeSectionCount,
    stepSection,
    switchArrangement,
    togglePlayback,
  ])

  return null
}

export default Trees
