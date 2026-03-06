import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.rainBloom

export default defineSceneConfig({
  id: 'rain-bloom',
  slug: 'season-03-rain-bloom',
  name: 'Rain Bloom',
  description: 'Lush moisture gathers the forest close and soft.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.036,
  },
  particles: {
    color: palette.particles,
    count: 92,
    size: [2.8, 7.4],
    opacity: [0.08, 0.24],
    xRange: [-80, 80],
    yRange: [-0.5, 7],
    zRange: [-76, 76],
    velocity: {
      x: [-0.009, 0.009],
      y: [-0.002, 0.01],
      z: [-0.005, 0.008],
    },
    bobAmplitude: 0.24,
    bobSpeed: [0.24, 0.48],
    swayAmplitude: 0.2,
    swaySpeed: [0.34, 0.62],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.56,
    directionalColor: palette.directional,
    directionalIntensity: 0.32,
    fillColor: palette.accentGlow,
    fillIntensity: 0.13,
    exposure: 0.56,
  },
  trees: {
    count: 17,
    spacing: 4.1,
    trunkHeight: [2.7, 4.9],
    trunkRadius: [0.09, 0.18],
    crownHeight: [2.2, 4.1],
    crownRadius: [0.72, 1.48],
    canopyLayers: 3,
    canopyOpacity: 0.9,
    emissiveIntensity: 0.1,
    swayAmount: 0.07,
    swaySpeed: 0.62,
    leanAmount: 0.038,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.96,
    metalness: 0.02,
    opacity: 0.96,
    heightOffset: 0.05,
  },
  motion: {
    fogDrift: 0.24,
    accentPulse: 0.34,
    accentRotation: 0.08,
    shimmer: 0.05,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.26,
    scale: 1.08,
  },
  interactions: {
    key: 'rain-bloom',
    note: 'Reserved for saturated-growth interactions.',
  },
  createAccent,
})
