import React from 'react'
import { MAP_LABELS } from '../utils/constants'

export default function InsightsPanel({ insights, selectedMap, onClose }) {
  const mapName = MAP_LABELS[selectedMap] || selectedMap

  const killToLootRatio = insights.total_loot
    ? (insights.total_kills / insights.total_loot).toFixed(2)
    : 'N/A'

  const avgKillsPerMatch = insights.total_matches
    ? (insights.total_kills / insights.total_matches).toFixed(1)
    : 'N/A'

  const stormDeathRate = insights.total_matches
    ? ((insights.storm_deaths / insights.total_matches) * 100).toFixed(1)
    : 'N/A'

  return (
    <div className="absolute top-4 right-4 w-80 bg-[#12151dee] border border-[#1e2435] rounded-xl p-4 shadow-2xl backdrop-blur-md panel-enter z-40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Map Intelligence</div>
          <div className="text-[10px] text-[#64748b] uppercase tracking-widest">{mapName}</div>
        </div>
        <button
          onClick={onClose}
          className="text-[#475569] hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#1e2435]"
        >
          ✕
        </button>
      </div>

      {/* Top insights */}
      <div className="space-y-3">
        <InsightCard
          icon="⚔️"
          title="Combat Density"
          value={`${avgKillsPerMatch} kills/match`}
          detail={`${insights.total_kills} total kills across ${insights.total_matches} matches`}
          color="border-[#e63946]"
          badge={parseFloat(avgKillsPerMatch) > 3 ? 'HIGH' : parseFloat(avgKillsPerMatch) > 1 ? 'MED' : 'LOW'}
          badgeColor={parseFloat(avgKillsPerMatch) > 3 ? 'bg-[#e63946]' : 'bg-[#f59e0b]'}
        />

        <InsightCard
          icon="📦"
          title="Loot Activity"
          value={`${killToLootRatio} kills per loot`}
          detail={`${insights.total_loot} loot events · players looting before engaging`}
          color="border-[#2a9d8f]"
          badge={parseFloat(killToLootRatio) < 0.3 ? 'SAFE' : 'RISKY'}
          badgeColor={parseFloat(killToLootRatio) < 0.3 ? 'bg-[#2a9d8f]' : 'bg-[#f59e0b]'}
        />

        <InsightCard
          icon="🌪️"
          title="Storm Pressure"
          value={`${stormDeathRate}% storm death rate`}
          detail={`${insights.storm_deaths} players caught by storm`}
          color="border-[#9b5de5]"
          badge={parseFloat(stormDeathRate) > 5 ? 'HIGH' : 'LOW'}
          badgeColor={parseFloat(stormDeathRate) > 5 ? 'bg-[#9b5de5]' : 'bg-[#374151]'}
        />

        <InsightCard
          icon="🤖"
          title="Bot Population"
          value={`${Math.round(insights.bot_ratio * 100)}% bots`}
          detail={`${Math.round((1 - insights.bot_ratio) * 100)}% human player events`}
          color="border-[#374151]"
          badge={insights.bot_ratio > 0.4 ? 'BOT-HEAVY' : 'BALANCED'}
          badgeColor={insights.bot_ratio > 0.4 ? 'bg-[#374151]' : 'bg-[#166534]'}
        />
      </div>

      {/* Centroid data */}
      {insights.kill_centroid && (
        <div className="mt-4 pt-3 border-t border-[#1e2435]">
          <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">Hot Zones (pixel coords)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <CentroidItem
              label="Kill Centroid"
              x={insights.kill_centroid[0]}
              y={insights.kill_centroid[1]}
              color="text-[#e63946]"
            />
            {insights.storm_centroid && (
              <CentroidItem
                label="Storm Centroid"
                x={insights.storm_centroid[0]}
                y={insights.storm_centroid[1]}
                color="text-[#9b5de5]"
              />
            )}
          </div>
        </div>
      )}

      {/* Story mode footer */}
      <div className="mt-4 pt-3 border-t border-[#1e2435]">
        <div className="text-[10px] text-[#475569] leading-relaxed">
          💡 Enable the <span className="text-[#60a5fa]">Heatmap</span> layer to see where these events concentrate on the map
        </div>
      </div>
    </div>
  )
}

function InsightCard({ icon, title, value, detail, color, badge, badgeColor }) {
  return (
    <div className={`border-l-2 ${color} pl-3 py-1`}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-white">{title}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor} text-white`}>
          {badge}
        </span>
      </div>
      <div className="text-xs font-mono text-[#94a3b8] mb-0.5">{value}</div>
      <div className="text-[10px] text-[#475569] leading-relaxed">{detail}</div>
    </div>
  )
}

function CentroidItem({ label, x, y, color }) {
  return (
    <div className="bg-[#1a1e2a] rounded p-2">
      <div className="text-[10px] text-[#64748b] mb-1">{label}</div>
      <div className={`font-mono text-[11px] ${color}`}>
        {Math.round(x)}, {Math.round(y)}
      </div>
    </div>
  )
}
