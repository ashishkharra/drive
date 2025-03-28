import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  base: './src',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PORT,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})