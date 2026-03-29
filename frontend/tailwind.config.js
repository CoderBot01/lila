/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lila: {
          bg: '#0d0f14',
          panel: '#12151d',
          border: '#1e2435',
          accent: '#e63946',
          gold: '#f4a261',
          blue: '#457b9d',
          green: '#2a9d8f',
          text: '#e2e8f0',
          muted: '#64748b',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}
