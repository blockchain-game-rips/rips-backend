import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
	UseInterceptors,
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { GetReferrerTierTablesUseCase } from '../../application/use-cases/get-referrer-tier-tables/get-referrer-tier-tables.use-case'
import { GetReferrerUseCase } from '../../application/use-cases/get-referrer/get-referrer.use-case'
import { QuoteWithdrawRewardUseCase } from '../../application/use-cases/quote-withdraw-reward/quote-withdraw-reward.use-case'
import { WithdrawRewardUseCase } from '../../application/use-cases/withdraw-reward/withdraw-reward.use-case'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
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
import { QuoteWithdrawRewardBodyDto } from './quote-withdraw-reward/quote-withdraw-reward.request'
import {
	QuoteWithdrawRewardResponseDto,
	toQuoteWithdrawRewardResponseDto,
} from './quote-withdraw-reward/quote-withdraw-reward.response'
import { WithdrawRewardBodyDto } from './withdraw-reward/withdraw-reward.request'
import {
	WithdrawRewardResponseDto,
	toWithdrawRewardResponseDto,
} from './withdraw-reward/withdraw-reward.response'

@Controller('referral-system')
@UseInterceptors(PriceEnrichmentInterceptor)
export class ReferralSystemController {
	constructor(
		private readonly getReferrerUseCase: GetReferrerUseCase,
		private readonly getReferrerTierTablesUseCase: GetReferrerTierTablesUseCase,
		private readonly withdrawRewardUseCase: WithdrawRewardUseCase,
		private readonly quoteWithdrawRewardUseCase: QuoteWithdrawRewardUseCase,
	) {}

	@Get('referrers')
	@ApiOperation({
		description:
			'Returns the referral state of the calling user. An address with no on-chain referral activity yet is not an error: the response is a zero state, with empty rewards and period, and the fee falling back to the global default referral fee.',
	})
	@ZodResponse({ type: GetReferrerResponseDto })
	async getReferrer(
		@Headers() headers: TelegramIdHeaderDto,
	): Promise<GetReferrerResponseDto> {
		const referrer = await this.getReferrerUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
		})

		return toGetReferrerResponseDto(referrer)
	}

	@Get('tier-tables')
	@ZodResponse({ type: GetTierTablesResponseDto })
	async getTierTables(): Promise<GetTierTablesResponseDto> {
		const tierTables = await this.getReferrerTierTablesUseCase.execute()

		return toGetTierTablesResponseDto(tierTables)
	}

	@Post('rewards')
	@HttpCode(HttpStatus.OK)
	@ZodResponse({ type: WithdrawRewardResponseDto })
	async withdrawReward(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: WithdrawRewardBodyDto,
	): Promise<WithdrawRewardResponseDto> {
		const attempt = await this.withdrawRewardUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyAddress: body.currencyAddress,
		})

		return toWithdrawRewardResponseDto(attempt)
	}

	@Post('rewards/quote')
	@ApiOperation({
		description:
			'Estimates the blockchain fee for withdrawing a referral reward in the given currency. The estimate does not depend on whether a withdrawable reward currently exists.',
	})
	@ZodResponse({ type: QuoteWithdrawRewardResponseDto })
	async quoteWithdrawReward(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteWithdrawRewardBodyDto,
	): Promise<QuoteWithdrawRewardResponseDto> {
		const quote = await this.quoteWithdrawRewardUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			currencyAddress: body.currencyAddress,
		})

		return toQuoteWithdrawRewardResponseDto(quote)
	}
}
