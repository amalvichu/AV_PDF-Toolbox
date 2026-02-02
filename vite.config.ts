import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/psnl_tools/', // Set base path for GitHub Pages, assuming project is hosted in /psnl_tools/ subfolder
});
