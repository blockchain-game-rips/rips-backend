import { Module } from '@nestjs/common'
import { MetricsModule } from '../../metrics/metrics.module'
import { AlchemyBalanceService } from './alchemy/alchemy-balance.service'
import { evmClientConfigProvider } from './evm-client-config.provider'
import { EvmClientService } from './evm-client.service'

@Module({
	imports: [MetricsModule],
	providers: [
		evmClientConfigProvider,
		EvmClientService,
		AlchemyBalanceService,
	],
	exports: [EvmClientService, AlchemyBalanceService],
})
export class EvmClientModule {}
