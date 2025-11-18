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
        // Primary Tan - Main Brand
        primary: {
          50: '#faf6f2',
          100: '#f0e6d9',
          200: '#e5d6bf',
          300: '#dbc6a6',
          400: '#d0b68c',
          500: '#ce9466',
          600: '#b87a52',
          700: '#a1613d',
          800: '#8b4729',
          900: '#742e14',
        },
        // Secondary Brown - Dark Chocolate
        secondary: {
          50: '#f2ede9',
          100: '#d9ccc3',
          200: '#c0ab9d',
          300: '#a78a77',
          400: '#8e6951',
          500: '#4d2b1e',
          600: '#3e2218',
          700: '#2f1912',
          800: '#20110c',
          900: '#110806',
        },
        // Accent Mid Brown - Warm Highlight
        accent: {
          50: '#f7f2ed',
          100: '#e7d9ce',
          200: '#d7c0af',
          300: '#c7a790',
          400: '#b78e71',
          500: '#a06a4a',
          600: '#80553b',
          700: '#60402c',
          800: '#402b1d',
          900: '#20150e',
        },
        // Rich Brown - Warm Earth
        olive: {
          50: '#ede9e8',
          100: '#cfc3c0',
          200: '#b19d98',
          300: '#937770',
          400: '#755148',
          500: '#5d4035',
          600: '#4a332a',
          700: '#37261f',
          800: '#241a15',
          900: '#110d0a',
        },
        // Dark Base - Almost Black
        dark: {
          50: '#ede9e7',
          100: '#cfc3bf',
          200: '#b19d97',
          300: '#93776f',
          400: '#755147',
          500: '#281915',
          600: '#201411',
          700: '#180f0d',
          800: '#100a08',
          900: '#080504',
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
