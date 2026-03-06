import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createSoftSpriteTexture } from '../../scenes/common/sceneUtils.js'
import { useSceneContext } from './sceneContext.js'

const GROUND_LEVEL = -1.28
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
  midCrown.scale.set(crownRadius * 0.84, crownHeight * 0.82, crownRadius * 0.84)
  midCrown.position.y = GROUND_LEVEL + trunkHeight + crownHeight * 0.72

  const upperCrown = new THREE.Mesh(crownGeometry, crownMaterial)
  upperCrown.scale.set(crownRadius * 0.7, crownHeight * 0.72, crownRadius * 0.7)
  upperCrown.position.y = GROUND_LEVEL + trunkHeight + crownHeight * 0.94

  tree.add(trunk, lowerCrown, midCrown, upperCrown)
  return tree
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
  const yMin = GROUND_LEVEL + 0.24
  const yMax = GROUND_LEVEL + trunkHeight + crownHeight * 1.06
  const ySpan = Math.max(0.1, yMax - yMin)

  for (let index = 0; index < particleCount; index += 1) {
    const sprite = new THREE.Sprite(material)
    const baseScale = randomRange(0.18, 0.38)
    sprite.scale.setScalar(baseScale)
    swarmGroup.add(sprite)
    particles.push({
      sprite,
      baseScale,
      orbitAngle: randomRange(0, Math.PI * 2),
      orbitSpeed: randomRange(0.4, 0.9) * (Math.random() < 0.5 ? -1 : 1),
      radiusAnchor: crownRadius * randomRange(1.14, 1.46),
      radialAmplitude: crownRadius * randomRange(0.015, 0.05),
      radialPhase: randomRange(0, Math.PI * 2),
      radialSpeed: randomRange(0.5, 1.32),
      yMin,
      ySpan,
      heightRatio: randomRange(0.04, 0.96),
      bobAmplitude: randomRange(0.08, 0.26),
      bobPhase: randomRange(0, Math.PI * 2),
      bobSpeed: randomRange(0.58, 1.44),
      twinklePhase: randomRange(0, Math.PI * 2),
      twinkleSpeed: randomRange(3.6, 7.8),
      wavePhase: randomRange(0, Math.PI * 2),
    })
  }

  tree.add(swarmGroup)
  return { material, particles }
}

function updateTreeParticleSwarm(swarm, elapsed, delta, activity, options = {}) {
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
    const twinkle = 0.78 + Math.sin(particle.twinklePhase) * 0.22
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

function EntryGrove() {
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

    const grove = new THREE.Group()
    grove.name = 'entry-grove'
    scene.add(grove)

    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 1, 7)
    const crownGeometry = new THREE.ConeGeometry(1, 1, 8)
    const amberTrunkMaterial = new THREE.MeshStandardMaterial({
      color: '#3f3324',
      emissive: '#8a6f43',
      emissiveIntensity: 0.1,
      roughness: 0.9,
      metalness: 0.03,
    })
    const playTreeMaterial = new THREE.MeshStandardMaterial({
      color: '#5f4b30',
      emissive: '#8a6f43',
      emissiveIntensity: 0.28,
      roughness: 0.88,
      metalness: 0.04,
    })
    const arrangementTreeMaterial = new THREE.MeshStandardMaterial({
      color: '#5f4b30',
      emissive: '#8a6f43',
      emissiveIntensity: 0.26,
      roughness: 0.87,
      metalness: 0.04,
    })

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
    grove.add(playTree)

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
    grove.add(arrangementTree)

    const glowTexture = createSoftSpriteTexture()
    const playTreeParticles = createTreeParticleSwarm({
      tree: playTree,
      texture: glowTexture,
      color: PLAY_LIGHT_PAUSED_COLOR,
      particleCount: PLAY_PARTICLE_COUNT,
      trunkHeight: 2.7,
      crownHeight: 2.6,
      crownRadius: 1.08,
    })
    const arrangementTreeParticles = createTreeParticleSwarm({
      tree: arrangementTree,
      texture: glowTexture,
      color: ARRANGEMENT_LIGHT_AMBER,
      particleCount: ARRANGEMENT_PARTICLE_COUNT,
      trunkHeight: 2.9,
      crownHeight: 2.75,
      crownRadius: 1.12,
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
      updateTreeParticleSwarm(playTreeParticles, elapsed, delta, playActivity, {
        speedScale: playMode === 'playing' ? 0.92 : 1.18,
        waveAmplitude: playMode === 'playing' ? 0.06 : 0.14,
        waveFrequency: playMode === 'playing' ? 1.7 : 2.2,
        waveSpeedScale: playMode === 'playing' ? 0.96 : 1.28,
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
        0.22 + Math.sin(elapsed * 1.2) * 0.04 + playActivity * 0.2
      arrangementTreeMaterial.emissiveIntensity =
        0.2 +
        Math.sin(elapsed * 1.05 + 1.4) * 0.04 +
        arrangementActivity * 0.14
    })

    return () => {
      unregisterPlay()
      unregisterArrangement()
      unsubscribePulse()
      scene.remove(grove)
      glowTexture.dispose()
      trunkGeometry.dispose()
      crownGeometry.dispose()
      amberTrunkMaterial.dispose()
      playTreeMaterial.dispose()
      arrangementTreeMaterial.dispose()
      playTreeParticles.material.dispose()
      arrangementTreeParticles.material.dispose()
    }
  }, [getScene, isPlaying, registerClickable, registerFrame, switchArrangement, togglePlayback])

  return null
}

export default EntryGrove
