import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { PendingZap } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { SwapInput, SwapUseCase } from './swap.use-case'

@Injectable()
export class SwapService extends SwapUseCase {
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
	}: SwapInput): Promise<PendingZap> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = {
			chain: currencyOut.chainAddress.chain,
			address: user.wallet.namespaceToAddress[EIP155],
		}

		return this.zapService.swap(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})
	}
}
