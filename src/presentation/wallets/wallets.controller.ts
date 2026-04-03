import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { WithdrawUseCase } from 'src/application/use-cases/withdraw.ts/withdraw.use-case'
import { EIP155 } from 'src/constants'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { MAIN_CURRENCY_VALUE } from 'src/modules/main-currency/main-currency.constants'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import {
	telegramIdParamSchema,
	withdrawBodySchema,
} from 'src/presentation/validation'
import { z } from 'zod'
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

	@Get('balance')
	async getBalance(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
	): Promise<BalanceResponseDto> {
		const result = await this.getBalanceUseCase.execute({ telegramId })

		return toBalanceResponseDto(result)
	}

	@Post('balance/withdraw')
	async withdraw(
		@Param(TELEGRAM_ID_PARAM, new ZodValidationPipe(telegramIdParamSchema))
		telegramId: TelegramId,
		@Body(new ZodValidationPipe(withdrawBodySchema))
		body: z.infer<typeof withdrawBodySchema>,
	): Promise<WithdrawResponseDto> {
		const recipientChainAddress = {
			chain: {
				namespace: EIP155,
				reference: MAIN_CURRENCY_VALUE.chain.reference,
			},
			address: body.recipientAddress,
		}

		const tx = await this.withdrawUseCase.execute({
			telegramId,
			amount: body.amount,
			recipientChainAddress,
		})

		return toWithdrawResponseDto(tx)
	}
}
