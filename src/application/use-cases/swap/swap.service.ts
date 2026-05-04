import { Injectable, Logger } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { PendingZap } from '../../../domain/value-objects/zap'
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
	}: SwapInput): Promise<PendingZap> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = {
			chain: currencyOut.chainAddress.chain,
			address: user.wallet.namespaceToAddress[EIP155],
		}

		const pendingZap = await this.zapService.swap(user.wallet, {
			currencyIn,
			currencyOut,
			amountIn,
			recipient,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				txHash: pendingZap.srcTransaction.id,
				fromChain: currencyIn.chainAddress.chain.reference,
				toChain: currencyOut.chainAddress.chain.reference,
				fromAmount: amountIn.toString(),
				fromToken: currencyIn.chainAddress.address,
				toToken: currencyOut.chainAddress.address,
			},
			'Swap initiated',
		)

		return pendingZap
	}
}
