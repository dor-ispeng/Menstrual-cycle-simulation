import Image from 'next/image'
import styles from './HomeFreedomGuidance.module.css'

export default function HomeFreedomGuidance() {
  return (
    <section
      style={{
        background: 'var(--site-band-dark-rose)',
        padding: 'calc(clamp(0px,calc(4vw - 20px),24px) + 5px) clamp(20px,5vw,48px) clamp(0px,calc(4vw - 20px),24px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div className={styles.orRow}>
        <div
          style={{
            flex: '1 1 300px',
            maxWidth: 450,
            background: 'var(--site-surface)',
            borderRadius: 24,
            padding: '20px',
            paddingTop: 44,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: -18.7, left: '50%', transform: 'translateX(-50%)', width: 52.8, height: 52.8 }}>
            <Image src="/freedom-icon.png" alt="" width={53} height={53} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-fredoka), sans-serif',
              color: '#e79ab1',
              fontWeight: 600,
              fontSize: 32.2,
              margin: '0 0 14px',
            }}
          >
            Freedom
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-quicksand), sans-serif',
              color: 'var(--site-muted-rose)',
              fontSize: 20.7,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Drag the timeline slider &amp; move through the cycle at your own pace
          </p>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            fontFamily: 'var(--font-fredoka), sans-serif',
            fontStyle: 'italic',
            color: 'var(--site-muted-rose-light)',
            fontSize: 30,
            padding: '0 4px',
          }}
        >
          OR
        </div>

        <div
          style={{
            flex: '1 1 300px',
            maxWidth: 450,
            background: 'var(--site-surface-filled)',
            borderRadius: 24,
            padding: '20px',
            paddingTop: 44,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: -18.7, left: '50%', transform: 'translateX(-50%)', width: 52.8, height: 52.8 }}>
            <Image src="/guidance-icon.png" alt="" width={53} height={53} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {/* Text on this card is DARK on the pink fill, not near-white. The
              original near-white pairing measured 1.60:1 (heading) and 1.47:1
              (body) against --site-surface-filled — far under WCAG AA and
              effectively unreadable for low-vision users or on a screen in
              sunlight. Darkening the fill instead of the text was the other
              option, but any fill dark enough to carry white body text at
              4.5:1 lands on top of this section's own --site-band-dark-rose
              background, so the card would stop reading as a card.
              Measured now: heading 4.21:1 (needs 3.0 at 32px), body 4.94:1
              (needs 4.5). Both use existing palette tokens. */}
          <h3
            style={{
              fontFamily: 'var(--font-fredoka), sans-serif',
              color: 'var(--site-heading-rose-dark)',
              fontWeight: 600,
              fontSize: 32.2,
              margin: '0 0 14px',
            }}
          >
            Guidance
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-quicksand), sans-serif',
              color: 'var(--site-body-rose-brown-dark)',
              fontSize: 20.7,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Use the &quot;What Happens Next?&quot; button for structured guidance
          </p>
        </div>
      </div>
    </section>
  )
}
