/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#31603D',    // retro-green
        secondary: '#F8EECB',  // vanilla-cream
        tertiary: '#F5C065',   // saffron
        danger: '#D23D2D',     // fire-red
        dark: '#6E433D',       // russet
        orange: '#f6a700',
        purple: '#D0BFFF',
        background: '#F8EECB', // vanilla-cream por defecto
      }
    },
  },
  plugins: [],
}