'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Tooltip,
} from 'recharts'
import { useSimStore } from '@/store/useSimStore'
import { velocityToColor } from '@/simulation/flowField'

function MetricCard({
  label,
  value,
  unit,
  color = '#3b82f6',
}: {
  label: string
  value: string
  unit: string
  color?: string
}) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-white/5">
      <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-mono font-semibold" style={{ color }}>
          {value}
        </span>
        <span className="text-[10px] text-white/30">{unit}</span>
      </div>
    </div>
  )
}

function HoverInfo() {
  const hoveredPoint = useSimStore((s) => s.hoveredPoint)

  if (!hoveredPoint) return null

  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 border border-blue-500/20">
      <div className="text-[10px] uppercase tracking-widest text-blue-400/60 mb-2">
        Surface Point
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-white/40">Position</div>
        <div className="font-mono text-white/70">
          ({hoveredPoint.position.map((v) => v.toFixed(2)).join(', ')})
        </div>
        <div className="text-white/40">Velocity</div>
        <div className="font-mono text-blue-400">
          {hoveredPoint.velocity.toFixed(1)} m/s
        </div>
        <div className="text-white/40">Cp</div>
        <div className="font-mono text-blue-400">
          {hoveredPoint.pressure.toFixed(3)}
        </div>
      </div>
    </div>
  )
}

export default function DataPanel() {
  const windSpeed = useSimStore((s) => s.windSpeed)
  const dragCoefficient = useSimStore((s) => s.dragCoefficient)
  const liftCoefficient = useSimStore((s) => s.liftCoefficient)
  const pressureData = useSimStore((s) => s.pressureData)
  const velocityHistogram = useSimStore((s) => s.velocityHistogram)
  const rightPanelOpen = useSimStore((s) => s.rightPanelOpen)
  const toggleRightPanel = useSimStore((s) => s.toggleRightPanel)

  // Compute forces
  const rho = 1.225 // kg/m^3 air density
  const area = 1.8 // m^2 approximate frontal area
  const qInf = 0.5 * rho * windSpeed * windSpeed * area
  const dragForce = (dragCoefficient * qInf).toFixed(1)
  const liftForce = (liftCoefficient * qInf).toFixed(1)

  const histogramColors = useMemo(() => {
    return velocityHistogram.map((d) => {
      const [r, g, b] = velocityToColor(d.normalizedVel)
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
    })
  }, [velocityHistogram])

  if (!rightPanelOpen) {
    return (
      <button
        onClick={toggleRightPanel}
        className="absolute right-4 top-4 z-20 glass-panel w-10 h-10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    )
  }

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[300px] z-20 glass-panel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 pulse-glow" />
          <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
            Metrics
          </span>
        </div>
        <button
          onClick={toggleRightPanel}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Coefficients */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Aerodynamic Coefficients
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Drag (Cd)"
              value={dragCoefficient.toFixed(4)}
              unit=""
              color="#f97316"
            />
            <MetricCard
              label="Lift (Cl)"
              value={liftCoefficient.toFixed(4)}
              unit=""
              color="#22c55e"
            />
          </div>
        </section>

        {/* Forces */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Forces at {windSpeed.toFixed(0)} m/s
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Drag Force"
              value={dragForce}
              unit="N"
              color="#f97316"
            />
            <MetricCard
              label="Lift Force"
              value={liftForce}
              unit="N"
              color="#22c55e"
            />
          </div>
        </section>

        {/* Pressure Distribution */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Pressure Distribution (Cp)
          </h3>
          <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={pressureData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="x"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  tickCount={5}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  tickCount={5}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,18,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                />
                <Line
                  type="monotone"
                  dataKey="cp"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Velocity Histogram */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Velocity Distribution
          </h3>
          <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={velocityHistogram} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="bin"
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,18,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {velocityHistogram.map((_, i) => (
                    <Cell key={i} fill={histogramColors[i] || '#3b82f6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Hover Info */}
        <HoverInfo />

        {/* Color Legend */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Velocity Scale
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30">Low</span>
            <div
              className="flex-1 h-3 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, #0d1ad9, #00a6ff, #1aff66, #ffe600, #ff2600)',
              }}
            />
            <span className="text-[9px] text-white/30">High</span>
          </div>
        </section>
      </div>
    </div>
  )
}
