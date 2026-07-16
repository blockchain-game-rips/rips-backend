import { randomBytes } from 'crypto'
import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { KEK_LENGTH } from '../../src/infrastructure/encryption/file-encryption.service'

export function provisionKekFile(): void {
	const kekDir = mkdtempSync(join(tmpdir(), 'rips-kek-'))
	const kekFile = join(kekDir, 'kek.hex')

	writeFileSync(kekFile, randomBytes(KEK_LENGTH).toString('hex'), 'utf-8')

	process.env.KEK_FILE = kekFile
}
