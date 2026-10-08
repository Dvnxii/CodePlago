/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#e0eaff', 400: '#6b8fff',
          500: '#4f6ef7', 600: '#3b5bdb', 700: '#2c4bc9', 900: '#1a2d8f'
        },
        surface: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          800: '#1e293b', 900: '#0f172a', 950: '#080e1a'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif']
      }
    }
  },
  plugins: []
};
