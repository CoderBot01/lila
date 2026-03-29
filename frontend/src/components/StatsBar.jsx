import React from 'react'
import { MAP_LABELS } from '../utils/constants'

export default function StatsBar({ mapInsights, selectedMap, matchData }) {
  const stats = matchData ? getMatchStats(matchData) : getMapStats(mapInsights)

  return (
    <div className="flex items-center gap-0 border-b border-[#1e2435] bg-[#0f1117] px-4 h-10 flex-shrink-0">
      <div className="text-xs font-medium text-white mr-4">
        {MAP_LABELS[selectedMap] || selectedMap}
      </div>
      <div className="h-4 w-px bg-[#1e2435] mr-4" />
      {stats.map(({ label, value, color }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <div className="h-4 w-px bg-[#1e2435] mx-3" />}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#475569]">{label}</span>
            <span className={`text-xs font-mono font-medium ${color || 'text-[#94a3b8]'}`}>{value}</span>
          </div>
        </React.Fragment>
      ))}

      {/* Right side: match indicator */}
      {matchData && (
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#e63946] animate-pulse" />
          <span className="text-[11px] text-[#64748b] font-mono">
            Match: {matchData.id.substring(0, 8)}…
          </span>
        </div>
      )}
    </div>
  )
}

function getMapStats(insights) {
  if (!insights) return []
  return [
    { label: 'MATCHES', value: insights.total_matches, color: 'text-[#60a5fa]' },
    { label: 'KILLS', value: insights.total_kills?.toLocaleString(), color: 'text-[#e63946]' },
    { label: 'LOOT', value: insights.total_loot?.toLocaleString(), color: 'text-[#2a9d8f]' },
    { label: 'STORM', value: insights.storm_deaths, color: 'text-[#9b5de5]' },
    { label: 'BOT RATIO', value: `${Math.round((insights.bot_ratio || 0) * 100)}%`, color: 'text-[#64748b]' },
  ]
}

function getMatchStats(matchData) {
  if (!matchData) return []
  const humans = matchData.players?.filter(p => !p.bot) || []
  const bots = matchData.players?.filter(p => p.bot) || []
  const allEvents = matchData.players?.flatMap(p => p.events) || []
  const kills = allEvents.filter(([e]) => e.includes('Kill'))
  const loot = allEvents.filter(([e]) => e === 'Loot')
  const storm = allEvents.filter(([e]) => e === 'KilledByStorm')

  return [
    { label: 'HUMANS', value: humans.length, color: 'text-[#60a5fa]' },
    { label: 'BOTS', value: bots.length, color: 'text-[#64748b]' },
    { label: 'EVENTS', value: allEvents.length, color: 'text-[#94a3b8]' },
    { label: 'KILLS', value: kills.length, color: 'text-[#e63946]' },
    { label: 'LOOT', value: loot.length, color: 'text-[#2a9d8f]' },
    { label: 'STORM', value: storm.length, color: 'text-[#9b5de5]' },
  ]
}
