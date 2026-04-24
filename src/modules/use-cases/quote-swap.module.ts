import { Module } from '@nestjs/common'
import { QuoteSwapService } from '../../application/use-cases/quote-swap/quote-swap.service'
import { QuoteSwapUseCase } from '../../application/use-cases/quote-swap/quote-swap.use-case'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, DeBridgeModule],
	providers: [{ provide: QuoteSwapUseCase, useClass: QuoteSwapService }],
	exports: [QuoteSwapUseCase],
})
export class QuoteSwapModule {}
