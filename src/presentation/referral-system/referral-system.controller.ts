import { Body, Controller, Get, Headers, Post } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { PriceProvider } from '../../application/interfaces/price-service'
import { GetReferrerTierTablesUseCase } from '../../application/use-cases/get-referrer-tier-tables/get-referrer-tier-tables.use-case'
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
import {
	GetTierTablesResponseDto,
	toGetTierTablesResponseDto,
} from './get-tier-tables/get-tier-tables.response'
import { WithdrawRewardBodyDto } from './withdraw-reward/withdraw-reward.request'
import {
	WithdrawRewardResponseDto,
	toWithdrawRewardResponseDto,
} from './withdraw-reward/withdraw-reward.response'

@Controller('referral-system')
export class ReferralSystemController {
	constructor(
		private readonly getReferrerUseCase: GetReferrerUseCase,
		private readonly getReferrerTierTablesUseCase: GetReferrerTierTablesUseCase,
		private readonly withdrawRewardUseCase: WithdrawRewardUseCase,
		private readonly priceProvider: PriceProvider,
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
			referrer.states.map((referrerState) => [
				referrerState.currency.id,
				referrerState.currency,
			]),
		)

		const prices = await this.priceProvider.getPrices(
			Array.from(currencyById.values()),
		)

		return toGetReferrerResponseDto(referrer, prices)
	}

	@Get('tier-tables')
	@ZodResponse({ type: GetTierTablesResponseDto })
	async getTierTables(): Promise<GetTierTablesResponseDto> {
		const tierTables = await this.getReferrerTierTablesUseCase.execute()

		const currencyById = new Map(
			tierTables.map((t) => [t.currency.id, t.currency]),
		)

		const prices = await this.priceProvider.getPrices(
			Array.from(currencyById.values()),
		)

		return toGetTierTablesResponseDto(tierTables, prices)
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

		const priceUsd = await this.priceProvider.getPrice(
			reward.amount.currency,
		)

		return toWithdrawRewardResponseDto(reward, priceUsd)
	}
}
