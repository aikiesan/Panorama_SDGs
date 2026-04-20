/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UIA-inspired Architectural Light Theme (preserving key names for compatibility)
        mapbox: {
          black: '#ffffff',      // Main background (was black, now white)
          dark: '#f8f9fa',       // Secondary background/inputs (was dark gray, now very light gray)
          card: '#ffffff',       // Card background (was dark gray, now white)
          gray: '#64748b',       // Secondary text (was light gray, now slate-500)
          light: '#0f172a',      // Primary text (was white, now slate-900)
          border: '#e2e8f0',     // Borders (was dark gray, now slate-200)
        },
        // Official UIA Brand Colors
        uia: {
          red: '#e30613',        // UIA Official Bright Red (primary accent)
          blue: '#577CB3',       // Primary brand color
          violet: '#484675',     // Secondary accent
          dark: '#6C6B69',       // Text, borders
          'dark-button': '#32373c',      // UIA official button color
          'dark-button-hover': '#1a1d1f', // Darker hover state
          'gray-hover': '#5A5A5A',        // Darker hover (not light grey)
          black: '#000000',      // Primary text
          'gray-light': '#F7F6F6', // Backgrounds, cards
        },
        // UIA Blue (Primary) - Updated to match official UIA blue
        primary: {
          50: '#f0f5fa',
          100: '#e0ebf5',
          200: '#c8dcef',
          300: '#a3c4e5',
          400: '#7aa6d8',
          500: '#577CB3',       // Official UIA Blue
          600: '#486aa0',
          700: '#3b5785',
          800: '#33496e',
          900: '#2e3f5c',
          950: '#1f293d',
        },
        // UIA Yellow (Accent)
        accent: {
          50: '#fffbea',
          100: '#fff1c5',
          200: '#ffe285',
          300: '#fed831',
          400: '#fdbf07',
          500: '#f0a300',
          600: '#d17e00',
          700: '#a65902',
          800: '#88460b',
          900: '#733a10',
        },
        // Neutral architectural tones (Slate)
        stone: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // SDG Official Colors (17 Goals)
        sdg: {
          1: '#E5243B',   // No Poverty
          2: '#DDA63A',   // Zero Hunger
          3: '#4C9F38',   // Good Health
          4: '#C5192D',   // Quality Education
          5: '#FF3A21',   // Gender Equality
          6: '#26BDE2',   // Clean Water
          7: '#FCC30B',   // Affordable Energy
          8: '#A21942',   // Decent Work
          9: '#FD6925',   // Industry Innovation
          10: '#DD1367',  // Reduced Inequalities
          11: '#FD9D24',  // Sustainable Cities
          12: '#BF8B2E',  // Responsible Consumption
          13: '#3F7E44',  // Climate Action
          14: '#0A97D9',  // Life Below Water
          15: '#56C02B',  // Life On Land
          16: '#00689D',  // Peace Justice
          17: '#19486A',  // Partnerships
        },
      },
      fontFamily: {
        sans: ['Merriweather', 'Georgia', 'serif'],           // Body text (UIA)
        display: ['Oswald', 'Impact', 'sans-serif'],          // Headers (UIA)
        heading: ['Oswald', 'Impact', 'sans-serif'],          // Alias for headers
      },
      fontSize: {
        'uia-label': ['13px', { lineHeight: '1.4', letterSpacing: '0.5px' }],
        'uia-button': ['13px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        'none': '0px',      // Default for images
        'sm': '6px',        // Form inputs
        'md': '8px',        // Cards
        'pill': '999px',    // Buttons
      },
      letterSpacing: {
        'uia-normal': '0.02em',
        'uia-wide': '0.05em',
        'uia-wider': '0.06em',
        tighter: '-0.02em',
        tight: '-0.01em',
        wide: '0.01em',
        wider: '0.02em',
        widest: '0.08em',
      },
      boxShadow: {
        'uia-card': '0 1px 3px rgba(0,0,0,0.1)',
        'uia-card-hover': '0 4px 6px rgba(0,0,0,0.1)',
      },
      // UIA Modular Spacing System (8px base)
      spacing: {
        'uia-xs': '4px',
        'uia-sm': '8px',
        'uia-md': '16px',
        'uia-lg': '24px',
        'uia-xl': '32px',
        'uia-2xl': '40px',
        'uia-3xl': '48px',
        'uia-4xl': '64px',
      },
      // Border widths for featured content
      borderWidth: {
        '5': '5px', // UIA featured border
      },
    },
  },
  plugins: [],
}
