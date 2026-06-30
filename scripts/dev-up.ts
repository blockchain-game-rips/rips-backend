import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
	Anvil,
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ANVIL_MNEMONIC,
	ANVIL_STATE_PATH,
	deployments,
	ensureIndexerSync,
	Indexer,
} from '@rips/test-harness'
import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { execSync } from 'child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { parseEther, toHex } from 'viem'
import { privateKeyToAddress } from 'viem/accounts'
import { AppConfigModule } from '../apps/backend/src/configuration/app-config.module'
import { Executor } from '../apps/backend/src/domain/entities/executor'
import { toEvmAddress } from '../apps/backend/src/domain/value-objects/evm-address'
import { toKmsKeyId } from '../apps/backend/src/domain/value-objects/kms-key-id'
import { evmAddressFromWallet } from '../apps/backend/src/infrastructure/evm/helpers'
import { ProvisionModule } from '../apps/backend/src/infrastructure/provision/provision.module'
import { ProvisionService } from '../apps/backend/src/infrastructure/provision/provision.service'
import { SeedCardDefinitionsService } from '../apps/backend/src/infrastructure/seed/seed-card-definitions.service'
import { SeedModule } from '../apps/backend/src/infrastructure/seed/seed.module'

@Module({
	imports: [
		AppConfigModule,
		CacheModule.register({ isGlobal: true }),
		ProvisionModule,
		SeedModule,
	],
})
class DevProvisionModule {}

const REPO_ROOT = join(__dirname, '..')
const BACKEND_DIR = join(REPO_ROOT, 'apps/backend')

const BACKEND_ENV_FILE = join(REPO_ROOT, '.env.backend.local')

const DEV_CONFIG_FILE = join(REPO_ROOT, 'dev-config.local.yaml')
const CARD_DEFINITIONS_FILE = join(BACKEND_DIR, 'test/fixtures/cards.json')

const POSTGRES_IMAGE = 'postgres:16'

const BASE_CHAIN_ID = 8453

const DEPLOYER_ADDRESS = privateKeyToAddress(ANVIL_ACCOUNT_0_PRIVATE_KEY)
const DEPLOYER_KMS_KEY_ID = '0'

const EXECUTOR_COUNT = 2
const ACCOUNT_BALANCE = parseEther('10')

const ADMIN_API_KEY = 'local-admin-key'

const teardown: Array<() => Promise<void> | void> = []

async function shutdown(): Promise<void> {
	for (const stop of teardown.reverse()) {
		try {
			await stop()
		} catch (error) {
			console.error('Teardown step failed:', error)
		}
	}
}

async function main() {
	process.on('SIGINT', () => void shutdown().then(() => process.exit(0)))
	process.on('SIGTERM', () => void shutdown().then(() => process.exit(0)))

	const anvil = new Anvil({
		chainId: BASE_CHAIN_ID,
		pathToState: ANVIL_STATE_PATH,
	})

	await anvil.start()
	teardown.push(() => anvil.stop())

	const rpcUrl = `http://127.0.0.1:${anvil.port}`

	const backendDb = await startPostgres()
	teardown.push(async () => {
		await backendDb.stop()
	})
	pushBackendSchema(backendDb.getConnectionUri())

	const indexer = new Indexer({ getRpcUrl: () => rpcUrl })
	await indexer.start()
	teardown.push(async () => {
		await indexer.stop()
	})

	configureProvisionEnv(backendDb.getConnectionUri(), indexer.databaseUrl)

	writeConfigFile(rpcUrl)

	const app = await createAppContext()

	await provision(app, rpcUrl)

	await ensureIndexerSync(indexer, anvil)

	await seedCards(app)

	await app.close()

	writeBackendEnv(backendDb.getConnectionUri(), indexer.databaseUrl)

	printReady(rpcUrl)

	await keepAlive()
}

function keepAlive(): Promise<never> {
	return new Promise<never>(() => {})
}

async function startPostgres(): Promise<StartedPostgreSqlContainer> {
	return new PostgreSqlContainer(POSTGRES_IMAGE).start()
}

function pushBackendSchema(databaseUrl: string): void {
	execSync('yarn prisma db push --force-reset', {
		cwd: BACKEND_DIR,
		stdio: 'inherit',
		env: {
			...process.env,
			DATABASE_URL: databaseUrl,
			PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
		},
	})
}

