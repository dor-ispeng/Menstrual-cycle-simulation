import { create } from 'zustand'
import { ConditionId } from '@/types/simulation'

interface SimulationStore {
  progress: number
  condition: ConditionId
  selectedStructureId: string | null
  isHormoneGraphOpen: boolean
  isPlaying: boolean
  setProgress: (p: number) => void
  setCondition: (c: ConditionId) => void
  setSelectedStructure: (id: string | null) => void
  toggleHormoneGraph: () => void
  setIsPlaying: (v: boolean) => void
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  progress: 0,
  condition: 'normal',
  selectedStructureId: null,
  isHormoneGraphOpen: true,
  isPlaying: false,
  setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),
  setCondition: (c) => set({ condition: c, selectedStructureId: null }),
  setSelectedStructure: (id) => set({ selectedStructureId: id }),
  toggleHormoneGraph: () => set((s) => ({ isHormoneGraphOpen: !s.isHormoneGraphOpen })),
  setIsPlaying: (v) => set({ isPlaying: v }),
}))
