import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common'
import { ZodResponse, ZodValidationPipe } from 'nestjs-zod'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import { CreateWithdrawalBodyDto } from './create-withdrawal/create-withdrawal.request'
import {
	CreateWithdrawalResponseDto,
	toCreateWithdrawalResponseDto,
} from './create-withdrawal/create-withdrawal.response'
import { GetBalancesQueryDto } from './get-balances/get-balances.request'
import {
	GetBalancesResponseDto,
	toGetBalancesResponseDto,
} from './get-balances/get-balances.response'

@Controller('wallets')
export class WalletsController {
	constructor(
		private readonly getBalanceUseCase: GetBalanceUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
		private readonly withdrawUseCase: WithdrawUseCase,
	) {}

	@Get('balances')
	@ZodResponse({ type: GetBalancesResponseDto })
	async getBalances(
		@Headers() headers: TelegramIdHeaderDto,
		//for some reason it doesn't work without implicit pipe
		@Query(new ZodValidationPipe(GetBalancesQueryDto))
		query: GetBalancesQueryDto,
	): Promise<GetBalancesResponseDto> {
		const telegramId = headers[TELEGRAM_ID_HEADER]

		const currencyAmounts = await Promise.all(
			query.chainAddress.map((chainAddress) =>
				this.getBalanceUseCase.execute({
					telegramId,
					currencyChainAddress: chainAddress,
				}),
			),
		)

		const prices = await this.getPriceUseCase.executeMany({
			currencies: currencyAmounts.map((ca) => ca.currency),
		})

		return toGetBalancesResponseDto(
			currencyAmounts.map((currencyAmount) => ({
				currencyAmount,
				priceUsd: prices.get(currencyAmount.currency.id) ?? 0,
			})),
		)
	}

	@Post('withdrawals')
	@ZodResponse({ type: CreateWithdrawalResponseDto })
	async createWithdrawal(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: CreateWithdrawalBodyDto,
	): Promise<CreateWithdrawalResponseDto> {
		const telegramId = headers[TELEGRAM_ID_HEADER]

		const tx = await this.withdrawUseCase.execute({
			telegramId,
			amount: body.amount,
			currencyChainAddress: body.currencyChainAddress,
			recipientChainAddress: {
				chain: body.currencyChainAddress.chain,
				address: body.recipientAddress,
			},
		})

		return toCreateWithdrawalResponseDto(tx)
	}
}
