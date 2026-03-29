import React from 'react'
import { MAP_LABELS, DATE_LABELS } from '../utils/constants'

export default function FilterPanel({
  maps, dates, selectedMap, selectedDate,
  onMapChange, onDateChange
}) {
  return (
    <div className="p-3 border-b border-[#1e2435] space-y-3">
      {/* Map selector */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium block mb-2">Map</label>
        <div className="flex flex-col gap-1">
          {maps.map(map => (
            <button
              key={map}
              onClick={() => onMapChange(map)}
              className={`text-left px-3 py-2 rounded text-xs font-medium transition-all flex items-center gap-2 ${
                selectedMap === map
                  ? 'bg-[#e63946] text-white shadow-sm'
                  : 'bg-[#1a1e2a] text-[#94a3b8] hover:bg-[#1e2435] hover:text-white'
              }`}
            >
              <MapDot map={map} active={selectedMap === map} />
              {MAP_LABELS[map] || map}
            </button>
          ))}
        </div>
      </div>

      {/* Date selector */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#64748b] font-medium block mb-2">Date</label>
        <div className="flex flex-wrap gap-1">
          <DateChip
            label="All"
            active={selectedDate === 'all'}
            onClick={() => onDateChange('all')}
          />
          {dates.map(date => (
            <DateChip
              key={date}
              label={DATE_LABELS[date] || date}
              active={selectedDate === date}
              onClick={() => onDateChange(date)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MapDot({ map, active }) {
  const colors = {
    AmbroseValley: '#2a9d8f',
    GrandRift: '#457b9d',
    Lockdown: '#e63946',
  }
  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: active ? 'white' : colors[map] || '#64748b' }}
    />
  )
}

function DateChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
        active
          ? 'bg-[#1e3a5f] text-[#60a5fa] border border-[#2563eb]'
          : 'bg-[#1a1e2a] text-[#64748b] border border-transparent hover:border-[#1e2435] hover:text-[#94a3b8]'
      }`}
    >
      {label}
    </button>
  )
}
