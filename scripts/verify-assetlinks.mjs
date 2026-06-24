#!/usr/bin/env node
/**
 * Verify public/.well-known/assetlinks.json SHA256 fingerprint matches the
 * release signing keystore. Used locally and in CI after decoding TWA_KEYSTORE_BASE64.
 *
 * Env: TWA_KEYSTORE_PASSWORD (required), TWA_KEY_ALIAS (default: android),
 *      TWA_KEYSTORE_PATH (default: builds/android.keystore)
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const keystorePath = resolve(root, process.env.TWA_KEYSTORE_PATH ?? 'builds/android.keystore')
const alias = process.env.TWA_KEY_ALIAS ?? 'android'
const password = process.env.TWA_KEYSTORE_PASSWORD

const assetlinksPaths = [
	resolve(root, 'public/.well-known/assetlinks.json'),
	resolve(root, 'public/assetlinks.json'),
]

function normalizeFingerprint(value) {
	return value.replace(/:/g, '').toUpperCase()
}

function extractKeystoreFingerprint() {
	if (!existsSync(keystorePath)) {
		throw new Error(`Keystore not found at ${keystorePath}`)
	}
	if (!password) {
		throw new Error('TWA_KEYSTORE_PASSWORD is required')
	}

	const output = execSync(
		`keytool -list -v -keystore "${keystorePath}" -alias "${alias}" -storepass "${password}"`,
		{ encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
	)

	const match = output.match(/SHA256:\s*([0-9A-F:]+)/i)
	if (!match) {
		throw new Error('Could not parse SHA256 fingerprint from keytool output')
	}
	return normalizeFingerprint(match[1])
}

function readAssetlinksFingerprints(path) {
	const json = JSON.parse(readFileSync(path, 'utf8'))
	const entry = json.find((item) => item.target?.sha256_cert_fingerprints?.length)
	if (!entry) {
		throw new Error(`No sha256_cert_fingerprints in ${path}`)
	}
	return entry.target.sha256_cert_fingerprints.map(normalizeFingerprint)
}

function main() {
	const keystoreFingerprint = extractKeystoreFingerprint()
	let ok = true

	for (const path of assetlinksPaths) {
		const fingerprints = readAssetlinksFingerprints(path)
		const matches = fingerprints.some((fp) => fp === keystoreFingerprint)
		if (!matches) {
			console.error(`FAIL ${path}`)
			console.error(`  keystore:  ${keystoreFingerprint}`)
			console.error(`  assetlinks: ${fingerprints.join(', ')}`)
			ok = false
		} else {
			console.log(`OK ${path} matches keystore fingerprint`)
		}
	}

	if (!ok) {
		process.exit(1)
	}
	console.log('Asset links verification passed.')
}

main()
