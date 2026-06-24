import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { nyxPwaSwPlugin } from './vite-pwa-sw-plugin.js'

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
		nyxPwaSwPlugin(),
		VitePWA({
			registerType: 'autoUpdate',
			manifestFilename: 'manifest.json',
			includeAssets: [
				'favicon/favicon.ico',
				'favicon/favicon.svg',
				'favicon/favicon-96x96.png',
				'favicon/apple-touch-icon.png',
				'splash/apple-splash-1170x2532.png',
				'splash/apple-splash-1290x2796.png',
				'splash/apple-splash-750x1334.png',
			],
			manifest: {
				name: 'Nyx Fitness',
				short_name: 'Nyx Fit',
				description: 'Your personal fitness companion',
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
			// Service worker is generated post-build via scripts/generate-sw.mjs
			// (vite-plugin-pwa skips SW for TanStack Start SSR client builds).
			selfDestroying: false,
		}),
	],
})

export default config
