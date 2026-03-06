import * as THREE from 'three'

const colorBufferA = new THREE.Color()
const colorBufferB = new THREE.Color()
const rgbaBuffer = new THREE.Color()

export const TAU = Math.PI * 2

export function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

export function lerp(start, end, t) {
  return start + (end - start) * t
}

export function wrapIndex(index, count) {
  if (!Number.isFinite(index) || count <= 0) {
    return 0
  }

  const roundedIndex = Math.round(index)
  return ((roundedIndex % count) + count) % count
}

export function circularDistance(indexA, indexB, count) {
  const distance = Math.abs(wrapIndex(indexA, count) - wrapIndex(indexB, count))
  return Math.min(distance, count - distance)
}

export function computeSegmentEmphasis(index, activeIndex, hoveredIndex, sectionCount) {
  const activeFalloff = 1 - clamp01(circularDistance(index, activeIndex, sectionCount) / 3)
  const hoverFalloff =
    hoveredIndex === null || hoveredIndex === undefined
      ? 0
      : 1 - clamp01(circularDistance(index, hoveredIndex, sectionCount) / 2)

  return clamp01(0.1 + activeFalloff * 0.56 + hoverFalloff * 0.5)
}

export function getSectionAngle(index, sectionCount) {
  return (wrapIndex(index, sectionCount) / sectionCount) * TAU
}

export function getSectionArc(index, sectionCount, padding = 0) {
  const centerAngle = getSectionAngle(index, sectionCount)
  const fullLength = TAU / Math.max(sectionCount, 1)
  const arcLength = Math.max(fullLength - padding, fullLength * 0.66)

  return {
    centerAngle,
    thetaStart: Math.PI / 2 - centerAngle - arcLength * 0.5,
    thetaLength: arcLength,
  }
}

export function getRingPoint(angle, radius, height = 0, target = new THREE.Vector3()) {
  return target.set(Math.sin(angle) * radius, height, -Math.cos(angle) * radius)
}

export function getOutwardVector(angle, target = new THREE.Vector3()) {
  return target.set(Math.sin(angle), 0, -Math.cos(angle))
}

export function getLateralVector(angle, target = new THREE.Vector3()) {
  return target.set(Math.cos(angle), 0, Math.sin(angle))
}

export function randomRange(min, max, random = Math.random) {
  return min + (max - min) * random()
}

export function sampleRange(range, random = Math.random) {
  return randomRange(range[0], range[1], random)
}

export function sampleRingRadius(innerRadius, outerRadius, random = Math.random) {
  return Math.sqrt(randomRange(innerRadius ** 2, outerRadius ** 2, random))
}

function hashSeed(seed) {
  const seedText = String(seed)
  let hash = 1779033703 ^ seedText.length

  for (let index = 0; index < seedText.length; index += 1) {
    hash = Math.imul(hash ^ seedText.charCodeAt(index), 3432918353)
    hash = (hash << 13) | (hash >>> 19)
  }

  return hash >>> 0
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed) || 0x6d2b79f5

  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function mixHex(startHex, endHex, t) {
  colorBufferA.set(startHex)
  colorBufferB.set(endHex)
  colorBufferA.lerp(colorBufferB, clamp01(t))
  return `#${colorBufferA.getHexString()}`
}

export function toRgba(colorHex, alpha) {
  rgbaBuffer.set(colorHex)

  return `rgba(${Math.round(rgbaBuffer.r * 255)}, ${Math.round(
    rgbaBuffer.g * 255,
  )}, ${Math.round(rgbaBuffer.b * 255)}, ${clamp01(alpha).toFixed(3)})`
}

export function getShellPalette(sceneConfig, dayCycle) {
  return {
    skyTop: mixHex(sceneConfig.palette.skyTop, dayCycle.skyTop, 0.24),
    skyMid: mixHex(sceneConfig.palette.skyMid, dayCycle.skyMid, 0.3),
    skyBottom: mixHex(sceneConfig.palette.skyBottom, dayCycle.skyBottom, 0.38),
    skyGlow: toRgba(
      mixHex(sceneConfig.palette.skyGlow, dayCycle.directional, 0.4),
      0.08 + dayCycle.daylight * 0.2,
    ),
    skyShadow: toRgba(
      mixHex(sceneConfig.palette.skyShadow, dayCycle.fog, 0.38),
      0.18 + (1 - dayCycle.daylight) * 0.18,
    ),
    skyGlowX: dayCycle.skyGlowX,
    skyGlowY: dayCycle.skyGlowY,
  }
}

export function createSoftSpriteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')

  if (context) {
    const center = canvas.width * 0.5
    const gradient = context.createRadialGradient(center, center, 0, center, center, center)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.22, 'rgba(255,244,214,0.9)')
    gradient.addColorStop(0.58, 'rgba(255,201,125,0.32)')
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

export function createAccentMaterial({
  color,
  emissive,
  opacity = 1,
  roughness = 0.86,
  metalness = 0.06,
}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.22,
    roughness,
    metalness,
    transparent: opacity < 1,
    opacity,
  })
}

export function createGlowMaterial({ color, opacity = 0.2 }) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export function createColorVariation(baseHex, random, variance = 0.08) {
  const color = new THREE.Color(baseHex)
  color.offsetHSL(
    randomRange(-0.02, 0.02, random),
    randomRange(-variance * 0.5, variance * 0.5, random),
    randomRange(-variance, variance, random),
  )
  return color
}

export function disposeObject3D(root) {
  root.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose())
        return
      }

      child.material.dispose()
    }
  })
}