function configureProvisionEnv(
	databaseUrl: string,
	indexerDatabaseUrl: string,
): void {
	const keyIndexDir = mkdtempSync(join(tmpdir(), 'rips-kms-'))

	process.env.DATABASE_URL = databaseUrl
	process.env.INDEXER_DATABASE_URL = indexerDatabaseUrl

	process.env.KMS_MNEMONIC = ANVIL_MNEMONIC
	process.env.KMS_LAST_KEY_INDEX_FILE = join(
		keyIndexDir,
		'last-key-index.txt',
	)

	process.env.RIPS_CHAIN_ID = String(BASE_CHAIN_ID)
	process.env.RIPS_CONTRACT_ADDRESS = deployments.rips

	process.env.CONFIG_PATH = DEV_CONFIG_FILE
}

type AppContext = Awaited<
	ReturnType<typeof NestFactory.createApplicationContext>
>

async function createAppContext(): Promise<AppContext> {
	return NestFactory.createApplicationContext(DevProvisionModule, {
		logger: ['log', 'error', 'warn'],
	})
}

async function provision(app: AppContext, rpcUrl: string): Promise<void> {
	const provisionService = app.get(ProvisionService)

	await provisionService.seedAdminWallet(
		toEvmAddress(DEPLOYER_ADDRESS),
		toKmsKeyId(DEPLOYER_KMS_KEY_ID),
	)

	await fundAccount(rpcUrl, DEPLOYER_ADDRESS)

	const executors = await provisionService.ensureExecutors(EXECUTOR_COUNT)

	await fundExecutors(executors, rpcUrl)

	await provisionService.grantExecutorRoles(executors)
}

async function fundExecutors(
	executors: Executor[],
	rpcUrl: string,
): Promise<void> {
	for (const executor of executors) {
		const address = evmAddressFromWallet(executor.wallet)

		await fundAccount(rpcUrl, address)
	}
}

async function fundAccount(rpcUrl: string, address: string): Promise<void> {
	await anvilRpc(rpcUrl, 'anvil_setBalance', [
		address,
		toHex(ACCOUNT_BALANCE),
	])
}

async function anvilRpc(
	rpcUrl: string,
	method: string,
	params: unknown[],
): Promise<void> {
	const response = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	})

	const body: { error?: { message: string } } = await response.json()

	if (!response.ok || body.error) {
		throw new Error(
			`Anvil RPC ${method} failed: ${body.error?.message ?? response.status}`,
		)
	}
}

async function seedCards(app: AppContext): Promise<void> {
	const raw: unknown = JSON.parse(
		readFileSync(CARD_DEFINITIONS_FILE, 'utf-8'),
	)

	const seedService = app.get(SeedCardDefinitionsService)

	const config = seedService.parseConfig(raw)

	await seedService.seed(config)
}

function writeConfigFile(rpcUrl: string): void {
	const config = [
		'chainClientConfig:',
		'  rpcSettings:',
		`    "${BASE_CHAIN_ID}":`,
		'      rpcUrls:',
		`        - ${rpcUrl}`,
		'      disableDefaultRpcUrl: true',
		'cardConfig:',
		'  presetsBiases:',
		'    "1": [2, 2, 2]',
		'    "2": [2, 2, 2]',
		'',
	].join('\n')

	writeFileSync(DEV_CONFIG_FILE, config, 'utf-8')
}

function writeBackendEnv(
	databaseUrl: string,
	indexerDatabaseUrl: string,
): void {
	const env = {
		NODE_ENV: 'development',
		DATABASE_URL: databaseUrl,
		INDEXER_DATABASE_URL: indexerDatabaseUrl,
		CONFIG_PATH: DEV_CONFIG_FILE,
		RIPS_CHAIN_ID: String(BASE_CHAIN_ID),
		RIPS_CONTRACT_ADDRESS: deployments.rips,
		KMS_MNEMONIC: ANVIL_MNEMONIC,
		KMS_LAST_KEY_INDEX_FILE: process.env.KMS_LAST_KEY_INDEX_FILE ?? '',
		ADMIN_API_KEY,
	}

	writeEnvFile(BACKEND_ENV_FILE, env)
}

function writeEnvFile(path: string, env: Record<string, string>): void {
	const contents = Object.entries(env)
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')

	writeFileSync(path, `${contents}\n`, 'utf-8')
}

function printReady(rpcUrl: string): void {
	console.log('\nLocal dev environment is up.')
	console.log(`  Anvil RPC:        ${rpcUrl}`)
	console.log(`  Deployer:         ${DEPLOYER_ADDRESS}`)
	console.log(`  Backend env:      ${BACKEND_ENV_FILE}`)
	console.log(
		'\nRun the backend (yarn dev:backend) in another terminal, then press Ctrl-C here to tear everything down.\n',
	)
}

void main().catch(async (error) => {
	console.error(error)

	await shutdown()

	process.exit(1)
})
