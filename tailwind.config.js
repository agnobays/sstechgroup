/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#080705',
          obsidian: '#080705',
          surface: '#0E0C09',
          card: '#120F0B',
          gold: '#D9AD32',
          'gold-light': '#F1CC59',
          amber: '#F67300',
          champagne: '#F9DB9A',
          violet: '#AB59D7',
          'warm-grey': '#C2C2BD',
          'off-white': '#F7F7F5',
          charcoal: '#100D09',
          dark: '#14110C',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-gold': 'rgba(217, 173, 50, 0.25)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 50px -10px rgba(217, 173, 50, 0.2)',
        'glow-amber': '0 0 60px -10px rgba(246, 115, 0, 0.25)',
        'glow-violet': '0 0 40px -10px rgba(171, 89, 215, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
