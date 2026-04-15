/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        cat: {
          necessary:    { bg: '#EAF3DE', text: '#3B6D11' },
          functional:   { bg: '#E6F1FB', text: '#185FA5' },
          analytics:    { bg: '#FAEEDA', text: '#854F0B' },
          advertising:  { bg: '#FAECE7', text: '#993C1D' },
          unknown:      { bg: '#F1EFE8', text: '#5F5E5A' },
        },
      },
    },
  },
  plugins: [],
};
