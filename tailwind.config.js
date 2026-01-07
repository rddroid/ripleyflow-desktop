/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode-bg': '#1e1e1e',
        'vscode-panel': '#252526',
        'vscode-sidebar': '#2d2d30',
        'vscode-border': '#3e3e42',
        'vscode-text': '#cccccc',
        'vscode-text-secondary': '#858585',
      },
    },
  },
  plugins: [],
}

