import { seasonPalettes } from '../../data/palettes.js'
import { defineSceneConfig } from '../common/sceneTypes.js'
import createAccent from './SceneAccent.jsx'

const palette = seasonPalettes.ashenThaw

export default defineSceneConfig({
  id: 'ashen-thaw',
  slug: 'season-01-ashen-thaw',
  name: 'Ashen Thaw',
  description: 'Late cold loosens into damp ground and hesitant return.',
  palette,
  fog: {
    color: palette.fog,
    density: 0.034,
  },
  particles: {
    color: palette.particles,
    count: 68,
    size: [2.8, 6.8],
    opacity: [0.06, 0.2],
    xRange: [-78, 78],
    yRange: [-0.4, 6.2],
    zRange: [-74, 74],
    velocity: {
      x: [-0.012, 0.012],
      y: [-0.004, 0.012],
      z: [-0.008, 0.014],
    },
    bobAmplitude: 0.16,
    bobSpeed: [0.2, 0.5],
    swayAmplitude: 0.08,
    swaySpeed: [0.24, 0.52],
  },
  lighting: {
    ambientColor: palette.ambient,
    ambientIntensity: 0.42,
    directionalColor: palette.directional,
    directionalIntensity: 0.22,
    fillColor: palette.accentGlow,
    fillIntensity: 0.08,
    exposure: 0.52,
  },
  trees: {
    count: 10,
    spacing: 5.3,
    trunkHeight: [3.1, 5.6],
    trunkRadius: [0.08, 0.16],
    crownHeight: [1, 2.1],
    crownRadius: [0.34, 0.82],
    canopyLayers: 2,
    canopyOpacity: 0.82,
    emissiveIntensity: 0.06,
    swayAmount: 0.035,
    swaySpeed: 0.42,
    leanAmount: 0.025,
  },
  ground: {
    color: palette.ground,
    emissive: palette.groundGlow,
    roughness: 0.98,
    metalness: 0.02,
    opacity: 0.96,
    heightOffset: 0.02,
  },
  motion: {
    fogDrift: 0.14,
    accentPulse: 0.24,
    accentRotation: 0.08,
    shimmer: 0.02,
  },
  accent: {
    color: palette.accent,
    emissive: palette.accentGlow,
    opacity: 0.22,
    scale: 1,
  },
  interactions: {
    key: 'ashen-thaw',
    note: 'Reserved for thaw-trace interactions.',
  },
  createAccent,
})
