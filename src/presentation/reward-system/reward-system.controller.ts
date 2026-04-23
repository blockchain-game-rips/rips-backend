import { Body, Controller, Get, Headers, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { GetRewardsUseCase } from '../../application/use-cases/get-rewards/get-rewards.use-case'
import { WithdrawRewardUseCase } from '../../application/use-cases/withdraw-reward/withdraw-reward.use-case'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import {
	GetRewardsResponseDto,
	toGetRewardsResponseDto,
} from './get-rewards/get-rewards.response'
import { WithdrawRewardBodyDto } from './withdraw-reward/withdraw-reward.request'
import {
	WithdrawRewardResponseDto,
	toWithdrawRewardResponseDto,
} from './withdraw-reward/withdraw-reward.response'

@Controller('reward')
export class RewardSystemController {
	constructor(
		private readonly getRewardsUseCase: GetRewardsUseCase,
		private readonly withdrawRewardUseCase: WithdrawRewardUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
	) {}

	@Get()
	@ZodResponse({ type: GetRewardsResponseDto })
	async getRewards(
		@Headers() headers: TelegramIdHeaderDto,
	): Promise<GetRewardsResponseDto> {
		const rewards = await this.getRewardsUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
		})

		return toGetRewardsResponseDto(rewards)
	}

	@Post()
	@ZodResponse({ type: WithdrawRewardResponseDto })
	async withdrawReward(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: WithdrawRewardBodyDto,
	): Promise<WithdrawRewardResponseDto> {
		const reward = await this.withdrawRewardUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyAddress: body.currencyAddress,
		})

		const priceUsd = await this.getPriceUseCase.execute({
			currency: reward.amount.currency,
		})

		return toWithdrawRewardResponseDto(reward, priceUsd)
	}
}
