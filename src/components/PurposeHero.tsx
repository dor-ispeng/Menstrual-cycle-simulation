import Image from 'next/image'
import styles from './PurposeLayout.module.css'

export default function PurposeHero() {
  return (
    <div className={styles.heroRow}>
      <div style={{ flex: '1 1 380px', minWidth: 280 }}>
        <h1
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            fontWeight: 700,
            color: 'var(--site-heading-rose)',
            fontSize: 'clamp(49px,5.06vw,63px)',
            margin: '-8px 0 12px',
          }}
        >
          Purpose
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px' }}>
          <span style={{ width: 64, height: 3, background: 'var(--site-accent-rose)', borderRadius: 2, display: 'block' }} />
          <span style={{ color: 'var(--site-accent-rose)', fontSize: 18 }}>♥</span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-quicksand), sans-serif',
            fontSize: 'clamp(18px,2vw,22px)',
            lineHeight: 1.55,
            color: 'var(--site-body-rose-brown)',
            margin: 0,
            maxWidth: 480,
          }}
        >
          Understanding the menstrual cycle is a crucial step toward understanding your health.
        </p>
      </div>

      <div
        style={{
          flex: '1 1 340px',
          minWidth: 240,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '44px 0',
          overflow: 'visible',
        }}
      >
        <svg
          viewBox="0 0 400 400"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 'min(560px, 80vw)',
            height: 'auto',
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="purposeBlob1" cx="38%" cy="32%" r="60%">
              <stop offset="0%" stopColor="#ffd7e0" />
              <stop offset="100%" stopColor="#ffd7e0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="purposeBlob2" cx="62%" cy="58%" r="55%">
              <stop offset="0%" stopColor="#f6b9c9" />
              <stop offset="100%" stopColor="#f6b9c9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="purposeBlob3" cx="45%" cy="70%" r="45%">
              <stop offset="0%" stopColor="#e79ab1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e79ab1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M200 40 C 280 30, 340 80, 350 150 C 360 220, 320 260, 280 300 C 240 340, 170 350, 120 320 C 70 290, 40 230, 50 170 C 60 110, 120 50, 200 40 Z" fill="url(#purposeBlob1)" />
          <path d="M230 120 C 300 130, 330 190, 320 250 C 310 300, 260 330, 210 325 C 160 320, 120 280, 125 225 C 130 170, 170 110, 230 120 Z" fill="url(#purposeBlob2)" />
          <path d="M140 220 C 190 210, 240 230, 250 270 C 258 305, 220 330, 175 328 C 130 326, 95 300, 95 265 C 95 240, 105 228, 140 220 Z" fill="url(#purposeBlob3)" />
        </svg>
        <Image
          src="/purpose-woman-illustration.png"
          alt="Illustration of a woman"
          width={617}
          height={536}
          quality={100}
          style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 'min(478.4px, 77.28vw)', height: 'auto' }}
        />
      </div>
    </div>
  )
}
