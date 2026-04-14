import { Module } from '@nestjs/common'
import { WalletService } from '../../application/interfaces/wallet.service'
import { EvmModule } from '../evm/evm.module'
import { RipsInfraModule } from '../rips/rips.module'
import { WalletServiceImpl } from './wallet.service'

@Module({
	imports: [EvmModule, RipsInfraModule],
	providers: [{ provide: WalletService, useClass: WalletServiceImpl }],
	exports: [WalletService],
})
export class WalletModule {}
