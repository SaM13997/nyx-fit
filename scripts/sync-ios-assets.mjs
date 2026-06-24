#!/usr/bin/env node
/**
 * Copy shared PWA icons into the Capacitor iOS asset catalog.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = process.cwd()
const APP_ICON_DIR = join(
	ROOT,
	'ios/App/App/Assets.xcassets/AppIcon.appiconset',
)
const SPLASH_DIR = join(
	ROOT,
	'ios/App/App/Assets.xcassets/Splash.imageset',
)

const SOURCES = {
	appIcon: [
		join(ROOT, 'store_icon.png'),
		join(ROOT, 'public/favicon/web-app-manifest-512x512.png'),
	],
	splash: join(ROOT, 'public/favicon/splash/splash-1290x2796.png'),
}

function firstExisting(paths) {
	for (const path of paths) {
		if (existsSync(path)) return path
	}
	return null
}

function ensureDir(path) {
	mkdirSync(dirname(path), { recursive: true })
}

function copyAsset(source, dest, label) {
	if (!source) {
		console.error(`Missing source for ${label}`)
		process.exit(1)
	}
	ensureDir(dest)
	copyFileSync(source, dest)
	console.log(`${label}: ${source} → ${dest}`)
}

const appIconSource = firstExisting(SOURCES.appIcon)
copyAsset(
	appIconSource,
	join(APP_ICON_DIR, 'AppIcon-512@2x.png'),
	'App icon',
)

if (existsSync(SOURCES.splash)) {
	copyAsset(
		SOURCES.splash,
		join(SPLASH_DIR, 'splash-2732x2732.png'),
		'Splash',
	)
} else {
	console.warn('Splash source not found — skipping Splash.imageset copy')
}

console.log('iOS assets synced. Export a 1024×1024 App Store icon before submission.')
