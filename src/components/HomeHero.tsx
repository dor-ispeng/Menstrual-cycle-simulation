import Link from 'next/link'

export default function HomeHero() {
  return (
    <section
      style={{
        background: 'var(--site-bg-section-light)',
        padding: 'clamp(43.2px,7.2vw,86.4px) clamp(20px,5vw,48px) clamp(50.4px,6.3vw,72px)',
        textAlign: 'center',
      }}
    >
      {/*
        Arc geometry (protected — already correct, do not rebuild):
          viewBox 800×280, arc M 20,270 A 379,260 0 0,1 778,270
          arc-length ≈ π × √((379²+260²)/2) ≈ 1021 px
          font-size=44 → text ≈ 888 px → 87% fill, 6.5% margin each side
          arc top y=10, chord y=270; interior center y=140 = 50% of viewBox height
          aspect-ratio container keeps button locked to arc center at any width
      */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '800 / 330' }}>
          <svg
            viewBox="0 -40 800 330"
            style={{ display: 'block', width: '100%', height: '100%', transform: 'scale(1.32)', transformOrigin: 'center center' }}
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
                padding: '13.8px 55.2px',
                borderRadius: 9999,
                background: 'white',
                color: '#c96875',
                border: '2.3px solid #f0b8c4',
                fontFamily: 'var(--font-fredoka), sans-serif',
                fontSize: 20.7,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 2.3px 9.2px rgba(201, 104, 117, 0.15)',
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
          fontFamily: 'var(--font-quicksand), sans-serif',
          textAlign: 'center',
          color: 'var(--site-body-rose-brown)',
          fontSize: 'clamp(18px,2.4vw,22px)',
          lineHeight: 1.55,
          maxWidth: 'min(600px, 88vw)',
          margin: '-16.2px auto 0',
          padding: '0 24px',
        }}
      >
        An interactive educational model of menstrual physiology
        and reproductive endocrinology.
      </p>
    </section>
  )
}
