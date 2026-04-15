'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'
import {
  computeVelocity,
  isInsideBody,
  type SourcePanel,
} from '@/simulation/flowField'

const NUM_PARTICLES = 2500

const PARTICLE_VS = /* glsl */ `
  attribute float aVelocity;
  uniform float uMaxVelocity;
  uniform float uPixelRatio;
  varying float vVelocity;

  void main() {
    vVelocity = aVelocity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float size = (3.5 * uPixelRatio) / -mvPosition.z;
    gl_PointSize = clamp(size, 1.0, 8.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const PARTICLE_FS = /* glsl */ `
  uniform float uMaxVelocity;
  varying float vVelocity;

  vec3 velocityColor(float v) {
    float t = clamp(v / uMaxVelocity, 0.0, 1.0);
    vec3 c;
    if (t < 0.25) {
      c = mix(vec3(0.05, 0.1, 0.85), vec3(0.0, 0.65, 1.0), t * 4.0);
    } else if (t < 0.5) {
      c = mix(vec3(0.0, 0.65, 1.0), vec3(0.1, 1.0, 0.4), (t - 0.25) * 4.0);
    } else if (t < 0.75) {
      c = mix(vec3(0.1, 1.0, 0.4), vec3(1.0, 0.95, 0.1), (t - 0.5) * 4.0);
    } else {
      c = mix(vec3(1.0, 0.95, 0.1), vec3(1.0, 0.15, 0.05), (t - 0.75) * 4.0);
    }
    return c;
  }

  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (d > 1.0) discard;
    float alpha = (1.0 - d * d) * 0.7;
    vec3 color = velocityColor(vVelocity);
    gl_FragColor = vec4(color * 1.2, alpha);
  }
`

interface ParticleFlowProps {
  sources: SourcePanel[]
}

function resetParticle(positions: Float32Array, i: number) {
  positions[i * 3] = -4.5 + Math.random() * 0.8
  positions[i * 3 + 1] = (Math.random() - 0.5) * 4
  positions[i * 3 + 2] = (Math.random() - 0.5) * 4
}

export default function ParticleFlow({ sources }: ParticleFlowProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const visualizationMode = useSimStore((s) => s.visualizationMode)

  const state = useRef({
    positions: new Float32Array(NUM_PARTICLES * 3),
    velocities: new Float32Array(NUM_PARTICLES),
  })

  // Initialize particles
  useEffect(() => {
    const { positions } = state.current
    for (let i = 0; i < NUM_PARTICLES; i++) {
      // Spread initialization across the domain for immediate visual
      positions[i * 3] = -5 + Math.random() * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
  }, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMaxVelocity: {
            value: 35,
          },
          uPixelRatio: {
            value: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
          },
        },
        vertexShader: PARTICLE_VS,
        fragmentShader: PARTICLE_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useEffect(() => {
    material.uniforms.uMaxVelocity.value = windSpeed * 1.4
  }, [windSpeed, material])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(state.current.positions, 3)
    )
    geo.setAttribute(
      'aVelocity',
      new THREE.BufferAttribute(state.current.velocities, 1)
    )
    return geo
  }, [])

  useFrame((_, delta) => {
    if (visualizationMode !== 'particles') return
    if (!pointsRef.current) return

    const { positions, velocities } = state.current
    const dt = Math.min(delta, 0.04)

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const ix = i * 3
      const px = positions[ix]
      const py = positions[ix + 1]
      const pz = positions[ix + 2]

      const vel = computeVelocity(
        px,
        py,
        pz,
        windSpeed,
        angleOfAttack,
        sources,
        modelType
      )
      const vmag = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)

      positions[ix] += vel.x * dt
      positions[ix + 1] += vel.y * dt
      positions[ix + 2] += vel.z * dt
      velocities[i] = vmag

      // Reset particles that leave the domain or enter the body
      if (
        positions[ix] > 6 ||
        positions[ix] < -5 ||
        Math.abs(positions[ix + 1]) > 3 ||
        Math.abs(positions[ix + 2]) > 3 ||
        isInsideBody(positions[ix], positions[ix + 1], positions[ix + 2], modelType)
      ) {
        resetParticle(positions, i)
      }
    }

    const geo = pointsRef.current.geometry
    ;(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('aVelocity') as THREE.BufferAttribute).needsUpdate = true
  })

  if (visualizationMode !== 'particles') return null

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
