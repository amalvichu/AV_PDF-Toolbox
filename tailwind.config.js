/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'slate-950': '#020617',
        'slate-900': '#0f172a',
        'slate-800': '#1e293b',
        'slate-400': '#94a3b8',
        'slate-100': '#f1f5f9',
        'blue-500': '#3b82f6', // Electric Blue Accent
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
