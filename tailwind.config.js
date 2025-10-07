/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90E2',
          50: '#F0F7FF',
          100: '#E6F2FF',
          200: '#B8DAFF',
          300: '#8AC2FF',
          400: '#6BA3F5',
          500: '#4A90E2',
          600: '#3B82F6',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E40AF',
        },
        success: '#5CB85C',
        warning: '#F0AD4E',
        error: '#D9534F',
        critical: '#D9534F',
        'warning-level': '#F0AD4E',
        info: '#4A90E2',
        safe: '#5CB85C',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};