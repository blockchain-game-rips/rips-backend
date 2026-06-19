import { Injectable } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailablePresetNotFoundError } from '../../../domain/errors/preset-not-found.error'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import { CurrencyService } from '../../interfaces/currency.service'
import { RipsService } from '../../interfaces/rips.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import {
	QuotePurchaseInput,
	QuotePurchaseUseCase,
} from './quote-purchase.use-case'

@Injectable()
export class QuotePurchaseService extends QuotePurchaseUseCase {
	constructor(
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly currencyService: CurrencyService,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(input: QuotePurchaseInput): Promise<TransactionQuote> {
		const { presetId, paymentCurrencyChainAddress } = input

		const [availablePresets, paymentCurrency] = await Promise.all([
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

		if (config.entryPrice.currency.id !== paymentCurrency.id) {
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} does not match entry price currency ${config.entryPrice.currency.id}`,
			)
		}

		return await this.ripsService.quoteBuyEntries()
	}
}
