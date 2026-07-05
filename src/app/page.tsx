'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'

const exploreItems = [
  'How the brain, pituitary, and ovaries communicate through hormone signals',
  'Why ovulation requires a specific sequence of biological events — not just a fixed day',
  'How the uterine lining builds and sheds in response to hormones',
  'What can disrupt the cycle, using PCOS as a comparison example',
  'Why missing periods can have multiple different biological causes',
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fce8ee' }}>
      <Nav mode="landing" />

      {/* All content sits below the 56px fixed nav */}
      <div style={{ paddingTop: 80 }}>

        {/*
          Arc geometry:
            viewBox 800×280, arc M 20,270 A 379,260 0 0,1 778,270
            arc-length ≈ π × √((379²+260²)/2) ≈ 1021 px
            font-size=44 → text ≈ 888 px → 87% fill, 6.5% margin each side
            arc top y=10, chord y=270; interior center y=140 = 50% of viewBox height
            aspect-ratio container keeps button locked to arc center at any width
        */}
        <div style={{ maxWidth: 820, margin: '24px auto 0', padding: '0 16px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '800 / 330' }}>
            <svg
              viewBox="0 -40 800 330"
              style={{ display: 'block', width: '100%', height: '100%' }}
              aria-hidden="true"
            >
              <defs>
                <path id="title-arc" d="M 20,270 A 379,260 0 0,1 778,270" fill="none" />
              </defs>
              <text
                fill="#c06070"
                fontFamily="var(--font-fredoka), sans-serif"
                fontWeight="700"
                fontSize="44"
              >
                <textPath href="#title-arc" startOffset="50%" textAnchor="middle">
                  {'The Menstrual Cycle:  A Simulation'}
                </textPath>
              </text>
            </svg>

            {/* Button is anchored at the geometric center of the arc interior.
                Because both the SVG and this div share the same aspect-ratio container,
                top:50% always maps to y=140 in SVG coordinates, regardless of viewport width. */}
            <div
              style={{
                position: 'absolute',
                top: '54.5%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              <Link
                href="/model"
                className="hover:scale-105 hover:shadow-md transition-all"
                style={{
                  display: 'inline-block',
                  padding: '12px 48px',
                  borderRadius: 9999,
                  background: 'white',
                  color: '#c96875',
                  border: '2px solid #f0b8c4',
                  fontFamily: 'var(--font-fredoka), sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(201, 104, 117, 0.15)',
                }}
              >
                Open Model
              </Link>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p
          style={{
            textAlign: 'center',
            color: '#6b3a42',
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: '8px auto 0',
            padding: '0 24px',
          }}
        >
          An interactive educational model of menstrual physiology
          and reproductive endocrinology.
        </p>

        {/* Explore card */}
        <div
          style={{
            maxWidth: 520,
            margin: '36px auto 0',
            background: 'white',
            borderRadius: 20,
            padding: '28px 28px',
            width: 'calc(100% - 48px)',
          }}
        >
          <p style={{ fontWeight: 600, color: '#2d1e18', fontSize: 15, margin: '0 0 16px' }}>
            What you&apos;ll explore:
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {exploreItems.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 10,
                  color: '#5a3a40',
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: '#c96875', flexShrink: 0, fontWeight: 700 }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Key note */}
        <p
          style={{
            textAlign: 'center',
            color: '#a07080',
            fontSize: 11,
            lineHeight: 1.6,
            maxWidth: 768,
            margin: '36px auto 0',
            padding: '0 24px 80px',
          }}
        >
          <strong>Key Note:</strong> This is NOT a diagnostic tool, solely an educational tool of
          empowerment and learning. If you have personal health concerns, please consult a
          professional medical care provider. Visuals are simplifications of complex biological
          processes and may not be anatomically accurate. Hormone levels and cycle timing varies
          between individuals.
        </p>
      </div>
    </div>
  )
}
