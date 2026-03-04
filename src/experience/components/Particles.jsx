import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const PARTICLE_COUNT = 96
const X_RANGE = 18
const Z_RANGE = 30
const Y_MIN = -0.9
const Y_MAX = 6.6

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function Particles() {
  const { getScene, registerFrame, dayCycle } = useSceneContext()
  const materialRef = useRef(null)

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const alphas = new Float32Array(PARTICLE_COUNT)

    const xState = new Float32Array(PARTICLE_COUNT)
    const yBaseState = new Float32Array(PARTICLE_COUNT)
    const zState = new Float32Array(PARTICLE_COUNT)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const frequencies = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const offset = i * 3
      const x = randomRange(-X_RANGE, X_RANGE)
      const y = randomRange(Y_MIN, Y_MAX)
      const z = randomRange(-Z_RANGE, 4)

      xState[i] = x
      yBaseState[i] = y
      zState[i] = z

      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = z

      velocities[offset] = randomRange(-0.0024, 0.0024)
      velocities[offset + 1] = randomRange(-0.00038, 0.00038)
      velocities[offset + 2] = randomRange(0.0007, 0.0028)

      frequencies[i] = randomRange(0.12, 0.3)
      phases[i] = randomRange(0, Math.PI * 2)
      sizes[i] = randomRange(3.2, 8.2)
      alphas[i] = randomRange(0.12, 0.34)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#b0bbb9') },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;

        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (150.0 / -mvPosition.z), 1.6, 10.0);
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
    materialRef.current = material
    scene.add(points)

    const unsubscribe = registerFrame(({ delta, elapsed }) => {
      const frameScale = delta * 60
      const positionArray = geometry.attributes.position.array

      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const offset = i * 3

        xState[i] += velocities[offset] * frameScale
        yBaseState[i] += velocities[offset + 1] * frameScale
        zState[i] += velocities[offset + 2] * frameScale

        if (xState[i] > X_RANGE) xState[i] = -X_RANGE
        if (xState[i] < -X_RANGE) xState[i] = X_RANGE
        if (yBaseState[i] > Y_MAX) yBaseState[i] = Y_MIN
        if (yBaseState[i] < Y_MIN) yBaseState[i] = Y_MAX
        if (zState[i] > 6) zState[i] = -Z_RANGE

        const phase = phases[i]
        const frequency = frequencies[i]

        positionArray[offset] = xState[i] + Math.sin(elapsed * frequency + phase) * 0.05
        positionArray[offset + 1] =
          yBaseState[i] + Math.sin(elapsed * frequency * 0.72 + phase * 0.7) * 0.1
        positionArray[offset + 2] = zState[i]
      }

      geometry.attributes.position.needsUpdate = true
    })

    return () => {
      unsubscribe()
      materialRef.current = null
      scene.remove(points)
      geometry.dispose()
      material.dispose()
    }
  }, [getScene, registerFrame])

  useEffect(() => {
    const material = materialRef.current

    if (!material) {
      return
    }

    material.uniforms.uColor.value.set(dayCycle.particles)
  }, [dayCycle.particles])

  return null
}

export default Particles
