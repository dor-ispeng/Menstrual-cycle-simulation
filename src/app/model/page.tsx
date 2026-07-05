'use client'

import Nav from '@/components/Nav'
import SimulationCanvas from '@/components/SimulationCanvas'
import TimelineBar from '@/components/TimelineBar'
import ContentCard from '@/components/ContentCard'
import StructurePanel from '@/components/StructurePanel'
import HormoneGraph from '@/components/HormoneGraph'

export default function ModelPage() {
  return (
    <div className="w-screen h-screen flex flex-col" style={{ background: 'var(--background)', overflow: 'hidden' }}>
      <Nav mode="simulation" />

      {/* Simulation area */}
      <div className="relative flex-1 min-h-0" style={{ marginTop: 56, marginBottom: 96 }}>
        <SimulationCanvas />
        <ContentCard />
        <StructurePanel />
        <HormoneGraph />
      </div>

      <TimelineBar />
    </div>
  )
}
