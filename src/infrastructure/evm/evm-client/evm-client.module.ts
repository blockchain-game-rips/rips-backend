import { Module } from '@nestjs/common'
import { evmClientConfigProvider } from './evm-client-config.provider'
import { EvmClientService } from './evm-client.service'

@Module({
	providers: [evmClientConfigProvider, EvmClientService],
	exports: [EvmClientService],
})
export class EvmClientModule {}
