/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#F7F8FA',
          white: '#FFFFFF',
          navy: '#183B56',
          blue: '#356B8C',
          text: '#172B3A',
          muted: '#697586',
          border: '#E4E9EF',
        },
        accent: {
          teal: '#20A39E',
          tealDark: '#177e7a',
          tealLight: '#e6f7f6',
        },
        status: {
          critical: '#D64545',
          criticalBg: '#FDF2F2',
          criticalBorder: '#F8B4B4',
          warning: '#D99A26',
          warningBg: '#FEF9EE',
          warningBorder: '#F9DE9E',
          success: '#25855A',
          successBg: '#F0FDF4',
          successBorder: '#BCF0DA',
          info: '#356B8C',
          infoBg: '#F0F6FA',
          infoBorder: '#D0E1ED',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(23, 43, 58, 0.05), 0 1px 2px -1px rgba(23, 43, 58, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(24, 59, 86, 0.08), 0 8px 10px -6px rgba(24, 59, 86, 0.04)',
        'panel': '0 4px 16px -2px rgba(24, 59, 86, 0.06), 0 2px 6px -2px rgba(24, 59, 86, 0.04)',
        'elevated': '0 20px 35px -5px rgba(24, 59, 86, 0.12), 0 10px 15px -5px rgba(24, 59, 86, 0.06)',
      }
    },
  },
  plugins: [],
}
