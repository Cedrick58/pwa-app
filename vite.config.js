import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Usa process.env.PORT para que Render lo asigne automáticamente
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    host: '0.0.0.0',  // Expone el servidor en todas las IPs
    port: process.env.PORT || 3000,  // Usa el puerto de Render o 3000 en local
  },
});
