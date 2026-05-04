import { Module } from '@nestjs/common'
import { MetricsModule } from '../../metrics/metrics.module'
import { evmClientConfigProvider } from './evm-client-config.provider'
import { EvmClientService } from './evm-client.service'

@Module({
	imports: [MetricsModule],
	providers: [evmClientConfigProvider, EvmClientService],
	exports: [EvmClientService],
})
export class EvmClientModule {}
