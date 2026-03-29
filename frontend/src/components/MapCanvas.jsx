import React, { useRef, useEffect, useCallback, useState } from 'react'
import { api } from '../utils/api'
import { EVENT_CONFIG, HUMAN_COLORS, BOT_COLOR, BOT_COLOR_LIGHT } from '../utils/constants'
import { drawHeatmap } from '../utils/heatmap'

const MINIMAP_SIZE = 1024
const EVENT_RADIUS = { Kill: 8, Killed: 8, BotKill: 6, BotKilled: 6, KilledByStorm: 10, Loot: 4 }
const POSITION_EVENTS = new Set(['Position', 'BotPosition'])

export default function MapCanvas({
  selectedMap, matchData, layers, heatmapData, heatmapType,
  playbackTime, onHoverPlayer, onHoverEvent
}) {
  const containerRef = useRef(null)
  const bgCanvasRef = useRef(null)     // Minimap image
  const heatCanvasRef = useRef(null)   // Heatmap layer
  const pathCanvasRef = useRef(null)   // Player paths
  const eventCanvasRef = useRef(null)  // Events (kills, deaths, etc.)
  const uiCanvasRef = useRef(null)     // Hover / selection UI

  const [dimensions, setDimensions] = useState({ w: 800, h: 600 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Track mouse for hover
  const mouseRef = useRef({ x: 0, y: 0 })
  const animRef = useRef(null)

  // ── Resize observer ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDimensions({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Compute canvas scale when dimensions change ────────────────────
  useEffect(() => {
    const s = Math.min(dimensions.w / MINIMAP_SIZE, dimensions.h / MINIMAP_SIZE)
    setScale(s)
    setOffset({
      x: (dimensions.w - MINIMAP_SIZE * s) / 2,
      y: (dimensions.h - MINIMAP_SIZE * s) / 2,
    })
  }, [dimensions])

  // ── Draw background minimap ────────────────────────────────────────
  useEffect(() => {
    const canvas = bgCanvasRef.current
    if (!canvas) return
    canvas.width = dimensions.w
    canvas.height = dimensions.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, dimensions.w, dimensions.h)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = api.minimapUrl(selectedMap)
    img.onload = () => {
      const cs = MINIMAP_SIZE * scale
      ctx.globalAlpha = 0.85
      ctx.drawImage(img, offset.x, offset.y, cs, cs)
      ctx.globalAlpha = 1
      // Dark vignette around the map
      const grad = ctx.createRadialGradient(
        dimensions.w/2, dimensions.h/2, cs * 0.3,
        dimensions.w/2, dimensions.h/2, cs * 0.7,
      )
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.3)')
      ctx.fillStyle = grad
      ctx.fillRect(offset.x, offset.y, cs, cs)
    }
  }, [selectedMap, dimensions, scale, offset])

  // ── Draw heatmap ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = heatCanvasRef.current
    if (!canvas) return
    canvas.width = dimensions.w
    canvas.height = dimensions.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, dimensions.w, dimensions.h)
    if (!heatmapData?.grid) return

    // Draw heatmap into a small offscreen canvas then scale it
    const size = MINIMAP_SIZE * scale
    const offscreen = document.createElement('canvas')
    offscreen.width = size
    offscreen.height = size
    const octx = offscreen.getContext('2d')
    drawHeatmap(octx, heatmapData.grid, heatmapType, size, size, 0.75)
    ctx.drawImage(offscreen, offset.x, offset.y)
  }, [heatmapData, heatmapType, dimensions, scale, offset])

  // ── Draw player paths + events ─────────────────────────────────────
  useEffect(() => {
    drawScene()
  }, [matchData, layers, playbackTime, dimensions, scale, offset])

  const drawScene = useCallback(() => {
    const pathCanvas = pathCanvasRef.current
    const eventCanvas = eventCanvasRef.current
    if (!pathCanvas || !eventCanvas) return

    pathCanvas.width = dimensions.w
    pathCanvas.height = dimensions.h
    eventCanvas.width = dimensions.w
    eventCanvas.height = dimensions.h

    const pCtx = pathCanvas.getContext('2d')
    const eCtx = eventCanvas.getContext('2d')
    pCtx.clearRect(0, 0, dimensions.w, dimensions.h)
    eCtx.clearRect(0, 0, dimensions.w, dimensions.h)

    if (!matchData) return

    const { players, meta } = matchData
    const tsRange = (meta?.ts_max || 1) - (meta?.ts_min || 0) || 1
    const cutoffT = meta?.ts_min + playbackTime * tsRange

    let humanIdx = 0

    players.forEach(player => {
      const isBot = player.bot
      if (isBot && !layers.botPaths) return
      if (!isBot && !layers.humanPaths) return

      const color = isBot ? BOT_COLOR : HUMAN_COLORS[humanIdx % HUMAN_COLORS.length]
      if (!isBot) humanIdx++

      // Separate position events from combat events
      const posEvents = player.events.filter(([e]) => POSITION_EVENTS.has(e))
      const combatEvents = player.events.filter(([e]) => !POSITION_EVENTS.has(e))

      // Apply playback filter
      const visiblePos = meta
        ? posEvents.filter(([,,,t]) => (meta.ts_min + t) <= cutoffT)
        : posEvents
      const visibleCombat = meta
        ? combatEvents.filter(([,,,t]) => (meta.ts_min + t) <= cutoffT)
        : combatEvents

      // Draw path
      if (visiblePos.length > 1) {
        pCtx.beginPath()
        visiblePos.forEach(([, px, py], i) => {
          const cx = offset.x + px * scale
          const cy = offset.y + py * scale
          i === 0 ? pCtx.moveTo(cx, cy) : pCtx.lineTo(cx, cy)
        })
        pCtx.strokeStyle = color
        pCtx.lineWidth = isBot ? 0.8 : 1.5
        pCtx.globalAlpha = isBot ? 0.25 : 0.7
        pCtx.stroke()

        // Draw start dot
        if (visiblePos.length > 0) {
          const [, sx, sy] = visiblePos[0]
          pCtx.beginPath()
          pCtx.arc(offset.x + sx * scale, offset.y + sy * scale, isBot ? 2 : 3.5, 0, Math.PI * 2)
          pCtx.fillStyle = color
          pCtx.globalAlpha = 0.9
          pCtx.fill()
        }

        // Draw current position indicator (at playback time)
        if (playbackTime > 0 && playbackTime < 1 && !isBot) {
          const last = visiblePos[visiblePos.length - 1]
          const [, lx, ly] = last
          const cx = offset.x + lx * scale
          const cy = offset.y + ly * scale
          pCtx.globalAlpha = 1
          pCtx.beginPath()
          pCtx.arc(cx, cy, 5, 0, Math.PI * 2)
          pCtx.fillStyle = color
          pCtx.fill()
          pCtx.beginPath()
          pCtx.arc(cx, cy, 8, 0, Math.PI * 2)
          pCtx.strokeStyle = color
          pCtx.lineWidth = 1.5
          pCtx.globalAlpha = 0.4
          pCtx.stroke()
        }

        pCtx.globalAlpha = 1
      }

      // Draw combat/event markers
      visibleCombat.forEach(([eventType, px, py]) => {
        if (!shouldShowEvent(eventType, layers)) return
        const cfg = EVENT_CONFIG[eventType]
        if (!cfg) return
        const cx = offset.x + px * scale
        const cy = offset.y + py * scale
        const r = (EVENT_RADIUS[eventType] || 5) * scale
        drawEventMarker(eCtx, cx, cy, r, cfg.color, eventType)
      })
    })
  }, [matchData, layers, playbackTime, dimensions, scale, offset])

  // ── Mouse hover detection ──────────────────────────────────────────
  useEffect(() => {
    const canvas = uiCanvasRef.current
    if (!canvas) return
    canvas.width = dimensions.w
    canvas.height = dimensions.h
  }, [dimensions])

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    mouseRef.current = { x: mx, y: my }

    // Find hovered player path
    if (matchData) {
      let found = null
      for (const player of matchData.players) {
        for (const [evt, px, py] of player.events) {
          if (!POSITION_EVENTS.has(evt)) continue
          const cx = offset.x + px * scale
          const cy = offset.y + py * scale
          if (Math.abs(cx - mx) < 12 && Math.abs(cy - my) < 12) {
            found = player
            break
          }
        }
        if (found) break
      }
      onHoverPlayer(found)
    }
  }, [matchData, scale, offset, onHoverPlayer])

  const handleMouseLeave = useCallback(() => {
    onHoverPlayer(null)
    onHoverEvent(null)
  }, [onHoverPlayer, onHoverEvent])

  const canvasStyle = {
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none'
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={bgCanvasRef}    style={canvasStyle} />
      <canvas ref={heatCanvasRef}  style={canvasStyle} />
      <canvas ref={pathCanvasRef}  style={canvasStyle} />
      <canvas ref={eventCanvasRef} style={canvasStyle} />
      <canvas ref={uiCanvasRef}    style={{ ...canvasStyle, pointerEvents: 'all', cursor: 'crosshair' }} />

      {/* Map label */}
      <div className="absolute bottom-4 right-4 bg-[#12151dcc] border border-[#1e2435] rounded px-3 py-1.5 text-xs text-[#64748b] backdrop-blur-sm">
        {selectedMap === 'AmbroseValley' ? 'Ambrose Valley' : selectedMap} · 1024×1024
      </div>

      {/* No match selected hint */}
      {!matchData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-[#12151d99] border border-[#1e2435] rounded-xl px-6 py-4 text-center backdrop-blur-sm">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm font-medium text-white mb-1">Select a match</div>
            <div className="text-xs text-[#64748b]">Choose a match from the left panel to view player journeys</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function shouldShowEvent(eventType, layers) {
  if (['Kill','BotKill','Killed','BotKilled'].includes(eventType)) {
    return eventType.includes('Kill') ? layers.kills : layers.deaths
  }
  if (eventType === 'KilledByStorm') return layers.storm
  if (eventType === 'Loot') return layers.loot
  return false
}

function drawEventMarker(ctx, cx, cy, r, color, eventType) {
  ctx.save()

  // Outer glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2)
  grad.addColorStop(0, color + '80')
  grad.addColorStop(1, color + '00')
  ctx.beginPath()
  ctx.arc(cx, cy, r * 2, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // Inner circle
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Event-specific decoration
  if (eventType === 'KilledByStorm') {
    // Cross for storm
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.6, cy)
    ctx.lineTo(cx + r * 0.6, cy)
    ctx.moveTo(cx, cy - r * 0.6)
    ctx.lineTo(cx, cy + r * 0.6)
    ctx.stroke()
  } else if (['Kill','Killed'].includes(eventType)) {
    // X for kills
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.5, cy - r * 0.5)
    ctx.lineTo(cx + r * 0.5, cy + r * 0.5)
    ctx.moveTo(cx + r * 0.5, cy - r * 0.5)
    ctx.lineTo(cx - r * 0.5, cy + r * 0.5)
    ctx.stroke()
  } else if (eventType === 'Loot') {
    // Dot for loot
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fill()
  }

  ctx.restore()
}
