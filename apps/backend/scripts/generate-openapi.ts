import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { KEK_LENGTH } from '../src/infrastructure/encryption/file-encryption.service'

/**
 * The OpenAPI document is derived purely from decorator metadata, so no
 * provider ever talks to infrastructure here. These values only exist to
 * satisfy constructor-time guards while the DI container is built.
 */
const STUB_ENV = {
	NODE_ENV: 'development',
	DATABASE_URL: 'postgresql://stub:stub@127.0.0.1:1/stub',
	INDEXER_DATABASE_URL: 'postgresql://stub:stub@127.0.0.1:1/stub',
	ADMIN_API_KEY: 'stub',
	BOT_API_KEY: 'stub',
	RIPS_CHAIN_ID: '1',
	RIPS_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000',
	RIPS_CONDUIT_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000',
}

const STUB_CONFIG = {
	useAlchemyBalances: false,
	chainClientConfig: { rpcSettings: {} },
	cardConfig: { presetsBiases: {} },
	supportedCurrencies: [],
}

const OUTPUT_PATH = join(__dirname, '..', 'openapi.json')

const JSON_INDENT = 2

function applyStubEnvironment(stubDir: string) {
	Object.assign(process.env, STUB_ENV)

	const kekPath = join(stubDir, 'kek.hex')
	writeFileSync(kekPath, '0'.repeat(KEK_LENGTH * 2))
	process.env.KEK_FILE = kekPath

	const configPath = join(stubDir, 'config.json')
	writeFileSync(configPath, JSON.stringify(STUB_CONFIG))
	process.env.CONFIG_PATH = configPath
}

async function generate() {
	const stubDir = mkdtempSync(join(tmpdir(), 'rips-openapi-'))

	try {
		applyStubEnvironment(stubDir)

		// Imported lazily so the stub environment is in place before any
		// module reads it at load time.
		const { NestFactory } = await import('@nestjs/core')
		const { AppModule } = await import('../src/app.module')
		const { buildOpenApiDocument } =
			await import('../src/openapi/build-openapi-document')

		// abortOnError lets a failed bootstrap reject here instead of Nest
		// silently exiting the process before this promise can report why.
		const app = await NestFactory.create(AppModule, { abortOnError: false })

		const document = buildOpenApiDocument(app)

		writeFileSync(OUTPUT_PATH, JSON.stringify(document, null, JSON_INDENT))

		await app.close()
	} finally {
		rmSync(stubDir, { recursive: true, force: true })
	}
}

generate()
	.then(() => {
		console.log(`✓ OpenAPI schema written to ${OUTPUT_PATH}`)

		process.exit(0)
	})
	.catch((error: unknown) => {
		console.error('✗ OpenAPI generation failed:')
		console.error(error)

		process.exit(1)
	})
