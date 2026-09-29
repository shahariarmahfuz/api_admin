/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: {
          DEFAULT: '#050505',
          secondary: '#0A0A0A',
          tertiary: '#121212',
          card: '#080808',
          hover: '#0f0f0f',
        },
        border: {
          DEFAULT: '#1A1A1A',
          subtle: '#141414',
          bright: '#282828',
        },
        foreground: {
          DEFAULT: '#F5F5F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
        brand: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          violet: '#a855f7',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
