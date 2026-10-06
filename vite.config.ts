import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // На GitHub Pages сайт живёт по адресу https://<user>.github.io/furniture-landing/
  base: command === 'build' || isPreview ? '/furniture-landing/' : '/',
  build: {
    // вся страница построена вокруг 3D-сцены, поэтому three.js входит в основной бандл (~410 КБ в gzip)
    chunkSizeWarningLimit: 1600,
  },
}))
