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
			manifest: {
				name: 'Nyx Fit',
				short_name: 'Nyx Fit',
				description: 'Your personal fitness companion',
				theme_color: '#000000',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{
						src: 'logo192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'logo512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'logo512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
			},
		}),
	],
})

export default config
