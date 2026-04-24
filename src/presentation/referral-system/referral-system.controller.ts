import { Body, Controller, Get, Headers, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { GetReferrerUseCase } from '../../application/use-cases/get-referrer/get-referrer.use-case'
import { WithdrawRewardUseCase } from '../../application/use-cases/withdraw-reward/withdraw-reward.use-case'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import {
	GetReferrerResponseDto,
	toGetReferrerResponseDto,
} from './get-referrer/get-referrer.response'
import { WithdrawRewardBodyDto } from './withdraw-reward/withdraw-reward.request'
import {
	WithdrawRewardResponseDto,
	toWithdrawRewardResponseDto,
} from './withdraw-reward/withdraw-reward.response'

@Controller('referral-system')
export class ReferralSystemController {
	constructor(
		private readonly getReferrerUseCase: GetReferrerUseCase,
		private readonly withdrawRewardUseCase: WithdrawRewardUseCase,
		private readonly getPriceUseCase: GetPriceUseCase,
	) {}

	@Get('referrers')
	@ZodResponse({ type: GetReferrerResponseDto })
	async getReferrer(
		@Headers() headers: TelegramIdHeaderDto,
	): Promise<GetReferrerResponseDto> {
		const referrer = await this.getReferrerUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
		})

		const currencyById = new Map(
			[
				...referrer.states.map((s) => s.currMonthVolume.currency),
				...referrer.rewards.availableToWithdraw.map((a) => a.currency),
				...referrer.rewards.withdrawnRewards.map((w) => w.currency),
			].map((c) => [c.id, c]),
		)

		const prices = await this.getPriceUseCase.executeMany({
			currencies: Array.from(currencyById.values()),
		})

		return toGetReferrerResponseDto(referrer, prices)
	}

	@Post('rewards')
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
