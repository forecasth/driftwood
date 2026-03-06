import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'
import { palette } from '../theme.js'

const GROUND_LEVEL = -1.28
const TREE_COUNT = 220
const CAMERA_ORBIT_RADIUS = 38
const CAMERA_ORBIT_CENTER_X = 0
const CAMERA_ORBIT_CENTER_Z = 8.4 + CAMERA_ORBIT_RADIUS
const FOREST_INNER_RADIUS = CAMERA_ORBIT_RADIUS + 12
const FOREST_OUTER_RADIUS = CAMERA_ORBIT_RADIUS + 38
const ENTRY_CLEARING_CENTER_X = 0
const ENTRY_CLEARING_CENTER_Z = -3.7
const ENTRY_CLEARING_RADIUS = 8
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

function Trees() {
  const {
    getScene,
    registerFrame,
    registerClickable,
    togglePlayback,
    switchArrangement,
    isPlaying,
  } = useSceneContext()
  const isPlayingRef = useRef(isPlaying)

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
