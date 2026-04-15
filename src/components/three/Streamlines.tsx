'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'
import { type SourcePanel } from '@/simulation/flowField'
import {
  traceStreamline,
  generateStreamlineSeeds,
} from '@/simulation/streamlineTracer'

const VERTEX_SHADER = /* glsl */ `
  attribute float aDistance;
  attribute float aVelocity;
  varying float vDistance;
  varying float vVelocity;

  void main() {
    vDistance = aDistance;
    vVelocity = aVelocity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uMaxVelocity;
  varying float vDistance;
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
    float flow = fract(vDistance * 1.8 - uTime * 0.7);
    float alpha = smoothstep(0.0, 0.12, flow) * smoothstep(1.0, 0.45, flow);
    vec3 color = velocityColor(vVelocity);
    // Boost brightness for additive blending
    gl_FragColor = vec4(color * (0.6 + alpha * 0.6), alpha * 0.82);
  }
`

interface StreamlinesProps {
  sources: SourcePanel[]
}

export default function Streamlines({ sources }: StreamlinesProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const visualizationMode = useSimStore((s) => s.visualizationMode)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMaxVelocity: { value: windSpeed * 1.4 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useEffect(() => {
    material.uniforms.uMaxVelocity.value = windSpeed * 1.4
  }, [windSpeed, material])

  const lines = useMemo(() => {
    const seeds = generateStreamlineSeeds(angleOfAttack, 48)
    const result: THREE.Line[] = []

    for (const [sx, sy, sz] of seeds) {
      const path = traceStreamline(
        sx,
        sy,
        sz,
        sources,
        windSpeed,
        angleOfAttack,
        modelType,
        280,
        0.035
      )

      if (path.length < 5) continue

      const positions = new Float32Array(path.length * 3)
      const distances = new Float32Array(path.length)
      const velocities = new Float32Array(path.length)

      let dist = 0
      for (let i = 0; i < path.length; i++) {
        positions[i * 3] = path[i].x
        positions[i * 3 + 1] = path[i].y
        positions[i * 3 + 2] = path[i].z

        if (i > 0) {
          const dx = path[i].x - path[i - 1].x
          const dy = path[i].y - path[i - 1].y
          const dz = path[i].z - path[i - 1].z
          dist += Math.sqrt(dx * dx + dy * dy + dz * dz)
        }
        distances[i] = dist
        velocities[i] = path[i].velocity
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('aDistance', new THREE.BufferAttribute(distances, 1))
      geo.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 1))

      result.push(new THREE.Line(geo, material))
    }

    return result
  }, [sources, windSpeed, angleOfAttack, modelType, material])

  // Cleanup old geometries
  useEffect(() => {
    return () => {
      lines.forEach((line) => line.geometry.dispose())
    }
  }, [lines])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  if (visualizationMode !== 'streamlines') return null

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <primitive key={`sl-${windSpeed}-${angleOfAttack}-${modelType}-${i}`} object={line} />
      ))}
    </group>
  )
}
