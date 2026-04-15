import {
  computeVelocity,
  isInsideBody,
  type SourcePanel,
} from './flowField'

export interface StreamlinePoint {
  x: number
  y: number
  z: number
  velocity: number
}

export function traceStreamline(
  startX: number,
  startY: number,
  startZ: number,
  sources: SourcePanel[],
  windSpeed: number,
  angleOfAttack: number,
  modelType: 'car' | 'airfoil' = 'car',
  maxSteps: number = 250,
  stepSize: number = 0.04
): StreamlinePoint[] {
  const path: StreamlinePoint[] = []
  let cx = startX
  let cy = startY
  let cz = startZ

  for (let i = 0; i < maxSteps; i++) {
    if (isInsideBody(cx, cy, cz, modelType)) break
    if (Math.abs(cx) > 6 || Math.abs(cy) > 4 || Math.abs(cz) > 4) break

    const v = computeVelocity(cx, cy, cz, windSpeed, angleOfAttack, sources, modelType)
    const vmag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

    if (vmag < 0.01) break

    path.push({ x: cx, y: cy, z: cz, velocity: vmag })

    // RK4 integration (arc-length parameterized)
    const inv1 = stepSize / vmag
    const k1x = v.x * inv1
    const k1y = v.y * inv1
    const k1z = v.z * inv1

    const v2 = computeVelocity(
      cx + k1x * 0.5,
      cy + k1y * 0.5,
      cz + k1z * 0.5,
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )
    const vmag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z)
    if (vmag2 < 0.01) break
    const inv2 = stepSize / vmag2
    const k2x = v2.x * inv2
    const k2y = v2.y * inv2
    const k2z = v2.z * inv2

    const v3 = computeVelocity(
      cx + k2x * 0.5,
      cy + k2y * 0.5,
      cz + k2z * 0.5,
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )
    const vmag3 = Math.sqrt(v3.x * v3.x + v3.y * v3.y + v3.z * v3.z)
    if (vmag3 < 0.01) break
    const inv3 = stepSize / vmag3
    const k3x = v3.x * inv3
    const k3y = v3.y * inv3
    const k3z = v3.z * inv3

    const v4 = computeVelocity(
      cx + k3x,
      cy + k3y,
      cz + k3z,
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )
    const vmag4 = Math.sqrt(v4.x * v4.x + v4.y * v4.y + v4.z * v4.z)
    if (vmag4 < 0.01) break
    const inv4 = stepSize / vmag4
    const k4x = v4.x * inv4
    const k4y = v4.y * inv4
    const k4z = v4.z * inv4

    cx += (k1x + 2 * k2x + 2 * k3x + k4x) / 6
    cy += (k1y + 2 * k2y + 2 * k3y + k4y) / 6
    cz += (k1z + 2 * k2z + 2 * k3z + k4z) / 6
  }

  return path
}

export function generateStreamlineSeeds(
  angleOfAttack: number,
  numStreamlines: number = 40
): Array<[number, number, number]> {
  const seeds: Array<[number, number, number]> = []
  const xStart = -4.0

  // Grid of seed points upstream
  const gridY = Math.ceil(Math.sqrt(numStreamlines * 1.5))
  const gridZ = Math.ceil(numStreamlines / gridY)
  const spanY = 2.5
  const spanZ = 2.5

  for (let iy = 0; iy < gridY; iy++) {
    for (let iz = 0; iz < gridZ; iz++) {
      if (seeds.length >= numStreamlines) break
      const y = -spanY / 2 + ((iy + 0.5) / gridY) * spanY
      const z = -spanZ / 2 + ((iz + 0.5) / gridZ) * spanZ
      seeds.push([xStart, y, z])
    }
  }

  // Add some seeds closer to the body for interesting near-body flow
  const closeSeeds = Math.min(12, Math.floor(numStreamlines * 0.3))
  for (let i = 0; i < closeSeeds; i++) {
    const angle = (i / closeSeeds) * Math.PI * 2
    const r = 0.7 + Math.random() * 0.3
    seeds.push([xStart, Math.cos(angle) * r, Math.sin(angle) * r])
  }

  return seeds
}
