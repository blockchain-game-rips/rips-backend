import { Module } from '@nestjs/common'
import { ZapService } from '../../application/interfaces/zap.service'
import { getEnvSafe } from '../../utils/common'
import { EvmModule } from '../evm/evm.module'
import { RIPS_SC_ADDRESS } from '../rips/rips.constants'
import { DeBridgeService } from './de-bridge.service'

@Module({
	imports: [EvmModule],
	providers: [
		{
			provide: RIPS_SC_ADDRESS,
			useFactory: () => getEnvSafe('RIPS_CONTRACT_ADDRESS'),
		},
		{
			provide: ZapService,
			useClass: DeBridgeService,
		},
		DeBridgeService,
	],
	//TODO: remove DeBridgeService export
	exports: [ZapService, DeBridgeService],
})
export class DeBridgeModule {}
