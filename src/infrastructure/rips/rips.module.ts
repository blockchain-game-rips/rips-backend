import { Module } from '@nestjs/common'
import { RipsReadService } from '../../application/interfaces/rips-read.service'
import { RipsService } from '../../application/interfaces/rips.service'
import { EIP155 } from '../../constants'
import { toEvmAddress } from '../../domain/value-objects/evm-address'
import { getEnvSafe } from '../../utils/common'
import { EvmModule } from '../evm/evm.module'
import { RipsReadServiceImpl } from './rips-read.service'
import { RIPS_CONTRACT } from './rips.constants'
import { RipsServiceIpml } from './rips.service'

@Module({
	imports: [EvmModule],
	providers: [
		{
			provide: RIPS_CONTRACT,
			useFactory: () => ({
				chain: {
					namespace: EIP155,
					reference: getEnvSafe('RIPS_CHAIN_ID'),
				},
				address: toEvmAddress(getEnvSafe('RIPS_CONTRACT_ADDRESS')),
			}),
		},
		{ provide: RipsService, useClass: RipsServiceIpml },
		{ provide: RipsReadService, useClass: RipsReadServiceImpl },
	],
	exports: [RipsService, RipsReadService, RIPS_CONTRACT],
})
export class RipsModule {}
