/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', '"Noto Kufi Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        marathon: {
          dark: '#0B3D2E',
          darker: '#063B2E',
          darkest: '#052A20',
          green: '#1F6B4A',
          light: '#DFF3DC',
          lighter: '#EFF8ED',
          cream: '#F8F6EF',
          offwhite: '#FCFBF7',
          gray: '#EEEDE7',
          peach: '#FBE2D2',
          peachtext: '#B5652E',
          border: '#E7E4DA',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
        card: '1rem',
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(11, 61, 46, 0.06)',
        card: '0 1px 3px 0 rgba(11, 61, 46, 0.05), 0 1px 2px -1px rgba(11, 61, 46, 0.05)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: false,
  },
}
