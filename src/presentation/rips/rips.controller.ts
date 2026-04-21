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
import {
	GetCompletedRoundsResponseDto,
	OngoingRoundResponseDto,
	toCompletedRoundResponseDto,
	toOngoingRoundResponseDto,
} from './round-response.dto'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

@Controller()
export class RipsController {
	constructor(
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly buyTicketsUseCase: BuyTicketsUseCase,
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly getCompletedRoundsUseCase: GetCompletedRoundsUseCase,
	) {}

	@Get('stakes')
	@ZodResponse({ type: [StakeResponseDto] })
	async getStakes(): Promise<StakeResponseDto[]> {
		const stakes = await this.getAvailableStakesUseCase.execute()

		return stakes.map(toStakeResponseDto)
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

		return toZapResponseDto(outcome.pendingZap)
	}

	@Get('rounds/ongoing')
	@ZodResponse({ type: [OngoingRoundResponseDto] })
	async getOngoingRounds(): Promise<OngoingRoundResponseDto[]> {
		const rounds = await this.getOngoingRoundsUseCase.execute()

		return rounds.map(toOngoingRoundResponseDto)
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

		return {
			rounds: result.rounds.map(toCompletedRoundResponseDto),
			nextCursor: result.nextCursor,
		}
	}
}
