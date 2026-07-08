import { Module } from '@nestjs/common'
import { QuoteZapSamechainService } from '../../application/use-cases/quote-zap-samechain/quote-zap-samechain.service'
import { QuoteZapSamechainUseCase } from '../../application/use-cases/quote-zap-samechain/quote-zap-samechain.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailablePresetsModule,
		WalletModule,
		CurrencyModule,
		ZapModule,
	],
	providers: [
		{
			provide: QuoteZapSamechainUseCase,
			useClass: QuoteZapSamechainService,
		},
	],
	exports: [QuoteZapSamechainUseCase],
})
export class QuoteZapSamechainModule {}
