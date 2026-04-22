import {
	Body,
	Controller,
	Get,
	Headers,
	InternalServerErrorException,
	Patch,
	Post,
	Query,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { BuyTicketsUseCase } from '../../application/use-cases/buy-tickets/buy-tickets.use-case'
import { GetAvailableStakesUseCase } from '../../application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { GetCompletedRoundsUseCase } from '../../application/use-cases/get-completed-rounds/get-completed-rounds.use-case'
import { GetOngoingRoundsUseCase } from '../../application/use-cases/get-ongoing-rounds/get-ongoing-rounds.use-case'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { GetRoundsUseCase } from '../../application/use-cases/get-rounds/get-rounds.use-case'
import { GetUnrevealedPrizesUseCase } from '../../application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { RevealTicketPrizesUseCase } from '../../application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import { BuyTicketsPurchaseBodyDto } from './buy-tickets-purchase/buy-tickets-purchase.request'
import {
	BuyTicketsPurchaseResponseDto,
	toBuyTicketsPurchaseResponseDto,
} from './buy-tickets-purchase/buy-tickets-purchase.response'
import { BuyTicketsZapBodyDto } from './buy-tickets-zap/buy-tickets-zap.request'
import {
	BuyTicketsZapResponseDto,
	toBuyTicketsZapResponseDto,
} from './buy-tickets-zap/buy-tickets-zap.response'
import { GetCompletedRoundsQueryDto } from './get-completed-rounds/get-completed-rounds.request'
import { GetCompletedRoundsResponseDto } from './get-completed-rounds/get-completed-rounds.response'
import { GetOngoingRoundsResponseDto } from './get-ongoing-rounds/get-ongoing-rounds.response'
import { GetPrizesResponseDto } from './get-prizes/get-prizes.response'
import { GetRoundsQueryDto } from './get-rounds/get-rounds.request'
import { GetRoundsResponseDto } from './get-rounds/get-rounds.response'
import { GetStakesResponseDto } from './get-stakes/get-stakes.response'
import { RevealPrizesBodyDto } from './reveal-prizes/reveal-prizes.request'
import { RevealPrizesResponseDto } from './reveal-prizes/reveal-prizes.response'
import { toAvailableStakeDto } from './shared/available-stake.dto'
import { toPrizeDto } from './shared/prize.dto'
import { toRoundDto } from './shared/round.dto'

@Controller('rips')
export class RipsController {
	constructor(
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly buyTicketsUseCase: BuyTicketsUseCase,
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly getCompletedRoundsUseCase: GetCompletedRoundsUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
		private readonly getUnrevealedPrizesUseCase: GetUnrevealedPrizesUseCase,
		private readonly revealTicketPrizesUseCase: RevealTicketPrizesUseCase,
		private readonly getRoundsUseCase: GetRoundsUseCase,
	) {}

	@Get('stakes')
	@ZodResponse({ type: GetStakesResponseDto })
	async getStakes(): Promise<GetStakesResponseDto> {
		const stakes = await this.getAvailableStakesUseCase.execute()

		const currencies = stakes.map((s) =>
			s.fillingRound !== null
				? s.fillingRound.currency
				: s.stake.currentConfig.ticketPrice.currency,
		)

		const prices = await this.getPriceUseCase.executeMany({ currencies })

		return {
			availableStakes: stakes.map((s, i) =>
				toAvailableStakeDto(s, prices.get(currencies[i].id) ?? 0),
			),
		}
	}

	@Post('tickets/purchase')
	@ZodResponse({ type: BuyTicketsPurchaseResponseDto })
	async buyTicketsPurchase(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: BuyTicketsPurchaseBodyDto,
	): Promise<BuyTicketsPurchaseResponseDto> {
		const outcome = await this.buyTicketsUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			stakeId: body.stakeId,
			ticketCount: body.ticketCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		if (outcome.type !== 'purchased') {
			throw new InternalServerErrorException(
				'Expected purchase outcome but got zap',
			)
		}

		return toBuyTicketsPurchaseResponseDto(outcome.purchaseReceipt)
	}

	@Post('tickets/zap')
	@ZodResponse({ type: BuyTicketsZapResponseDto })
	async buyTicketsZap(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: BuyTicketsZapBodyDto,
	): Promise<BuyTicketsZapResponseDto> {
		const outcome = await this.buyTicketsUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
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

		return toBuyTicketsZapResponseDto(
			pendingZap,
			prices.get(pendingZap.amountIn.currency.id) ?? 0,
			prices.get(pendingZap.fee.currency.id) ?? 0,
		)
	}

	@Get('prizes')
	@ZodResponse({ type: GetPrizesResponseDto })
	async getPrizes(
		@Headers() headers: TelegramIdHeaderDto,
	): Promise<GetPrizesResponseDto> {
		const prizes = await this.getUnrevealedPrizesUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
		})

		return {
			prizes: prizes.map(toPrizeDto),
		}
	}

	@Patch('prizes')
	@ZodResponse({ type: RevealPrizesResponseDto })
	async revealPrizes(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: RevealPrizesBodyDto,
	): Promise<RevealPrizesResponseDto> {
		const prizes = await this.revealTicketPrizesUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			revealAll: body.revealAll,
		})

		return {
			prizes: prizes.map(toPrizeDto),
		}
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

	@Get('rounds')
	@ZodResponse({ type: GetRoundsResponseDto })
	async getRounds(
		@Query() query: GetRoundsQueryDto,
	): Promise<GetRoundsResponseDto> {
		const result = await this.getRoundsUseCase.execute({
			ids: new Set(query.ids),
		})

		const prices = await this.getPriceUseCase.executeMany({
			currencies: result.rounds.map((r) => r.currency),
		})

		return {
			rounds: result.rounds.map((r) =>
				toRoundDto(r, prices.get(r.currency.id) ?? 0),
			),
		}
	}

	@Get('rounds/completed')
	@ZodResponse({ type: GetCompletedRoundsResponseDto })
	async getCompletedRounds(
		@Query() query: GetCompletedRoundsQueryDto,
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
