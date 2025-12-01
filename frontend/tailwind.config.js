
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Travel Theme Color Palette
      colors: {
        travel: {
          primary: '#004E7C',      // Deep ocean blue
          primaryLight: '#00649B',  // Lighter ocean blue
          accent: '#DE354C',        // Coral/sunset
          secondary: '#266150',     // Natural green
          secondaryLight: '#2A7A65',
          neutral: {
            DEFAULT: '#4F4846',     // Charcoal
            light: '#DDAF94',       // Tan
            lightest: '#FDF8F5',    // Off-white
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 78, 124, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 78, 124, 0)' },
        },
      },
      boxShadow: {
        'travel-sm': '0 2px 8px rgba(0, 78, 124, 0.08)',
        'travel-md': '0 4px 16px rgba(0, 78, 124, 0.12)',
        'travel-lg': '0 8px 24px rgba(0, 78, 124, 0.16)',
        'travel-xl': '0 12px 32px rgba(0, 78, 124, 0.2)',
      },
    },
  },
  plugins: [],
}
