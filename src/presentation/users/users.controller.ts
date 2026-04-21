import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case'
import { GetUnrevealedPrizesUseCase } from '../../application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { GetUserUseCase } from '../../application/use-cases/get-user/get-user.use-case'
import { RevealTicketPrizesUseCase } from '../../application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import {
	CreateUserBodyDto,
	RevealBodyDto,
	TELEGRAM_ID_PARAM,
	TelegramIdParamsDto,
} from '../validation'
import {
	TicketPrizeResponseDto,
	toTicketPrizeResponseDto,
} from './ticket-prize-response.dto'
import { toUserResponseDto, UserResponseDto } from './user-response.dto'

@Controller()
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
		private readonly revealTicketPrizesUseCase: RevealTicketPrizesUseCase,
		private readonly getUnrevealedPrizesUseCase: GetUnrevealedPrizesUseCase,
	) {}

	@Get(`:${TELEGRAM_ID_PARAM}`)
	@ZodResponse({ type: UserResponseDto })
	async getUser(
		@Param() params: TelegramIdParamsDto,
	): Promise<UserResponseDto> {
		const user = await this.getUserUseCase.execute({
			telegramId: params.telegramId,
		})

		return toUserResponseDto(user)
	}

	@Get(`:${TELEGRAM_ID_PARAM}/unrevealed-prizes`)
	@ZodResponse({ type: [TicketPrizeResponseDto] })
	async getUnrevealedPrizes(
		@Param() params: TelegramIdParamsDto,
	): Promise<TicketPrizeResponseDto[]> {
		const prizes = await this.getUnrevealedPrizesUseCase.execute({
			telegramId: params.telegramId,
		})

		return prizes.map(toTicketPrizeResponseDto)
	}

	@Post(`:${TELEGRAM_ID_PARAM}/reveal`)
	@ZodResponse({ type: [TicketPrizeResponseDto] })
	async revealTicketPrizes(
		@Param() params: TelegramIdParamsDto,
		@Body() body: RevealBodyDto,
	): Promise<TicketPrizeResponseDto[]> {
		const prizes = await this.revealTicketPrizesUseCase.execute({
			telegramId: params.telegramId,
			revealAll: body.revealAll,
		})

		return prizes.map(toTicketPrizeResponseDto)
	}

	@Post()
	@ZodResponse({ type: UserResponseDto })
	async createUser(
		@Body() body: CreateUserBodyDto,
	): Promise<UserResponseDto> {
		const user = await this.createUserUseCase.execute({
			telegramId: body.telegramId,
			referrerAddress: body.referrerAddress,
		})

		return toUserResponseDto(user)
	}
}
