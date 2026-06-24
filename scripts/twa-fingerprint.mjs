#!/usr/bin/env node
/**
 * Print the SHA-256 certificate fingerprint for a TWA signing keystore.
 * Used to verify assetlinks.json matches the release signing key.
 *
 * Env: TWA_KEYSTORE_PATH, TWA_KEYSTORE_PASSWORD, TWA_KEY_ALIAS (default: android)
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const keystorePath = process.env.TWA_KEYSTORE_PATH ?? 'builds/android.keystore'
const storePassword = process.env.TWA_KEYSTORE_PASSWORD
const alias = process.env.TWA_KEY_ALIAS ?? 'android'

if (!existsSync(keystorePath)) {
	console.error(`Keystore not found: ${keystorePath}`)
	process.exit(1)
}

if (!storePassword) {
	console.error('Set TWA_KEYSTORE_PASSWORD to read the keystore fingerprint.')
	process.exit(1)
}

const output = execSync(
	`keytool -list -v -keystore "${keystorePath}" -storepass "${storePassword}" -alias "${alias}"`,
	{ encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
)

const match = output.match(/SHA256:\s*([0-9A-F:]+)/i)
if (!match) {
	console.error('Could not parse SHA256 fingerprint from keytool output.')
	process.exit(1)
}

console.log(match[1].toUpperCase())
