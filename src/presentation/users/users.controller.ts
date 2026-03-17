import {
	Body,
	ConflictException,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common'
import {
	CreateUserUseCase,
	UserAlreadyExistsError,
} from 'src/application/use-cases/create-user/create-user.use-case'
import {
	GetUserUseCase,
	UserNotFoundError,
} from 'src/application/use-cases/get-user/get-user.use-case'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { z } from 'zod'
import { toUserResponseDto, UserResponseDto } from './user-response.dto'

const telegramIdParamSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

const createUserBodySchema = z.object({
	telegramId: z
		.union([z.string(), z.number()])
		.transform((v) => toTelegramId(BigInt(v))),
})

@Controller('users')
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
	) {}

	@Get(':telegramId')
	async getUser(
		@Param('telegramId') rawId: string,
	): Promise<UserResponseDto> {
		const telegramId = telegramIdParamSchema.parse(rawId)

		try {
			const user = await this.getUserUseCase.execute({ telegramId })

			return toUserResponseDto(user)
		} catch (error) {
			if (error instanceof UserNotFoundError)
				throw new NotFoundException(error.message)

			throw error
		}
	}

	@Post()
	async createUser(@Body() body: unknown): Promise<UserResponseDto> {
		const { telegramId } = createUserBodySchema.parse(body)

		try {
			const user = await this.createUserUseCase.execute({ telegramId })

			return toUserResponseDto(user)
		} catch (error) {
			if (error instanceof UserAlreadyExistsError)
				throw new ConflictException(error.message)

			throw error
		}
	}
}
