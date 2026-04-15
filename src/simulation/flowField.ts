/**
 * Potential flow field computation using slender body theory.
 * Uses a distribution of point sources along the body axis to model
 * flow around the aerodynamic body.
 */

export interface SourcePanel {
  x: number
  y: number
  z: number
  strength: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function getCarProfile(t: number): {
  width: number
  height: number
  nExponent: number
  zOffset: number
} {
  // t: 0 (front) to 1 (rear)
  const frontTaper = smoothstep(0, 0.18, t)
  const rearTaper = smoothstep(1, 0.6, t)
  const envelope = frontTaper * rearTaper

  const baseWidth = 0.65
  const wheelBulge =
    0.06 *
    (Math.exp(-((t - 0.25) ** 2) / 0.005) +
      Math.exp(-((t - 0.72) ** 2) / 0.008))
  const width = baseWidth * envelope + wheelBulge * envelope

  const baseHeight = 0.35
  const cabinBump = 0.55 * Math.exp(-((t - 0.38) ** 2) / 0.015)
  const spoiler =
    0.05 * Math.exp(-((t - 0.88) ** 2) / 0.003) * smoothstep(0.7, 0.88, t)
  const height = baseHeight * envelope * (1 + cabinBump) + spoiler * envelope

  const nExponent = 2.5 + 1.5 * envelope
  const zOffset = -0.12 * envelope

  return { width, height, nExponent, zOffset }
}

export function getAirfoilProfile(t: number): {
  width: number
  height: number
  nExponent: number
  zOffset: number
} {
  // NACA 0012-like symmetric airfoil extruded as a wing
  const chord = 3.0
  const thickness = 0.12
  const span = 3.0

  const frontTaper = smoothstep(0, 0.05, t)
  const rearTaper = smoothstep(1, 0.92, t)
  const envelope = frontTaper * rearTaper

  const x = t * chord
  const yt =
    5 *
    thickness *
    chord *
    (0.2969 * Math.sqrt(t) -
      0.126 * t -
      0.3516 * t * t +
      0.2843 * t * t * t -
      0.1015 * t * t * t * t)

  return {
    width: (span / 2) * envelope,
    height: Math.max(yt, 0),
    nExponent: 2.0,
    zOffset: 0,
  }
}

const NUM_SOURCES = 40

export function computeSourceDistribution(
  windSpeed: number,
  angleOfAttack: number,
  modelType: 'car' | 'airfoil' = 'car'
): SourcePanel[] {
  const panels: SourcePanel[] = []
  const alpha = (angleOfAttack * Math.PI) / 180
  const Vx = windSpeed * Math.cos(alpha)
  const bodyLength = 4.0
  const dt = 1 / NUM_SOURCES

  const getProfile =
    modelType === 'car' ? getCarProfile : getAirfoilProfile

  for (let i = 0; i < NUM_SOURCES; i++) {
    const t = (i + 0.5) / NUM_SOURCES
    const x = -2 + t * bodyLength

    const t_prev = Math.max(0, t - dt * 0.5)
    const t_next = Math.min(1, t + dt * 0.5)
    const p_prev = getProfile(t_prev)
    const p_next = getProfile(t_next)

    const area_prev = Math.PI * p_prev.width * p_prev.height
    const area_next = Math.PI * p_next.width * p_next.height
    const dAdx = (area_next - area_prev) / ((t_next - t_prev) * bodyLength)

    panels.push({
      x,
      y: 0,
      z: 0,
      strength: Vx * dAdx * (bodyLength / NUM_SOURCES),
    })
  }

  return panels
}

export function computeVelocity(
  px: number,
  py: number,
  pz: number,
  windSpeed: number,
  angleOfAttack: number,
  sources: SourcePanel[],
  modelType: 'car' | 'airfoil' = 'car'
): Vec3 {
  const alpha = (angleOfAttack * Math.PI) / 180
  let vx = windSpeed * Math.cos(alpha)
  let vy = windSpeed * Math.sin(alpha)
  let vz = 0

  // Source contributions
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i]
    const dx = px - s.x
    const dy = py - s.y
    const dz = pz - s.z
    const r2 = dx * dx + dy * dy + dz * dz
    if (r2 < 0.0001) continue
    const r = Math.sqrt(r2)
    const r3 = r2 * r
    const factor = s.strength / (4 * Math.PI * r3)
    vx += factor * dx
    vy += factor * dy
    vz += factor * dz
  }

  // Near-body repulsion to prevent streamline penetration
  const t = (px + 2) / 4
  if (t > 0 && t < 1) {
    const getProfile =
      modelType === 'car' ? getCarProfile : getAirfoilProfile
    const prof = getProfile(t)

    if (prof.width > 0.01 && prof.height > 0.01) {
      const ly = py
      const lz = pz - prof.zOffset
      const wy = Math.abs(ly / prof.width)
      const wz = Math.abs(lz / Math.max(prof.height, 0.01))

      const n = prof.nExponent
      const t1 = Math.pow(wy, n)
      const t2 = Math.pow(wz, n)
      const dist = Math.pow(t1 + t2, 1 / n)

      if (dist > 0.01 && dist < 1.8) {
        const repulsion = Math.exp(-(dist - 1) * 4) * 0.6
        // Gradient of the super-ellipse (outward normal direction)
        const gny =
          ly !== 0
            ? (Math.sign(ly) * n * Math.pow(Math.abs(ly), n - 1)) /
              Math.pow(prof.width, n)
            : 0
        const gnz =
          lz !== 0
            ? (Math.sign(lz) * n * Math.pow(Math.abs(lz), n - 1)) /
              Math.pow(Math.max(prof.height, 0.01), n)
            : 0
        const gnl = Math.sqrt(gny * gny + gnz * gnz) + 0.001
        vy += repulsion * windSpeed * (gny / gnl)
        vz += repulsion * windSpeed * (gnz / gnl)
      }
    }
  }

  return { x: vx, y: vy, z: vz }
}

