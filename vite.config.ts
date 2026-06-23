import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig({
	plugins: [
		nitroV2Plugin(),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		VitePWA({
			registerType: 'autoUpdate',
			manifestFilename: 'manifest.json',
			devOptions: {
				enabled: true,
			},
			includeAssets: ['favicon/**/*', 'favicon/splash/**/*'],
			manifest: {
				id: '/',
				name: 'Nyx Fitness',
				short_name: 'Nyx Fit',
				description: 'Your personal fitness tracking app',
				start_url: '/',
				scope: '/',
				theme_color: '#000000',
				background_color: '#000000',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{
						src: '/favicon/web-app-manifest-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable',
					},
					{
						src: '/favicon/web-app-manifest-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
					{
						src: '/favicon/web-app-manifest-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/favicon/web-app-manifest-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
				navigateFallback: '/index.html',
				navigateFallbackDenylist: [/^\/api/, /^\/convex/],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-stylesheets',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: { statuses: [0, 200] },
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: { statuses: [0, 200] },
						},
					},
				],
			},
		}),
	],
})

export default config
