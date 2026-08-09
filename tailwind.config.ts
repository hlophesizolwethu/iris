import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          400: '#d9a441',
          500: '#c1902d',
          950: '#2a2010',
        },
      },
    },
  },
  plugins: [],
}

export default config
