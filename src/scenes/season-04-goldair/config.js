import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.goldair

export default defineSceneConfig({
  id: 'goldair',
  slug: 'season-04-goldair',
  name: 'Goldair',
  description: 'Warm brightness opens the ring without turning loud.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.024,
  },
  particles: {
    color: palette.particles,
    count: 62,
    size: [2.4, 5.8],
    opacity: [0.05, 0.18],
    xRange: [-82, 82],
    yRange: [-0.2, 6.8],
    zRange: [-78, 78],
    velocity: {
      x: [-0.008, 0.008],
      y: [0.001, 0.012],
      z: [-0.004, 0.008],
    },
    bobAmplitude: 0.16,
    bobSpeed: [0.24, 0.5],
    swayAmplitude: 0.1,
    swaySpeed: [0.36, 0.62],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.62,
    directionalColor: palette.directional,
    directionalIntensity: 0.44,
    fillColor: palette.accentGlow,
    fillIntensity: 0.16,
    exposure: 0.62,
  },
  trees: {
    count: 13,
    spacing: 4.8,
    trunkHeight: [2.8, 5.2],
    trunkRadius: [0.09, 0.18],
    crownHeight: [1.9, 3.5],
    crownRadius: [0.62, 1.26],
    canopyLayers: 3,
    canopyOpacity: 0.88,
    emissiveIntensity: 0.1,
    swayAmount: 0.055,
    swaySpeed: 0.5,
    leanAmount: 0.03,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.95,
    metalness: 0.03,
    opacity: 0.94,
    heightOffset: 0.04,
  },
  motion: {
    fogDrift: 0.12,
    accentPulse: 0.24,
    accentRotation: 0.14,
    shimmer: 0.04,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.22,
    scale: 1.06,
  },
  interactions: {
    key: 'goldair',
    note: 'Reserved for light-shaft interactions.',
  },
  createAccent,
})
