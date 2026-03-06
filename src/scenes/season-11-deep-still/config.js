import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.deepStill

export default defineSceneConfig({
  id: 'deep-still',
  slug: 'season-11-deep-still',
  name: 'Deep Still',
  description: 'Winter settles into meditative balance rather than absence.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.028,
  },
  particles: {
    color: palette.particles,
    count: 40,
    size: [2.2, 5.4],
    opacity: [0.05, 0.16],
    xRange: [-82, 82],
    yRange: [-0.2, 6],
    zRange: [-80, 80],
    velocity: {
      x: [-0.005, 0.005],
      y: [-0.002, 0.004],
      z: [-0.004, 0.004],
    },
    bobAmplitude: 0.08,
    bobSpeed: [0.14, 0.26],
    swayAmplitude: 0.04,
    swaySpeed: [0.12, 0.24],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.5,
    directionalColor: palette.directional,
    directionalIntensity: 0.22,
    fillColor: palette.accentGlow,
    fillIntensity: 0.12,
    exposure: 0.5,
  },
  trees: {
    count: 10,
    spacing: 5.7,
    trunkHeight: [3, 5.4],
    trunkRadius: [0.08, 0.16],
    crownHeight: [1.4, 2.5],
    crownRadius: [0.42, 0.92],
    canopyLayers: 2,
    canopyOpacity: 0.76,
    emissiveIntensity: 0.05,
    swayAmount: 0.02,
    swaySpeed: 0.16,
    leanAmount: 0.016,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.98,
    metalness: 0.03,
    opacity: 0.95,
    heightOffset: 0.03,
  },
  motion: {
    fogDrift: 0.08,
    accentPulse: 0.14,
    accentRotation: 0.05,
    shimmer: 0.02,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.18,
    scale: 1,
  },
  interactions: {
    key: 'deep-still',
    note: 'Reserved for stillness interactions.',
  },
  createAccent,
})
