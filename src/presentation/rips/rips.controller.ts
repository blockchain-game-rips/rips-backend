import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { BuyTicketsUseCase } from 'src/application/use-cases/buy-tickets/buy-tickets.use-case'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { ZodValidationPipe } from 'src/presentation/pipes/zod-validation.pipe'
import { z } from 'zod'
import {
	BuyTicketsResponseDto,
	toBuyTicketsResponseDto,
} from './buy-tickets-response.dto'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

const telegramIdParamSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

const buyTicketsBodySchema = z.object({
	stakeId: z.number().int().positive(),
	amount: z.number().int().positive(),
})

@Controller()
export class RipsController {
	constructor(
		private readonly getStakesUseCase: GetStakesUseCase,
		private readonly buyTicketsUseCase: BuyTicketsUseCase,
	) {}

	@Get('stakes')
	async getStakes(): Promise<StakeResponseDto[]> {
		const stakes = await this.getStakesUseCase.execute()

		return stakes.map(toStakeResponseDto)
	}

	@Post('users/:telegramId/buy-tickets')
	async buyTickets(
		@Param('telegramId', new ZodValidationPipe(telegramIdParamSchema))
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
}
