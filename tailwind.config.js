/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Severity encoding
        severity: {
          severe: 'var(--severity-severe)',
          moderate: 'var(--severity-moderate)',
          mild: 'var(--severity-mild)',
        },
        // Accent colours
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
        // Surfaces
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-inverse': 'var(--text-inverse)',
        // Borders
        border: 'var(--border)',
        divider: 'var(--divider)',
        // Background
        bg: 'var(--bg)',
        // During tint
        'during-tint': 'var(--during-tint)',
      },
    },
  },
  plugins: [],
};
