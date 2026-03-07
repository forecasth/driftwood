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
const SWARM_TREE_RATIO = 1 / 3
const SWARM_PARTICLE_COUNT = 18
const SWARM_LIGHT_AMBER = '#ffaf59'
const SWARM_LIGHT_GREEN = '#b8ff45'
const SWARM_LIGHT_MAGENTA = '#df42ff'
const PARTICLE_BASE_OPACITY = 0.46
const PARTICLE_OPACITY_SWING = 0.24
const SWARM_PARTICLE_ACTIVITY_PAUSED = 0.58
const SWARM_PARTICLE_ACTIVITY_PLAYING = 0.92
const PARTICLE_COLOR_LERP = 0.12
const SWARM_CLICK_FLASH_DURATION = 0.88
const PARTICLE_RADIUS_MIN_MULTIPLIER = 1.14
const PARTICLE_RADIUS_MAX_MULTIPLIER = 1.46

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomRingRadius(innerRadius, outerRadius) {
  return Math.sqrt(randomRange(innerRadius ** 2, outerRadius ** 2))
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = items[index]
    items[index] = items[swapIndex]
    items[swapIndex] = current
  }

  return items
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
    const forestTrees = []

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

      const trunkHeight = randomRange(2.3, 4.9)
      const trunkRadius = randomRange(0.09, 0.19)
      const crownHeight = randomRange(1.9, 4.2)
      const crownRadius = randomRange(0.68, 1.45)
      const tree = createTree({
        trunkGeometry,
        crownGeometry,
        trunkMaterial: darkTrunkMaterial,
        crownMaterial: darkCrownMaterial,
        trunkHeight,
        trunkRadius,
        crownHeight,
        crownRadius,
      })

      tree.position.set(x, 0, z)
      tree.rotation.y = randomRange(0, Math.PI * 2)
      treeGroup.add(tree)
      forestTrees.push({ tree, trunkHeight, crownHeight, crownRadius })
      plantedTrees += 1
    }

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
            switchArrangement(sectionDelta)
          }),
        )
      })
    }

    const glowParticleTexture = createGlowSpriteTexture()
    const particleTreeCount = Math.floor(forestTrees.length * SWARM_TREE_RATIO)
    const selectedTrees = shuffleInPlace(forestTrees.slice()).slice(0, particleTreeCount)
    const amberCount = Math.floor(selectedTrees.length / 2)
    const magentaColor = new THREE.Color(SWARM_LIGHT_MAGENTA)
    const particleTreeEntries = selectedTrees.map((treeConfig, index) => {
      const variant = index < amberCount ? 'amber' : 'green'
      const baseColor = new THREE.Color(
        variant === 'amber' ? SWARM_LIGHT_AMBER : SWARM_LIGHT_GREEN,
      )
      const swarm = createTreeParticleSwarm({
        tree: treeConfig.tree,
        texture: glowParticleTexture,
        color: baseColor,
        particleCount: SWARM_PARTICLE_COUNT,
        trunkHeight: treeConfig.trunkHeight,
        crownHeight: treeConfig.crownHeight,
        crownRadius: treeConfig.crownRadius,
      })
      const currentColor = baseColor.clone()
      const targetColor = baseColor.clone()
      const clickFlash = {
        pending: false,
        startTime: null,
      }
      const unregister = registerClickable(treeConfig.tree, () => {
        clickFlash.pending = true
        clickFlash.startTime = null
      })

      return {
        variant,
        swarm,
        baseColor,
        currentColor,
        targetColor,
        clickFlash,
        unregister,
      }
    })

    const unsubscribePulse = registerFrame(({ delta, elapsed }) => {
      const baseActivity = isPlayingRef.current
        ? SWARM_PARTICLE_ACTIVITY_PLAYING
        : SWARM_PARTICLE_ACTIVITY_PAUSED

      particleTreeEntries.forEach((entry) => {
        if (entry.clickFlash.pending) {
          entry.clickFlash.pending = false
          entry.clickFlash.startTime = elapsed
        }

        let clickStrength = 0

        if (entry.clickFlash.startTime !== null) {
          const sinceClick = elapsed - entry.clickFlash.startTime

          if (sinceClick > SWARM_CLICK_FLASH_DURATION) {
            entry.clickFlash.startTime = null
          } else if (sinceClick >= 0) {
            const normalizedClick = sinceClick / SWARM_CLICK_FLASH_DURATION
            clickStrength = Math.sin(normalizedClick * Math.PI) ** 1.6
          }
        }

        const activity = baseActivity + clickStrength * 0.85
        entry.targetColor.lerpColors(entry.baseColor, magentaColor, clickStrength)
        entry.currentColor.lerp(entry.targetColor, PARTICLE_COLOR_LERP)
        setTreeParticleSwarmAppearance(
          entry.swarm,
          entry.currentColor,
          PARTICLE_BASE_OPACITY +
            PARTICLE_OPACITY_SWING * (baseActivity + clickStrength * 0.72),
        )

        const isGreen = entry.variant === 'green'
        updateTreeParticleSwarm(entry.swarm, elapsed, delta, activity, {
          speedScale: isGreen
            ? 1.12 + clickStrength * 0.22
            : 0.96 + clickStrength * 0.2,
          waveAmplitude: isGreen
            ? 0.12 + clickStrength * 0.06
            : 0.07 + clickStrength * 0.05,
          waveFrequency: isGreen ? 2.08 : 1.78,
          waveSpeedScale: isGreen ? 1.2 : 1.02,
        })
      })

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
      sectionSignUnsubscribers.forEach((unregister) => {
        unregister()
      })
      particleTreeEntries.forEach((entry) => {
        entry.unregister()
      })
      unsubscribePulse()

      scene.remove(treeGroup)

      particleTreeEntries.forEach((entry) => {
        disposeTreeParticleSwarm(entry.swarm)
      })
      glowParticleTexture.dispose()
      trunkGeometry.dispose()
      crownGeometry.dispose()
      arrowGeometry.dispose()
      arrowOmbreTexture.dispose()
      darkTrunkMaterial.dispose()
      darkCrownMaterial.dispose()
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
  ])

  return null
}

export default Trees
