import { Injectable } from '@nestjs/common'
import { resolveChainAddress } from '../../../domain/services/wallet-utils'
import { ZapQuoteSwapResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { QuoteSwapInput, QuoteSwapUseCase } from './quote-swap.use-case'

@Injectable()
export class QuoteSwapService extends QuoteSwapUseCase {
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
	}: QuoteSwapInput): Promise<ZapQuoteSwapResult> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = resolveChainAddress(user.wallet, currencyOut)

		return this.zapService.quoteSwapCrosschain(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})
	}
}
