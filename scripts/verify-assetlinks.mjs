#!/usr/bin/env node
/**
 * Verifies public/assetlinks.json SHA-256 fingerprint matches the release keystore.
 * Requires: TWA_KEYSTORE_PASSWORD, optional TWA_KEY_ALIAS (default: android)
 * Keystore path: builds/android.keystore (or TWA_KEYSTORE_PATH)
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const keystorePath = process.env.TWA_KEYSTORE_PATH ?? join(root, 'builds/android.keystore')
const alias = process.env.TWA_KEY_ALIAS ?? 'android'
const storePass = process.env.TWA_KEYSTORE_PASSWORD

if (!storePass) {
	console.error('TWA_KEYSTORE_PASSWORD is required')
	process.exit(1)
}

if (!existsSync(keystorePath)) {
	console.error(`Keystore not found: ${keystorePath}`)
	process.exit(1)
}

const output = execFileSync(
	'keytool',
	['-list', '-v', '-keystore', keystorePath, '-alias', alias, `-storepass:${storePass}`],
	{ encoding: 'utf8' },
)

const match = output.match(/SHA256:\s*([0-9A-F:]+)/i)
if (!match) {
	console.error('Could not parse SHA-256 fingerprint from keytool output')
	process.exit(1)
}

const fingerprint = match[1].toUpperCase()
const assetlinksPath = join(root, 'public/assetlinks.json')
const assetlinks = JSON.parse(readFileSync(assetlinksPath, 'utf8'))
const published =
	assetlinks[0]?.target?.sha256_cert_fingerprints?.map((f) => f.toUpperCase()) ?? []

if (!published.includes(fingerprint)) {
	console.error('Fingerprint mismatch')
	console.error(`  Keystore:  ${fingerprint}`)
	console.error(`  Published: ${published.join(', ')}`)
	console.error('Update public/assetlinks.json and public/.well-known/assetlinks.json')
	process.exit(1)
}

console.log(`Asset links fingerprint OK: ${fingerprint}`)
