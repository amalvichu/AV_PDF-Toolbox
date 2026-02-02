import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/psnl_tools/', // Set base path for GitHub Pages, allowing the browser to find .js and .css files in the correct subfolder
});
