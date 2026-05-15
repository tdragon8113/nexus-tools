/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Noto Serif SC', 'Songti SC', 'STSong', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b'
      },
      boxShadow: {
        doc: '0 1px 2px rgba(28, 25, 23, 0.06)'
      }
    }
  }
}
