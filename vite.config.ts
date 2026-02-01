import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/AV_PDF-Toolbox/', // Set base path for GitHub Pages
});