import * as THREE from 'three'
import { getCarProfile, getAirfoilProfile } from './flowField'

export function generateCarBodyGeometry(): THREE.BufferGeometry {
  const lengthSegments = 72
  const radialSegments = 32
  const bodyLength = 4
  const xMin = -2

  const vertices: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments
    const x = xMin + t * bodyLength
    const { width, height, nExponent, zOffset } = getCarProfile(t)

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2

      if (width < 0.001 || height < 0.001) {
        vertices.push(x, 0, zOffset)
      } else {
        const cosT = Math.cos(theta)
        const sinT = Math.sin(theta)
        const exp = 2 / nExponent
        const y =
          Math.sign(cosT) * Math.pow(Math.abs(cosT) + 1e-8, exp) * width
        const z =
          Math.sign(sinT) * Math.pow(Math.abs(sinT) + 1e-8, exp) * height +
          zOffset

        // Flatten the bottom for a car-like shape
        const zFlat = sinT < -0.3 ? Math.max(z, zOffset - height * 0.4) : z

        vertices.push(x, y, zFlat)
      }
    }
  }

  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = a + radialSegments + 1
      indices.push(a, b, a + 1)
      indices.push(a + 1, b, b + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

export function generateAirfoilGeometry(): THREE.BufferGeometry {
  const chordSegments = 60
  const spanSegments = 20
  const chord = 3.0
  const span = 3.0
  const thickness = 0.12

  const vertices: number[] = []
  const indices: number[] = []

  // Generate NACA 0012 airfoil cross-section
  function nacaThickness(xc: number): number {
    const t = thickness
    return (
      5 *
      t *
      chord *
      (0.2969 * Math.sqrt(xc) -
        0.126 * xc -
        0.3516 * xc * xc +
        0.2843 * xc * xc * xc -
        0.1015 * xc * xc * xc * xc)
    )
  }

  // Upper and lower surface
  for (let surface = 0; surface < 2; surface++) {
    const sign = surface === 0 ? 1 : -1

    for (let iz = 0; iz <= spanSegments; iz++) {
      const zt = iz / spanSegments
      const z = (zt - 0.5) * span
      // Slight taper at tips
      const taperFactor =
        1 - 0.3 * Math.pow(Math.abs(zt - 0.5) * 2, 2)

      for (let ix = 0; ix <= chordSegments; ix++) {
        const xt = ix / chordSegments
        const xc = xt
        const x = -2 + xt * chord * taperFactor + (1 - taperFactor) * chord * 0.25
        const yt = nacaThickness(xc) * taperFactor
        const y = sign * yt

        vertices.push(x, y, z)
      }
    }
  }

  const vertsPerSurface = (spanSegments + 1) * (chordSegments + 1)

  // Upper surface indices
  for (let iz = 0; iz < spanSegments; iz++) {
    for (let ix = 0; ix < chordSegments; ix++) {
      const a = iz * (chordSegments + 1) + ix
      const b = a + chordSegments + 1
      indices.push(a, a + 1, b)
      indices.push(a + 1, b + 1, b)
    }
  }

  // Lower surface indices (reversed winding)
  for (let iz = 0; iz < spanSegments; iz++) {
    for (let ix = 0; ix < chordSegments; ix++) {
      const a = vertsPerSurface + iz * (chordSegments + 1) + ix
      const b = a + chordSegments + 1
      indices.push(a, b, a + 1)
      indices.push(a + 1, b, b + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}
