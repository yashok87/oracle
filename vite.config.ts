
// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', 
  define: {
    // Safely inject the API keys.
    // Google Gemini SDK strictly requires 'process.env.API_KEY'
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    'process.env.POLL_KEY': JSON.stringify(process.env.POLL_KEY || ''),
    'process.env.POLLINATIONS_API_KEY': JSON.stringify(process.env.POLLINATIONS_API_KEY || ''),
    'process.env.BIGMODEL_API_KEY': JSON.stringify(process.env.BIGMODEL_API_KEY || '')
  },
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
