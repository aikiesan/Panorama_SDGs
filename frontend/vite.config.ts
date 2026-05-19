/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'test/'],
      extension: ['.js', '.ts', '.jsx', '.tsx'],
      requireEnv: false,
      cypress: false,
      forceBuildInstrument: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/**/*.test.tsx', 'src/**/*.test.ts'],
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          maps: ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          charts: ['recharts'],
          ui: ['clsx'],
        },
      },
    },
  },
});
