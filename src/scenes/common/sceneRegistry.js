import { worldConfig } from '../../data/worldConfig.js'
import ashenThaw from '../season-01-ashen-thaw/config.js'
import vernalHush from '../season-02-vernal-hush/config.js'
import rainBloom from '../season-03-rain-bloom/config.js'
import goldair from '../season-04-goldair/config.js'
import highsummerStatic from '../season-05-highsummer-static/config.js'
import stormglass from '../season-06-stormglass/config.js'
import harvestEcho from '../season-07-harvest-echo/config.js'
import emberfall from '../season-08-emberfall/config.js'
import firstFrost from '../season-09-first-frost/config.js'
import longNight from '../season-10-long-night/config.js'
import deepStill from '../season-11-deep-still/config.js'
import returningLight from '../season-12-returning-light/config.js'
import { defineSceneRegistry } from './sceneTypes.js'
import { wrapIndex } from './sceneUtils.js'

export const sceneRegistry = defineSceneRegistry([
  ashenThaw,
  vernalHush,
  rainBloom,
  goldair,
  highsummerStatic,
  stormglass,
  harvestEcho,
  emberfall,
  firstFrost,
  longNight,
  deepStill,
  returningLight,
])

if (sceneRegistry.length !== worldConfig.sectionCount) {
  throw new Error(
    `Scene registry length ${sceneRegistry.length} does not match world section count ${worldConfig.sectionCount}.`,
  )
}

export function getSceneConfig(index) {
  return sceneRegistry[wrapIndex(index, sceneRegistry.length)]
}
