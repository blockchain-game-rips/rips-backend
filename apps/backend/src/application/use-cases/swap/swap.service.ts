import { Injectable, Logger } from '@nestjs/common'
import { resolveChainAddress } from '../../../domain/services/wallet-utils'
import { attemptTransactionId } from '../../../domain/value-objects/transaction-attempt'
import { CrosschainSwapStartResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { SwapInput, SwapUseCase } from './swap.use-case'

@Injectable()
export class SwapService extends SwapUseCase {
	private readonly logger = new Logger(SwapService.name)

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
	}: SwapInput): Promise<CrosschainSwapStartResult> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = resolveChainAddress(user.wallet, currencyOut)

		const result = await this.zapService.swapCrosschain(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				zapStatus: result.zap.status,
				txHash: attemptTransactionId(result.zap),
				fromChain: currencyIn.chainAddress.chain.reference,
				toChain: currencyOut.chainAddress.chain.reference,
				fromAmount: amountIn.toString(),
				fromToken: currencyIn.chainAddress.address,
				toToken: currencyOut.chainAddress.address,
			},
			'Swap initiated',
		)

		return result
	}
}
