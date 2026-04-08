import { Module } from '@nestjs/common'
import { RipsService } from 'src/application/interfaces/rips.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { getEnvSafe } from 'src/utils/common'
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
