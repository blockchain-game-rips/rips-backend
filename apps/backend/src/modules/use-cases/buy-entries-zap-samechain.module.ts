import { Module } from '@nestjs/common'
import { BuyEntriesZapSamechainService } from '../../application/use-cases/buy-entries-zap-samechain/buy-entries-zap-samechain.service'
import { BuyEntriesZapSamechainUseCase } from '../../application/use-cases/buy-entries-zap-samechain/buy-entries-zap-samechain.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailablePresetsModule,
		CurrencyModule,
		ZapModule,
	],
	providers: [
		{
			provide: BuyEntriesZapSamechainUseCase,
			useClass: BuyEntriesZapSamechainService,
		},
	],
	exports: [BuyEntriesZapSamechainUseCase],
})
export class BuyEntriesZapSamechainModule {}
