import type { SupportEntry } from '@/data/sources'

function Card({ entry }: { entry: SupportEntry }) {
  const nameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-fredoka), sans-serif',
    fontWeight: 600,
    color: 'var(--site-heading-rose-dark)',
    fontSize: 19,
    margin: '0 0 8px',
  }

  return (
    <div
      style={{
        background: 'var(--site-bg-section-pale)',
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: '0 6px 16px rgba(138,67,86,0.07)',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          background: 'var(--site-surface-filled)',
          color: '#7a3346',
          fontFamily: 'var(--font-fredoka), sans-serif',
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: 0.3,
          padding: '4px 12px',
          borderRadius: 999,
          marginBottom: 10,
        }}
      >
        {entry.focus}
      </span>
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...nameStyle, display: 'block', textDecoration: 'underline' }}
        >
          {entry.name}
        </a>
      ) : (
        <p style={nameStyle}>{entry.name}</p>
      )}
      <p
        style={{
          fontFamily: 'var(--font-quicksand), sans-serif',
          fontSize: 17,
          lineHeight: 1.55,
          color: 'var(--site-body-rose-brown)',
          margin: 0,
        }}
      >
        {entry.desc}
      </p>
    </div>
  )
}

export default function SupportGrid({ items }: { items: SupportEntry[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}
    >
      {items.map((entry) => (
        <Card key={entry.name} entry={entry} />
      ))}
    </div>
  )
}
