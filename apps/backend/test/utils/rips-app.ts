import { INestApplication, Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ANVIL_MNEMONIC,
	ANVIL_STATE_PATH,
	Anvil,
	deployments,
	setNativeBalance,
	useAnvil,
} from '@rips/test-harness'
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import {
	createPublicClient,
	createWalletClient,
	defineChain,
	http,
	parseEther,
	type Address,
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
import { EVM_CLIENT_CONFIG } from '../../src/infrastructure/evm/evm-client/types'
import { evmAddressFromWallet } from '../../src/infrastructure/evm/helpers'
import { IndexerModule } from '../../src/infrastructure/indexer/indexer.module'
import { MnemonicKmsService } from '../../src/infrastructure/kms/mnemonic-kms.service'
import { WARMUP_CURRENCY_IDS } from '../../src/infrastructure/price-provider/price-provider-warmup.service'
import { ProvisionService } from '../../src/infrastructure/provision/provision.service'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { RIPS_CONTRACT } from '../../src/infrastructure/rips/rips.constants'
import { UseCaseExceptionFilter } from '../../src/presentation/filters/use-case-exception.filter'
import { MockIndexerModule } from '../mocks/mock-indexer.module'
import { usePostgres } from './postgres'
import { TestConfigModule } from './test-config.module'

@Module({})
class NoopScheduleModule {}

const KMS_MNEMONIC = ANVIL_MNEMONIC
const DEPLOYER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

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

	beforeAll(async () => {
		result.anvil = anvil

		const rpcUrl = `http://127.0.0.1:${anvil.port}`

		result.publicClient = createPublicClient({
			chain,
			transport: http(rpcUrl),
		})

		process.env.KMS_MNEMONIC = KMS_MNEMONIC

		const testEvmClientConfig = {
			rpcSettings: {
				[chain.id]: {
					rpcUrls: [rpcUrl],
					disableDefaultRpcUrl: true,
				},
			},
		}

		let builder = Test.createTestingModule({ imports: [AppModule] })
			.overrideModule(AppConfigModule)
			.useModule(TestConfigModule)
			.overrideModule(ScheduleModule)
			.useModule(NoopScheduleModule)
			.overrideProvider(KmsService)
			.useClass(MnemonicKmsService)
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
			.overrideModule(IndexerModule)
			.useModule(MockIndexerModule)
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
		const executors = await provisionService.ensureExecutors(EXECUTOR_COUNT)

		await setupExecutors(executors, result.publicClient, rpcUrl)
	})

	afterAll(async () => {
		await result.app?.close()
	})

	return result
}

async function setupExecutors(
	executors: Executor[],
	publicClient: PublicClient<HttpTransport, Chain>,
	rpcUrl: string,
): Promise<void> {
	const deployerAccount = privateKeyToAccount(DEPLOYER_PRIVATE_KEY)

	const walletClient = createWalletClient({
		account: deployerAccount,
		chain,
		transport: http(rpcUrl),
	})

	const operatorRole = await publicClient.readContract({
		address: deployments.rips as Address,
		abi: ripsAbi,
		functionName: 'OPERATOR_ROLE',
	})

	for (const executor of executors) {
		const address = evmAddressFromWallet(executor.wallet)

		await setNativeBalance(publicClient, address, EXECUTOR_BALANCE)

		await walletClient.writeContract({
			address: deployments.rips as Address,
			abi: ripsAbi,
			functionName: 'grantRole',
			args: [operatorRole, address],
		})
	}
}
