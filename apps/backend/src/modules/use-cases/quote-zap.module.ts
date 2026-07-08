import { Module } from '@nestjs/common'
import { QuoteZapService } from '../../application/use-cases/quote-zap/quote-zap.service'
import { QuoteZapUseCase } from '../../application/use-cases/quote-zap/quote-zap.use-case'
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
	providers: [{ provide: QuoteZapUseCase, useClass: QuoteZapService }],
	exports: [QuoteZapUseCase],
})
export class QuoteZapModule {}
