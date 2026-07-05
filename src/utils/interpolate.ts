// Linear interpolation between two numbers
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Clamp a value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Interpolate a value from an array of per-anchor keyframe values.
// anchorTs: the t positions of each anchor (must match values.length)
export function interpolateKeyframes(
  values: number[],
  anchorTs: number[],
  t: number
): number {
  const n = anchorTs.length
  if (n === 0) return 0
  if (t <= anchorTs[0]) return values[0]
  if (t >= anchorTs[n - 1]) return values[n - 1]

  let i = 0
  while (i < n - 1 && anchorTs[i + 1] <= t) i++

  const t0 = anchorTs[i]
  const t1 = anchorTs[i + 1]
  const alpha = (t - t0) / (t1 - t0)
  return lerp(values[i], values[i + 1], alpha)
}

// Returns the index of the nearest anchor to the given t
export function nearestAnchorIndex(anchorTs: number[], t: number): number {
  let best = 0
  let bestDist = Math.abs(anchorTs[0] - t)
  for (let i = 1; i < anchorTs.length; i++) {
    const d = Math.abs(anchorTs[i] - t)
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

// Returns the index of the transition (between anchors) currently active at t.
// Returns -1 if exactly on an anchor.
export function activeTransitionIndex(anchorTs: number[], t: number): number {
  for (let i = 0; i < anchorTs.length - 1; i++) {
    if (t > anchorTs[i] && t < anchorTs[i + 1]) return i
  }
  return -1
}
