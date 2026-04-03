import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { BuyTicketsUseCase } from 'src/application/use-cases/buy-tickets/buy-tickets.use-case'
import { GetCompletedRoundsUseCase } from 'src/application/use-cases/get-completed-rounds/get-completed-rounds.use-case'
import { GetOngoingRoundsUseCase } from 'src/application/use-cases/get-ongoing-rounds/get-ongoing-rounds.use-case'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import {
	buyTicketsBodySchema,
	completedRoundsQuerySchema,
	telegramIdParamSchema,
} from 'src/presentation/validation'
import { z } from 'zod'
import {
	BuyTicketsResponseDto,
	toBuyTicketsResponseDto,
} from './buy-tickets-response.dto'
import {
	GetCompletedRoundsResponseDto,
	OngoingRoundResponseDto,
	toCompletedRoundResponseDto,
	toOngoingRoundResponseDto,
} from './round-response.dto'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

const TELEGRAM_ID_PARAM = 'telegramId'

@Controller()
export class RipsController {
	constructor(
		private readonly getStakesUseCase: GetStakesUseCase,
		private readonly buyTicketsUseCase: BuyTicketsUseCase,
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly getCompletedRoundsUseCase: GetCompletedRoundsUseCase,
	) {}

	@Get('stakes')
	async getStakes(): Promise<StakeResponseDto[]> {
		const stakes = await this.getStakesUseCase.execute()

		return stakes.map(toStakeResponseDto)
	}

	@Post(`users/:${TELEGRAM_ID_PARAM}/buy-tickets`)
	async buyTickets(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
		@Body(new ZodValidationPipe(buyTicketsBodySchema))
		body: z.infer<typeof buyTicketsBodySchema>,
	): Promise<BuyTicketsResponseDto> {
		const purchase = await this.buyTicketsUseCase.execute({
			telegramId,
			stakeId: body.stakeId,
			amount: body.amount,
		})

		return toBuyTicketsResponseDto(purchase)
	}

	@Get('rounds/ongoing')
	async getOngoingRounds(): Promise<OngoingRoundResponseDto[]> {
		const rounds = await this.getOngoingRoundsUseCase.execute()

		return rounds.map(toOngoingRoundResponseDto)
	}

	@Get('rounds/completed')
	async getCompletedRounds(
		@Query(new ZodValidationPipe(completedRoundsQuerySchema))
		query: z.infer<typeof completedRoundsQuerySchema>,
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
