import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // 1. Add this import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add this to your plugins array
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('conciergeBrain')) return 'concierge-brain';
          if (id.includes('geographicSearch')) return 'geographic-search';
          if (id.includes('historyKnowledge')) return 'history-knowledge';
        }
      }
    }
  }
});
