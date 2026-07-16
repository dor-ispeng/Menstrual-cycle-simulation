'use client'

import { useCallback, useEffect, useRef } from 'react'

// Loads a PNG's pixel data once and exposes a fast alpha lookup by native pixel
// coordinate. Used to gate click handlers on hand-drawn invisible hit-shapes so
// clicking on a PNG's transparent padding (inside the shape's rough bounding
// region but not on actual visible artwork) doesn't open a structure's popup.
export function useImageAlpha(src: string) {
  const dataRef = useRef<{ data: Uint8ClampedArray; width: number; height: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      dataRef.current = { data: imgData.data, width: canvas.width, height: canvas.height }
    }
    img.src = src
    return () => { cancelled = true }
  }, [src])

  // Returns true if any pixel within `radius` of (nativeX, nativeY) is
  // sufficiently opaque. radius=0 checks only the exact pixel (plus a little
  // slack for anti-aliased edges is up to the caller). Fails open (returns
  // true) if the pixel data hasn't loaded yet, so clicks are never silently
  // broken by a slow/uncached image load.
  return useCallback((nativeX: number, nativeY: number, radius = 0): boolean => {
    const d = dataRef.current
    if (!d) return true
    const { data, width, height } = d
    const r = Math.max(0, Math.round(radius))
    const cx = Math.round(nativeX)
    const cy = Math.round(nativeY)
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy
      if (y < 0 || y >= height) continue
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx
        if (x < 0 || x >= width) continue
        const alpha = data[(y * width + x) * 4 + 3]
        if (alpha > 15) return true
      }
    }
    return false
  }, [])
}

// Converts a click event's screen position into the local SVG coordinate
// space of the element it fired on (i.e. the same space its sibling elements'
// x/y attributes are already expressed in), independent of any ancestor pan/
// zoom or group transforms.
export function svgLocalPointFromEvent(
  e: React.MouseEvent<SVGGraphicsElement>
): { x: number; y: number } | null {
  const el = e.currentTarget
  const svg = el.ownerSVGElement
  const ctm = el.getScreenCTM()
  if (!svg || !ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const loc = pt.matrixTransform(ctm.inverse())
  return { x: loc.x, y: loc.y }
}
