import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// Dev only. Cloudflare's edge caches anything ending in .css and rewrites the
// dev server's `no-cache` to a 4 hour browser TTL, so phones on the tunnel kept
// a stale (or JS-module) /src/styles.css. `no-store` is the one value it keeps.
function noStoreDevCss(): Plugin {
	return {
		name: 'nyx:no-store-dev-css',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const pathname = req.url?.split('?')[0] ?? ''
				if (pathname.endsWith('.css')) {
					const setHeader = res.setHeader.bind(res)
					res.setHeader = (name, value) =>
						setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value)
				}
				next()
			})
		},
	}
}

const config = defineConfig({
	server: {
		allowedHosts: [
			// Cloudflare tunnel "nyx-dev" -> localhost:3000
			"nyx-dev.sarthakmalhotra.dev",
			"devhub.cobbler-tritone.ts.net",
			// vite matches the hostname only (port is stripped from the Host header)
			"devhub",
			"devhub:3000",
			...(process.env.VITE_ALLOWED_HOSTS?.split(",")
				.map((host) => host.trim())
				.filter(Boolean) ?? []),
		],
	},
	plugins: [
		noStoreDevCss(),
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
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
			// The app registers /sw.js itself; do not inject a second registration script.
			injectRegister: false,
			devOptions: {
				enabled: false,
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
				// SW generated post-build via scripts/generate-sw.mjs (TanStack Start + ssr)
				globPatterns: ['**/*.{ico,png,svg,webp,woff2,json}'],
				globIgnores: ['favicon/splash/**', 'onboarding/**'],
				cleanupOutdatedCaches: true,
			},
		}),
	],
})

export default config
