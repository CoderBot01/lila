import React, { useMemo } from 'react'

const SPEEDS = [0.5, 1, 2, 4, 8]

export default function PlaybackControls({
  matchData, isPlaying, playbackTime, playbackSpeed,
  onPlayPause, onSeek, onSpeedChange
}) {
  const { meta, players } = matchData || {}
  const duration = meta ? (meta.ts_max - meta.ts_min) : 1000
  const currentMs = Math.round(playbackTime * duration)

  const eventCount = useMemo(() => {
    if (!players) return 0
    return players.reduce((acc, p) => acc + p.events.length, 0)
  }, [players])

  const humanCount = useMemo(() => players?.filter(p => !p.bot).length || 0, [players])
  const botCount = useMemo(() => players?.filter(p => p.bot).length || 0, [players])

  return (
    <div className="border-t border-[#1e2435] bg-[#0f1117] px-4 py-3">
      {/* Match info row */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
          <span className="text-[#64748b]">{humanCount} humans</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#374151]" />
          <span className="text-[#64748b]">{botCount} bots</span>
        </div>
        <div className="text-[#475569]">{eventCount} events total</div>
        <div className="ml-auto font-mono text-[#64748b]">
          {(currentMs / 1000).toFixed(2)}s / {(duration / 1000).toFixed(2)}s
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="relative mb-3">
        <input
          type="range"
          min={0} max={1000}
          value={Math.round(playbackTime * 1000)}
          onChange={e => onSeek(parseInt(e.target.value) / 1000)}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #e63946 ${playbackTime * 100}%, #1e2435 ${playbackTime * 100}%)`
          }}
        />
        {/* Event tick marks */}
        <EventTicks players={players} meta={meta} duration={duration} />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Rewind */}
        <button
          onClick={() => onSeek(0)}
          className="text-[#64748b] hover:text-white transition-colors"
          title="Rewind to start"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h2v12H2V2zm3 6l8-6v12L5 8z"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-9 h-9 rounded-full bg-[#e63946] hover:bg-[#c1121f] text-white flex items-center justify-center transition-colors shadow-lg"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <rect x="0" y="0" width="4" height="14"/>
              <rect x="8" y="0" width="4" height="14"/>
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <polygon points="2,0 12,7 2,14"/>
            </svg>
          )}
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-[#475569] mr-1">Speed</span>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-[11px] px-2 py-0.5 rounded font-mono transition-all ${
                playbackSpeed === s
                  ? 'bg-[#1e3a5f] text-[#60a5fa] border border-[#2563eb]'
                  : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="ml-auto flex items-center gap-2">
          <div
            className="h-1.5 w-24 bg-[#1e2435] rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#e63946] rounded-full transition-all"
              style={{ width: `${playbackTime * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#475569]">
            {Math.round(playbackTime * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function EventTicks({ players, meta, duration }) {
  if (!players || !meta || duration <= 0) return null

  const ticks = []
  players.forEach(player => {
    player.events.forEach(([evt, , , t]) => {
      if (['Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm'].includes(evt)) {
        const pct = t / duration * 100
        const color = evt.includes('Storm') ? '#9b5de5' :
                      evt.includes('Kill') ? '#e63946' : '#f4a261'
        ticks.push({ pct, color, evt })
      }
    })
  })

  return (
    <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-px opacity-60"
          style={{ left: `${tick.pct}%`, background: tick.color }}
          title={tick.evt}
        />
      ))}
    </div>
  )
}
