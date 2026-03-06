import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.harvestEcho

export default defineSceneConfig({
  id: 'harvest-echo',
  slug: 'season-07-harvest-echo',
  name: 'Harvest Echo',
  description: 'Warmth lingers as memory more than season.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.028,
  },
  particles: {
    color: palette.particles,
    count: 66,
    size: [2.4, 6],
    opacity: [0.06, 0.2],
    xRange: [-82, 82],
    yRange: [-0.2, 6.4],
    zRange: [-80, 80],
    velocity: {
      x: [-0.016, 0.01],
      y: [-0.004, 0.006],
      z: [-0.01, 0.008],
    },
    bobAmplitude: 0.14,
    bobSpeed: [0.24, 0.54],
    swayAmplitude: 0.16,
    swaySpeed: [0.3, 0.62],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.54,
    directionalColor: palette.directional,
    directionalIntensity: 0.34,
    fillColor: palette.accentGlow,
    fillIntensity: 0.12,
    exposure: 0.56,
  },
  trees: {
    count: 11,
    spacing: 5.2,
    trunkHeight: [2.9, 5.2],
    trunkRadius: [0.09, 0.18],
    crownHeight: [1.7, 3.1],
    crownRadius: [0.54, 1.12],
    canopyLayers: 3,
    canopyOpacity: 0.84,
    emissiveIntensity: 0.08,
    swayAmount: 0.048,
    swaySpeed: 0.4,
    leanAmount: 0.03,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.96,
    metalness: 0.03,
    opacity: 0.94,
    heightOffset: 0.04,
  },
  motion: {
    fogDrift: 0.16,
    accentPulse: 0.24,
    accentRotation: 0.1,
    shimmer: 0.04,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.22,
    scale: 1.02,
  },
  interactions: {
    key: 'harvest-echo',
    note: 'Reserved for memory-leaf interactions.',
  },
  createAccent,
})
