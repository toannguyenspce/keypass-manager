import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` matters for GitHub Pages, where the app is served from
// https://<user>.github.io/<repo>/. Set VITE_BASE_PATH in CI (the deploy
// workflow sets it to "/<repo>/"); locally it stays "/".
export default defineConfig(() => ({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
}));
