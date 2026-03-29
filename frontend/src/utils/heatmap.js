/**
 * Heatmap rendering utilities
 * Renders a 32×32 normalized grid onto a canvas context
 */

// Color stops for different heatmap types
const HEAT_PALETTES = {
  kills:   [[0,0,0,0], [230,57,70,60], [230,57,70,180], [255,200,0,255]],
  deaths:  [[0,0,0,0], [155,93,229,60], [155,93,229,180], [255,255,255,255]],
  traffic: [[0,0,0,0], [69,123,157,40], [69,123,157,160], [100,200,255,255]],
  loot:    [[0,0,0,0], [42,157,143,40], [42,157,143,160], [100,255,220,255]],
}

function interpolateColor(stops, t) {
  if (t <= 0) return stops[0]
  if (t >= 1) return stops[stops.length - 1]
  const seg = (stops.length - 1) * t
  const i = Math.floor(seg)
  const f = seg - i
  const a = stops[i]
  const b = stops[i + 1]
  return a.map((v, j) => Math.round(v + (b[j] - v) * f))
}

export function drawHeatmap(ctx, grid, type, canvasW, canvasH, opacity = 0.7) {
  if (!grid || !grid.length) return
  const GRID = grid.length
  const palette = HEAT_PALETTES[type] || HEAT_PALETTES.kills
  const cellW = canvasW / GRID
  const cellH = canvasH / GRID

  // Apply gaussian-style smoothing by drawing overlapping circles
  // For each cell with non-zero value, draw a soft radial gradient
  const imageData = ctx.createImageData(canvasW, canvasH)
  const data = imageData.data

  // First pass: accumulate values per pixel
  const accumulator = new Float32Array(canvasW * canvasH)

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const val = grid[gy][gx]
      if (val < 0.01) continue

      const cx = (gx + 0.5) * cellW
      const cy = (gy + 0.5) * cellH
      const radius = Math.max(cellW, cellH) * 1.5

      const x0 = Math.max(0, Math.floor(cx - radius))
      const x1 = Math.min(canvasW - 1, Math.ceil(cx + radius))
      const y0 = Math.max(0, Math.floor(cy - radius))
      const y1 = Math.min(canvasH - 1, Math.ceil(cy + radius))

      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const dx = px - cx, dy = py - cy
          const dist = Math.sqrt(dx*dx + dy*dy)
          const falloff = Math.max(0, 1 - dist / radius)
          const influence = val * falloff * falloff
          accumulator[py * canvasW + px] += influence
        }
      }
    }
  }

  // Find max for normalization
  let maxVal = 0
  for (let i = 0; i < accumulator.length; i++) {
    if (accumulator[i] > maxVal) maxVal = accumulator[i]
  }
  if (maxVal === 0) return

  // Second pass: color pixels
  for (let i = 0; i < accumulator.length; i++) {
    const t = accumulator[i] / maxVal
    if (t < 0.02) continue
    const [r, g, b, a] = interpolateColor(palette, t)
    const idx = i * 4
    data[idx]     = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = Math.round(a * opacity)
  }

  ctx.putImageData(imageData, 0, 0)
}
