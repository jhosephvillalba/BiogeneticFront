import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden', // ✅ Habilitado en desarrollo, oculto en producción
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  optimizeDeps: {
    include: [
      'bootstrap-icons',
      'axios',
      'react-router-dom',
      'chart.js',
      'react-chartjs-2',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/react-fontawesome'
    ]
  },
  resolve: {
    alias: {
      'bootstrap-icons': 'bootstrap-icons/font/bootstrap-icons.css'
    }
  }
})
