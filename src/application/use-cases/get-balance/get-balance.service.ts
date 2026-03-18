import { Inject, Injectable } from '@nestjs/common'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { CurrencyService } from 'src/infrastructure/evm/currency.service'
import { MAIN_CHAIN_ID } from 'src/modules/wallets/wallets.constants'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly currencyService: CurrencyService,
		@Inject(MAIN_CHAIN_ID) private readonly chainId: number,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({ telegramId: input.telegramId })

		const token = this.currencyService.getNative(this.chainId)
		const amount = await token.balanceOf(user.evmAddress)

		return { token, amount }
	}
}
