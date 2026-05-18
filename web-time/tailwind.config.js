/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b'
      }
    }
  }
}
