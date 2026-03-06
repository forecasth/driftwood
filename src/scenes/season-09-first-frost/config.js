import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.firstFrost

export default defineSceneConfig({
  id: 'first-frost',
  slug: 'season-09-first-frost',
  name: 'First Frost',
  description: 'Cold returns with crisp edges and opened space.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.025,
  },
  particles: {
    color: palette.particles,
    count: 46,
    size: [2.2, 5.6],
    opacity: [0.05, 0.16],
    xRange: [-82, 82],
    yRange: [-0.2, 6.4],
    zRange: [-80, 80],
    velocity: {
      x: [-0.008, 0.008],
      y: [-0.003, 0.006],
      z: [-0.008, 0.008],
    },
    bobAmplitude: 0.1,
    bobSpeed: [0.24, 0.44],
    swayAmplitude: 0.06,
    swaySpeed: [0.2, 0.38],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.46,
    directionalColor: palette.directional,
    directionalIntensity: 0.3,
    fillColor: palette.accentGlow,
    fillIntensity: 0.1,
    exposure: 0.54,
  },
  trees: {
    count: 10,
    spacing: 5.8,
    trunkHeight: [3.2, 5.6],
    trunkRadius: [0.08, 0.16],
    crownHeight: [1.2, 2.3],
    crownRadius: [0.38, 0.86],
    canopyLayers: 2,
    canopyOpacity: 0.76,
    emissiveIntensity: 0.05,
    swayAmount: 0.024,
    swaySpeed: 0.24,
    leanAmount: 0.02,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.98,
    metalness: 0.03,
    opacity: 0.94,
    heightOffset: 0.03,
  },
  motion: {
    fogDrift: 0.1,
    accentPulse: 0.18,
    accentRotation: 0.1,
    shimmer: 0.04,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.2,
    scale: 0.98,
  },
  interactions: {
    key: 'first-frost',
    note: 'Reserved for frost-edge interactions.',
  },
  createAccent,
})
