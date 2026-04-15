'use client'

import { useSimStore, type VisualizationMode, type ModelType } from '@/store/useSimStore'

const VIS_MODES: { value: VisualizationMode; label: string; icon: string }[] = [
  { value: 'streamlines', label: 'Streamlines', icon: '~' },
  { value: 'pressure', label: 'Pressure Map', icon: '#' },
  { value: 'particles', label: 'Particle Flow', icon: '.' },
  { value: 'vectors', label: 'Vector Field', icon: '^' },
]

const MODELS: { value: ModelType; label: string }[] = [
  { value: 'car', label: 'Concept Car' },
  { value: 'airfoil', label: 'NACA Airfoil' },
]

function Toggle({
  active,
  onToggle,
  label,
}: {
  active: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-1.5 group"
    >
      <span className="text-white/60 text-xs group-hover:text-white/80 transition-colors">
        {label}
      </span>
      <div className={`toggle-track ${active ? 'active' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </button>
  )
}

export default function ControlPanel() {
  const windSpeed = useSimStore((s) => s.windSpeed)
  const angleOfAttack = useSimStore((s) => s.angleOfAttack)
  const visualizationMode = useSimStore((s) => s.visualizationMode)
  const modelType = useSimStore((s) => s.modelType)
  const showDebugMesh = useSimStore((s) => s.showDebugMesh)
  const showSlicePlane = useSimStore((s) => s.showSlicePlane)
  const slicePlaneX = useSimStore((s) => s.slicePlaneX)
  const leftPanelOpen = useSimStore((s) => s.leftPanelOpen)

  const setWindSpeed = useSimStore((s) => s.setWindSpeed)
  const setAngleOfAttack = useSimStore((s) => s.setAngleOfAttack)
  const setVisualizationMode = useSimStore((s) => s.setVisualizationMode)
  const setModelType = useSimStore((s) => s.setModelType)
  const toggleDebugMesh = useSimStore((s) => s.toggleDebugMesh)
  const toggleSlicePlane = useSimStore((s) => s.toggleSlicePlane)
  const setSlicePlaneX = useSimStore((s) => s.setSlicePlaneX)
  const toggleLeftPanel = useSimStore((s) => s.toggleLeftPanel)

  if (!leftPanelOpen) {
    return (
      <button
        onClick={toggleLeftPanel}
        className="absolute left-4 top-4 z-20 glass-panel w-10 h-10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    )
  }

  return (
    <div className="absolute left-4 top-4 bottom-4 w-[270px] z-20 glass-panel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 pulse-glow" />
          <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
            Controls
          </span>
        </div>
        <button
          onClick={toggleLeftPanel}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Model Selection */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Model
          </h3>
          <div className="flex gap-1.5">
            {MODELS.map((m) => (
              <button
                key={m.value}
                onClick={() => setModelType(m.value)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  modelType === m.value
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/8 hover:text-white/60'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* Wind Speed */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Wind Speed
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={80}
              step={0.5}
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono text-blue-400 min-w-[52px] text-right">
              {windSpeed.toFixed(1)}
              <span className="text-white/30 text-[10px] ml-0.5">m/s</span>
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-white/20 mt-1 px-0.5">
            <span>1</span>
            <span>80</span>
          </div>
        </section>

        {/* Angle of Attack */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Angle of Attack
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-20}
              max={20}
              step={0.5}
              value={angleOfAttack}
              onChange={(e) => setAngleOfAttack(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono text-blue-400 min-w-[40px] text-right">
              {angleOfAttack.toFixed(1)}
              <span className="text-white/30 text-[10px] ml-0.5">deg</span>
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-white/20 mt-1 px-0.5">
            <span>-20</span>
            <span>0</span>
            <span>20</span>
          </div>
        </section>

        {/* Visualization Mode */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Visualization
          </h3>
          <div className="space-y-1">
            {VIS_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setVisualizationMode(mode.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                  visualizationMode === mode.value
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/60 border border-transparent'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono ${
                    visualizationMode === mode.value
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-white/25'
                  }`}
                >
                  {mode.icon}
                </span>
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        {/* Engineering Tools */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium">
            Engineering Mode
          </h3>
          <div className="space-y-1">
            <Toggle
              active={showDebugMesh}
              onToggle={toggleDebugMesh}
              label="Wireframe Mesh"
            />
            <Toggle
              active={showSlicePlane}
              onToggle={toggleSlicePlane}
              label="Cross-Section Slice"
            />
          </div>

          {showSlicePlane && (
            <div className="mt-2 pl-1">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={slicePlaneX}
                  onChange={(e) =>
                    setSlicePlaneX(parseFloat(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="text-xs font-mono text-white/50 min-w-[36px] text-right">
                  {slicePlaneX.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-[9px] text-white/20">
          <span>Drag to orbit</span>
          <span className="text-white/10">|</span>
          <span>Scroll to zoom</span>
          <span className="text-white/10">|</span>
          <span>Right-click to pan</span>
        </div>
      </div>
    </div>
  )
}
