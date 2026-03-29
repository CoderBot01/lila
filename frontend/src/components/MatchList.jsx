import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../utils/api'

export default function MatchList({ selectedMap, selectedDate, selectedMatch, onMatchSelect }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    api.getMatches(selectedMap, selectedDate)
      .then(data => setMatches(data.matches || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedMap, selectedDate])

  const filtered = useMemo(() => {
    if (!search) return matches
    const q = search.toLowerCase()
    return matches.filter(m => m.id.toLowerCase().includes(q))
  }, [matches, search])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e2435]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium">
            Matches
          </span>
          <span className="text-[10px] font-mono text-[#475569]">
            {filtered.length} shown
          </span>
        </div>
        <input
          type="text"
          placeholder="Search match ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0d0f14] border border-[#1e2435] rounded px-2 py-1.5 text-xs text-[#94a3b8] placeholder-[#374151] focus:outline-none focus:border-[#2d3748]"
        />
      </div>

      {/* Match list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border border-[#e63946] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#475569]">No matches found</div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isSelected={match.id === selectedMatch}
                onClick={() => onMatchSelect(match.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MatchCard({ match, isSelected, onClick }) {
  const humanPct = match.n_events > 0
    ? Math.round((match.n_humans / match.n_events) * 100)
    : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded px-3 py-2.5 transition-all text-xs ${
        isSelected
          ? 'bg-[#1a2035] border border-[#2563eb] shadow-md'
          : 'hover:bg-[#151820] border border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] text-[#475569]">
          {match.id.substring(0, 8)}…
        </span>
        <PlayerTypeBadge nHumans={match.n_humans} nBots={match.n_bots} />
      </div>
      <div className="flex items-center gap-2 text-[#64748b]">
        <span>{match.n_players} players</span>
        <span>·</span>
        <span>{match.n_events} events</span>
      </div>
      <div className="mt-1.5 text-[10px] text-[#374151]">
        {match.date?.replace('_', ' ')} · t={Math.round(match.ts_min/1000)}s
      </div>
    </button>
  )
}

function PlayerTypeBadge({ nHumans, nBots }) {
  if (nHumans > 0 && nBots > 0) {
    return (
      <span className="text-[10px] text-[#f59e0b] bg-[#1c1a0f] px-1.5 py-0.5 rounded">
        Mixed
      </span>
    )
  }
  if (nHumans > 0) {
    return (
      <span className="text-[10px] text-[#60a5fa] bg-[#0f1b2d] px-1.5 py-0.5 rounded">
        Human
      </span>
    )
  }
  return (
    <span className="text-[10px] text-[#6b7280] bg-[#151720] px-1.5 py-0.5 rounded">
      Bots
    </span>
  )
}
