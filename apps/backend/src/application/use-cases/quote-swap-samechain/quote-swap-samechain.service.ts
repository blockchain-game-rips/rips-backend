import { Injectable } from '@nestjs/common'
import { resolveChainAddress } from '../../../domain/services/wallet-utils'
import { SamechainSwapQuoteResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	QuoteSwapSamechainInput,
	QuoteSwapSamechainUseCase,
} from './quote-swap-samechain.use-case'

@Injectable()
export class QuoteSwapSamechainService extends QuoteSwapSamechainUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly zapService: ZapService,
	) {
		super()
	}

	async execute({
		telegramId,
		currencyIn,
		currencyOut,
		amountIn,
	}: QuoteSwapSamechainInput): Promise<SamechainSwapQuoteResult> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = resolveChainAddress(user.wallet, currencyOut)

		return this.zapService.quoteSwapSamechain(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})
	}
}
