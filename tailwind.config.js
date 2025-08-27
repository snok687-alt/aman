/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      aspectRatio: {
        'video': '16 / 9',
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      }
    },
  },
  plugins: [],
}

// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
