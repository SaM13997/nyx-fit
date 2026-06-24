#!/usr/bin/env node
/**
 * Copy shared PWA icons/splash into the Capacitor iOS asset catalog.
 * Run after `npx cap add ios` on macOS: npm run ios:assets
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iosApp = join(root, 'ios', 'App', 'App')
const assets = join(iosApp, 'Assets.xcassets')

const iconSource = join(root, 'public/favicon/web-app-manifest-512x512.png')
const splashSources = [
	join(root, 'public/splash/apple-splash-750x1334.png'),
	join(root, 'public/splash/apple-splash-1170x2532.png'),
	join(root, 'public/splash/apple-splash-1290x2796.png'),
]

if (!existsSync(iosApp)) {
	console.error(
		'ios/App not found. Run on macOS: npx cap add ios && npx cap sync ios',
	)
	process.exit(1)
}

if (!existsSync(iconSource)) {
	console.error('Missing icon:', iconSource)
	process.exit(1)
}

const appIconSet = join(assets, 'AppIcon.appiconset')
const splashSet = join(assets, 'Splash.imageset')

mkdirSync(appIconSet, { recursive: true })
mkdirSync(splashSet, { recursive: true })

// Single 1024 App Store icon slot; Xcode can generate other sizes from source.
copyFileSync(iconSource, join(appIconSet, 'AppIcon-1024.png'))
writeFileSync(
	join(appIconSet, 'Contents.json'),
	JSON.stringify(
		{
			images: [
				{
					filename: 'AppIcon-1024.png',
					idiom: 'universal',
					platform: 'ios',
					size: '1024x1024',
				},
			],
			info: { author: 'xcode', version: 1 },
		},
		null,
		2,
	),
)

const splashFile = splashSources.find((p) => existsSync(p)) ?? splashSources[0]
copyFileSync(splashFile, join(splashSet, 'splash.png'))
writeFileSync(
	join(splashSet, 'Contents.json'),
	JSON.stringify(
		{
			images: [
				{
					filename: 'splash.png',
					idiom: 'universal',
					scale: '1x',
				},
			],
			info: { author: 'xcode', version: 1 },
		},
		null,
		2,
	),
)

console.log('Synced iOS assets from public/favicon and public/splash')
