import { Module } from '@nestjs/common'
import { WalletReadService } from '../../application/interfaces/wallet-read.service'
import { WalletWriteService } from '../../application/interfaces/wallet-write.service'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { WalletReadServiceImpl } from './wallet-read.service'
import { WalletWriteServiceImpl } from './wallet-write.service'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [
		{ provide: WalletReadService, useClass: WalletReadServiceImpl },
		{ provide: WalletWriteService, useClass: WalletWriteServiceImpl },
	],
	exports: [WalletReadService, WalletWriteService],
})
export class WalletModule {}
