import { useEffect } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const GROUND_LEVEL = -1.28
const ENTRY_CAMERA_Z = 8.4
const ENTRY_FORWARD_OFFSET = 16.4
const ENTRY_LATERAL_OFFSET = 0.75
const ENTRY_PILE_HEIGHT_OFFSET = 0.14
const FIRE_CENTER_X = 0.02
const FIRE_CENTER_Z = 0.04
const FIRE_BASE_Y = GROUND_LEVEL + 0.22
const FLAME_PARTICLE_COUNT = 24
const FIRE_RENDER_ORDER_GLOW = 12
const FIRE_RENDER_ORDER_EMBER = 13
const FIRE_RENDER_ORDER_FLAME = 14

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

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function createFlameTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')

  if (context) {
    const gradient = context.createRadialGradient(64, 84, 8, 64, 58, 60)
    gradient.addColorStop(0, 'rgba(255,250,220,1)')
    gradient.addColorStop(0.24, 'rgba(255,195,95,0.98)')
    gradient.addColorStop(0.55, 'rgba(255,114,45,0.52)')
    gradient.addColorStop(1, 'rgba(255,72,16,0)')
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

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')

  if (context) {
    const center = canvas.width * 0.5
    const gradient = context.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255,220,146,1)')
    gradient.addColorStop(0.34, 'rgba(255,149,66,0.7)')
    gradient.addColorStop(0.72, 'rgba(255,96,34,0.18)')
    gradient.addColorStop(1, 'rgba(255,80,20,0)')
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

function EntryStones() {
  const { getScene, registerFrame } = useSceneContext()

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const pile = new THREE.Group()
    pile.name = 'entry-stones'
    pile.position.set(
      ENTRY_LATERAL_OFFSET,
      ENTRY_PILE_HEIGHT_OFFSET,
      ENTRY_CAMERA_Z - ENTRY_FORWARD_OFFSET,
    )
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

    const flameTexture = createFlameTexture()
    const glowTexture = createGlowTexture()
    const flameColorA = new THREE.Color('#ff9f34')
    const flameColorB = new THREE.Color('#ffe091')
    const fireGlowColorA = new THREE.Color('#ff7f2d')
    const fireGlowColorB = new THREE.Color('#ffc166')

    const fireGroundGlowGeometry = new THREE.PlaneGeometry(2.75, 2.75)
    const fireGroundGlowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: fireGlowColorA,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const fireGroundGlow = new THREE.Mesh(fireGroundGlowGeometry, fireGroundGlowMaterial)
    fireGroundGlow.position.set(FIRE_CENTER_X, GROUND_LEVEL + 0.03, FIRE_CENTER_Z)
    fireGroundGlow.rotation.x = -Math.PI / 2
    fireGroundGlow.renderOrder = FIRE_RENDER_ORDER_GLOW
    pile.add(fireGroundGlow)

    const emberGlowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: '#ffb54a',
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const emberGlow = new THREE.Sprite(emberGlowMaterial)
    emberGlow.position.set(FIRE_CENTER_X, FIRE_BASE_Y + 0.1, FIRE_CENTER_Z)
    emberGlow.scale.set(1.05, 1.05, 1.05)
    emberGlow.renderOrder = FIRE_RENDER_ORDER_EMBER
    pile.add(emberGlow)

    const fireLight = new THREE.PointLight('#ff963e', 1.3, 7.6, 2)
    fireLight.position.set(FIRE_CENTER_X, FIRE_BASE_Y + 0.35, FIRE_CENTER_Z)
    pile.add(fireLight)

    const flameParticles = []
    for (let index = 0; index < FLAME_PARTICLE_COUNT; index += 1) {
      const material = new THREE.SpriteMaterial({
        map: flameTexture,
        color: flameColorA.clone().lerp(flameColorB, Math.random() * 0.6),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(material)
      sprite.position.set(FIRE_CENTER_X, FIRE_BASE_Y, FIRE_CENTER_Z)
      sprite.renderOrder = FIRE_RENDER_ORDER_FLAME
      pile.add(sprite)

      flameParticles.push({
        sprite,
        material,
        life: Math.random(),
        lifeSpeed: randomRange(0.78, 1.6),
        height: randomRange(0.52, 1.22),
        driftRadius: randomRange(0.04, 0.19),
        driftSpeed: randomRange(1.2, 3.2) * (Math.random() < 0.5 ? -1 : 1),
        angle: randomRange(0, Math.PI * 2),
        flickerPhase: randomRange(0, Math.PI * 2),
        flickerSpeed: randomRange(6, 11.4),
        scale: randomRange(0.2, 0.42),
      })
    }

    const unsubscribe = registerFrame(({ delta, elapsed }) => {
      const pulse =
        0.74 +
        (Math.sin(elapsed * 7.2) * 0.16 + Math.sin(elapsed * 13.8 + 0.7) * 0.1)
      fireGroundGlowMaterial.opacity = 0.22 + pulse * 0.38
      fireGroundGlowMaterial.color.lerpColors(
        fireGlowColorA,
        fireGlowColorB,
        0.5 + Math.sin(elapsed * 1.3) * 0.5,
      )
      fireGroundGlow.scale.setScalar(1 + pulse * 0.16)

      emberGlowMaterial.opacity = 0.33 + pulse * 0.42
      emberGlow.scale.setScalar(0.78 + pulse * 0.42)

      fireLight.intensity = 0.86 + pulse * 1.08
      fireLight.distance = 6.4 + pulse * 1.6
      fireLight.color.lerpColors(
        fireGlowColorA,
        fireGlowColorB,
        0.5 + Math.sin(elapsed * 2.2 + 1.1) * 0.5,
      )

      flameParticles.forEach((particle) => {
        particle.life += delta * particle.lifeSpeed
        if (particle.life >= 1) {
          particle.life -= 1
          particle.height = randomRange(0.52, 1.22)
          particle.driftRadius = randomRange(0.04, 0.19)
          particle.scale = randomRange(0.2, 0.42)
          particle.lifeSpeed = randomRange(0.78, 1.6)
        }

        particle.angle += delta * particle.driftSpeed
        const lifeIn = Math.min(1, particle.life / 0.16)
        const lifeOut = Math.max(0, (1 - particle.life) / 0.7)
        const visibility = Math.min(lifeIn, lifeOut)
        const flicker =
          0.9 +
          Math.sin(
            particle.flickerPhase + elapsed * particle.flickerSpeed,
          ) *
            0.12
        const radius = particle.driftRadius * (1 - particle.life * 0.78)
        const y = FIRE_BASE_Y + particle.life * particle.height
        const x = FIRE_CENTER_X + Math.cos(particle.angle) * radius
        const z =
          FIRE_CENTER_Z +
          Math.sin(particle.angle) * radius +
          Math.sin(elapsed * 1.7 + particle.flickerPhase) * 0.02
        const scale = particle.scale * (0.52 + lifeOut * 1.2) * flicker

        particle.sprite.position.set(x, y, z)
        particle.sprite.scale.set(scale * 0.72, scale * 1.3, 1)
        particle.material.opacity = visibility * (0.42 + pulse * 0.6)
      })
    })

    return () => {
      unsubscribe()
      scene.remove(pile)
      stoneGeometry.dispose()
      mossGeometry.dispose()
      stoneMaterial.dispose()
      mossMaterial.dispose()
      fireGroundGlowGeometry.dispose()
      fireGroundGlowMaterial.dispose()
      emberGlowMaterial.dispose()
      flameParticles.forEach((particle) => {
        particle.material.dispose()
      })
      flameTexture.dispose()
      glowTexture.dispose()
    }
  }, [getScene, registerFrame])

  return null
}

export default EntryStones
