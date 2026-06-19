import { Module } from '@nestjs/common'
import { BuyEntriesZapService } from '../../application/use-cases/buy-entries-zap/buy-entries-zap.service'
import { BuyEntriesZapUseCase } from '../../application/use-cases/buy-entries-zap/buy-entries-zap.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailablePresetsModule,
		CurrencyModule,
		DeBridgeModule,
	],
	providers: [
		{ provide: BuyEntriesZapUseCase, useClass: BuyEntriesZapService },
	],
	exports: [BuyEntriesZapUseCase],
})
export class BuyEntriesZapModule {}
