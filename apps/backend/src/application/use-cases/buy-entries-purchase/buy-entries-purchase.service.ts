import { Injectable, Logger } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import {
	findAvailablePreset,
	resolveConfig,
} from '../../../domain/services/preset-utils'
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

		const availablePreset = findAvailablePreset(availablePresets, presetId)

		const config = resolveConfig(availablePreset)

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
