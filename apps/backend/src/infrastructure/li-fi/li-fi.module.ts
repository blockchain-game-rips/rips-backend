import { Module } from '@nestjs/common'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { LiFiApiService } from './li-fi-api.service'
import { LIFI_API_KEY } from './li-fi.constants'
import { LiFiService } from './li-fi.service'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [
		{
			provide: LIFI_API_KEY,
			useFactory: () => process.env.LIFI_API_KEY ?? null,
		},
		LiFiService,
		LiFiApiService,
	],
	exports: [LiFiService],
})
export class LiFiModule {}
