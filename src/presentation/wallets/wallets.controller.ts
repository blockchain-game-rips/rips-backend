import { Body, Controller, Param, Post } from '@nestjs/common'
import { z } from 'zod'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import { TelegramId } from '../../domain/value-objects/telegram-id'
import { ZodValidationPipe } from '../pipes/zod-validation.pipe'
import {
	getBalanceBodySchema,
	telegramIdParamSchema,
	withdrawBodySchema,
} from '../validation'
import {
	BalanceResponseDto,
	toBalanceResponseDto,
} from './balance-response.dto'
import {
	WithdrawResponseDto,
	toWithdrawResponseDto,
} from './withdraw-response.dto'

const TELEGRAM_ID_PARAM = 'telegramId'

@Controller()
export class WalletsController {
	constructor(
		private readonly getBalanceUseCase: GetBalanceUseCase,
		private readonly withdrawUseCase: WithdrawUseCase,
	) {}

	@Post('balance')
	async getBalance(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
		@Body(new ZodValidationPipe(getBalanceBodySchema))
		body: z.infer<typeof getBalanceBodySchema>,
	): Promise<BalanceResponseDto> {
		const result = await this.getBalanceUseCase.execute({
			telegramId,
			currencyChainAddress: body.currencyChainAddress,
		})

		return toBalanceResponseDto(result)
	}

	@Post('balance/withdraw')
	async withdraw(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
		@Body(new ZodValidationPipe(withdrawBodySchema))
		body: z.infer<typeof withdrawBodySchema>,
	): Promise<WithdrawResponseDto> {
		const tx = await this.withdrawUseCase.execute({
			telegramId,
			amount: body.amount,
			currencyChainAddress: body.currencyChainAddress,
			recipientChainAddress: {
				chain: body.currencyChainAddress.chain,
				address: body.recipientAddress,
			},
		})

		return toWithdrawResponseDto(tx)
	}
}
