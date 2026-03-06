import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.longNight

export default defineSceneConfig({
  id: 'long-night',
  slug: 'season-10-long-night',
  name: 'Long Night',
  description: 'Deep winter quiet widens into solitary dark shelter.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.033,
  },
  particles: {
    color: palette.particles,
    count: 38,
    size: [2.2, 5],
    opacity: [0.04, 0.14],
    xRange: [-84, 84],
    yRange: [-0.4, 5.8],
    zRange: [-82, 82],
    velocity: {
      x: [-0.006, 0.006],
      y: [-0.004, 0.004],
      z: [-0.005, 0.005],
    },
    bobAmplitude: 0.08,
    bobSpeed: [0.16, 0.3],
    swayAmplitude: 0.04,
    swaySpeed: [0.14, 0.28],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.34,
    directionalColor: palette.directional,
    directionalIntensity: 0.16,
    fillColor: palette.accentGlow,
    fillIntensity: 0.08,
    exposure: 0.46,
  },
  trees: {
    count: 8,
    spacing: 6.8,
    trunkHeight: [3.4, 6],
    trunkRadius: [0.08, 0.15],
    crownHeight: [0.9, 1.8],
    crownRadius: [0.28, 0.68],
    canopyLayers: 1,
    canopyOpacity: 0.64,
    emissiveIntensity: 0.04,
    swayAmount: 0.016,
    swaySpeed: 0.18,
    leanAmount: 0.015,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.99,
    metalness: 0.03,
    opacity: 0.97,
    heightOffset: 0.02,
  },
  motion: {
    fogDrift: 0.06,
    accentPulse: 0.12,
    accentRotation: 0.06,
    shimmer: 0.02,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.16,
    scale: 0.96,
  },
  interactions: {
    key: 'long-night',
    note: 'Reserved for deep-night interactions.',
  },
  createAccent,
})
