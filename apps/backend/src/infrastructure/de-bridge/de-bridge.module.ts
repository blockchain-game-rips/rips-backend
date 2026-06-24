import { Module } from '@nestjs/common'
import { ZapService } from '../../application/interfaces/zap.service'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { DeBridgeApiService } from './de-bridge-api.service'
import { DeBridgeService } from './de-bridge.service'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [
		{
			provide: ZapService,
			useClass: DeBridgeService,
		},
		DeBridgeApiService,
	],
	exports: [ZapService],
})
export class DeBridgeModule {}
