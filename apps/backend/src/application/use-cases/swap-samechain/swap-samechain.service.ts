import { Injectable, Logger } from '@nestjs/common'
import { resolveChainAddress } from '../../../domain/services/wallet-utils'
import { SamechainSwapResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	SwapSamechainInput,
	SwapSamechainUseCase,
} from './swap-samechain.use-case'

@Injectable()
export class SwapSamechainService extends SwapSamechainUseCase {
	private readonly logger = new Logger(SwapSamechainService.name)

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
	}: SwapSamechainInput): Promise<SamechainSwapResult> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = resolveChainAddress(user.wallet, currencyOut)

		const result = await this.zapService.swapSamechain(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				txHash: result.transaction.id,
				chain: currencyIn.chainAddress.chain.reference,
				fromAmount: amountIn.toString(),
				fromToken: currencyIn.chainAddress.address,
				toToken: currencyOut.chainAddress.address,
			},
			'Swap samechain initiated',
		)

		return result
	}
}
