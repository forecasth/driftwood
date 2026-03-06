import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { worldConfig } from '../../data/worldConfig.js'
import {
  createSeededRandom,
  randomRange,
} from '../../scenes/common/sceneUtils.js'
import { useSceneContext } from '../world/sceneContext.js'

const MAX_PARTICLES = 120

function ParticleField({ sceneConfig }) {
  const { getScene, registerFrame } = useSceneContext()
  const materialRef = useRef(null)
  const geometryRef = useRef(null)
  const stateRef = useRef(null)
  const configRef = useRef(sceneConfig)
  const resetFieldRef = useRef(null)

  useEffect(() => {
    configRef.current = sceneConfig
    resetFieldRef.current?.(sceneConfig)
  }, [sceneConfig])

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)
    const alphas = new Float32Array(MAX_PARTICLES)
    const xState = new Float32Array(MAX_PARTICLES)
    const yState = new Float32Array(MAX_PARTICLES)
    const zState = new Float32Array(MAX_PARTICLES)
    const velocityX = new Float32Array(MAX_PARTICLES)
    const velocityY = new Float32Array(MAX_PARTICLES)
    const velocityZ = new Float32Array(MAX_PARTICLES)
    const bobSpeeds = new Float32Array(MAX_PARTICLES)
    const swaySpeeds = new Float32Array(MAX_PARTICLES)
    const phases = new Float32Array(MAX_PARTICLES)
    const phaseOffsets = new Float32Array(MAX_PARTICLES)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(configRef.current.particles.color) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;

        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (150.0 / -mvPosition.z), 1.4, 11.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float falloff = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
          gl_FragColor = vec4(uColor, falloff * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })

    const points = new THREE.Points(geometry, material)
    points.position.set(
      worldConfig.camera.orbitCenter.x,
      0,
      worldConfig.camera.orbitCenter.z,
    )

    geometryRef.current = geometry
    materialRef.current = material
    stateRef.current = {
      positions,
      sizes,
      alphas,
      xState,
      yState,
      zState,
      velocityX,
      velocityY,
      velocityZ,
      bobSpeeds,
      swaySpeeds,
      phases,
      phaseOffsets,
      count: 0,
      bounds: {
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0,
        zMin: 0,
        zMax: 0,
      },
    }

    const resetField = (nextSceneConfig) => {
      const random = createSeededRandom(`${nextSceneConfig.id}-particle-field`)
      const particleConfig = nextSceneConfig.particles
      const count = Math.min(particleConfig.count, MAX_PARTICLES)
      const bounds = {
        xMin: particleConfig.xRange[0],
        xMax: particleConfig.xRange[1],
        yMin: particleConfig.yRange[0],
        yMax: particleConfig.yRange[1],
        zMin: particleConfig.zRange[0],
        zMax: particleConfig.zRange[1],
      }

      stateRef.current.count = count
      stateRef.current.bounds = bounds
      geometry.setDrawRange(0, count)
      material.uniforms.uColor.value.set(particleConfig.color)

      for (let index = 0; index < MAX_PARTICLES; index += 1) {
        const offset = index * 3

        if (index >= count) {
          positions[offset] = 0
          positions[offset + 1] = -999
          positions[offset + 2] = 0
          sizes[index] = 0
          alphas[index] = 0
          continue
        }

        const x = randomRange(bounds.xMin, bounds.xMax, random)
        const y = randomRange(bounds.yMin, bounds.yMax, random)
        const z = randomRange(bounds.zMin, bounds.zMax, random)

        xState[index] = x
        yState[index] = y
        zState[index] = z

        positions[offset] = x
        positions[offset + 1] = y
        positions[offset + 2] = z

        velocityX[index] = randomRange(
          particleConfig.velocity.x[0],
          particleConfig.velocity.x[1],
          random,
        )
        velocityY[index] = randomRange(
          particleConfig.velocity.y[0],
          particleConfig.velocity.y[1],
          random,
        )
        velocityZ[index] = randomRange(
          particleConfig.velocity.z[0],
          particleConfig.velocity.z[1],
          random,
        )
        bobSpeeds[index] = randomRange(
          particleConfig.bobSpeed[0],
          particleConfig.bobSpeed[1],
          random,
        )
        swaySpeeds[index] = randomRange(
          particleConfig.swaySpeed[0],
          particleConfig.swaySpeed[1],
          random,
        )
        phases[index] = randomRange(0, Math.PI * 2, random)
        phaseOffsets[index] = randomRange(0, Math.PI * 2, random)
        sizes[index] = randomRange(particleConfig.size[0], particleConfig.size[1], random)
        alphas[index] = randomRange(
          particleConfig.opacity[0],
          particleConfig.opacity[1],
          random,
        )
      }

      geometry.attributes.position.needsUpdate = true
      geometry.attributes.aSize.needsUpdate = true
      geometry.attributes.aAlpha.needsUpdate = true
    }

    resetFieldRef.current = resetField
    resetField(configRef.current)
    scene.add(points)

    const unsubscribe = registerFrame(({ delta, elapsed }) => {
      const particleConfig = configRef.current.particles
      const state = stateRef.current

      if (!state || state.count === 0) {
        return
      }

      const frameScale = delta * 60
      const { count, bounds } = state
      const positionArray = geometry.attributes.position.array

      for (let index = 0; index < count; index += 1) {
        const offset = index * 3

        xState[index] += velocityX[index] * frameScale
        yState[index] += velocityY[index] * frameScale
        zState[index] += velocityZ[index] * frameScale

        if (xState[index] > bounds.xMax) xState[index] = bounds.xMin
        if (xState[index] < bounds.xMin) xState[index] = bounds.xMax
        if (yState[index] > bounds.yMax) yState[index] = bounds.yMin
        if (yState[index] < bounds.yMin) yState[index] = bounds.yMax
        if (zState[index] > bounds.zMax) zState[index] = bounds.zMin
        if (zState[index] < bounds.zMin) zState[index] = bounds.zMax

        positionArray[offset] =
          xState[index] +
          Math.sin(elapsed * swaySpeeds[index] + phaseOffsets[index]) *
            particleConfig.swayAmplitude
        positionArray[offset + 1] =
          yState[index] +
          Math.sin(elapsed * bobSpeeds[index] + phases[index]) *
            particleConfig.bobAmplitude
        positionArray[offset + 2] =
          zState[index] +
          Math.cos(elapsed * swaySpeeds[index] * 0.8 + phases[index]) *
            particleConfig.swayAmplitude *
            0.38
      }

      geometry.attributes.position.needsUpdate = true
    })

    return () => {
      unsubscribe()
      resetFieldRef.current = null
      scene.remove(points)
      geometry.dispose()
      material.dispose()
      geometryRef.current = null
      materialRef.current = null
      stateRef.current = null
    }
  }, [getScene, registerFrame])

  return null
}

export default ParticleField
