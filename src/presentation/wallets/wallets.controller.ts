import { Body, Controller, Param, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import {
	GetBalanceBodyDto,
	TelegramIdParamsDto,
	WithdrawBodyDto,
} from '../validation'
import {
	BalanceResponseDto,
	toBalanceResponseDto,
} from './balance-response.dto'
import {
	WithdrawResponseDto,
	toWithdrawResponseDto,
} from './withdraw-response.dto'

@Controller()
export class WalletsController {
	constructor(
		private readonly getBalanceUseCase: GetBalanceUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
		private readonly withdrawUseCase: WithdrawUseCase,
	) {}

	@Post('balance')
	@ZodResponse({ type: BalanceResponseDto })
	async getBalance(
		@Param() params: TelegramIdParamsDto,
		@Body() body: GetBalanceBodyDto,
	): Promise<BalanceResponseDto> {
		const result = await this.getBalanceUseCase.execute({
			telegramId: params.telegramId,
			currencyChainAddress: body.currencyChainAddress,
		})

		const priceUsd = await this.getPriceUseCase.execute({
			currency: result.currency,
		})

		return toBalanceResponseDto(result, priceUsd)
	}

	@Post('balance/withdraw')
	@ZodResponse({ type: WithdrawResponseDto })
	async withdraw(
		@Param() params: TelegramIdParamsDto,
		@Body() body: WithdrawBodyDto,
	): Promise<WithdrawResponseDto> {
		const tx = await this.withdrawUseCase.execute({
			telegramId: params.telegramId,
			amount: body.amount,
			currencyChainAddress: body.currencyChainAddress,
			recipientChainAddress: {
				chain: body.currencyChainAddress.chain,
				address: body.recipientAddress,
			},
		})

		return toWithdrawResponseDto(tx)
	}
}
