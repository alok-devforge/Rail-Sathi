/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'rail-blue': '#2196F3',
        'rail-green': '#4CAF50',
        'rail-yellow': '#FFC107',
        'rail-red': '#F44336',
      },
    },
  },
  plugins: [],
};
