import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	UseInterceptors,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetBalancesUseCase } from '../../application/use-cases/get-balances/get-balances.use-case'
import { GetSwapResultUseCase } from '../../application/use-cases/get-swap-result/get-swap-result.use-case'
import { QuoteSwapSamechainUseCase } from '../../application/use-cases/quote-swap-samechain/quote-swap-samechain.use-case'
import { QuoteSwapUseCase } from '../../application/use-cases/quote-swap/quote-swap.use-case'
import { QuoteWithdrawUseCase } from '../../application/use-cases/quote-withdraw/quote-withdraw.use-case'
import { SwapSamechainUseCase } from '../../application/use-cases/swap-samechain/swap-samechain.use-case'
import { SwapUseCase } from '../../application/use-cases/swap/swap.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import { PublicAccess, UserAccess } from '../shared/access/access-level'
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
	toSuccessSwapResultDto,
} from './get-swap-result/get-swap-result.response'
import {
	QuoteSwapSamechainResponseDto,
	toQuoteSwapSamechainResponseDto,
} from './quote-swap-samechain/quote-swap-samechain.response'
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
import {
	SwapSamechainResponseDto,
	toSwapSamechainResponseDto,
} from './swap-samechain/swap-samechain.response'
import { SwapBodyDto } from './swap/swap.request'
import { SwapResponseDto, toSwapResponseDto } from './swap/swap.response'

@Controller('wallets')
@UserAccess()
@UseInterceptors(PriceEnrichmentInterceptor)
export class WalletsController {
	constructor(
		private readonly getBalancesUseCase: GetBalancesUseCase,
		private readonly withdrawUseCase: WithdrawUseCase,
		private readonly quoteWithdrawUseCase: QuoteWithdrawUseCase,
		private readonly quoteSwapUseCase: QuoteSwapUseCase,
		private readonly quoteSwapSamechainUseCase: QuoteSwapSamechainUseCase,
		private readonly swapUseCase: SwapUseCase,
		private readonly swapSamechainUseCase: SwapSamechainUseCase,
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

		const currencyAmounts = await this.getBalancesUseCase.execute({
			telegramId,
			currencyChainAddresses: query.chainAddress,
		})

		return toGetBalancesResponseDto(currencyAmounts)
	}

	@Post('withdrawals')
	@HttpCode(HttpStatus.OK)
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

		const attempt = await this.withdrawUseCase.execute({
			telegramId,
			amountIn: { currency: currencyIn, amount: body.amountIn.amount },
			currencyOut,
			recipientAddress: body.recipientAddress,
		})

		return toCreateWithdrawalResponseDto(attempt)
	}

	@Post('quote-swap/crosschain')
	@ZodResponse({ type: QuoteSwapResponseDto })
	async quoteSwapCrosschain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteSwapBodyDto,
	): Promise<QuoteSwapResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.currencyInChainAddress),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const result = await this.quoteSwapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toQuoteSwapResponseDto(result)
	}

	@Post('quote-swap/samechain')
	@ZodResponse({ type: QuoteSwapSamechainResponseDto })
	async quoteSwapSamechain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteSwapBodyDto,
	): Promise<QuoteSwapSamechainResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.currencyInChainAddress),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const result = await this.quoteSwapSamechainUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toQuoteSwapSamechainResponseDto(result)
	}

	@Post('swap/crosschain')
	@HttpCode(HttpStatus.OK)
	@ZodResponse({ type: SwapResponseDto })
	async swapCrosschain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: SwapBodyDto,
	): Promise<SwapResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.currencyInChainAddress),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const pendingZap = await this.swapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toSwapResponseDto(pendingZap)
	}

	@Post('swap/samechain')
	@HttpCode(HttpStatus.OK)
	@ZodResponse({ type: SwapSamechainResponseDto })
	async swapSamechain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: SwapBodyDto,
	): Promise<SwapSamechainResponseDto> {
		const [currencyIn, currencyOut] = await Promise.all([
			this.currencyService.fromAccount(body.currencyInChainAddress),
			this.currencyService.fromAccount(body.currencyOutChainAddress),
		])

		const result = await this.swapSamechainUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyIn,
			currencyOut,
			amountIn: body.amountIn,
		})

		return toSwapSamechainResponseDto(result)
	}

	@PublicAccess()
	@Get('swap/crosschain/result')
	@ZodResponse({ type: GetSwapResultResponseDto })
	async getSwapResult(
		@Query() query: GetSwapResultQueryDto,
	): Promise<GetSwapResultResponseDto> {
		const result = await this.getSwapResultUseCase.execute({
			zapId: query.zapId,
		})

		if (result === null) return pendingSwapResultDto

		if (result.status === 'cancelled') return cancelledSwapResultDto

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
