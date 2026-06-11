import {
	Body,
	Controller,
	Get,
	Headers,
	Post,
	Query,
	UseInterceptors,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { GetSwapResultUseCase } from '../../application/use-cases/get-swap-result/get-swap-result.use-case'
import { QuoteSwapUseCase } from '../../application/use-cases/quote-swap/quote-swap.use-case'
import { QuoteWithdrawUseCase } from '../../application/use-cases/quote-withdraw/quote-withdraw.use-case'
import { SwapUseCase } from '../../application/use-cases/swap/swap.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
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
import { GetSwapResultQueryDto } from './get-swap-result/get-swap-result.request'
import {
	cancelledSwapResultDto,
	GetSwapResultResponseDto,
	pendingSwapResultDto,
	toFailedSwapResultDto,
	toSuccessSwapResultDto,
} from './get-swap-result/get-swap-result.response'
import { QuoteSwapBodyDto } from './quote-swap/quote-swap.request'
import {
	QuoteSwapResponseDto,
	toQuoteSwapResponseDto,
} from './quote-swap/quote-swap.response'
import { QuoteWithdrawBodyDto } from './quote-withdraw/quote-withdraw.request'
import {
	QuoteWithdrawResponseDto,
	toQuoteWithdrawResponseDto,
} from './quote-withdraw/quote-withdraw.response'
import { SwapBodyDto } from './swap/swap.request'
import { SwapResponseDto, toSwapResponseDto } from './swap/swap.response'

@Controller('wallets')
@UseInterceptors(PriceEnrichmentInterceptor)
export class WalletsController {
	constructor(
		private readonly getBalanceUseCase: GetBalanceUseCase,
		private readonly withdrawUseCase: WithdrawUseCase,
		private readonly quoteWithdrawUseCase: QuoteWithdrawUseCase,
		private readonly quoteSwapUseCase: QuoteSwapUseCase,
		private readonly swapUseCase: SwapUseCase,
		private readonly getSwapResultUseCase: GetSwapResultUseCase,
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

		return toGetBalancesResponseDto(currencyAmounts)
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

		const transaction = await this.withdrawUseCase.execute({
			telegramId,
			amountIn: { currency: currencyIn, amount: body.amountIn.amount },
			currencyOut,
			recipientAddress: body.recipientAddress,
		})

		return toCreateWithdrawalResponseDto(transaction)
	}

	@Post('quote-swap')
	@ZodResponse({ type: QuoteSwapResponseDto })
	async quoteSwap(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteSwapBodyDto,
	): Promise<QuoteSwapResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.tokenInChainAddress),
			this.currencyService.fromAccount(body.tokenOutChainAddress),
		])

		const result = await this.quoteSwapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toQuoteSwapResponseDto(result)
	}

	@Post('swap')
	@ZodResponse({ type: SwapResponseDto })
	async swap(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: SwapBodyDto,
	): Promise<SwapResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.tokenInChainAddress),
			this.currencyService.fromAccount(body.tokenOutChainAddress),
		])

		const pendingZap = await this.swapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toSwapResponseDto(pendingZap)
	}

	@Get('swap-result')
	@ZodResponse({ type: GetSwapResultResponseDto })
	async getSwapResult(
		@Query() query: GetSwapResultQueryDto,
	): Promise<GetSwapResultResponseDto> {
		const result = await this.getSwapResultUseCase.execute({
			zapId: query.zapId,
		})

		if (result === null) return pendingSwapResultDto

		if (result.status === 'cancelled') return cancelledSwapResultDto

		if (result.status === 'failed') {
			return toFailedSwapResultDto(result)
		}

		return toSuccessSwapResultDto(result)
	}

	@Post('quote-withdraw')
	@ZodResponse({ type: QuoteWithdrawResponseDto })
	async quoteWithdraw(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteWithdrawBodyDto,
	): Promise<QuoteWithdrawResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(
				body.amountIn.currencyChainAddress,
			),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const quote = await this.quoteWithdrawUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			amountIn: { currency: currencyIn, amount: body.amountIn.amount },
			currencyOut,
			recipientAddress: body.recipientAddress,
		})

		return toQuoteWithdrawResponseDto(quote)
	}
}
