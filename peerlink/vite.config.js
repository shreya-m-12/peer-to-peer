import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { apiPlugin } from './apiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/peer-to-peer/' : '/',
  plugins: [react(), tailwindcss(), apiPlugin()],
})
