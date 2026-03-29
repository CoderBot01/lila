import React from 'react'
import { HEATMAP_TYPES } from '../utils/constants'

const LAYERS = [
  { key: 'humanPaths', label: 'Human Paths',  color: '#60a5fa', icon: '👤' },
  { key: 'botPaths',   label: 'Bot Paths',    color: '#4b5563', icon: '🤖' },
  { key: 'kills',      label: 'Kill Events',  color: '#e63946', icon: '💀' },
  { key: 'deaths',     label: 'Death Events', color: '#9b5de5', icon: '☠️' },
  { key: 'loot',       label: 'Loot Events',  color: '#2a9d8f', icon: '📦' },
  { key: 'storm',      label: 'Storm Deaths', color: '#9b5de5', icon: '🌪️' },
  { key: 'heatmap',    label: 'Heatmap',      color: '#f4a261', icon: '🔥' },
]

export default function LayerControls({ layers, heatmapType, onToggle, onHeatmapTypeChange }) {
  return (
    <div className="p-3 space-y-4">
      <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium">Layers</div>

      <div className="space-y-1">
        {LAYERS.map(({ key, label, color, icon }) => (
          <LayerToggle
            key={key}
            label={label}
            color={color}
            icon={icon}
            active={layers[key]}
            onToggle={() => onToggle(key)}
          />
        ))}
      </div>

      {/* Heatmap type selector */}
      {layers.heatmap && (
        <div className="panel-enter">
          <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium mb-2">
            Heatmap Type
          </div>
          <div className="space-y-1">
            {HEATMAP_TYPES.map(({ id, label, color }) => (
              <button
                key={id}
                onClick={() => onHeatmapTypeChange(id)}
                className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${
                  heatmapType === id
                    ? 'bg-[#1a1e2a] text-white border border-[#2d3748]'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#151820]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-[#1e2435] pt-3">
        <div className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium mb-2">Legend</div>
        <div className="space-y-1.5 text-[11px] text-[#64748b]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-[#60a5fa] rounded" />
            Human movement path
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-[#374151] rounded" />
            Bot movement path
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#e63946]" />
            Kill / Death
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f4a261]" />
            Bot Kill
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2a9d8f]" />
            Loot pickup
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#9b5de5]" />
            Storm death
          </div>
        </div>
      </div>
    </div>
  )
}

function LayerToggle({ label, color, icon, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded text-xs transition-all ${
        active ? 'text-white' : 'text-[#475569]'
      } hover:bg-[#151820]`}
    >
      {/* Toggle switch */}
      <div
        className={`relative w-8 h-4 rounded-full transition-all flex-shrink-0 ${
          active ? 'bg-[#1e3a5f]' : 'bg-[#1e2435]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
            active ? 'left-[18px]' : 'left-0.5'
          }`}
          style={{ background: active ? color : '#374151' }}
        />
      </div>
      <span className="text-sm leading-none">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}
