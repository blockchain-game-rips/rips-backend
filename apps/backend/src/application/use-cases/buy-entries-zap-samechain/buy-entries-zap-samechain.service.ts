import { Injectable, Logger } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import {
	findAvailablePreset,
	resolveConfig,
} from '../../../domain/services/preset-utils'
import { SamechainEnterResult } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyEntriesZapSamechainInput,
	BuyEntriesZapSamechainUseCase,
} from './buy-entries-zap-samechain.use-case'

@Injectable()
export class BuyEntriesZapSamechainService extends BuyEntriesZapSamechainUseCase {
	private readonly logger = new Logger(BuyEntriesZapSamechainService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(
		input: BuyEntriesZapSamechainInput,
	): Promise<SamechainEnterResult> {
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

		if (config.entryPrice.currency.id === paymentCurrency.id) {
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} matches entry price currency — use direct purchase instead of zap`,
			)
		}

		const entryCurrency = config.entryPrice.currency

		const result = await this.zapService.enterSamechain(user.wallet, {
			paymentCurrency,
			presetId: availablePreset.preset.id,
			config,
			entryCount,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				txHash: result.transaction.id,
				chain: paymentCurrency.chainAddress.chain.reference,
				fromToken: paymentCurrency.chainAddress.address,
				toToken: entryCurrency.chainAddress.address,
			},
			'Buy entries zap samechain initiated',
		)

		return result
	}
}
