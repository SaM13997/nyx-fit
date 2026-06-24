import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Nyx Fit loads the deployed TanStack Start app in WKWebView (SSR + Convex).
 * Local `webDir` is a Capacitor shell; production URL is the runtime entry.
 *
 * Override for dev: CAPACITOR_SERVER_URL=http://localhost:3000 npx cap sync ios
 */
const serverUrl =
	process.env.CAPACITOR_SERVER_URL ?? 'https://fit.webdevsam.pro'

const config: CapacitorConfig = {
	appId: 'pro.webdevsam.fit',
	appName: 'Nyx Fit',
	webDir: 'capacitor-web',
	server: {
		url: serverUrl,
		cleartext: serverUrl.startsWith('http://'),
	},
	ios: {
		backgroundColor: '#000000',
		contentInset: 'automatic',
		scrollEnabled: true,
	},
}

export default config
