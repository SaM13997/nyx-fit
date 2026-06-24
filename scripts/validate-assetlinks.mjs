#!/usr/bin/env node
/**
 * Verify public assetlinks.json matches the expected TWA release fingerprint.
 */
import { readFileSync } from 'node:fs'

const PACKAGE_NAME = 'pro.webdevsam.fit.twa'

function readFingerprint(path) {
	const data = JSON.parse(readFileSync(path, 'utf8'))
	const entry = data.find(
		(item) => item.target?.package_name === PACKAGE_NAME,
	)
	const fingerprints = entry?.target?.sha256_cert_fingerprints ?? []
	return fingerprints[0]?.toUpperCase() ?? null
}

const assetlinksPath = 'public/.well-known/assetlinks.json'
const committed = readFingerprint(assetlinksPath)

if (!committed) {
	console.error(`No fingerprint found in ${assetlinksPath}`)
	process.exit(1)
}

const expected = process.env.TWA_SHA256_FINGERPRINT?.toUpperCase()

if (expected) {
	if (committed !== expected) {
		console.error(
			`Fingerprint mismatch:\n  committed: ${committed}\n  expected:  ${expected}`,
		)
		process.exit(1)
	}
	console.log(`assetlinks.json matches TWA_SHA256_FINGERPRINT (${committed})`)
	process.exit(0)
}

// Without secrets, validate structure and that both copies match
const rootCopy = readFingerprint('public/assetlinks.json')
if (rootCopy !== committed) {
	console.error('public/assetlinks.json and .well-known copy differ')
	process.exit(1)
}

console.log(
	`assetlinks.json structure OK (fingerprint ${committed}). Set TWA_SHA256_FINGERPRINT in CI to verify against release keystore.`,
)
