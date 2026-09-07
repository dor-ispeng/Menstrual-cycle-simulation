import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Use — Menstrual Cycle Explorer',
  description: 'Educational purpose, no warranty, and limits of liability.',
}

const UPDATED = 'September 7, 2026'
const CONTACT = 'png.doris1@gmail.com'

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-fredoka), sans-serif',
  fontWeight: 600,
  color: 'var(--site-heading-rose-dark)',
  fontSize: 22,
  margin: '32px 0 10px',
}

const body: React.CSSProperties = {
  fontFamily: 'var(--font-quicksand), sans-serif',
  fontSize: 17,
  lineHeight: 1.65,
  color: 'var(--site-body-rose-brown)',
  margin: '0 0 12px',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--site-bg-section-light)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            fontWeight: 700,
            color: 'var(--site-heading-rose)',
            fontSize: 'clamp(33px, calc(4vw + 3px), 45px)',
            margin: '0 0 8px',
          }}
        >
          Terms of Use
        </h1>
        <p style={{ ...body, color: 'var(--site-muted-rose)', fontSize: 15, margin: '0 0 8px' }}>
          Last updated {UPDATED}
        </p>

        <p style={body}>
          By using this website you agree to the terms below. It is a free educational project and
          is provided at no cost.
        </p>

        <h2 style={heading}>Educational purpose only</h2>
        <p style={body}>
          Everything here is general educational information about menstrual-cycle physiology. It
          is not medical advice, not a diagnosis, and not a substitute for care from a qualified
          healthcare professional. Nothing on this site should be used to diagnose or treat any
          condition, or to make decisions about your health, contraception, or fertility.
        </p>
        <p style={body}>
          If you have concerns about your cycle or your health, please speak to a doctor or another
          qualified provider. If you think you may be experiencing a medical emergency, contact your
          local emergency services.
        </p>

        <h2 style={heading}>The model is simplified</h2>
        <p style={body}>
          The simulation deliberately simplifies a complex biological system so that the underlying
          mechanism is easier to follow. Hormone values shown are relative illustrations of shape
          and timing, not measured concentrations, and the anatomical visuals are stylized rather
          than clinically precise. Real cycles vary considerably between individuals and from month
          to month. The conditions represented are simplified single presentations of conditions
          that are, in reality, varied and diverse.
        </p>

        <h2 style={heading}>No warranty</h2>
        <p style={body}>
          This site is provided &ldquo;as is,&rdquo; without warranties of any kind, express or
          implied. While considerable care has gone into checking the content against published
          clinical references, no guarantee is made that it is complete, current, or free of error.
        </p>

        <h2 style={heading}>Limitation of liability</h2>
        <p style={body}>
          To the fullest extent permitted by law, the creator of this site is not liable for any
          loss or harm arising from use of, or reliance on, anything presented here.
        </p>

        <h2 style={heading}>Content and ownership</h2>
        <p style={body}>
          The written explanations, simulation design, and code were created by Doris Peng. Some
          visual assets are licensed from third parties or generated with AI tools and are used
          under their respective terms. Please do not reproduce the site&apos;s written content
          wholesale without permission; short quotations with attribution are welcome.
        </p>

        <h2 style={heading}>Links to other sites</h2>
        <p style={body}>
          Links to outside references and support organizations are provided for convenience. Those
          organizations are independent, and listing them is not an endorsement or a guarantee of
          their content.
        </p>

        <h2 style={heading}>Changes</h2>
        <p style={body}>
          These terms may be updated from time to time. The date at the top reflects the most
          recent revision.
        </p>

        <h2 style={heading}>Contact</h2>
        <p style={body}>
          Questions can be sent to{' '}
          <a href={`mailto:${CONTACT}`} style={{ color: 'var(--site-link)', textDecoration: 'underline' }}>
            {CONTACT}
          </a>
          .
        </p>
      </div>

      <Footer />
    </div>
  )
}
