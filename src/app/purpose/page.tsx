import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import PurposeHero from '@/components/PurposeHero'
import PurposeCards from '@/components/PurposeCards'

export default function PurposePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--site-bg-section-light)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          width: '100%',
          padding: 'clamp(28.8px,4.2vw,43.2px) clamp(20px,5vw,48px)',
          background: 'var(--site-bg-section-light)',
        }}
      >
        <PurposeHero />
        <PurposeCards />
      </div>

      <Footer />
    </div>
  )
}
