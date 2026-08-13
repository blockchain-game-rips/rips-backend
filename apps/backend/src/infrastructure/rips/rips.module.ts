import { Module } from '@nestjs/common'
import { RipsAdminService } from '../../application/interfaces/rips-admin.service'
import { RipsReadService } from '../../application/interfaces/rips-read.service'
import { RipsService } from '../../application/interfaces/rips.service'
import { EIP155 } from '../../constants'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toEvmAddress } from '../../domain/value-objects/evm-address'
import { getEnvSafe } from '../../utils/common'
import { EvmModule } from '../evm/evm.module'
import { RipsAdminServiceImpl } from './rips-admin.service'
import { RipsReadServiceImpl } from './rips-read.service'
import { RIPS_CONDUIT_CONTRACT, RIPS_CONTRACT } from './rips.constants'
import { RipsServiceIpml } from './rips.service'

function contractOnRipsChain(addressEnvVar: string): ChainAddress {
	return {
		chain: {
			namespace: EIP155,
			reference: getEnvSafe('RIPS_CHAIN_ID'),
		},
		address: toEvmAddress(getEnvSafe(addressEnvVar)),
	}
}

@Module({
	imports: [EvmModule],
	providers: [
		{
			provide: RIPS_CONTRACT,
			useFactory: () => contractOnRipsChain('RIPS_CONTRACT_ADDRESS'),
		},
		{
			provide: RIPS_CONDUIT_CONTRACT,
			useFactory: () =>
				contractOnRipsChain('RIPS_CONDUIT_CONTRACT_ADDRESS'),
		},
		{ provide: RipsService, useClass: RipsServiceIpml },
		{ provide: RipsReadService, useClass: RipsReadServiceImpl },
		{ provide: RipsAdminService, useClass: RipsAdminServiceImpl },
	],
	exports: [
		RipsService,
		RipsReadService,
		RipsAdminService,
		RIPS_CONTRACT,
		RIPS_CONDUIT_CONTRACT,
	],
})
export class RipsModule {}
