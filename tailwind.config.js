/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic color names using CSS custom properties
        'theme': {
          'card-bg': 'var(--color-card-bg)',
          'card-border': 'var(--color-card-border)',
          'text-1': 'var(--color-text-1)',
          'text-2': 'var(--color-text-2)',
          'text-3': 'var(--color-text-3)',
        },
        // Keep existing Bitcoin brand colors
        'bitcoin': '#f7931a',
        'bitcoin-dark': '#e6820a',
      },
      backgroundImage: {
        'gradient-page': 'var(--gradient-page)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}