'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSimulationStore } from '@/store/simulation'
import { conditions } from '@/data/conditions'

type Props = {
  mode: 'landing' | 'simulation'
}

export default function Nav({ mode }: Props) {
  const { condition, setCondition } = useSimulationStore()
  const [modelOpen, setModelOpen] = useState(false)

  const navBg = mode === 'landing' ? '#fef4f6' : 'var(--surface)'
  const navBorder = mode === 'landing' ? '1px solid #fad8e0' : '1px solid var(--border)'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14"
      style={{ background: navBg, borderBottom: navBorder }}
    >
      {/* Logo */}
      <Link href="/" className="text-sm font-semibold tracking-wide" style={{ color: 'var(--accent)' }}>
        Logo
      </Link>

      {/* Right nav links */}
      <div className="flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>

        <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
          Home
        </Link>

        <Link href="/purpose" className="hover:text-[var(--foreground)] transition-colors">
          Purpose
        </Link>

        {/* Model */}
        {mode === 'landing' ? (
          <Link href="/model" className="hover:text-[var(--foreground)] transition-colors">
            Model
          </Link>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setModelOpen(true)}
            onMouseLeave={() => setModelOpen(false)}
          >
            <button
              className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors cursor-default"
              style={{ color: modelOpen ? 'var(--foreground)' : undefined }}
            >
              Model
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-0.5">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {modelOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl py-1 w-44 shadow-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Simulation
                </p>
                {conditions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCondition(c.id); setModelOpen(false) }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[var(--accent-light)] transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {c.label}
                    {condition === c.id && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Link href="/#sources" className="hover:text-[var(--foreground)] transition-colors">
          Sources
        </Link>
      </div>
    </nav>
  )
}
