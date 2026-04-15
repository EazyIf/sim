import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgba(12, 12, 20, 0.88)',
          solid: '#0c0c14',
        },
        accent: {
          DEFAULT: '#3b82f6',
          glow: '#60a5fa',
        },
      },
    },
  },
  plugins: [],
}

export default config
