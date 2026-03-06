import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.highsummerStatic

export default defineSceneConfig({
  id: 'highsummer-static',
  slug: 'season-05-highsummer-static',
  name: 'Highsummer Static',
  description: 'Warm abundance hangs almost still, carrying pressure underneath.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.028,
  },
  particles: {
    color: palette.particles,
    count: 56,
    size: [2.4, 5.6],
    opacity: [0.05, 0.16],
    xRange: [-82, 82],
    yRange: [-0.2, 6.2],
    zRange: [-78, 78],
    velocity: {
      x: [-0.004, 0.004],
      y: [-0.001, 0.006],
      z: [-0.003, 0.005],
    },
    bobAmplitude: 0.12,
    bobSpeed: [0.18, 0.36],
    swayAmplitude: 0.06,
    swaySpeed: [0.18, 0.34],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.56,
    directionalColor: palette.directional,
    directionalIntensity: 0.36,
    fillColor: palette.accentGlow,
    fillIntensity: 0.14,
    exposure: 0.58,
  },
  trees: {
    count: 15,
    spacing: 4.3,
    trunkHeight: [2.9, 5.1],
    trunkRadius: [0.09, 0.18],
    crownHeight: [2, 3.8],
    crownRadius: [0.74, 1.36],
    canopyLayers: 3,
    canopyOpacity: 0.9,
    emissiveIntensity: 0.08,
    swayAmount: 0.028,
    swaySpeed: 0.26,
    leanAmount: 0.02,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.95,
    metalness: 0.03,
    opacity: 0.95,
    heightOffset: 0.04,
  },
  motion: {
    fogDrift: 0.08,
    accentPulse: 0.16,
    accentRotation: 0.06,
    shimmer: 0.06,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.2,
    scale: 1.08,
  },
  interactions: {
    key: 'highsummer-static',
    note: 'Reserved for heat-shimmer interactions.',
  },
  createAccent,
})
