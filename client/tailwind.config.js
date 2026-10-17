/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a192f',
          800: '#0f2442',
          700: '#1e3a5f',
          600: '#2c5282',
        },
        civic: {
          teal: '#0d9488',
          tealLight: '#14b8a6',
          dark: '#0f172a',
          slate: '#1e293b',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
