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
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import {
	createPublicClient,
	defineChain,
	http,
	parseEther,
	type Chain,
	type HttpTransport,
	type PublicClient,
} from 'viem'
import { AppModule } from '../../src/app.module'
import { AppConfigModule } from '../../src/configuration/app-config.module'
import { EIP155 } from '../../src/constants'
import { Executor } from '../../src/domain/entities/executor'
import { evmAddressFromWallet } from '../../src/domain/services/evm'
import { toPrivateKey } from '../../src/domain/value-objects/private-key'
import { EVM_CLIENT_CONFIG } from '../../src/infrastructure/evm/evm-client/types'
import { WARMUP_CURRENCY_IDS } from '../../src/infrastructure/price-provider/price-provider-warmup.service'
import { ProvisionService } from '../../src/infrastructure/provision/provision.service'
import { SetupEligibilityPolicyService } from '../../src/infrastructure/provision/setup-eligibility-policy.service'
import {
	RIPS_CONDUIT_CONTRACT,
	RIPS_CONTRACT,
} from '../../src/infrastructure/rips/rips.constants'
import { SeedModule } from '../../src/infrastructure/seed/seed.module'
import { UseCaseExceptionFilter } from '../../src/presentation/filters/use-case-exception.filter'
import { provisionTestEnv } from './env'
import { provisionKekFile } from './kek'
import { usePostgres } from './postgres'
import { TestConfigModule } from './test-config.module'

@Module({})
class NoopScheduleModule {}

/**
 * Stands in for the real terms PDF an operator supplies at setup. Its only job
 * is to be non-empty, so tests that upload a replacement can tell the two apart.
 */
export const TEST_TERMS_DOCUMENT = new Uint8Array([0x25, 0x50, 0x44, 0x46])

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

		provisionKekFile()
		provisionTestEnv()

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
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
			.overrideProvider(RIPS_CONTRACT)
			.useValue({
				chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
				address: deployments.rips,
			})
			.overrideProvider(RIPS_CONDUIT_CONTRACT)
			.useValue({
				chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
				address: deployments.conduit,
			})
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
			toPrivateKey(ANVIL_ACCOUNT_0_PRIVATE_KEY),
		)

		const executors = await provisionService.ensureExecutors(EXECUTOR_COUNT)

		await setupExecutors(executors, result.publicClient, provisionService)

		await result.app
			.get(SetupEligibilityPolicyService)
			.setup(TEST_TERMS_DOCUMENT)

		await ensureIndexerSync(indexer, anvil)
	})

	afterAll(async () => {
		await result.app?.close()
	})

	return result
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
