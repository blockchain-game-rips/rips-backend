import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

const ts = readFileSync(join(srcDir, 'rips.ts'), 'utf8')
const json = readFileSync(join(srcDir, 'rips.json'), 'utf8')

const expression = ts.replace(/export const ripsAbi = /, '').replace(/ as const\s*;?\s*$/, '')

const fromTs = JSON.stringify(Function(`return (${expression})`)())
const fromJson = JSON.stringify(JSON.parse(json))

if (fromTs !== fromJson) {
	console.error('ABI drift: rips.ts and rips.json differ')
	process.exit(1)
}

console.log('rips.ts and rips.json are in sync')
