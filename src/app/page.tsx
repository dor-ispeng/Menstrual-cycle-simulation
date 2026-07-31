import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import HomeHero from '@/components/HomeHero'
import HomeExplore from '@/components/HomeExplore'
import HomeFreedomGuidance from '@/components/HomeFreedomGuidance'
import HomeClosing from '@/components/HomeClosing'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--site-bg)', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      <HomeHero />
      <HomeExplore />
      <HomeFreedomGuidance />
      <HomeClosing />

      <Footer />
    </div>
  )
}
