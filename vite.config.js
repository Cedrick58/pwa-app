import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  },
  preview: {
    port: process.env.PORT || 3000,
    allowedHosts: ['pwa-app-vv4i.onrender.com'], // 👈 Agrega tu dominio aquí
  },
});