export function isInsideBody(
  px: number,
  py: number,
  pz: number,
  modelType: 'car' | 'airfoil' = 'car'
): boolean {
  const t = (px + 2) / 4
  if (t <= 0 || t >= 1) return false

  const getProfile =
    modelType === 'car' ? getCarProfile : getAirfoilProfile
  const prof = getProfile(t)

  if (prof.width < 0.001 || prof.height < 0.001) return false

  const ly = py
  const lz = pz - prof.zOffset
  const wy = Math.abs(ly / prof.width)
  const wz = Math.abs(lz / Math.max(prof.height, 0.001))

  const n = prof.nExponent
  return Math.pow(wy, n) + Math.pow(wz, n) <= 1.05 // slight padding
}

export function velocityToColor(normalizedVelocity: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, normalizedVelocity))
  let r: number, g: number, b: number

  if (t < 0.25) {
    const s = t / 0.25
    r = 0.0
    g = s * 0.7
    b = 0.8 + s * 0.2
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    r = 0.0
    g = 0.7 + s * 0.3
    b = 1.0 - s * 0.7
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    r = s
    g = 1.0
    b = 0.3 - s * 0.3
  } else {
    const s = (t - 0.75) / 0.25
    r = 1.0
    g = 1.0 - s * 0.85
    b = 0.0
  }

  return [r, g, b]
}

export function computePressureCoefficient(
  vmag: number,
  windSpeed: number
): number {
  return 1 - (vmag * vmag) / (windSpeed * windSpeed)
}

export function computeAeroCoefficients(
  windSpeed: number,
  angleOfAttack: number,
  sources: SourcePanel[],
  modelType: 'car' | 'airfoil' = 'car'
): { cd: number; cl: number } {
  // Empirical approximation that responds correctly to parameters
  const alpha = (angleOfAttack * Math.PI) / 180

  if (modelType === 'airfoil') {
    // Thin airfoil theory approximation
    const cl = 2 * Math.PI * alpha * 0.85
    const cd_friction = 0.008
    const cd_induced = (cl * cl) / (Math.PI * 6 * 0.9) // AR=6, e=0.9
    const cd_pressure = 0.15 * Math.sin(alpha) * Math.sin(alpha)
    return {
      cd: parseFloat((cd_friction + cd_induced + cd_pressure).toFixed(4)),
      cl: parseFloat(cl.toFixed(4)),
    }
  }

  // Car body
  const cd_base = 0.32
  const cd_alpha = 0.5 * Math.sin(alpha) * Math.sin(alpha)
  const cl_base = -0.05 // slight downforce
  const cl_alpha = 1.8 * Math.sin(alpha) * Math.cos(alpha)

  return {
    cd: parseFloat((cd_base + cd_alpha).toFixed(4)),
    cl: parseFloat((cl_base + cl_alpha).toFixed(4)),
  }
}

export function computePressureDistribution(
  windSpeed: number,
  angleOfAttack: number,
  sources: SourcePanel[],
  modelType: 'car' | 'airfoil' = 'car'
): Array<{ x: number; cp: number }> {
  const data: Array<{ x: number; cp: number }> = []
  const getProfile =
    modelType === 'car' ? getCarProfile : getAirfoilProfile
  const N = 50

  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = -2 + t * 4
    const prof = getProfile(t)

    if (prof.width < 0.01 || prof.height < 0.01) {
      data.push({ x: parseFloat(x.toFixed(2)), cp: 1 })
      continue
    }

    // Sample on top of body
    const sampleZ = prof.height + prof.zOffset + 0.04
    const vel = computeVelocity(x, 0, sampleZ, windSpeed, angleOfAttack, sources, modelType)
    const vmag = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
    const cp = computePressureCoefficient(vmag, windSpeed)
    data.push({ x: parseFloat(x.toFixed(2)), cp: parseFloat(cp.toFixed(3)) })
  }

  return data
}

export function computeVelocityHistogram(
  windSpeed: number,
  angleOfAttack: number,
  sources: SourcePanel[],
  modelType: 'car' | 'airfoil' = 'car'
): Array<{ bin: string; count: number; normalizedVel: number }> {
  const velocities: number[] = []
  const sampleCount = 400

  for (let i = 0; i < sampleCount; i++) {
    const x = -3 + Math.random() * 8
    const y = (Math.random() - 0.5) * 4
    const z = (Math.random() - 0.5) * 4

    if (isInsideBody(x, y, z, modelType)) continue

    const vel = computeVelocity(x, y, z, windSpeed, angleOfAttack, sources, modelType)
    velocities.push(Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z))
  }

  const maxVel = Math.max(...velocities, windSpeed * 1.5)
  const numBins = 10
  const bins = Array.from({ length: numBins }, (_, i) => ({
    bin: `${((i * maxVel) / numBins).toFixed(0)}`,
    count: 0,
    normalizedVel: (i + 0.5) / numBins,
  }))

  for (const v of velocities) {
    const idx = Math.min(Math.floor((v / maxVel) * numBins), numBins - 1)
    bins[idx].count++
  }

  return bins
}
