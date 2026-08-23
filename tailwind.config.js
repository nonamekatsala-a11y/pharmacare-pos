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
          50: '#f4f6fa',
          100: '#e5eaf3',
          200: '#c5cfe0',
          300: '#a5b4cd',
          400: '#6b7a8e',
          500: '#33475b',
          600: '#2a3a4a',
          700: '#1f2a37',
          800: '#141a24',
          900: '#0a0f14',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
