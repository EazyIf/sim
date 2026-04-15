'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useSimStore } from '@/store/useSimStore'
import {
  computeSourceDistribution,
  computeAeroCoefficients,
  computePressureDistribution,
  computeVelocityHistogram,
} from '@/simulation/flowField'
import AeroBody from './AeroBody'
import Streamlines from './Streamlines'
import ParticleFlow from './ParticleFlow'
import VectorField from './VectorField'
import SlicePlane from './SlicePlane'

function SceneContent() {
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const modelType = useSimStore((s) => s.modelType)
  const setComputedData = useSimStore((s) => s.setComputedData)

  const sources = useMemo(
    () => computeSourceDistribution(windSpeed, angleOfAttack, modelType),
    [windSpeed, angleOfAttack, modelType]
  )

  // Update computed aerodynamic data when parameters change
  useEffect(() => {
    const { cd, cl } = computeAeroCoefficients(
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )
    const pressureData = computePressureDistribution(
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )
    const velocityHistogram = computeVelocityHistogram(
      windSpeed,
      angleOfAttack,
      sources,
      modelType
    )

    setComputedData({
      dragCoefficient: cd,
      liftCoefficient: cl,
      pressureData,
      velocityHistogram,
    })
  }, [windSpeed, angleOfAttack, sources, modelType, setComputedData])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -5]} intensity={0.4} color="#6088ff" />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#4060ff" />
      <Environment preset="city" backgroundBlurriness={1} backgroundIntensity={0} />

      {/* Ground grid */}
      <Grid
        args={[20, 20]}
        position={[0, -1.2, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#1a1a3a"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#2a2a5a"
        fadeDistance={12}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0, 0]}
      />

      {/* Model */}
      <AeroBody sources={sources} />

      {/* Visualizations */}
      <Streamlines sources={sources} />
      <ParticleFlow sources={sources} />
      <VectorField sources={sources} />
      <SlicePlane sources={sources} />
    </>
  )
}

export default function Scene() {
  return (
    <Canvas
      camera={{
        position: [4, 2.5, 4],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ background: '#08080c' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#08080c']} />
      <fog attach="fog" args={['#08080c', 10, 20]} />
      <SceneContent />
    </Canvas>
  )
}
