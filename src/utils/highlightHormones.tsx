import type { ReactNode } from 'react'

// Darkened text-accent variants of each hormone's particle/graph colour —
// see the --hormone-*-text tokens in globals.css for why these are separate
// from --signal-*/BrainLayer's colours rather than reused.
const HORMONE_COLOR_VAR: Record<string, string> = {
  gnrh: 'var(--hormone-gnrh-text)',
  fsh: 'var(--hormone-fsh-text)',
  lh: 'var(--hormone-lh-text)',
  estrogen: 'var(--hormone-estrogen-text)',
  progesterone: 'var(--hormone-progesterone-text)',
}

// Case-insensitive so "Estrogen" at a sentence start still matches; matched
// text is always rendered verbatim (never re-cased) below. Hyphens and
// apostrophes aren't word characters, so \b already does the right thing at
// "LH-to-FSH", "FSH-sensitive", "unopposed-estrogen", and "estrogen's"
// (including the typographic ’) without any extra handling. GnRH is listed
// first in the alternation, ahead of LH, purely for readability — it has
// its own leading \b, so it can't be shadowed by LH's match regardless of
// order.
const HORMONE_PATTERN = /\b(GnRH|FSH|LH|estrogen|progesterone)\b/gi

// Wraps hormone names in coloured spans matching their particle colour, so
// "estrogen" in a sentence visually links to the orange particles (etc).
// Colours ONLY the letters — no weight/style/size change — by setting just
// `color` on an inline span with no other styling.
export function highlightHormones(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  HORMONE_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = HORMONE_PATTERN.exec(text)) !== null) {
    const matched = match[0]
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    nodes.push(
      <span key={key++} style={{ color: HORMONE_COLOR_VAR[matched.toLowerCase()] }}>
        {matched}
      </span>
    )
    lastIndex = match.index + matched.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}
