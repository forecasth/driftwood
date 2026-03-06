import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.stormglass

export default defineSceneConfig({
  id: 'stormglass',
  slug: 'season-06-stormglass',
  name: 'Stormglass',
  description: 'Charged air sharpens the forest without breaking it open.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.034,
  },
  particles: {
    color: palette.particles,
    count: 84,
    size: [2.6, 6.6],
    opacity: [0.06, 0.22],
    xRange: [-82, 82],
    yRange: [-0.2, 6.8],
    zRange: [-80, 80],
    velocity: {
      x: [-0.022, -0.004],
      y: [-0.002, 0.012],
      z: [0.008, 0.02],
    },
    bobAmplitude: 0.14,
    bobSpeed: [0.32, 0.72],
    swayAmplitude: 0.2,
    swaySpeed: [0.42, 0.88],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.5,
    directionalColor: palette.directional,
    directionalIntensity: 0.38,
    fillColor: palette.accentGlow,
    fillIntensity: 0.16,
    exposure: 0.54,
  },
  trees: {
    count: 12,
    spacing: 4.9,
    trunkHeight: [3, 5.4],
    trunkRadius: [0.09, 0.18],
    crownHeight: [1.8, 3.2],
    crownRadius: [0.54, 1.1],
    canopyLayers: 3,
    canopyOpacity: 0.86,
    emissiveIntensity: 0.09,
    swayAmount: 0.08,
    swaySpeed: 0.84,
    leanAmount: 0.04,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.95,
    metalness: 0.04,
    opacity: 0.95,
    heightOffset: 0.05,
  },
  motion: {
    fogDrift: 0.32,
    accentPulse: 0.26,
    accentRotation: 0.2,
    shimmer: 0.08,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.22,
    scale: 1.02,
  },
  interactions: {
    key: 'stormglass',
    note: 'Reserved for charged-weather interactions.',
  },
  createAccent,
})
