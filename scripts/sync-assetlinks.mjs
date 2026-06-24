#!/usr/bin/env node
/**
 * Write Digital Asset Links JSON from TWA_SHA256_FINGERPRINT env var.
 * Falls back to extracting fingerprint from keystore when password is set.
 */
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const PACKAGE_NAME = 'pro.webdevsam.fit.twa'
const OUTPUT_PATHS = [
	'public/assetlinks.json',
	'public/.well-known/assetlinks.json',
]

function getFingerprint() {
	if (process.env.TWA_SHA256_FINGERPRINT) {
		return process.env.TWA_SHA256_FINGERPRINT.toUpperCase()
	}

	if (process.env.TWA_KEYSTORE_PASSWORD) {
		return execSync('node scripts/twa-fingerprint.mjs', {
			encoding: 'utf8',
		}).trim()
	}

	console.error(
		'Set TWA_SHA256_FINGERPRINT or TWA_KEYSTORE_PASSWORD to sync assetlinks.',
	)
	process.exit(1)
}

const fingerprint = getFingerprint()
const assetLinks = [
	{
		relation: ['delegate_permission/common.handle_all_urls'],
		target: {
			namespace: 'android_app',
			package_name: PACKAGE_NAME,
			sha256_cert_fingerprints: [fingerprint],
		},
	},
]

const json = `${JSON.stringify(assetLinks, null, 2)}\n`
for (const path of OUTPUT_PATHS) {
	writeFileSync(path, json)
	console.log(`Wrote ${path} (fingerprint ${fingerprint})`)
}
