import * as THREE from 'three'

const TAU = Math.PI * 2
const DAY_SECONDS = 24 * 60 * 60

const colorBufferA = new THREE.Color()
const colorBufferB = new THREE.Color()
const rgbaBuffer = new THREE.Color()

const DAY_KEYFRAMES = Object.freeze([
  {
    t: 0,
    skyTop: '#060814',
    skyMid: '#0f1628',
    skyBottom: '#1f2a3f',
    fog: '#121a2b',
    fogDensity: 0.038,
    ground: '#12191d',
    groundOpacity: 0.84,
    ambient: '#2b3453',
    ambientIntensity: 0.38,
    directional: '#9bb8ea',
    directionalIntensity: 0.09,
    particles: '#a8b8da',
    exposure: 0.46,
  },
  {
    t: 0.23,
    skyTop: '#273156',
    skyMid: '#a46c64',
    skyBottom: '#e3a87a',
    fog: '#6d5e5f',
    fogDensity: 0.031,
    ground: '#2c2723',
    groundOpacity: 0.88,
    ambient: '#7f6860',
    ambientIntensity: 0.57,
    directional: '#ffd4a1',
    directionalIntensity: 0.44,
    particles: '#f8cd99',
    exposure: 0.54,
  },
  {
    t: 0.5,
    skyTop: '#66b0e7',
    skyMid: '#9ad0ef',
    skyBottom: '#e3f2ff',
    fog: '#a9c6d8',
    fogDensity: 0.024,
    ground: '#333e33',
    groundOpacity: 0.92,
    ambient: '#bfccbf',
    ambientIntensity: 0.84,
    directional: '#fff2d4',
    directionalIntensity: 0.74,
    particles: '#ecf7ff',
    exposure: 0.66,
  },
  {
    t: 0.77,
    skyTop: '#2f3657',
    skyMid: '#8e5f69',
    skyBottom: '#e8a067',
    fog: '#6d5f63',
    fogDensity: 0.031,
    ground: '#2f261f',
    groundOpacity: 0.89,
    ambient: '#776567',
    ambientIntensity: 0.6,
    directional: '#ffc996',
    directionalIntensity: 0.37,
    particles: '#ffd9ac',
    exposure: 0.56,
  },
  {
    t: 1,
    skyTop: '#060814',
    skyMid: '#0f1628',
    skyBottom: '#1f2a3f',
    fog: '#121a2b',
    fogDensity: 0.038,
    ground: '#12191d',
    groundOpacity: 0.84,
    ambient: '#2b3453',
    ambientIntensity: 0.38,
    directional: '#9bb8ea',
    directionalIntensity: 0.09,
    particles: '#a8b8da',
    exposure: 0.46,
  },
])

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

export function wrapDayProgress(value) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return ((value % 1) + 1) % 1
}

function lerpNumber(start, end, t) {
  return start + (end - start) * t
}

function lerpColor(startHex, endHex, t) {
  colorBufferA.set(startHex)
  colorBufferB.set(endHex)
  colorBufferA.lerp(colorBufferB, t)
  return `#${colorBufferA.getHexString()}`
}

function toRgba(colorHex, alpha) {
  rgbaBuffer.set(colorHex)
  const r = Math.round(rgbaBuffer.r * 255)
  const g = Math.round(rgbaBuffer.g * 255)
  const b = Math.round(rgbaBuffer.b * 255)
  const a = clamp01(alpha)
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
}

function pickFrameWindow(progress) {
  for (let index = 1; index < DAY_KEYFRAMES.length; index += 1) {
    const current = DAY_KEYFRAMES[index]

    if (progress <= current.t) {
      const previous = DAY_KEYFRAMES[index - 1]
      return { previous, current }
    }
  }

  const last = DAY_KEYFRAMES[DAY_KEYFRAMES.length - 1]
  return { previous: last, current: last }
}

export function getSystemDayProgress(now = new Date()) {
  const seconds =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds() +
    now.getMilliseconds() / 1000

  return seconds / DAY_SECONDS
}

export function progressToSunAngle(progress) {
  return wrapDayProgress(progress) * TAU - Math.PI / 2
}

export function sunAngleToProgress(angle) {
  return wrapDayProgress((angle + Math.PI / 2) / TAU)
}

export function shortestAngleDelta(nextAngle, previousAngle) {
  let delta = nextAngle - previousAngle

  if (delta > Math.PI) {
    delta -= TAU
  } else if (delta < -Math.PI) {
    delta += TAU
  }

  return delta
}

export function sampleDayCycle(progress) {
  const normalized = wrapDayProgress(progress)
  const { previous, current } = pickFrameWindow(normalized)
  const span = Math.max(current.t - previous.t, Number.EPSILON)
  const t = clamp01((normalized - previous.t) / span)

  const sunAngle = progressToSunAngle(normalized)
  const sunHeight = Math.sin(sunAngle)
  const daylight = clamp01((sunHeight + 0.2) / 1.2)

  const skyGlowColor = lerpColor('#9cb4e8', '#ffcd8c', daylight)
  const skyShadowColor = lerpColor('#081017', '#273248', 1 - daylight)

  return {
    skyTop: lerpColor(previous.skyTop, current.skyTop, t),
    skyMid: lerpColor(previous.skyMid, current.skyMid, t),
    skyBottom: lerpColor(previous.skyBottom, current.skyBottom, t),
    fog: lerpColor(previous.fog, current.fog, t),
    fogDensity: lerpNumber(previous.fogDensity, current.fogDensity, t),
    ground: lerpColor(previous.ground, current.ground, t),
    groundOpacity: lerpNumber(previous.groundOpacity, current.groundOpacity, t),
    ambient: lerpColor(previous.ambient, current.ambient, t),
    ambientIntensity: lerpNumber(previous.ambientIntensity, current.ambientIntensity, t),
    directional: lerpColor(previous.directional, current.directional, t),
    directionalIntensity: lerpNumber(
      previous.directionalIntensity,
      current.directionalIntensity,
      t,
    ),
    particles: lerpColor(previous.particles, current.particles, t),
    exposure: lerpNumber(previous.exposure, current.exposure, t),
    daylight,
    sunAngle,
    skyGlowX: `${(50 + Math.cos(sunAngle) * 36).toFixed(2)}%`,
    skyGlowY: `${(72 - Math.sin(sunAngle) * 48).toFixed(2)}%`,
    skyGlow: toRgba(skyGlowColor, 0.09 + daylight * 0.28),
    skyShadow: toRgba(skyShadowColor, 0.16 + (1 - daylight) * 0.24),
  }
}
