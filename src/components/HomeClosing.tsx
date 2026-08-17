export default function HomeClosing() {
  return (
    <section
      style={{
        background: 'var(--site-bg-section-light)',
        padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-quicksand), sans-serif',
          maxWidth: 990,
          margin: '0 auto',
          textAlign: 'center',
          fontSize: 'clamp(18px,2.2vw,21px)',
          lineHeight: 1.6,
          color: 'var(--site-body-rose-brown)',
          border: '3px solid var(--site-accent-rose)',
          borderRadius: 16,
          padding: '16px 22px',
        }}
      >
        The menstrual cycle, or period, is a natural biological process that reflects overall
        health and development. It&apos;s one of the body&apos;s ways of signaling vitality, but it
        can also bring physical and emotional challenges worth understanding and addressing
        holistically.
      </p>
    </section>
  )
}
