/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#0073ea',
          DEFAULT: '#0060b9',
          dark: '#004b8f',
        },
        secondary: {
          light: '#00cff4',
          DEFAULT: '#00a5d7',
          dark: '#0080a8',
        },
        success: '#00c875',
        warning: '#ffcb00',
        danger: '#e44258',
        gray: {
          100: '#f6f7fb',
          200: '#ebeef6',
          300: '#d5dae5',
          400: '#b2bdcd',
          500: '#9197a3',
          600: '#676879',
          700: '#323338',
          800: '#1f1f1f',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 8px rgba(0, 0, 0, 0.05)',
        dropdown: '0 6px 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
