import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.vernalHush

export default defineSceneConfig({
  id: 'vernal-hush',
  slug: 'season-02-vernal-hush',
  name: 'Vernal Hush',
  description: 'Quiet early growth gathers without announcing itself.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.03,
  },
  particles: {
    color: palette.particles,
    count: 74,
    size: [2.6, 6.2],
    opacity: [0.07, 0.22],
    xRange: [-78, 78],
    yRange: [-0.3, 6.6],
    zRange: [-74, 74],
    velocity: {
      x: [-0.01, 0.01],
      y: [0.002, 0.018],
      z: [-0.006, 0.01],
    },
    bobAmplitude: 0.18,
    bobSpeed: [0.28, 0.6],
    swayAmplitude: 0.12,
    swaySpeed: [0.32, 0.66],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.5,
    directionalColor: palette.directional,
    directionalIntensity: 0.28,
    fillColor: palette.accentGlow,
    fillIntensity: 0.1,
    exposure: 0.54,
  },
  trees: {
    count: 12,
    spacing: 4.7,
    trunkHeight: [2.8, 5.1],
    trunkRadius: [0.09, 0.17],
    crownHeight: [1.4, 2.8],
    crownRadius: [0.48, 1.02],
    canopyLayers: 3,
    canopyOpacity: 0.85,
    emissiveIntensity: 0.08,
    swayAmount: 0.05,
    swaySpeed: 0.56,
    leanAmount: 0.03,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.97,
    metalness: 0.02,
    opacity: 0.95,
    heightOffset: 0.04,
  },
  motion: {
    fogDrift: 0.18,
    accentPulse: 0.3,
    accentRotation: 0.1,
    shimmer: 0.03,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.24,
    scale: 1.04,
  },
  interactions: {
    key: 'vernal-hush',
    note: 'Reserved for first-growth interactions.',
  },
  createAccent,
})
