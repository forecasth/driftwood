import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.emberfall

export default defineSceneConfig({
  id: 'emberfall',
  slug: 'season-08-emberfall',
  name: 'Emberfall',
  description: 'Afterglow settles close to the ground and turns inward.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.03,
  },
  particles: {
    color: palette.particles,
    count: 54,
    size: [2.4, 6],
    opacity: [0.07, 0.2],
    xRange: [-80, 80],
    yRange: [-0.2, 5.8],
    zRange: [-78, 78],
    velocity: {
      x: [-0.012, 0.012],
      y: [-0.004, 0.004],
      z: [-0.008, 0.008],
    },
    bobAmplitude: 0.12,
    bobSpeed: [0.2, 0.42],
    swayAmplitude: 0.08,
    swaySpeed: [0.22, 0.44],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.48,
    directionalColor: palette.directional,
    directionalIntensity: 0.28,
    fillColor: palette.accentGlow,
    fillIntensity: 0.16,
    exposure: 0.52,
  },
  trees: {
    count: 9,
    spacing: 5.9,
    trunkHeight: [2.8, 5.1],
    trunkRadius: [0.09, 0.18],
    crownHeight: [1.2, 2.5],
    crownRadius: [0.42, 0.88],
    canopyLayers: 2,
    canopyOpacity: 0.78,
    emissiveIntensity: 0.07,
    swayAmount: 0.038,
    swaySpeed: 0.34,
    leanAmount: 0.025,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.97,
    metalness: 0.03,
    opacity: 0.96,
    heightOffset: 0.03,
  },
  motion: {
    fogDrift: 0.12,
    accentPulse: 0.22,
    accentRotation: 0.08,
    shimmer: 0.05,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.24,
    scale: 0.98,
  },
  interactions: {
    key: 'emberfall',
    note: 'Reserved for ember-trace interactions.',
  },
  createAccent,
})
