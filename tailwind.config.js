/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nae: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#e91e8c',
          500: '#db1a80',
          600: '#be155e',
          700: '#9d124e',
          800: '#7c0f3e',
          900: '#5c0b2e',
          950: '#3d0720',
        },
        cyan: {
          400: '#00d2ff',
          500: '#00b8e0',
          600: '#009ec4',
        },
      },
      backgroundImage: {
        'gradient-pink-cyan': 'linear-gradient(135deg, #e91e8c 0%, #00d2ff 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a14 0%, #0d0d1a 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
