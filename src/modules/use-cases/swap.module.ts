import { Module } from '@nestjs/common'
import { SwapService } from '../../application/use-cases/swap/swap.service'
import { SwapUseCase } from '../../application/use-cases/swap/swap.use-case'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, DeBridgeModule],
	providers: [{ provide: SwapUseCase, useClass: SwapService }],
	exports: [SwapUseCase],
})
export class SwapModule {}
