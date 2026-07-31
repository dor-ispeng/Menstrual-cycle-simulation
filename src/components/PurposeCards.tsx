import Image from 'next/image'
import styles from './PurposeLayout.module.css'

function InfoCard({
  heading,
  iconSrc,
  children,
}: {
  heading: string
  iconSrc: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        flex: '1 1 380px',
        minWidth: 280,
        background: 'var(--site-surface)',
        borderRadius: 24,
        padding: 'clamp(28px,4vw,40px)',
        boxShadow: '0 8px 24px rgba(138,67,86,0.08)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 18px' }}>
        <Image
          src={iconSrc}
          alt=""
          width={64}
          height={64}
          quality={100}
          style={{ width: 64, height: 64, flexShrink: 0, objectFit: 'contain' }}
        />
        <h2
          style={{
            fontFamily: 'var(--font-fredoka), sans-serif',
            color: 'var(--site-heading-rose-dark)',
            fontWeight: 600,
            fontSize: 25,
            margin: 0,
            textAlign: 'left',
          }}
        >
          {heading}
        </h2>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-quicksand), sans-serif',
          fontSize: 18,
          lineHeight: 1.65,
          color: 'var(--site-body-rose-brown)',
          margin: 0,
          textAlign: 'left',
        }}
      >
        {children}
      </p>
    </div>
  )
}

export default function PurposeCards() {
  return (
    <div className={styles.cardsRow}>
      <InfoCard heading="Created by women, for women" iconSrc="/purpose-icon-created.png">
        For those struggling with the beginning of a new cycle, amenorrhea, PCOS, endometriosis,
        and more, or simply seeking to gain a better understanding of their body. Reliable
        information, support, and grace is not always easily accessible. Moreover, it can be
        incredibly difficult to discover comprehensible sources without fears of shame and
        belittlement. This simulation is meant to provide baseline knowledge and help connect the
        dots behind a period. Ultimately, the knowledge serves as a tool of empowerment;
        empowerment and the ability to advocate for yourself.
      </InfoCard>
      <InfoCard heading="Mechanism over memorization" iconSrc="/purpose-icon-mechanism.png">
        Most menstrual health resources teach &ldquo;ovulation happens on day 14&rdquo;. Although
        equally as important, this simulation focuses on <u>why</u> ovulation happens: through the
        orderly sequence of hormonal signals and biological states that drive its chain of events.
        Cycle timing varies between individuals and across life circumstances, therefore
        understanding the mechanism makes that variability easier to digest and seek help if
        needed. Additionally, the extenuating circumstances that can cause an abnormal menstrual
        cycle are also explored.
      </InfoCard>
    </div>
  )
}
