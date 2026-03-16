import { Module } from '@nestjs/common'
import { EvmClientConfigService } from './evm-client-config.service'
import { EvmClientService } from './evm-client.service'

@Module({
	providers: [EvmClientConfigService, EvmClientService],
	exports: [EvmClientService],
})
export class EvmClientModule {}
