import { Module } from '@nestjs/common'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { DeBridgeApiService } from './de-bridge-api.service'
import { DeBridgeService } from './de-bridge.service'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [DeBridgeService, DeBridgeApiService],
	exports: [DeBridgeService],
})
export class DeBridgeModule {}
