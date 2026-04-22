import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	Param,
	Post,
	Query,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { BuyTicketsUseCase } from '../../application/use-cases/buy-tickets/buy-tickets.use-case'
import { GetAvailableStakesUseCase } from '../../application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { GetCompletedRoundsUseCase } from '../../application/use-cases/get-completed-rounds/get-completed-rounds.use-case'
import { GetOngoingRoundsUseCase } from '../../application/use-cases/get-ongoing-rounds/get-ongoing-rounds.use-case'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import {
	BuyTicketsBodyDto,
	CompletedRoundsQueryDto,
	TELEGRAM_ID_PARAM,
	TelegramIdParamsDto,
} from '../validation'
import {
	PurchaseResponseDto,
	toPurchaseResponseDto,
	toZapResponseDto,
	ZapResponseDto,
} from './buy-tickets-response.dto'
import { toRoundDto } from './rips-schemas'
import {
	GetCompletedRoundsResponseDto,
	GetOngoingRoundsResponseDto,
} from './round-response.dto'
import {
	AvailableStakeResponseDto,
	toAvailableStakeResponseDto,
} from './stake-response.dto'

@Controller()
export class RipsController {
	constructor(
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly buyTicketsUseCase: BuyTicketsUseCase,
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly getCompletedRoundsUseCase: GetCompletedRoundsUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
	) {}

	@Get('stakes')
	@ZodResponse({ type: [AvailableStakeResponseDto] })
	async getAvailableStakes(): Promise<AvailableStakeResponseDto[]> {
		const stakes = await this.getAvailableStakesUseCase.execute()

		const currencies = stakes.map((s) =>
			s.fillingRound !== null
				? s.fillingRound.currency
				: s.stake.currentConfig.ticketPrice.currency,
		)

		const prices = await this.getPriceUseCase.executeMany({ currencies })

		return stakes.map((s, i) =>
			toAvailableStakeResponseDto(s, prices.get(currencies[i].id) ?? 0),
		)
	}

	@Post(`users/:${TELEGRAM_ID_PARAM}/buy-tickets/purchase`)
	@ZodResponse({ type: PurchaseResponseDto })
	async buyTicketsPurchase(
		@Param() params: TelegramIdParamsDto,
		@Body() body: BuyTicketsBodyDto,
	): Promise<PurchaseResponseDto> {
		const outcome = await this.buyTicketsUseCase.execute({
			telegramId: params.telegramId,
			stakeId: body.stakeId,
			ticketCount: body.ticketCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		if (outcome.type !== 'purchased') {
			throw new InternalServerErrorException(
				'Expected purchase outcome but got zap',
			)
		}

		return toPurchaseResponseDto(outcome.purchaseReceipt)
	}

	@Post(`users/:${TELEGRAM_ID_PARAM}/buy-tickets/zap`)
	@ZodResponse({ type: ZapResponseDto })
	async buyTicketsZap(
		@Param() params: TelegramIdParamsDto,
		@Body() body: BuyTicketsBodyDto,
	): Promise<ZapResponseDto> {
		const outcome = await this.buyTicketsUseCase.execute({
			telegramId: params.telegramId,
			stakeId: body.stakeId,
			ticketCount: body.ticketCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		if (outcome.type !== 'zap') {
			throw new InternalServerErrorException(
				'Expected zap outcome but got purchase',
			)
		}

		const { pendingZap } = outcome
		const prices = await this.getPriceUseCase.executeMany({
			currencies: [pendingZap.amountIn.currency, pendingZap.fee.currency],
		})

		return toZapResponseDto(
			pendingZap,
			prices.get(pendingZap.amountIn.currency.id) ?? 0,
			prices.get(pendingZap.fee.currency.id) ?? 0,
		)
	}

	@Get('rounds/ongoing')
	@ZodResponse({ type: GetOngoingRoundsResponseDto })
	async getOngoingRounds(): Promise<GetOngoingRoundsResponseDto> {
		const rounds = await this.getOngoingRoundsUseCase.execute()

		const prices = await this.getPriceUseCase.executeMany({
			currencies: rounds.map((r) => r.currency),
		})

		return {
			rounds: rounds.map((r) =>
				toRoundDto(r, prices.get(r.currency.id) ?? 0),
			),
		}
	}

	@Get('rounds/completed')
	@ZodResponse({ type: GetCompletedRoundsResponseDto })
	async getCompletedRounds(
		@Query() query: CompletedRoundsQueryDto,
	): Promise<GetCompletedRoundsResponseDto> {
		const result = await this.getCompletedRoundsUseCase.execute({
			limit: query.limit,
			cursor: query.cursor,
		})

		const prices = await this.getPriceUseCase.executeMany({
			currencies: result.rounds.map((r) => r.currency),
		})

		return {
			rounds: result.rounds.map((r) =>
				toRoundDto(r, prices.get(r.currency.id) ?? 0),
			),
			nextCursor: result.nextCursor,
		}
	}
}
