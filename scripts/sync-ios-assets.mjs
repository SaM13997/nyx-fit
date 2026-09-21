#!/usr/bin/env node
/**
 * Copies shared PWA icons/splash into Capacitor resources/.
 * Source of truth: public/favicon (same as vite-plugin-pwa manifest).
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(
	readFileSync(join(root, 'builds/ios-config.json'), 'utf8'),
)

const resourcesDir = join(root, 'resources')
mkdirSync(resourcesDir, { recursive: true })

const mappings = [
	[config.icons.appIcon, join(resourcesDir, 'icon.png')],
	[config.icons.splash, join(resourcesDir, 'splash.png')],
]

for (const [src, dest] of mappings) {
	copyFileSync(join(root, src), dest)
	console.log(`sync-ios-assets: ${src} → ${dest.replace(root + '/', '')}`)
}
