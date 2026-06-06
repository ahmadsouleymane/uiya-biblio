import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      ".ngrok-free.app"
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          pdf: ['react-pdf', 'pdfjs-dist'],
          charts: ['recharts'],
          scanner: ['html5-qrcode', 'quagga', 'react-qr-barcode-scanner'],
        }
      }
    },
    chunkSizeWarningLimit: 800,
  }
})
