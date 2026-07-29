import Image from 'next/image'

const exploreItems = [
  'How the brain, pituitary, and ovaries communicate through hormone signals',
  'Why ovulation requires a specific sequence of biological events, not just a fixed day',
  'How different structures respond to signaling and maintain feedback',
  'How the uterine lining builds and sheds in response to hormones',
  'Various physiological changes that can disrupt the cycle and lead to abnormalities',
]

export default function HomeExplore() {
  return (
    <section
      style={{
        background: 'var(--site-bg-section-pale)',
        minHeight: 500,
        padding: 'clamp(20px,5vw,48px) clamp(20px,5vw,48px) calc(clamp(20px,5vw,48px) - 15px)',
        display: 'flex',
        gap: 'clamp(32px,5vw,64px)',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ flex: '1 1 420px', minWidth: 280, transform: 'translateY(calc(-5% + 10px))' }}>
        <h2
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            fontWeight: 600,
            color: 'var(--site-heading-rose-dark)',
            fontSize: 'clamp(29px, calc(3vw + 3px), 37px)',
            margin: '0 0 24px',
          }}
        >
          What You&apos;ll Explore
        </h2>
        {exploreItems.map((item) => (
          <div key={item} style={{ display: 'flex', gap: 10, margin: '0 0 14px' }}>
            <span
              style={{
                color: 'var(--site-accent-rose)',
                fontWeight: 700,
                fontSize: 21,
                lineHeight: 1.6,
                flexShrink: 0,
              }}
            >
              →
            </span>
            <p
              style={{
                fontFamily: 'var(--font-quicksand), sans-serif',
                fontSize: 21,
                lineHeight: 1.6,
                color: 'var(--site-body-rose-brown)',
                margin: 0,
              }}
            >
              {item}
            </p>
          </div>
        ))}
      </div>

      <div style={{ flex: '1 1 320px', minWidth: 260, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 'min(459px, 60vw)',
            aspectRatio: '1',
            transform: 'translateY(-5%)',
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            background: '#fdefed',
          }}
        >
          <Image
            src="/explore-illustration.png"
            alt="Diagram of hormone signaling between the brain and ovaries"
            fill
            quality={100}
            style={{ objectFit: 'contain', objectPosition: 'center 46%' }}
          />
        </div>
      </div>
    </section>
  )
}
