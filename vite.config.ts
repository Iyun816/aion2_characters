import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    proxy: {
      // 代理 AION2 API 请求,绕过 CORS 限制
      '/api/aion2': {
        target: 'https://tw.ncsoft.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aion2/, '/aion2/api'),
        secure: false,
      },
    },
  },
})
