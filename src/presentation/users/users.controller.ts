import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateUserUseCase } from 'src/application/use-cases/create-user/create-user.use-case'
import { GetUnrevealedPrizesUseCase } from 'src/application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { RevealTicketPrizesUseCase } from 'src/application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import {
	createUserBodySchema,
	revealBodySchema,
	telegramIdParamSchema,
} from 'src/presentation/validation'
import { z } from 'zod'
import {
	TicketPrizeResponseDto,
	toTicketPrizeResponseDto,
} from './ticket-prize-response.dto'
import { toUserResponseDto, UserResponseDto } from './user-response.dto'

const TELEGRAM_ID_PARAM = 'telegramId'

@Controller()
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
		private readonly revealTicketPrizesUseCase: RevealTicketPrizesUseCase,
		private readonly getUnrevealedPrizesUseCase: GetUnrevealedPrizesUseCase,
	) {}

	@Get(`:${TELEGRAM_ID_PARAM}`)
	async getUser(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
	): Promise<UserResponseDto> {
		const user = await this.getUserUseCase.execute({ telegramId })

		return toUserResponseDto(user)
	}

	@Get(`:${TELEGRAM_ID_PARAM}/unrevealed-prizes`)
	async getUnrevealedPrizes(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
	): Promise<TicketPrizeResponseDto[]> {
		const prizes = await this.getUnrevealedPrizesUseCase.execute({
			telegramId,
		})

		return prizes.map(toTicketPrizeResponseDto)
	}

	@Post(`:${TELEGRAM_ID_PARAM}/reveal`)
	async revealTicketPrizes(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
		@Body(new ZodValidationPipe(revealBodySchema))
		body: z.infer<typeof revealBodySchema>,
	): Promise<TicketPrizeResponseDto[]> {
		const prizes = await this.revealTicketPrizesUseCase.execute({
			telegramId,
			revealAll: body.revealAll,
		})

		return prizes.map(toTicketPrizeResponseDto)
	}

	@Post()
	async createUser(
		@Body(new ZodValidationPipe(createUserBodySchema))
		body: z.infer<typeof createUserBodySchema>,
	): Promise<UserResponseDto> {
		const user = await this.createUserUseCase.execute({
			telegramId: body.telegramId,
			referrerAddress: body.referrerAddress,
		})

		return toUserResponseDto(user)
	}
}
