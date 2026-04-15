'use client'

import Scene from './three/Scene'
import ControlPanel from './ui/ControlPanel'
import DataPanel from './ui/DataPanel'

export default function Workspace() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08080c]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-3 px-5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-semibold tracking-wider text-white/70">
                AEROSIM
              </span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[10px] text-white/30 tracking-wide">
              3D Aerodynamic Simulation
            </span>
          </div>
        </div>
      </div>

      {/* 3D Scene (fills entire viewport) */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* UI Overlays */}
      <ControlPanel />
      <DataPanel />
    </div>
  )
}
