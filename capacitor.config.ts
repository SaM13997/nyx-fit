import type { CapacitorConfig } from '@capacitor/cli'

/**
 * iOS wrapper loads the hosted PWA (TanStack Start SSR).
 * Icons/manifest: vite.config.ts → https://fit.webdevsam.pro/manifest.json
 * See docs/ios-wrapper.md
 */
const config: CapacitorConfig = {
	appId: 'pro.webdevsam.fit',
	appName: 'Nyx Fitness',
	webDir: 'dist/client',
	server: {
		url: 'https://fit.webdevsam.pro',
		cleartext: false,
	},
	ios: {
		contentInset: 'automatic',
		backgroundColor: '#000000',
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0,
			backgroundColor: '#000000',
			showSpinner: false,
		},
	},
}

export default config
