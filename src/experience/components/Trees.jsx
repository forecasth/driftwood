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
const PLAY_PARTICLE_COUNT = 18
const ARRANGEMENT_PARTICLE_COUNT = 20
const PARTICLE_BASE_OPACITY = 0.46
const PARTICLE_OPACITY_SWING = 0.24
const PLAY_PARTICLE_ACTIVITY_PAUSED = 0.58
const PLAY_PARTICLE_ACTIVITY_PLAYING = 0.92
const ARRANGEMENT_PARTICLE_ACTIVITY_PAUSED = 0.52
const ARRANGEMENT_PARTICLE_ACTIVITY_PLAYING = 0.78
const PARTICLE_COLOR_LERP = 0.12
const ARRANGEMENT_CLICK_FLASH_DURATION = 0.88
const PARTICLE_RADIUS_MIN_MULTIPLIER = 1.14
const PARTICLE_RADIUS_MAX_MULTIPLIER = 1.46

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomRingRadius(innerRadius, outerRadius) {
  return Math.sqrt(randomRange(innerRadius ** 2, outerRadius ** 2))
}

function createGlowSpriteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')

  if (context) {
    const center = canvas.width * 0.5
    const gradient = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    )
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.22, 'rgba(255,246,224,0.96)')
    gradient.addColorStop(0.56, 'rgba(255,201,125,0.42)')
    gradient.addColorStop(1, 'rgba(255,148,80,0)')
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

function createTreeParticleSwarm({
  tree,
  texture,
  color,
  particleCount,
  trunkHeight,
  crownHeight,
  crownRadius,
}) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: new THREE.Color(color),
    transparent: true,
    opacity: PARTICLE_BASE_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const swarmGroup = new THREE.Group()
  const particles = []
  const yMin = GROUND_LEVEL + 0.26
  const yMax = GROUND_LEVEL + trunkHeight + crownHeight * 1.08
  const ySpan = Math.max(0.1, yMax - yMin)

  for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
    const sprite = new THREE.Sprite(material)
    const baseScale = randomRange(0.18, 0.38)
    const orbitAngle = randomRange(0, Math.PI * 2)
    const orbitSpeed = randomRange(0.4, 0.9) * (Math.random() < 0.5 ? -1 : 1)
    const radiusAnchor =
      crownRadius *
      randomRange(PARTICLE_RADIUS_MIN_MULTIPLIER, PARTICLE_RADIUS_MAX_MULTIPLIER)
    const radialAmplitude = crownRadius * randomRange(0.015, 0.05)
    const radialPhase = randomRange(0, Math.PI * 2)
    const radialSpeed = randomRange(0.5, 1.32)
    const heightRatio = randomRange(0.04, 0.96)
    const bobAmplitude = randomRange(0.08, 0.26)
    const bobPhase = randomRange(0, Math.PI * 2)
    const bobSpeed = randomRange(0.58, 1.44)
    const twinklePhase = randomRange(0, Math.PI * 2)
    const twinkleSpeed = randomRange(3.6, 7.8)
    const wavePhase = randomRange(0, Math.PI * 2)

    sprite.scale.setScalar(baseScale)
    swarmGroup.add(sprite)
    particles.push({
      sprite,
      baseScale,
      orbitAngle,
      orbitSpeed,
      radiusAnchor,
      radialAmplitude,
      radialPhase,
      radialSpeed,
      yMin,
      ySpan,
      heightRatio,
      bobAmplitude,
      bobPhase,
      bobSpeed,
      twinklePhase,
      twinkleSpeed,
      wavePhase,
    })
  }

  tree.add(swarmGroup)
  return { group: swarmGroup, material, particles }
}

function updateTreeParticleSwarm(
  swarm,
  elapsed,
  delta,
  activity,
  options = {},
) {
  const {
    speedScale = 1,
    waveAmplitude = 0,
    waveFrequency = 1.9,
    waveSpeedScale = 1,
  } = options
  const safeDelta = Math.min(Math.max(delta, 0), 0.05)
  const motionBoost = (0.72 + activity * 0.58) * speedScale
  const scaleBoost = 0.86 + activity * 0.34

  swarm.particles.forEach((particle) => {
    particle.orbitAngle += safeDelta * particle.orbitSpeed * motionBoost
    particle.radialPhase += safeDelta * particle.radialSpeed * (0.86 + activity * 0.32)
    particle.bobPhase += safeDelta * particle.bobSpeed * waveSpeedScale
    particle.twinklePhase += safeDelta * particle.twinkleSpeed

    const radius =
      particle.radiusAnchor +
      Math.sin(particle.radialPhase) * particle.radialAmplitude
    const waveY =
      Math.sin(elapsed * waveFrequency + particle.wavePhase) * waveAmplitude
    const unclampedY =
      particle.yMin +
      particle.ySpan * particle.heightRatio +
      Math.sin(particle.bobPhase) * particle.bobAmplitude +
      waveY
    const y = Math.min(
      particle.yMin + particle.ySpan,
      Math.max(particle.yMin, unclampedY),
    )
    const twinkle =
      0.78 + Math.sin(particle.twinklePhase) * 0.22
    const scale = particle.baseScale * twinkle * scaleBoost

    particle.sprite.position.set(
      Math.cos(particle.orbitAngle) * radius,
      y,
      Math.sin(particle.orbitAngle) * radius,
    )
    particle.sprite.scale.setScalar(scale)
  })
}

function setTreeParticleSwarmAppearance(swarm, color, opacity) {
  swarm.material.color.copy(color)
  swarm.material.opacity = opacity
}

