import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateUserUseCase } from 'src/application/use-cases/create-user/create-user.use-case'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import { z } from 'zod'
import { toUserResponseDto, UserResponseDto } from './user-response.dto'

const TELEGRAM_ID_PARAM = 'telegramId'

const telegramIdParamSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

const createUserBodySchema = z.object({
	telegramId: z
		.union([z.string(), z.number()])
		.transform((v) => toTelegramId(BigInt(v))),
})

@Controller()
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
	) {}

	@Get(`:${TELEGRAM_ID_PARAM}`)
	async getUser(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
	): Promise<UserResponseDto> {
		const user = await this.getUserUseCase.execute({ telegramId })

		return toUserResponseDto(user)
	}

	@Post()
	async createUser(
		@Body(new ZodValidationPipe(createUserBodySchema))
		body: { telegramId: TelegramId },
	): Promise<UserResponseDto> {
		const user = await this.createUserUseCase.execute({
			telegramId: body.telegramId,
		})

		return toUserResponseDto(user)
	}
}
