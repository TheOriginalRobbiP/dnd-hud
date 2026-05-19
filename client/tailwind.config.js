/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tier colours — also defined as CSS vars in index.css
        // Use oklch for perceptual consistency
        bronze:    'oklch(62% 0.12 50)',
        silver:    'oklch(78% 0.01 240)',
        gold:      'oklch(80% 0.16 75)',
        platinum:  'oklch(72% 0.14 240)',
        legendary: 'oklch(72% 0.18 35)',
        celestial: 'oklch(62% 0.22 300)',
        // HUD palette — OKLCH tinted neutrals (no pure #000/#fff)
        'hud-bg':     '#0d0d0f',
        'hud-panel':  '#161619',
        'hud-border': '#2a2a2e',
        'hud-text':   '#ffffff',
        'hud-muted':  '#888888',
        'hud-accent': '#f59e0b',
        'hud-cyan':   '#3b82f6',
        'hud-danger': '#ef4444',
        'hud-success': '#22c55e',
        'hp-high':    '#22c55e',
        'hp-mid':     '#f59e0b',
        'hp-low':     '#ef4444',
      },
      fontFamily: {
        hud: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
