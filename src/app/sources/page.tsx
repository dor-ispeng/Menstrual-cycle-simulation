import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SourcesList from '@/components/SourcesList'
import SupportGrid from '@/components/SupportGrid'
import { sources, supportItems } from '@/data/sources'

export default function SourcesPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--site-bg-section-light)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <div
        style={{
          maxWidth: 960,
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
            textAlign: 'center',
            margin: '0 0 14px',
          }}
        >
          Sources
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-quicksand), sans-serif',
            textAlign: 'center',
            fontSize: 20,
            color: 'var(--site-body-rose-brown)',
            margin: '0 0 clamp(32px,5vw,44px)',
          }}
        >
          Created by one high school student with the assistance of many reference resources.
        </p>

        <SourcesList items={sources} />

        <h2
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            color: 'var(--site-heading-rose)',
            fontWeight: 600,
            fontSize: 29,
            margin: 'clamp(40px,5vw,56px) 0 20px',
          }}
        >
          Support
        </h2>

        <SupportGrid items={supportItems} />
      </div>

      <Footer />
    </div>
  )
}
