/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        primary: "#00825B",
        primaryLight: "#DCFFF5",
        primaryLight2: "#DCFFF5",
        primaryBorder: "#E1E1E1",
        gray: "#AAAAAA",
        black: "#222222",
      },
    },
  },
  plugins: [],
};
