import { Module } from '@nestjs/common'
import { WalletService } from '../../application/interfaces/wallet.service'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { WalletServiceImpl } from './wallet.service'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [{ provide: WalletService, useClass: WalletServiceImpl }],
	exports: [WalletService],
})
export class WalletModule {}
