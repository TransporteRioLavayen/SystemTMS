import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Determinar si es Cloudflare Pages
  const isCloudflare = mode === 'cloudflare' || process.env.CF_PAGES;
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Cloudflare Pages compatibility
    base: isCloudflare ? '/' : '/',
    server: {
      port: 3001,
      proxy: isCloudflare ? undefined : {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR siempre activo
      hmr: true,
      watch: {
        // WSL2 fix: use polling for file watching on /mnt/c/ paths
        usePolling: true,
        interval: 300,
      },
    },
    build: {
      // Cloudflare Pages: output directo al raíz
      outDir: 'dist',
      emptyOutDir: true,
      // Cache busting en producción
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    // Optimizaciones para producción
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };
});
