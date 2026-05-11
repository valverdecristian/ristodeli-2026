/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'retro-green': '#31603D',
        'vanilla-cream': '#F8EECB',
        'fire-red': '#D23D2D',
        'saffron': '#F5C065',
        'russet': '#6E433D',
        'orange': '#f6a700',
        'purple': '#D0BFFF',
        primary: '#31603D',
        secondary: '#F8EECB',
        tertiary: '#F5C065',
        warning: '#F5C065',
        danger: '#D23D2D',
        dark: '#6E433D',
        success: '#31603D',
        error: '#D23D2D',
        info: '#D0BFFF',
      },
    },
  },
  plugins: [],
}
