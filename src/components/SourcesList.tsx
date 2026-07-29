import type { SourceEntry } from '@/data/sources'

function Row({ entry, isLast }: { entry: SourceEntry; isLast: boolean }) {
  const nameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-fredoka), sans-serif',
    fontWeight: 600,
    color: 'var(--site-heading-rose-dark)',
    fontSize: 20,
    margin: '0 0 6px',
  }

  return (
    <div
      style={{
        padding: '20px 22px',
        borderBottom: isLast ? 'none' : '1px solid rgba(138,67,86,0.08)',
      }}
    >
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...nameStyle, display: 'inline-block', textDecoration: 'underline' }}
        >
          {entry.name}
        </a>
      ) : (
        <p style={nameStyle}>{entry.name}</p>
      )}
      <p
        style={{
          fontFamily: 'var(--font-quicksand), sans-serif',
          fontSize: 18,
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

export default function SourcesList({ items }: { items: SourceEntry[] }) {
  return (
    <div
      style={{
        background: 'var(--site-bg-section-pale)',
        borderRadius: 20,
        padding: 8,
        boxShadow: '0 8px 24px rgba(138,67,86,0.08)',
      }}
    >
      {items.map((entry, i) => (
        <Row key={entry.name} entry={entry} isLast={i === items.length - 1} />
      ))}
    </div>
  )
}
