import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: false,
  },
  define: {
    'import.meta.env.VITE_VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV || ''),
    'import.meta.env.VITE_VERCEL_GIT_COMMIT_REF': JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || ''),
  },
});
