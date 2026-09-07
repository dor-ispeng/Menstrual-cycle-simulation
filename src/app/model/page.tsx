'use client'

import Nav from '@/components/Nav'
import SimulationCanvas from '@/components/SimulationCanvas'
import TimelineBar from '@/components/TimelineBar'
import ContentCard from '@/components/ContentCard'
import StructurePanel from '@/components/StructurePanel'
import HormoneGraph from '@/components/HormoneGraph'

export default function ModelPage() {
  return (
    <div className="w-screen h-screen flex flex-col" style={{ background: 'var(--background)', overflow: 'hidden', fontFamily: 'var(--font-quicksand), sans-serif' }}>
      <Nav />

      {/* Simulation area.
          marginBottom reserves room for the fixed TimelineBar so the canvas
          and its overlay cards are never hidden behind it. It must stay >=
          the bar's rendered height: the bar grew from ~86px to ~107px when
          the persistent disclaimer row was added, so 96 was no longer enough.
          If you add or remove a row in TimelineBar, re-measure and update
          this number. */}
      <div className="relative flex-1 min-h-0" style={{ marginBottom: 112 }}>
        <SimulationCanvas />
        <ContentCard />
        <StructurePanel />
        <HormoneGraph />
      </div>

      <TimelineBar />
    </div>
  )
}
