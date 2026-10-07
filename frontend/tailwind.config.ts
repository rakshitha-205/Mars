import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 ChatConnect Color Tokens
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary ChatConnect Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          bubbleReceived: '#F1F5F9',
          border: '#E2E8F0',
          dark: '#090D16',
          darkCard: '#0E1524',
          darkBubbleReceived: '#162033',
          darkBorder: '#212E46',
        },
        accent: {
          violet: '#7C3AED',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        bubble: '18px',
      },
    },
  },
  plugins: [],
};

export default config;
