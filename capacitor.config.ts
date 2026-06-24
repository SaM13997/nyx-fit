import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Remote-URL wrapper (mirrors Android TWA): the native shell loads the deployed
 * TanStack Start app. `webDir` is a minimal offline fallback only.
 *
 * Override for local dev: CAPACITOR_SERVER_URL=http://localhost:3000
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
		androidScheme: 'https',
	},
	ios: {
		contentInset: 'automatic',
		backgroundColor: '#000000',
		scrollEnabled: true,
	},
	android: {
		backgroundColor: '#000000',
	},
}

export default config
