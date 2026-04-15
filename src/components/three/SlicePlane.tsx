'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'
import {
  computeVelocity,
  isInsideBody,
  velocityToColor,
  type SourcePanel,
} from '@/simulation/flowField'

const RESOLUTION = 64

interface SlicePlaneProps {
  sources: SourcePanel[]
}

export default function SlicePlane({ sources }: SlicePlaneProps) {
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const showSlicePlane = useSimStore((s) => s.showSlicePlane)
  const slicePlaneX = useSimStore((s) => s.slicePlaneX)

  const texture = useMemo(() => {
    if (!showSlicePlane) return null

    const data = new Uint8Array(RESOLUTION * RESOLUTION * 4)
    const span = 4

    for (let iy = 0; iy < RESOLUTION; iy++) {
      for (let iz = 0; iz < RESOLUTION; iz++) {
        const y = (iy / RESOLUTION - 0.5) * span
        const z = (iz / RESOLUTION - 0.5) * span

        const idx = (iy * RESOLUTION + iz) * 4

        if (isInsideBody(slicePlaneX, y, z, modelType)) {
          data[idx] = 20
          data[idx + 1] = 20
          data[idx + 2] = 30
          data[idx + 3] = 220
          continue
        }

        const vel = computeVelocity(
          slicePlaneX,
          y,
          z,
          windSpeed,
          angleOfAttack,
          sources,
          modelType
        )
        const vmag = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        const [r, g, b] = velocityToColor(vmag / (windSpeed * 1.4))

        data[idx] = Math.round(r * 255)
        data[idx + 1] = Math.round(g * 255)
        data[idx + 2] = Math.round(b * 255)
        data[idx + 3] = 160
      }
    }

    const tex = new THREE.DataTexture(
      data,
      RESOLUTION,
      RESOLUTION,
      THREE.RGBAFormat
    )
    tex.needsUpdate = true
    tex.magFilter = THREE.LinearFilter
    tex.minFilter = THREE.LinearFilter
    return tex
  }, [showSlicePlane, slicePlaneX, windSpeed, angleOfAttack, sources, modelType])

  if (!showSlicePlane || !texture) return null

  return (
    <group>
      {/* Slice plane */}
      <mesh
        position={[slicePlaneX, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Slice plane border */}
      <lineSegments position={[slicePlaneX, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(4, 4)]} />
        <lineBasicMaterial color="#3b82f6" opacity={0.5} transparent />
      </lineSegments>
    </group>
  )
}
