import { Module } from '@nestjs/common'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { RipsInfraModule } from 'src/infrastructure/rips/rips.module'
import { WalletServiceImpl } from './wallet.service'

@Module({
	imports: [EvmModule, RipsInfraModule],
	providers: [{ provide: WalletService, useClass: WalletServiceImpl }],
	exports: [WalletService],
})
export class WalletModule {}
