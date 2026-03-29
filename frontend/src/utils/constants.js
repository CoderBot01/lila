// Event type configuration
export const EVENT_CONFIG = {
  Position:       { color: '#457b9d', label: 'Movement',    show: false, icon: '·' },
  BotPosition:    { color: '#2d3748', label: 'Bot Move',     show: false, icon: '·' },
  Kill:           { color: '#e63946', label: 'Kill (PvP)',   show: true,  icon: '💀', size: 8 },
  Killed:         { color: '#e63946', label: 'Killed (PvP)', show: true,  icon: '💀', size: 8 },
  BotKill:        { color: '#f4a261', label: 'Bot Kill',     show: true,  icon: '⚔️', size: 6 },
  BotKilled:      { color: '#e07b54', label: 'Bot Killed',   show: true,  icon: '💥', size: 6 },
  KilledByStorm:  { color: '#9b5de5', label: 'Storm Death',  show: true,  icon: '🌪️', size: 10 },
  Loot:           { color: '#2a9d8f', label: 'Loot',         show: true,  icon: '📦', size: 5 },
}

export const HEATMAP_TYPES = [
  { id: 'kills',   label: 'Kill Zones',    color: '#e63946' },
  { id: 'deaths',  label: 'Death Zones',   color: '#9b5de5' },
  { id: 'traffic', label: 'High Traffic',  color: '#457b9d' },
  { id: 'loot',    label: 'Loot Density',  color: '#2a9d8f' },
]

export const MAP_LABELS = {
  AmbroseValley: 'Ambrose Valley',
  GrandRift: 'Grand Rift',
  Lockdown: 'Lockdown',
}

export const DATE_LABELS = {
  February_10: 'Feb 10',
  February_11: 'Feb 11',
  February_12: 'Feb 12',
  February_13: 'Feb 13',
  February_14: 'Feb 14',
}

// Human path color palette — bright, distinct
export const HUMAN_COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#fbbf24',
  '#a78bfa', '#38bdf8', '#fb923c', '#4ade80',
  '#e879f9', '#facc15',
]

// Bot path color
export const BOT_COLOR = '#374151'
export const BOT_COLOR_LIGHT = '#4b5563'
