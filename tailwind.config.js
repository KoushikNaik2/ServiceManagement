/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0a1a',
          lighter: '#1a1a2e',
          card: '#11112b',
        },
        primary: {
          DEFAULT: '#8b5cf6', // purple
          glow: '#a78bfa',
        },
        secondary: {
          DEFAULT: '#3b82f6', // blue
          glow: '#60a5fa',
        },
        accent: {
          purple: '#d8b4fe',
          blue: '#93c5fd',
        }
      },
      boxShadow: {
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.5)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.5)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
