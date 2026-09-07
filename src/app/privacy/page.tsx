import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy — Menstrual Cycle Explorer',
  description: 'What this site does and does not collect.',
}

// Deliberately written from what the site ACTUALLY does rather than from a
// generic template. This site has no accounts, no forms, no cookies and no
// third-party embeds, so a boilerplate policy describing those things would
// be a false statement about its own data practices — worse than saying
// nothing. If the site ever gains a form, a login, or an embed, this page
// has to be revised to match.
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

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ ...body, color: 'var(--site-muted-rose)', fontSize: 15, margin: '0 0 8px' }}>
          Last updated {UPDATED}
        </p>

        <p style={body}>
          This is a free educational website about menstrual-cycle physiology. It is run by one
          person, not a company, and it collects as little information as possible.
        </p>

        <h2 style={heading}>What this site does not collect</h2>
        <p style={body}>
          There are no accounts, no sign-ups, no contact forms, and no search boxes — the site has
          no way to accept information from you at all. It does not set cookies, and it does not
          use browser storage to remember you between visits. It contains no advertising, no
          social-media embeds, no chat widgets, and no third-party trackers.
        </p>

        <h2 style={heading}>What is collected</h2>
        <p style={body}>
          The site uses Vercel Web Analytics to count visits. This records aggregate information
          only: which pages were viewed, the referring site, the country the request came from,
          and general device and browser type. It does not use cookies, does not assign you a
          persistent identifier, and cannot follow you to other websites.
        </p>
        <p style={body}>
          The site is hosted by Vercel, which — like any web host — processes technical request
          data, including IP addresses, in order to deliver the page and maintain security. Vercel
          handles that data under its own privacy policy.
        </p>

        <h2 style={heading}>How the information is used</h2>
        <p style={body}>
          Only to understand roughly how many people use the site and which sections are read.
          Nothing is sold, rented, or shared with anyone for marketing, and no attempt is made to
          identify individual visitors.
        </p>

        <h2 style={heading}>Links to other sites</h2>
        <p style={body}>
          The Sources page links to outside organizations and reference materials. Those sites are
          run independently and have their own privacy practices, which this policy does not cover.
        </p>

        <h2 style={heading}>Younger visitors</h2>
        <p style={body}>
          This site is intended to be useful to people learning about their own cycle, including
          teenagers. It does not knowingly collect personal information from anyone, of any age,
          because it has no mechanism to collect personal information in the first place.
        </p>

        <h2 style={heading}>Changes</h2>
        <p style={body}>
          If the site ever starts collecting information differently, this page will be updated and
          the date at the top will change.
        </p>

        <h2 style={heading}>Contact</h2>
        <p style={body}>
          Questions about this policy can be sent to{' '}
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
