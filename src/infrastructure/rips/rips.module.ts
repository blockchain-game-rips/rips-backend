import { Module } from '@nestjs/common'
import { RipsService } from '../../application/interfaces/rips.service'
import { MainCurrencyModule } from '../../modules/main-currency/main-currency.module'
import { getEnvSafe } from '../../utils/common'
import { EvmModule } from '../evm/evm.module'
import { RIPS_SC_ADDRESS } from './rips.constants'
import { RipsServiceIpml } from './rips.service'

@Module({
	imports: [EvmModule, MainCurrencyModule],
	providers: [
		{
			provide: RIPS_SC_ADDRESS,
			useFactory: () => getEnvSafe('RIPS_CONTRACT_ADDRESS'),
		},
		{
			provide: RipsService,
			useClass: RipsServiceIpml,
		},
	],
	exports: [RipsService],
})
export class RipsInfraModule {}
