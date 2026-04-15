import { create } from 'zustand'

export type VisualizationMode = 'streamlines' | 'pressure' | 'particles' | 'vectors'
export type ModelType = 'car' | 'airfoil'

interface HoveredPoint {
  position: [number, number, number]
  pressure: number
  velocity: number
}

interface SimState {
  // Simulation parameters
  windSpeed: number
  angleOfAttack: number
  visualizationMode: VisualizationMode
  modelType: ModelType
  showDebugMesh: boolean
  showSlicePlane: boolean
  slicePlaneX: number
  leftPanelOpen: boolean
  rightPanelOpen: boolean

  // Computed data
  dragCoefficient: number
  liftCoefficient: number
  pressureData: Array<{ x: number; cp: number }>
  velocityHistogram: Array<{ bin: string; count: number; normalizedVel: number }>

  // Interaction
  hoveredPoint: HoveredPoint | null

  // Actions
  setWindSpeed: (speed: number) => void
  setAngleOfAttack: (angle: number) => void
  setVisualizationMode: (mode: VisualizationMode) => void
  setModelType: (type: ModelType) => void
  toggleDebugMesh: () => void
  toggleSlicePlane: () => void
  setSlicePlaneX: (x: number) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setHoveredPoint: (point: HoveredPoint | null) => void
  setComputedData: (data: {
    dragCoefficient: number
    liftCoefficient: number
    pressureData: Array<{ x: number; cp: number }>
    velocityHistogram: Array<{ bin: string; count: number; normalizedVel: number }>
  }) => void
}

export const useSimStore = create<SimState>((set) => ({
  windSpeed: 25,
  angleOfAttack: 0,
  visualizationMode: 'streamlines',
  modelType: 'car',
  showDebugMesh: false,
  showSlicePlane: false,
  slicePlaneX: 0,
  leftPanelOpen: true,
  rightPanelOpen: true,

  dragCoefficient: 0.32,
  liftCoefficient: -0.05,
  pressureData: [],
  velocityHistogram: [],

  hoveredPoint: null,

  setWindSpeed: (speed) => set({ windSpeed: speed }),
  setAngleOfAttack: (angle) => set({ angleOfAttack: angle }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),
  setModelType: (type) => set({ modelType: type }),
  toggleDebugMesh: () => set((s) => ({ showDebugMesh: !s.showDebugMesh })),
  toggleSlicePlane: () => set((s) => ({ showSlicePlane: !s.showSlicePlane })),
  setSlicePlaneX: (x) => set({ slicePlaneX: x }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setHoveredPoint: (point) => set({ hoveredPoint: point }),
  setComputedData: (data) => set(data),
}))