function disposeTreeParticleSwarm(swarm) {
  swarm.material.dispose()
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

    const glowParticleTexture = createGlowSpriteTexture()
    const playTreeParticles = createTreeParticleSwarm({
      tree: playTree,
      texture: glowParticleTexture,
      color: PLAY_LIGHT_PAUSED_COLOR,
      particleCount: PLAY_PARTICLE_COUNT,
      trunkHeight: playTreeTrunkHeight,
      crownHeight: playTreeCrownHeight,
      crownRadius: playTreeCrownRadius,
    })
    const arrangementTreeParticles = createTreeParticleSwarm({
      tree: arrangementTree,
      texture: glowParticleTexture,
      color: ARRANGEMENT_LIGHT_AMBER,
      particleCount: ARRANGEMENT_PARTICLE_COUNT,
      trunkHeight: arrangementTreeTrunkHeight,
      crownHeight: arrangementTreeCrownHeight,
      crownRadius: arrangementTreeCrownRadius,
    })

    const playParticleColor = new THREE.Color(PLAY_LIGHT_PAUSED_COLOR)
    const playParticleTargetColor = new THREE.Color(PLAY_LIGHT_PAUSED_COLOR)
    const arrangementAmberColor = new THREE.Color(ARRANGEMENT_LIGHT_AMBER)
    const arrangementMagentaColor = new THREE.Color(ARRANGEMENT_LIGHT_MAGENTA)
    const arrangementParticleColor = new THREE.Color(ARRANGEMENT_LIGHT_AMBER)
    const arrangementParticleTargetColor = new THREE.Color(ARRANGEMENT_LIGHT_AMBER)
    const arrangementClickFlash = {
      pending: false,
      startTime: null,
    }

    const unregisterPlay = registerClickable(playTree, () => {
      togglePlayback()
    })
    const unregisterArrangement = registerClickable(arrangementTree, () => {
      arrangementClickFlash.pending = true
      arrangementClickFlash.startTime = null
      switchArrangement()
    })
    const unsubscribePulse = registerFrame(({ delta, elapsed }) => {
      const playMode = isPlayingRef.current ? 'playing' : 'paused'

      if (arrangementClickFlash.pending) {
        arrangementClickFlash.pending = false
        arrangementClickFlash.startTime = elapsed
      }

      let arrangementClickStrength = 0

      if (arrangementClickFlash.startTime !== null) {
        const sinceClick = elapsed - arrangementClickFlash.startTime

        if (sinceClick > ARRANGEMENT_CLICK_FLASH_DURATION) {
          arrangementClickFlash.startTime = null
        } else if (sinceClick >= 0) {
          const normalizedClick = sinceClick / ARRANGEMENT_CLICK_FLASH_DURATION
          arrangementClickStrength = Math.sin(normalizedClick * Math.PI) ** 1.6
        }
      }

      const playActivity =
        playMode === 'playing'
          ? PLAY_PARTICLE_ACTIVITY_PLAYING
          : PLAY_PARTICLE_ACTIVITY_PAUSED
      playParticleTargetColor.set(
        playMode === 'playing' ? PLAY_LIGHT_ACTIVE_COLOR : PLAY_LIGHT_PAUSED_COLOR,
      )
      playParticleColor.lerp(playParticleTargetColor, PARTICLE_COLOR_LERP)
      setTreeParticleSwarmAppearance(
        playTreeParticles,
        playParticleColor,
        PARTICLE_BASE_OPACITY + PARTICLE_OPACITY_SWING * playActivity,
      )
      const isPlayGreen = playMode !== 'playing'
      updateTreeParticleSwarm(playTreeParticles, elapsed, delta, playActivity, {
        speedScale: isPlayGreen ? 1.18 : 0.9,
        waveAmplitude: isPlayGreen ? 0.14 : 0.05,
        waveFrequency: isPlayGreen ? 2.2 : 1.7,
        waveSpeedScale: isPlayGreen ? 1.28 : 0.96,
      })

      const arrangementBaseActivity =
        playMode === 'playing'
          ? ARRANGEMENT_PARTICLE_ACTIVITY_PLAYING
          : ARRANGEMENT_PARTICLE_ACTIVITY_PAUSED
      const arrangementActivity = arrangementBaseActivity + arrangementClickStrength * 0.85
      arrangementParticleTargetColor.lerpColors(
        arrangementAmberColor,
        arrangementMagentaColor,
        arrangementClickStrength,
      )
      arrangementParticleColor.lerp(
        arrangementParticleTargetColor,
        PARTICLE_COLOR_LERP,
      )
      setTreeParticleSwarmAppearance(
        arrangementTreeParticles,
        arrangementParticleColor,
        PARTICLE_BASE_OPACITY +
          PARTICLE_OPACITY_SWING *
            (arrangementBaseActivity + arrangementClickStrength * 0.72),
      )
      updateTreeParticleSwarm(
        arrangementTreeParticles,
        elapsed,
        delta,
        arrangementActivity,
        {
          speedScale: 0.96 + arrangementClickStrength * 0.24,
          waveAmplitude: 0.06 + arrangementClickStrength * 0.03,
          waveFrequency: 1.76,
          waveSpeedScale: 1.04,
        },
      )

      playTreeMaterial.emissiveIntensity =
        0.24 + Math.sin(elapsed * 1.2) * 0.04 + playActivity * 0.2
      arrangementTreeMaterial.emissiveIntensity =
        0.22 +
        Math.sin(elapsed * 1.05 + 1.4) * 0.04 +
        arrangementActivity * 0.14

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

      disposeTreeParticleSwarm(playTreeParticles)
      disposeTreeParticleSwarm(arrangementTreeParticles)
      glowParticleTexture.dispose()
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
