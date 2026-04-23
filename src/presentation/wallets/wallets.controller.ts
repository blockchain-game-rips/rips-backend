import {
	Body,
	Controller,
	Get,
	Headers,
	InternalServerErrorException,
	Post,
	Query,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import { CreateWithdrawalZapBodyDto } from './create-withdrawal-zap/create-withdrawal-zap.request'
import {
	CreateWithdrawalZapResponseDto,
	toCreateWithdrawalZapResponseDto,
} from './create-withdrawal-zap/create-withdrawal-zap.response'
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
		private readonly currencyService: CurrencyService,
	) {}

	@Get('balances')
	@ZodResponse({ type: GetBalancesResponseDto })
	async getBalances(
		@Headers() headers: TelegramIdHeaderDto,
		@Query()
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

		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(
				body.amountIn.currencyChainAddress,
			),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const outcome = await this.withdrawUseCase.execute({
			telegramId,
			amountIn: { currency: currencyIn, amount: body.amountIn.amount },
			currencyOut,
			recipientAddress: body.recipientAddress,
		})

		if (outcome.type !== 'transferred') {
			throw new InternalServerErrorException(
				'Expected transfer outcome but got zap',
			)
		}

		return toCreateWithdrawalResponseDto(outcome.transaction)
	}

	@Post('withdrawals/zap')
	@ZodResponse({ type: CreateWithdrawalZapResponseDto })
	async createWithdrawalZap(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: CreateWithdrawalZapBodyDto,
	): Promise<CreateWithdrawalZapResponseDto> {
		const telegramId = headers[TELEGRAM_ID_HEADER]

		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(
				body.amountIn.currencyChainAddress,
			),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const outcome = await this.withdrawUseCase.execute({
			telegramId,
			amountIn: { currency: currencyIn, amount: body.amountIn.amount },
			currencyOut,
			recipientAddress: body.recipientAddress,
		})

		if (outcome.type !== 'zap') {
			throw new InternalServerErrorException(
				'Expected zap outcome but got transfer',
			)
		}

		const { pendingZap } = outcome
		const prices = await this.getPriceUseCase.executeMany({
			currencies: [pendingZap.amountIn.currency, pendingZap.fee.currency],
		})

		return toCreateWithdrawalZapResponseDto(
			pendingZap,
			prices.get(pendingZap.amountIn.currency.id) ?? 0,
			prices.get(pendingZap.fee.currency.id) ?? 0,
		)
	}
}
