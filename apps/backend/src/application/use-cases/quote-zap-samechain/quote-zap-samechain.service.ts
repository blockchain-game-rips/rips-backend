import { Injectable } from '@nestjs/common'
import {
	findAvailablePreset,
	resolveConfig,
} from '../../../domain/services/preset-utils'
import { SamechainEnterQuoteResult } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	QuoteZapSamechainInput,
	QuoteZapSamechainUseCase,
} from './quote-zap-samechain.use-case'

@Injectable()
export class QuoteZapSamechainService extends QuoteZapSamechainUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(
		input: QuoteZapSamechainInput,
	): Promise<SamechainEnterQuoteResult> {
		const {
			telegramId,
			presetId,
			entryCount,
			paymentCurrencyChainAddress,
		} = input

		const [user, availablePresets, paymentCurrency] = await Promise.all([
			this.getUserUseCase.execute({ telegramId }),
			this.getAvailablePresetsUseCase.execute(),
			this.currencyService.fromAccount(paymentCurrencyChainAddress),
		])

		const availablePreset = findAvailablePreset(availablePresets, presetId)

		const config = resolveConfig(availablePreset)

		return this.zapService.quoteEnterSamechain(user.wallet, {
			presetId: availablePreset.preset.id,
			config,
			paymentCurrency,
			entryCount,
		})
	}
}
