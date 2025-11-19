/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        cream: '#EDE5D8',
        medium: '#7E715D',
        muted: '#AB9F8B',
        creamgrey: '#C9C6C0',
      },
    },
  },
  plugins: [],
}
