function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key])
  })

  return Object.freeze(value)
}

/**
 * @typedef {[number, number]} NumberRange
 */

/**
 * @typedef {object} SceneConfig
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string} description
 * @property {Record<string, string>} palette
 * @property {{color: string, density: number}} fog
 * @property {{
 *   color: string,
 *   count: number,
 *   size: NumberRange,
 *   opacity: NumberRange,
 *   xRange: NumberRange,
 *   yRange: NumberRange,
 *   zRange: NumberRange,
 *   velocity: {
 *     x: NumberRange,
 *     y: NumberRange,
 *     z: NumberRange,
 *   },
 *   bobAmplitude: number,
 *   bobSpeed: NumberRange,
 *   swayAmplitude: number,
 *   swaySpeed: NumberRange,
 * }} particles
 * @property {{
 *   ambientColor: string,
 *   ambientIntensity: number,
 *   directionalColor: string,
 *   directionalIntensity: number,
 *   fillColor: string,
 *   fillIntensity: number,
 *   exposure: number,
 * }} lighting
 * @property {{
 *   count: number,
 *   spacing: number,
 *   trunkHeight: NumberRange,
 *   trunkRadius: NumberRange,
 *   crownHeight: NumberRange,
 *   crownRadius: NumberRange,
 *   canopyLayers: number,
 *   canopyOpacity: number,
 *   emissiveIntensity: number,
 *   swayAmount: number,
 *   swaySpeed: number,
 *   leanAmount: number,
 * }} trees
 * @property {{
 *   color: string,
 *   emissive: string,
 *   roughness: number,
 *   metalness: number,
 *   opacity: number,
 *   heightOffset: number,
 * }} ground
 * @property {{
 *   fogDrift: number,
 *   accentPulse: number,
 *   accentRotation: number,
 *   shimmer: number,
 * }} motion
 * @property {{
 *   color: string,
 *   emissive: string,
 *   opacity: number,
 *   scale: number,
 * }} accent
 * @property {{
 *   key: string,
 *   note: string,
 * }} interactions
 * @property {(context: object) => {object: object, update?: (frame: object) => void, dispose?: () => void}} [createAccent]
 */

const requiredSceneKeys = [
  'id',
  'slug',
  'name',
  'description',
  'palette',
  'fog',
  'particles',
  'lighting',
  'trees',
  'ground',
  'motion',
  'accent',
  'interactions',
]

/**
 * @param {SceneConfig} config
 * @returns {SceneConfig}
 */
export function defineSceneConfig(config) {
  const missingKeys = requiredSceneKeys.filter((key) => config[key] === undefined)

  if (missingKeys.length > 0) {
    throw new Error(
      `Scene config "${config.id ?? 'unknown'}" is missing keys: ${missingKeys.join(', ')}`,
    )
  }

  return deepFreeze(config)
}

/**
 * @template T
 * @param {T[]} configs
 * @returns {readonly T[]}
 */
export function defineSceneRegistry(configs) {
  return deepFreeze(configs.slice())
}
