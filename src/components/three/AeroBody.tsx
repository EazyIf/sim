'use client'

import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'
import {
  computeVelocity,
  computePressureCoefficient,
  velocityToColor,
  type SourcePanel,
} from '@/simulation/flowField'
import {
  generateCarBodyGeometry,
  generateAirfoilGeometry,
} from '@/simulation/geometry'

interface AeroBodyProps {
  sources: SourcePanel[]
}

export default function AeroBody({ sources }: AeroBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const wireRef = useRef<THREE.Mesh>(null!)

  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const visualizationMode = useSimStore((s) => s.visualizationMode)
  const showDebugMesh = useSimStore((s) => s.showDebugMesh)
  const setHoveredPoint = useSimStore((s) => s.setHoveredPoint)

  const geometry = useMemo(() => {
    return modelType === 'car'
      ? generateCarBodyGeometry()
      : generateAirfoilGeometry()
  }, [modelType])

  // Compute pressure vertex colors
  const pressureColorAttr = useMemo(() => {
    if (visualizationMode !== 'pressure') return null

    const positions = geometry.getAttribute('position')
    const normals = geometry.getAttribute('normal')
    const colors = new Float32Array(positions.count * 3)

    for (let i = 0; i < positions.count; i++) {
      const nx = normals.getX(i)
      const ny = normals.getY(i)
      const nz = normals.getZ(i)

      // Sample slightly outside surface
      const px = positions.getX(i) + nx * 0.04
      const py = positions.getY(i) + ny * 0.04
      const pz = positions.getZ(i) + nz * 0.04

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
      const cp = computePressureCoefficient(vmag, windSpeed)

      // Map Cp to color: high pressure (cp~1) = red, low pressure (cp~-1) = blue
      const normalized = Math.max(0, Math.min(1, (cp + 1) / 2))
      const [r, g, b] = velocityToColor(1 - normalized)
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }

    return new THREE.Float32BufferAttribute(colors, 3)
  }, [
    geometry,
    windSpeed,
    angleOfAttack,
    sources,
    modelType,
    visualizationMode,
  ])

  // Apply/remove pressure colors
  useEffect(() => {
    if (pressureColorAttr) {
      geometry.setAttribute('color', pressureColorAttr)
    } else {
      geometry.deleteAttribute('color')
    }
  }, [geometry, pressureColorAttr])

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      const p = e.point
      const vel = computeVelocity(
        p.x,
        p.y,
        p.z,
        windSpeed,
        angleOfAttack,
        sources,
        modelType
      )
      const vmag = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
      const cp = computePressureCoefficient(vmag, windSpeed)

      setHoveredPoint({
        position: [p.x, p.y, p.z],
        pressure: cp,
        velocity: vmag,
      })
    },
    [windSpeed, angleOfAttack, sources, modelType, setHoveredPoint]
  )

  const handlePointerLeave = useCallback(() => {
    setHoveredPoint(null)
  }, [setHoveredPoint])

  return (
    <group>
      {/* Main body */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {visualizationMode === 'pressure' ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshPhysicalMaterial
            color="#151528"
            metalness={0.92}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={0.8}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Debug wireframe overlay */}
      {showDebugMesh && (
        <mesh ref={wireRef} geometry={geometry}>
          <meshBasicMaterial
            wireframe
            color="#00ff88"
            opacity={0.25}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
