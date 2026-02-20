/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          dark: '#0a0a0a',
          darker: '#050505',
          gold: '#d4af37',
          'gold-light': '#f4e4bc',
          red: '#c41e3a',
          black: '#1a1a1a',
          green: '#2d5016',
          felt: '#0d5f2d',
        },
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'chip-fly': 'fly 0.8s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fly: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-50px) scale(1.2)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
