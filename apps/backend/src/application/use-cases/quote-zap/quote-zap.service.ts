import { Injectable } from '@nestjs/common'
import { AvailablePresetNotFoundError } from '../../../domain/errors/preset-not-found.error'
import { ZapQuoteEnterResult } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { QuoteZapInput, QuoteZapUseCase } from './quote-zap.use-case'

@Injectable()
export class QuoteZapService extends QuoteZapUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: QuoteZapInput): Promise<ZapQuoteEnterResult> {
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

		const availablePreset = availablePresets.find(
			(s) => s.preset.id === presetId,
		)

		if (!availablePreset) {
			throw new AvailablePresetNotFoundError(
				`Preset with id ${presetId} not found in available presets`,
			)
		}

		const config =
			availablePreset.fillingRip !== null
				? availablePreset.fillingRip.config
				: availablePreset.preset.currentConfig

		return this.zapService.quoteEnter(user.wallet, {
			presetId: availablePreset.preset.id,
			config,
			paymentCurrency,
			entryCount,
		})
	}
}
