import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
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

		const recipient = {
			chain: currencyOut.chainAddress.chain,
			address: user.wallet.namespaceToAddress[EIP155],
		}

		return this.zapService.quoteSwap(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})
	}
}
