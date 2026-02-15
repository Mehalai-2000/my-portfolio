module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-bg)',
        text: 'var(--color-text)',
        card: 'var(--color-card)',
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        heading: ['"Petrona"', 'sans-serif'],
        body: ['"Petrona"', 'sans-serif'],
        signature: ['"Dancing Script"', 'cursive'],
      },
    },
  },
  plugins: [],
}
