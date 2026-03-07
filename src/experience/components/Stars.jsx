import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSceneContext } from '../sceneContext.js'

const STAR_COUNT = 1300
const STAR_INNER_RADIUS = 140
const STAR_OUTER_RADIUS = 235
const STAR_CENTER_Y = 10
const STAR_MIN_Y_FACTOR = -0.24
const CAMERA_ORBIT_RADIUS = 38
const CAMERA_ORBIT_CENTER_Z = 8.4 + CAMERA_ORBIT_RADIUS

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function Stars() {
  const { getScene, registerFrame, dayCycle } = useSceneContext()
  const materialRef = useRef(null)

  useEffect(() => {
    const scene = getScene()

    if (!scene) {
      return undefined
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)
    const alphas = new Float32Array(STAR_COUNT)
    const phases = new Float32Array(STAR_COUNT)
    const twinkleSpeeds = new Float32Array(STAR_COUNT)
    const center = new THREE.Vector3(0, STAR_CENTER_Y, CAMERA_ORBIT_CENTER_Z)

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const offset = i * 3
      const radius = randomRange(STAR_INNER_RADIUS, STAR_OUTER_RADIUS)
      const theta = Math.random() * Math.PI * 2
      let yFactor = randomRange(STAR_MIN_Y_FACTOR, 1)

      if (yFactor < STAR_MIN_Y_FACTOR) {
        yFactor = STAR_MIN_Y_FACTOR
      }

      const radial = Math.sqrt(Math.max(0, 1 - yFactor * yFactor))

      positions[offset] = center.x + radius * radial * Math.cos(theta)
      positions[offset + 1] = center.y + radius * yFactor
      positions[offset + 2] = center.z + radius * radial * Math.sin(theta)

      sizes[i] = randomRange(1.2, 2.8)
      alphas[i] = randomRange(0.26, 0.94)
      phases[i] = Math.random() * Math.PI * 2
      twinkleSpeeds[i] = randomRange(0.45, 1.45)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#d8e2ff') },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute float aPhase;
        attribute float aTwinkleSpeed;
        varying float vAlpha;
        varying float vPhase;
        varying float vTwinkleSpeed;

        void main() {
          vAlpha = aAlpha;
          vPhase = aPhase;
          vTwinkleSpeed = aTwinkleSpeed;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        varying float vAlpha;
        varying float vPhase;
        varying float vTwinkleSpeed;

        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float starShape = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
          float twinkle = 0.72 + sin(uTime * vTwinkleSpeed + vPhase) * 0.28;
          float alpha = starShape * vAlpha * twinkle * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    points.renderOrder = -10
    materialRef.current = material
    scene.add(points)

    const unsubscribe = registerFrame(({ elapsed }) => {
      material.uniforms.uTime.value = elapsed
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

    material.uniforms.uOpacity.value = 0.14 + (1 - dayCycle.daylight) * 0.96
  }, [dayCycle.daylight])

  return null
}

export default Stars
