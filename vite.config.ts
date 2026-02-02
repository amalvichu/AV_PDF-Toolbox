import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/AV_PDF-Toolbox/', // Crucial: This MUST match your GitHub repository name exactly for GitHub Pages hosting
});
