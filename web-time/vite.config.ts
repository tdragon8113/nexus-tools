/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: '时光记',
                short_name: '时光记',
                description: '记录时间，看见生活',
                lang: 'zh-CN',
                start_url: '/manage/time/',
                scope: '/manage/time/',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#0f3e17',
                background_color: '#eef6ef',
                icons: [
                    {
                        src: 'pwa-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [/^\/api/],
            },
            devOptions: {
                enabled: true,
                navigateFallback: 'index.html',
            },
        }),
    ],
    base: '/manage/time/',
    server: {
        port: 3001,
        proxy: {
            '/api': { target: 'http://localhost:8080', changeOrigin: true },
        },
    },
    test: {
        environment: 'node',
    },
});
