import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Electron 模式判断
const isElectron = process.env.ELECTRON === 'true';
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // Electron 特殊配置 - 使用相对路径以支持 file:// 协议
    base: './',

    define: {
      // 在构建时注入环境变量
      'import.meta.env.VITE_ELECTRON': JSON.stringify(env.VITE_ELECTRON || 'false'),
      'import.meta.env.PROD': JSON.stringify(mode === 'production'),
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        external: ['socket.io-client'],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ant-vendor': ['antd', '@ant-design/icons'],
          },
        },
      },
    },

    server: {
      port: isElectron ? 5174 : 5173,  // Electron 模式下用不同端口
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Electron 开发模式优化
    optimizeDeps: {
      include: ['react', 'react-dom', 'antd', '@ant-design/icons'],
    },
  };
});
