import { Injectable, Logger } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailablePresetNotFoundError } from '../../../domain/errors/preset-not-found.error'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { CurrencyService } from '../../interfaces/currency.service'
import { RipsService } from '../../interfaces/rips.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyEntriesPurchaseInput,
	BuyEntriesPurchaseUseCase,
} from './buy-entries-purchase.use-case'

@Injectable()
export class BuyEntriesPurchaseService extends BuyEntriesPurchaseUseCase {
	private readonly logger = new Logger(BuyEntriesPurchaseService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly ripsService: RipsService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: BuyEntriesPurchaseInput): Promise<PurchaseReceipt> {
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

		if (config.entryPrice.currency.id !== paymentCurrency.id) {
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} does not match entry price currency ${config.entryPrice.currency.id}`,
			)
		}

		const receipt = await this.ripsService.buyEntries(user.wallet, {
			presetId: availablePreset.preset.id,
			config,
			entryCount,
		})

		const totalCost = config.entryPrice.amount * BigInt(entryCount)

		this.logger.log(
			{
				userId: user.id.toString(),
				presetId: availablePreset.preset.id,
				entryCount,
				totalCost: totalCost.toString(),
				currency: paymentCurrency.chainAddress.address,
			},
			'Entry purchased',
		)

		return receipt
	}
}
