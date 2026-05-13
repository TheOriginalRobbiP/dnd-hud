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
        'hud-bg':     'oklch(8% 0.015 265)',   // near-black, blue tint
        'hud-panel':  'oklch(11% 0.015 265)',  // panels
        'hud-border': 'oklch(22% 0.02 265)',   // visible borders
        'hud-text':   'oklch(92% 0.01 265)',   // primary — 12.5:1 on bg
        'hud-muted':  'oklch(68% 0.01 265)',   // secondary — 5.2:1 on bg, proper AA
        'hud-accent': 'oklch(62% 0.22 300)',   // electric purple
        'hud-cyan':   'oklch(80% 0.15 200)',   // cyan secondary
        'hp-high':    'oklch(65% 0.2 145)',
        'hp-mid':     'oklch(75% 0.18 75)',
        'hp-low':     'oklch(58% 0.22 20)',
      },
      fontFamily: {
        hud: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
