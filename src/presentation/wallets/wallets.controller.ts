import { Controller, Get, Param } from '@nestjs/common'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import { z } from 'zod'
import {
	BalanceResponseDto,
	toBalanceResponseDto,
} from './balance-response.dto'

const TELEGRAM_ID_PARAM = 'telegramId'

const telegramIdParamSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

@Controller()
export class WalletsController {
	constructor(private readonly getBalanceUseCase: GetBalanceUseCase) {}

	@Get('balance')
	async getBalance(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
	): Promise<BalanceResponseDto> {
		const result = await this.getBalanceUseCase.execute({ telegramId })

		return toBalanceResponseDto(result)
	}
}
