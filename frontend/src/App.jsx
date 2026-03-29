import React, { useState, useEffect, useCallback } from 'react'
import { api } from './utils/api'
import FilterPanel from './components/FilterPanel'
import MapCanvas from './components/MapCanvas'
import MatchList from './components/MatchList'
import PlaybackControls from './components/PlaybackControls'
import InsightsPanel from './components/InsightsPanel'
import LayerControls from './components/LayerControls'
import StatsBar from './components/StatsBar'
import { MAP_LABELS } from './utils/constants'

export default function App() {
  // ── Global state ──────────────────────────────────────────────────────
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [selectedMap, setSelectedMap] = useState('AmbroseValley')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState(null)

  // Layer toggles
  const [layers, setLayers] = useState({
    humanPaths: true,
    botPaths: false,
    kills: true,
    deaths: true,
    loot: true,
    storm: true,
    heatmap: false,
  })
  const [heatmapType, setHeatmapType] = useState('kills')

  // Playback
  const [playbackTime, setPlaybackTime] = useState(0)  // 0-1 normalized
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // UI panels
  const [showInsights, setShowInsights] = useState(false)
  const [matchData, setMatchData] = useState(null)
  const [heatmapData, setHeatmapData] = useState(null)

  // Hover state
  const [hoveredPlayer, setHoveredPlayer] = useState(null)
  const [hoveredEvent, setHoveredEvent] = useState(null)

  // ── Load metadata ─────────────────────────────────────────────────────
  useEffect(() => {
    api.getMeta()
      .then(setMeta)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Load match data when selected ────────────────────────────────────
  useEffect(() => {
    if (!selectedMatch) {
      setMatchData(null)
      setPlaybackTime(0)
      setIsPlaying(false)
      return
    }
    api.getMatch(selectedMatch)
      .then(setMatchData)
      .catch(console.error)
  }, [selectedMatch])

  // ── Load heatmap when map/date/type changes ───────────────────────────
  useEffect(() => {
    if (!layers.heatmap) return
    api.getHeatmap(selectedMap, heatmapType, selectedDate)
      .then(setHeatmapData)
      .catch(console.error)
  }, [selectedMap, heatmapType, selectedDate, layers.heatmap])

  useEffect(() => {
    if (layers.heatmap) {
      api.getHeatmap(selectedMap, heatmapType, selectedDate)
        .then(setHeatmapData)
        .catch(console.error)
    }
  }, [heatmapType])

  // ── Playback loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !matchData) return
    let raf
    let lastTime = null
    const duration = matchData.meta?.ts_max - matchData.meta?.ts_min || 1000

    const tick = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const delta = (timestamp - lastTime) * playbackSpeed
      lastTime = timestamp
      setPlaybackTime(prev => {
        const next = prev + delta / duration
        if (next >= 1) {
          setIsPlaying(false)
          return 1
        }
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, matchData, playbackSpeed])

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleMapChange = useCallback((map) => {
    setSelectedMap(map)
    setSelectedMatch(null)
    setMatchData(null)
    setPlaybackTime(0)
    setIsPlaying(false)
    setHeatmapData(null)
  }, [])

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date)
    setSelectedMatch(null)
    setMatchData(null)
    setPlaybackTime(0)
    setIsPlaying(false)
  }, [])

  const handleMatchSelect = useCallback((matchId) => {
    setSelectedMatch(matchId === selectedMatch ? null : matchId)
    setPlaybackTime(0)
    setIsPlaying(false)
  }, [selectedMatch])

  const toggleLayer = useCallback((key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handlePlayPause = useCallback(() => {
    if (playbackTime >= 1) setPlaybackTime(0)
    setIsPlaying(p => !p)
  }, [playbackTime])

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  const mapInsights = meta?.insights?.[selectedMap]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f14] text-[#e2e8f0]">
      {/* ── LEFT PANEL: Filters + Match List ───────────────────────── */}
      <div className="flex flex-col w-72 flex-shrink-0 border-r border-[#1e2435] bg-[#12151d] overflow-hidden">
        <Header />
        <FilterPanel
          maps={meta?.maps || []}
          dates={meta?.dates || []}
          selectedMap={selectedMap}
          selectedDate={selectedDate}
          onMapChange={handleMapChange}
          onDateChange={handleDateChange}
        />
        <MatchList
          selectedMap={selectedMap}
          selectedDate={selectedDate}
          selectedMatch={selectedMatch}
          onMatchSelect={handleMatchSelect}
        />
      </div>

      {/* ── CENTER: Map Canvas ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Stats bar */}
        <StatsBar
          mapInsights={mapInsights}
          selectedMap={selectedMap}
          matchData={matchData}
        />

        {/* Main canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MapCanvas
            selectedMap={selectedMap}
            matchData={matchData}
            layers={layers}
            heatmapData={layers.heatmap ? heatmapData : null}
            heatmapType={heatmapType}
            playbackTime={playbackTime}
            onHoverPlayer={setHoveredPlayer}
            onHoverEvent={setHoveredEvent}
          />

          {/* Hover tooltip */}
          {(hoveredPlayer || hoveredEvent) && (
            <HoverTooltip player={hoveredPlayer} event={hoveredEvent} />
          )}

          {/* Insights overlay */}
          {showInsights && mapInsights && (
            <InsightsPanel
              insights={mapInsights}
              selectedMap={selectedMap}
              onClose={() => setShowInsights(false)}
            />
          )}
        </div>

        {/* Playback controls */}
        {matchData && (
          <PlaybackControls
            matchData={matchData}
            isPlaying={isPlaying}
            playbackTime={playbackTime}
            playbackSpeed={playbackSpeed}
            onPlayPause={handlePlayPause}
            onSeek={setPlaybackTime}
            onSpeedChange={setPlaybackSpeed}
          />
        )}
      </div>

      {/* ── RIGHT PANEL: Layers + Insights ─────────────────────────── */}
      <div className="flex flex-col w-64 flex-shrink-0 border-l border-[#1e2435] bg-[#12151d] overflow-hidden">
        <LayerControls
          layers={layers}
          heatmapType={heatmapType}
          onToggle={toggleLayer}
          onHeatmapTypeChange={setHeatmapType}
        />
        <div className="border-t border-[#1e2435] p-3">
          <button
            onClick={() => setShowInsights(s => !s)}
            className={`w-full py-2 px-3 rounded text-sm font-medium transition-all ${
              showInsights
                ? 'bg-[#e63946] text-white'
                : 'bg-[#1e2435] text-[#94a3b8] hover:bg-[#252d3d] hover:text-white'
            }`}
          >
            {showInsights ? '✕ Close Insights' : '🔍 Show Insights'}
          </button>
        </div>
        {mapInsights && (
          <MapSummary insights={mapInsights} selectedMap={selectedMap} />
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Header() {
  return (
    <div className="p-4 border-b border-[#1e2435]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-[#e63946] rounded flex items-center justify-center text-xs font-bold">L</div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">LILA BLACK</div>
          <div className="text-[10px] text-[#64748b] uppercase tracking-widest">Player Journey Visualizer</div>
        </div>
      </div>
    </div>
  )
}

function HoverTooltip({ player, event }) {
  if (!player && !event) return null
  return (
    <div className="absolute top-4 left-4 bg-[#12151d] border border-[#1e2435] rounded-lg p-3 text-xs z-50 pointer-events-none max-w-xs shadow-2xl">
      {player && (
        <div>
          <div className="font-medium text-white mb-1">
            {player.bot ? '🤖 Bot' : '👤 Human Player'}
          </div>
          <div className="text-[#64748b]">ID: {player.uid}</div>
          <div className="text-[#64748b]">Events: {player.events?.length}</div>
        </div>
      )}
      {event && (
        <div>
          <div className="font-medium text-white mb-1">{event.type}</div>
          <div className="text-[#64748b]">x: {event.px?.toFixed(0)}, y: {event.py?.toFixed(0)}</div>
          {event.t && <div className="text-[#64748b]">t: {(event.t/1000).toFixed(2)}s</div>}
        </div>
      )}
    </div>
  )
}

function MapSummary({ insights, selectedMap }) {
  const mapNames = { AmbroseValley: 'Ambrose Valley', GrandRift: 'Grand Rift', Lockdown: 'Lockdown' }
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium">
        {mapNames[selectedMap]} · Overview
      </div>
      <StatRow label="Matches" value={insights.total_matches} color="text-[#60a5fa]" />
      <StatRow label="Human Matches" value={insights.human_matches} color="text-[#60a5fa]" />
      <StatRow label="Total Kills" value={insights.total_kills?.toLocaleString()} color="text-[#e63946]" />
      <StatRow label="Loot Events" value={insights.total_loot?.toLocaleString()} color="text-[#2a9d8f]" />
      <StatRow label="Storm Deaths" value={insights.storm_deaths} color="text-[#9b5de5]" />
      <StatRow
        label="Bot Ratio"
        value={`${(insights.bot_ratio * 100).toFixed(0)}%`}
        color="text-[#94a3b8]"
      />
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-[#64748b]">{label}</span>
      <span className={`font-mono font-medium ${color}`}>{value}</span>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0d0f14]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm text-[#64748b]">Loading LILA BLACK analytics…</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0d0f14]">
      <div className="text-center max-w-md">
        <div className="text-[#e63946] text-2xl mb-3">⚠</div>
        <div className="text-white font-medium mb-2">Failed to load data</div>
        <div className="text-sm text-[#64748b] font-mono">{message}</div>
        <div className="text-xs text-[#475569] mt-4">Make sure the backend API is running</div>
      </div>
    </div>
  )
}
