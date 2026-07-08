import { Module } from '@nestjs/common'
import { QuoteSwapSamechainService } from '../../application/use-cases/quote-swap-samechain/quote-swap-samechain.service'
import { QuoteSwapSamechainUseCase } from '../../application/use-cases/quote-swap-samechain/quote-swap-samechain.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, ZapModule],
	providers: [
		{
			provide: QuoteSwapSamechainUseCase,
			useClass: QuoteSwapSamechainService,
		},
	],
	exports: [QuoteSwapSamechainUseCase],
})
export class QuoteSwapSamechainModule {}
