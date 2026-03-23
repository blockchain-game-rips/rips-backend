import { INestApplication } from '@nestjs/common'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import path from 'path'
import { AppModule } from 'src/app.module'
import { KmsService } from 'src/application/interfaces/kms.service'
import { EVM_CLIENT_CONFIG } from 'src/infrastructure/evm/evm-client/types'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'
import { MnemonicKmsService } from 'src/infrastructure/kms/mnemonic-kms.service'
import {
	KEEPER_PK,
	RIPS_SC_ADDRESS,
} from 'src/infrastructure/rips/rips.constants'
import { UseCaseExceptionFilter } from 'src/presentation/filters/use-case-exception.filter'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { Anvil, useAnvil } from './anvil'
import deployments from './deployments.json'
import { MockIndexerModule } from './mock-indexer.module'
import { usePostgres } from './postgres'

const KMS_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const KEEPER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const ANVIL_STATE_PATH = path.resolve(__dirname, 'anvil-state.json')

const chain = base

type PublicClient = ReturnType<
	typeof createPublicClient<ReturnType<typeof http>, typeof chain>
>

export type RipsApp = {
	app: INestApplication
	publicClient: PublicClient
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
			.overrideProvider(KmsService)
			.useClass(MnemonicKmsService)
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
			.overrideModule(IndexerModule)
			.useModule(MockIndexerModule)
			.overrideProvider(RIPS_SC_ADDRESS)
			.useValue(deployments.rips)
			.overrideProvider(KEEPER_PK)
			.useValue(KEEPER_PRIVATE_KEY)

		if (applyOverrides) {
			builder = applyOverrides(builder)
		}

		const moduleRef = await builder.compile()

		result.app = moduleRef.createNestApplication()
		result.app.useGlobalFilters(new UseCaseExceptionFilter())
		await result.app.init()
	})

	afterAll(async () => {
		await result.app?.close()
	})

	return result
}
