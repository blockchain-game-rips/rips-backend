import { Injectable, Logger } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailablePresetNotFoundError } from '../../../domain/errors/preset-not-found.error'
import { PendingZap } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyEntriesZapInput,
	BuyEntriesZapUseCase,
} from './buy-entries-zap.use-case'

@Injectable()
export class BuyEntriesZapService extends BuyEntriesZapUseCase {
	private readonly logger = new Logger(BuyEntriesZapService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: BuyEntriesZapInput): Promise<PendingZap> {
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

		if (config.entryPrice.currency.id === paymentCurrency.id) {
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} matches entry price currency — use direct purchase instead of zap`,
			)
		}

		const entryCurrency = config.entryPrice.currency

		const pendingZap = await this.zapService.enterCrosschain(user.wallet, {
			paymentCurrency,
			presetId: availablePreset.preset.id,
			config,
			entryCount,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				txHash: pendingZap.srcTransaction.id,
				fromChain: paymentCurrency.chainAddress.chain.reference,
				toChain: entryCurrency.chainAddress.chain.reference,
				fromAmount: pendingZap.amountIn.amount.toString(),
				fromToken: paymentCurrency.chainAddress.address,
				toToken: entryCurrency.chainAddress.address,
			},
			'Buy entries zap initiated',
		)

		return pendingZap
	}
}
