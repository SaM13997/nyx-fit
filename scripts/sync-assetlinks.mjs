import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(root, 'builds/assetlinks.config.json')
const config = JSON.parse(readFileSync(configPath, 'utf8'))

const assetLinks = [
	{
		relation: ['delegate_permission/common.handle_all_urls'],
		target: {
			namespace: 'android_app',
			package_name: config.packageName,
			sha256_cert_fingerprints: config.sha256CertFingerprints,
		},
	},
]

const json = `${JSON.stringify(assetLinks, null, 2)}\n`
const targets = [
	join(root, 'public/assetlinks.json'),
	join(root, 'public/.well-known/assetlinks.json'),
]

for (const target of targets) {
	writeFileSync(target, json)
	console.log(`Wrote ${target}`)
}
