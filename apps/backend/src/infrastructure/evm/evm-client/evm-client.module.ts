import { Module } from '@nestjs/common'
import { MetricsModule } from '../../metrics/metrics.module'
import { AlchemyBalanceService } from './alchemy/alchemy-balance.service'
import { readAlchemyApiKey } from './alchemy/alchemy-utils'
import { evmClientConfigProvider } from './evm-client-config.provider'
import { EvmClientService } from './evm-client.service'
import { ALCHEMY_API_KEY } from './types'

const alchemyApiKeyProvider = {
	provide: ALCHEMY_API_KEY,
	useFactory: readAlchemyApiKey,
}

@Module({
	imports: [MetricsModule],
	providers: [
		alchemyApiKeyProvider,
		evmClientConfigProvider,
		EvmClientService,
		AlchemyBalanceService,
	],
	exports: [EvmClientService, AlchemyBalanceService],
})
export class EvmClientModule {}
