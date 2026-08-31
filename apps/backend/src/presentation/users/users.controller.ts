import {
	Body,
	Controller,
	Get,
	Headers,
	Param,
	Patch,
	Post,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case'
import { ExportKeyUseCase } from '../../application/use-cases/export-key/export-key.use-case'
import { GetUserUseCase } from '../../application/use-cases/get-user/get-user.use-case'
import { SetReferrerUseCase } from '../../application/use-cases/set-referrer/set-referrer.use-case'
import { UserAccess } from '../shared/access/access-level'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import {
	TELEGRAM_ID_PARAM,
	TelegramIdParamDto,
} from '../shared/telegram-id.param'
import { CreateUserBodyDto } from './create-user/create-user.request'
import { ExportKeyResponseDto } from './export-key/export-key.request'
import { ImportUserBodyDto } from './import-user/import-user.request'
import { SetReferrerBodyDto } from './set-referrer/set-referrer.request'
import { toUserDto, UserDto } from './shared/user.dto'

@Controller('users')
@UserAccess()
export class UsersController {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly createUserUseCase: CreateUserUseCase,
		private readonly setReferrerUseCase: SetReferrerUseCase,
		private readonly exportKeyUseCase: ExportKeyUseCase,
	) {}

	@Get(`:${TELEGRAM_ID_PARAM}`)
	@ZodResponse({ type: UserDto })
	async getUser(@Param() params: TelegramIdParamDto): Promise<UserDto> {
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

	@Post('import')
	@ZodResponse({ type: UserDto })
	async importUser(@Body() body: ImportUserBodyDto): Promise<UserDto> {
		const user = await this.createUserUseCase.execute({
			telegramId: body.telegramId,
			referrerAddress: body.referrerAddress,
			privateKey: body.privateKey,
		})

		return toUserDto(user)
	}

	@Get(`:${TELEGRAM_ID_PARAM}/export-key`)
	@ZodResponse({ type: ExportKeyResponseDto })
	async exportKey(
		@Param() params: TelegramIdParamDto,
	): Promise<ExportKeyResponseDto> {
		const privateKey = await this.exportKeyUseCase.execute({
			telegramId: params.telegramId,
		})

		return { privateKey }
	}

	@Patch()
	@ZodResponse({ type: UserDto })
	async setReferrer(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: SetReferrerBodyDto,
	): Promise<UserDto> {
		const user = await this.setReferrerUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			referrerAddress: body.referrerAddress,
		})

		return toUserDto(user)
	}
}
