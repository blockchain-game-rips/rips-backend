import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { PriceProvider } from '../../application/interfaces/price-service'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { EvmCurrencyService } from '../evm/evm-currency.service'

export const WARMUP_CURRENCY_IDS = Symbol('WARMUP_CURRENCY_IDS')

@Injectable()
export class PriceProviderWarmupService implements OnModuleInit {
	constructor(
		@Inject(WARMUP_CURRENCY_IDS) private readonly currencyIds: CurrencyId[],
		private readonly currencyService: EvmCurrencyService,
		private readonly priceProvider: PriceProvider,
	) {}

	async onModuleInit() {
		const currencies = await Promise.all(
			this.currencyIds.map((id) => this.currencyService.fromId(id)),
		)

		await this.priceProvider.getPrices(currencies)
	}
}
