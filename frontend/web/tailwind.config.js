/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        obsidian: {
          50:  '#f0f0f5',
          100: '#e0e0eb',
          200: '#c2c2d6',
          300: '#9999b8',
          400: '#6b6b96',
          500: '#4a4a75',
          600: '#333358',
          700: '#1e1e3a',
          800: '#12122a',
          900: '#09091a',
          950: '#050510',
        },
        iris: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        ember: {
          400: '#fb923c',
          500: '#f97316',
        },
        jade: {
          400: '#34d399',
          500: '#10b981',
        },
        crimson: {
          400: '#f87171',
          500: '#ef4444',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      backgroundImage: {
        'grid-obsidian': `
          linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
      boxShadow: {
        'iris': '0 0 0 1px rgba(99,102,241,0.3), 0 4px 24px rgba(99,102,241,0.15)',
        'iris-lg': '0 0 0 1px rgba(99,102,241,0.4), 0 8px 40px rgba(99,102,241,0.25)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(99,102,241,0.2)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.3s ease',
        'pulse-iris': 'pulseIris 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseIris: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
