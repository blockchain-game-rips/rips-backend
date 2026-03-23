import { Module } from '@nestjs/common'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { SignModule } from 'src/infrastructure/sign/sign.module'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { getEnvSafe } from 'src/utils/common'
import { RipsKeeperService } from './rips-keeper.service'
import { RipsWriteService } from './rips-write.service'
import { KEEPER_PK, RIPS_SC_ADDRESS } from './rips.constants'

@Module({
	imports: [EvmModule, SignModule, MainCurrencyModule],
	providers: [
		{
			provide: RIPS_SC_ADDRESS,
			useFactory: () => getEnvSafe('RIPS_CONTRACT_ADDRESS'),
		},
		{
			provide: KEEPER_PK,
			useFactory: () => getEnvSafe('KEEPER_PK'),
		},
		RipsWriteService,
		RipsKeeperService,
	],
	exports: [RipsWriteService, RipsKeeperService],
})
export class RipsInfraModule {}
