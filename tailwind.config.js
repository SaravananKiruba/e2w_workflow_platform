/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Primary Blue - Main Brand
        primary: {
          50: '#e6f5fd',
          100: '#b8e3f9',
          200: '#8ad1f5',
          300: '#5cbff1',
          400: '#2eaded',
          500: '#0485e2',
          600: '#036bb5',
          700: '#025088',
          800: '#02365a',
          900: '#011b2d',
        },
        // Secondary Blue - Darker Accent
        secondary: {
          50: '#e6f0fc',
          100: '#b8d5f7',
          200: '#8abaf2',
          300: '#5c9fed',
          400: '#2e84e8',
          500: '#0458c9',
          600: '#0347a1',
          700: '#033579',
          800: '#022351',
          900: '#011228',
        },
        // Accent Cyan - Bright Highlight
        accent: {
          50: '#ebfaf7',
          100: '#c5f0e8',
          200: '#9fe6d9',
          300: '#79dcca',
          400: '#53d2bb',
          500: '#46d3c0',
          600: '#38a99a',
          700: '#2a7f73',
          800: '#1c544d',
          900: '#0e2a26',
        },
        // Olive Green - Natural Earth
        olive: {
          50: '#f3f5e9',
          100: '#dce2c0',
          200: '#c5cf97',
          300: '#aebc6e',
          400: '#97a945',
          500: '#566b17',
          600: '#455613',
          700: '#34400e',
          800: '#232b0a',
          900: '#121505',
        },
        // Dark Base - Deep Background
        dark: {
          50: '#e9ebe7',
          100: '#c1c6bb',
          200: '#99a18f',
          300: '#717c63',
          400: '#495737',
          500: '#1a260b',
          600: '#151e09',
          700: '#101707',
          800: '#0b0f04',
          900: '#050802',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(4, 133, 226, 0.25)',
        'primary-lg': '0 10px 40px 0 rgba(4, 133, 226, 0.3)',
        'secondary': '0 4px 14px 0 rgba(4, 88, 201, 0.25)',
        'accent': '0 4px 14px 0 rgba(70, 211, 192, 0.25)',
        'accent-lg': '0 10px 40px 0 rgba(70, 211, 192, 0.3)',
        'olive': '0 4px 14px 0 rgba(86, 107, 23, 0.25)',
        'dark': '0 4px 14px 0 rgba(26, 38, 11, 0.4)',
        'soft': '0 2px 8px 0 rgba(4, 133, 226, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0485e2 0%, #0458c9 100%)',
        'gradient-accent': 'linear-gradient(135deg, #46d3c0 0%, #0485e2 100%)',
        'gradient-olive': 'linear-gradient(135deg, #566b17 0%, #1a260b 100%)',
        'gradient-multi': 'linear-gradient(135deg, #0485e2 0%, #46d3c0 50%, #566b17 100%)',
        'gradient-radial': 'radial-gradient(circle, #0485e2 0%, #0458c9 50%, #1a260b 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}
