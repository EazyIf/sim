'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useSimStore } from '@/store/useSimStore'
import {
  computeVelocity,
  isInsideBody,
  velocityToColor,
  type SourcePanel,
} from '@/simulation/flowField'

const GRID_SIZE = 8
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE * GRID_SIZE
const SPACING = 0.9

interface VectorFieldProps {
  sources: SourcePanel[]
}

export default function VectorField({ sources }: VectorFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const visualizationMode = useSimStore((s) => s.visualizationMode)

  useEffect(() => {
    if (!meshRef.current || visualizationMode !== 'vectors') return

    const mesh = meshRef.current
    const dummy = new THREE.Object3D()
    const up = new THREE.Vector3(0, 1, 0)
    const offset = ((GRID_SIZE - 1) * SPACING) / 2
    const colors = new Float32Array(INSTANCE_COUNT * 3)

    let idx = 0
    for (let ix = 0; ix < GRID_SIZE; ix++) {
      for (let iy = 0; iy < GRID_SIZE; iy++) {
        for (let iz = 0; iz < GRID_SIZE; iz++) {
          const x = ix * SPACING - offset
          const y = iy * SPACING - offset
          const z = iz * SPACING - offset

          if (isInsideBody(x, y, z, modelType)) {
            dummy.position.set(x, y, z)
            dummy.scale.set(0, 0, 0)
            dummy.updateMatrix()
            mesh.setMatrixAt(idx, dummy.matrix)
          } else {
            const vel = computeVelocity(
              x,
              y,
              z,
              windSpeed,
              angleOfAttack,
              sources,
              modelType
            )
            const vmag = Math.sqrt(
              vel.x * vel.x + vel.y * vel.y + vel.z * vel.z
            )
            const dir = new THREE.Vector3(vel.x, vel.y, vel.z).normalize()

            dummy.position.set(x, y, z)
            dummy.quaternion.setFromUnitVectors(up, dir)

            const scale = Math.min(vmag / windSpeed, 2) * 0.18
            dummy.scale.set(0.03, scale, 0.03)
            dummy.updateMatrix()
            mesh.setMatrixAt(idx, dummy.matrix)

            const [r, g, b] = velocityToColor(vmag / (windSpeed * 1.4))
            colors[idx * 3] = r
            colors[idx * 3 + 1] = g
            colors[idx * 3 + 2] = b
          }

          idx++
        }
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute(
      'color',
      new THREE.InstancedBufferAttribute(colors, 3)
    )
  }, [windSpeed, angleOfAttack, sources, modelType, visualizationMode])

  if (visualizationMode !== 'vectors') return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, INSTANCE_COUNT]}>
      <coneGeometry args={[1, 2.5, 5]} />
      <meshBasicMaterial vertexColors toneMapped={false} opacity={0.7} transparent />
    </instancedMesh>
  )
}
