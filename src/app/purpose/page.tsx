'use client'

import Nav from '@/components/Nav'

export default function PurposePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fce8ee' }}>
      <Nav mode="landing" />

      <div style={{ paddingTop: 80 }}>
        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-fredoka), sans-serif',
            fontSize: 48,
            fontWeight: 700,
            color: '#c06070',
            margin: '40px 0 40px',
          }}
        >
          Purpose
        </h2>

        {/* Two-column cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            maxWidth: 820,
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          {/* Left card */}
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '28px 28px 32px',
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                color: '#2d1e18',
                fontSize: 16,
                textAlign: 'center',
                margin: '0 0 18px',
              }}
            >
              Created by women for women
            </h3>
            <p
              style={{
                color: '#5a3a40',
                fontSize: 14,
                lineHeight: 1.75,
                textAlign: 'center',
                margin: 0,
              }}
            >
              For those struggling with amenorrhea, pregnancy, infertility,
              PCOS, endometriosis, or if you&apos;re simply seeking to gain a
              better understanding of your body. There is so little information,
              knowledge, and grace provided to women as we navigate these
              changes. Moreover, it can be incredibly difficult to discover
              comprehensible information without fears of shame and belittlement.
              This simulation is meant to serve as empowerment; empowerment and
              the ability to advocate for yourself.
            </p>
          </div>

          {/* Right card */}
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '28px 28px 32px',
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                color: '#2d1e18',
                fontSize: 16,
                textAlign: 'center',
                margin: '0 0 18px',
              }}
            >
              Mechanism over memorization
            </h3>
            <p
              style={{
                color: '#5a3a40',
                fontSize: 14,
                lineHeight: 1.75,
                textAlign: 'center',
                margin: 0,
              }}
            >
              Most menstrual health resources teach &ldquo;ovulation happens on
              day 14.&rdquo; This model teaches <em>why</em> ovulation happens:
              through the sequence of hormonal signals and biological states that
              must occur in order. Cycle timing varies between individuals and
              across life circumstances. Understanding the mechanism makes that
              variability easier to digest. Additionally, this model explores the
              extenuating circumstances that can cause an abnormal menstrual
              cycle.
            </p>
          </div>
        </div>

        {/* Key note */}
        <p
          style={{
            textAlign: 'center',
            color: '#a07080',
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 768,
            margin: '40px auto 0',
            padding: '0 24px 80px',
          }}
        >
          <strong>Key Note:</strong> This is NOT a diagnostic tool, solely an
          educational tool of empowerment and learning. If you have personal
          health concerns, please consult a professional medical care provider.
          Visuals are simplifications of complex biological processes and may not
          be anatomically accurate. Hormone levels and cycle timing varies
          between individuals.
        </p>
      </div>
    </div>
  )
}
