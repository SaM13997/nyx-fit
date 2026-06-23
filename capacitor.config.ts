import type { CapacitorConfig } from '@capacitor/cli'
import iosConfig from './builds/ios-config.json'

/**
 * Capacitor loads the deployed PWA (SSR on Vercel) — same model as Android TWA.
 * Icons and splash sync from public/favicon via `npm run ios:sync-assets`.
 */
const config: CapacitorConfig = {
	appId: iosConfig.appId,
	appName: iosConfig.appName,
	webDir: 'dist/client',
	server: {
		url: iosConfig.startUrl,
		cleartext: false,
	},
	ios: {
		contentInset: 'automatic',
		backgroundColor: iosConfig.backgroundColor,
		scrollEnabled: true,
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 300,
			backgroundColor: iosConfig.backgroundColor,
			showSpinner: false,
			androidSplashResourceName: 'splash',
			iosSpinnerStyle: 'small',
		},
		StatusBar: {
			style: 'DARK',
			backgroundColor: iosConfig.themeColor,
		},
	},
}

export default config
