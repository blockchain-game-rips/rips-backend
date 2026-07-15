import { INestApplication, Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ANVIL_STATE_PATH,
	Anvil,
	deployments,
	ensureIndexerSync,
	setNativeBalance,
	useAnvil,
	useIndexer,
	type Indexer,
} from '@rips/test-harness'
import { mkdtempSync, writeFileSync } from 'fs'
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import { tmpdir } from 'os'
import { join } from 'path'
import {
	createPublicClient,
	defineChain,
	http,
	parseEther,
	type Chain,
	type HttpTransport,
	type PublicClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { AppModule } from '../../src/app.module'
import { KmsService } from '../../src/application/interfaces/kms.service'
import { PRESET_TO_TIER_BIASES } from '../../src/application/interfaces/tokens'
import { AppConfigModule } from '../../src/configuration/app-config.module'
import { EIP155 } from '../../src/constants'
import { Executor } from '../../src/domain/entities/executor'
import { toEvmAddress } from '../../src/domain/value-objects/evm-address'
import { toKmsKeyId } from '../../src/domain/value-objects/kms-key-id'
import { EVM_CLIENT_CONFIG } from '../../src/infrastructure/evm/evm-client/types'
import { evmAddressFromWallet } from '../../src/infrastructure/evm/helpers'
import { FileKmsService } from '../../src/infrastructure/kms/file-kms.service'
import { WARMUP_CURRENCY_IDS } from '../../src/infrastructure/price-provider/price-provider-warmup.service'
import { ProvisionService } from '../../src/infrastructure/provision/provision.service'
import { RIPS_CONTRACT } from '../../src/infrastructure/rips/rips.constants'
import { SeedModule } from '../../src/infrastructure/seed/seed.module'
import { UseCaseExceptionFilter } from '../../src/presentation/filters/use-case-exception.filter'
import { usePostgres } from './postgres'
import { TestConfigModule } from './test-config.module'

@Module({})
class NoopScheduleModule {}

const DEPLOYER_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const DEPLOYER_KMS_KEY_ID = DEPLOYER_ADDRESS

const EXECUTOR_COUNT = 2
const EXECUTOR_BALANCE = parseEther('10')

const BASE_CHAIN_ID = 8453

const chain = defineChain({
	id: BASE_CHAIN_ID,
	name: 'Base',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: [] } },
})

export type RipsApp = {
	app: INestApplication
	publicClient: PublicClient<HttpTransport, Chain>
	anvil: Anvil
	indexer: Indexer
}

export function useRipsApp(
	applyOverrides?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): RipsApp {
	const result = {} as RipsApp

	const kmsStoreDir = mkdtempSync(join(tmpdir(), 'rips-kms-'))
	const kmsStoreFile = join(kmsStoreDir, 'kms-store.json')

	usePostgres()
	const anvil = useAnvil({
		chainId: chain.id,
		pathToState: ANVIL_STATE_PATH,
	}).anvils[0]

	const indexer = useIndexer(() => `http://127.0.0.1:${anvil.port}`)

	beforeAll(async () => {
		result.anvil = anvil
		result.indexer = indexer

		const rpcUrl = `http://127.0.0.1:${anvil.port}`

		process.env.INDEXER_DATABASE_URL = indexer.databaseUrl

		result.publicClient = createPublicClient({
			chain,
			transport: http(rpcUrl),
		})

		seedKmsStore(kmsStoreFile)
		process.env.KMS_STORE_FILE = kmsStoreFile

		const testEvmClientConfig = {
			rpcSettings: {
				[chain.id]: {
					rpcUrls: [rpcUrl],
					disableDefaultRpcUrl: true,
				},
			},
		}

		let builder = Test.createTestingModule({
			imports: [AppModule, SeedModule],
		})
			.overrideModule(AppConfigModule)
			.useModule(TestConfigModule)
			.overrideModule(ScheduleModule)
			.useModule(NoopScheduleModule)
			.overrideProvider(KmsService)
			.useClass(FileKmsService)
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
			.overrideProvider(RIPS_CONTRACT)
			.useValue({
				chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
				address: deployments.rips,
			})
			.overrideProvider(PRESET_TO_TIER_BIASES)
			.useValue(
				new Map([
					['1', [2, 2, 2]],
					['2', [1, 1, 1]],
				]),
			)
			.overrideProvider(WARMUP_CURRENCY_IDS)
			.useValue([])

		if (applyOverrides) {
			builder = applyOverrides(builder)
		}

		const moduleRef = await builder.compile()

		result.app = moduleRef.createNestApplication({ bufferLogs: true })
		result.app.useLogger(result.app.get(Logger))
		result.app.useGlobalPipes(new ZodValidationPipe())
		result.app.useGlobalFilters(new UseCaseExceptionFilter())
		await result.app.init()

		const provisionService = result.app.get(ProvisionService)

		await provisionService.seedAdminWallet(
			toEvmAddress(DEPLOYER_ADDRESS),
			toKmsKeyId(DEPLOYER_KMS_KEY_ID),
		)

		const executors = await provisionService.ensureExecutors(EXECUTOR_COUNT)

		await setupExecutors(executors, result.publicClient, provisionService)

		await ensureIndexerSync(indexer, anvil)
	})

	afterAll(async () => {
		await result.app?.close()
	})

	return result
}

function seedKmsStore(storeFile: string): void {
	const deployer = privateKeyToAccount(ANVIL_ACCOUNT_0_PRIVATE_KEY)

	const store = {
		keys: {
			[deployer.address]: {
				privateKey: ANVIL_ACCOUNT_0_PRIVATE_KEY,
				address: deployer.address,
				createdAt: new Date().toISOString(),
			},
		},
	}

	writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf-8')
}

async function setupExecutors(
	executors: Executor[],
	publicClient: PublicClient<HttpTransport, Chain>,
	provisionService: ProvisionService,
): Promise<void> {
	for (const executor of executors) {
		const address = evmAddressFromWallet(executor.wallet)

		await setNativeBalance(publicClient, address, EXECUTOR_BALANCE)
	}

	await provisionService.grantExecutorRoles(executors)
}
