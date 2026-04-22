import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case'
import { GetUserUseCase } from '../../application/use-cases/get-user/get-user.use-case'
import { CreateUserBodyDto } from './create-user/create-user.request'
import {
	GetUserParamsDto,
	TELEGRAM_ID_PARAM,
} from './get-user/get-user.request'
import { toUserDto, UserDto } from './shared/user.dto'

@Controller('users')
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
	) {}

	@Get(`:${TELEGRAM_ID_PARAM}`)
	@ZodResponse({ type: UserDto })
	async getUser(@Param() params: GetUserParamsDto): Promise<UserDto> {
		const user = await this.getUserUseCase.execute({
			telegramId: params.telegramId,
		})

		return toUserDto(user)
	}

	@Post()
	@ZodResponse({ type: UserDto })
	async createUser(@Body() body: CreateUserBodyDto): Promise<UserDto> {
		const user = await this.createUserUseCase.execute({
			telegramId: body.telegramId,
			referrerAddress: body.referrerAddress,
		})

		return toUserDto(user)
	}
}
