import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.returningLight

export default defineSceneConfig({
  id: 'returning-light',
  slug: 'season-12-returning-light',
  name: 'Returning Light',
  description: 'Cold remains, but warmth begins to remember itself.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.027,
  },
  particles: {
    color: palette.particles,
    count: 58,
    size: [2.4, 6],
    opacity: [0.06, 0.18],
    xRange: [-82, 82],
    yRange: [-0.2, 6.6],
    zRange: [-80, 80],
    velocity: {
      x: [-0.01, 0.01],
      y: [0.001, 0.01],
      z: [-0.005, 0.008],
    },
    bobAmplitude: 0.14,
    bobSpeed: [0.24, 0.48],
    swayAmplitude: 0.1,
    swaySpeed: [0.26, 0.54],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.52,
    directionalColor: palette.directional,
    directionalIntensity: 0.3,
    fillColor: palette.accentGlow,
    fillIntensity: 0.16,
    exposure: 0.56,
  },
  trees: {
    count: 11,
    spacing: 5.1,
    trunkHeight: [2.9, 5.4],
    trunkRadius: [0.08, 0.17],
    crownHeight: [1.4, 2.8],
    crownRadius: [0.46, 0.98],
    canopyLayers: 2,
    canopyOpacity: 0.8,
    emissiveIntensity: 0.06,
    swayAmount: 0.04,
    swaySpeed: 0.42,
    leanAmount: 0.024,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.97,
    metalness: 0.03,
    opacity: 0.95,
    heightOffset: 0.04,
  },
  motion: {
    fogDrift: 0.12,
    accentPulse: 0.22,
    accentRotation: 0.08,
    shimmer: 0.04,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.22,
    scale: 1.04,
  },
  interactions: {
    key: 'returning-light',
    note: 'Reserved for threshold-light interactions.',
  },
  createAccent,
})
