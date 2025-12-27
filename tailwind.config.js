/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // This links your CSS variable to a Tailwind color name
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}