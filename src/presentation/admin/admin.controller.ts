import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { SetDefaultReferralFeeUseCase } from '../../application/use-cases/set-default-referral-fee/set-default-referral-fee.use-case'
import { SetPausedUseCase } from '../../application/use-cases/set-paused/set-paused.use-case'
import { SetReferralTiersUseCase } from '../../application/use-cases/set-referral-tiers/set-referral-tiers.use-case'
import { SetReferrerFrozenUseCase } from '../../application/use-cases/set-referrer-frozen/set-referrer-frozen.use-case'
import { UpdateStakeConfigUseCase } from '../../application/use-cases/update-stake-config/update-stake-config.use-case'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toTransactionDto } from '../shared/transaction.dto'
import { AdminApiKeyGuard } from './admin-api-key.guard'
import { SetDefaultReferralFeeBodyDto } from './set-default-referral-fee/set-default-referral-fee.request'
import { SetPausedBodyDto } from './set-paused/set-paused.request'
import {
	SetReferralTiersBodyDto,
	SetReferralTiersParamsDto,
} from './set-referral-tiers/set-referral-tiers.request'
import {
	SetReferrerFrozenBodyDto,
	SetReferrerFrozenParamsDto,
} from './set-referrer-frozen/set-referrer-frozen.request'
import { AdminTransactionResponseDto } from './shared/admin-transaction.response'
import { UpdateStakeConfigBodyDto } from './update-stake-config/update-stake-config.request'

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class AdminController {
	constructor(
		private readonly setPausedUseCase: SetPausedUseCase,
		private readonly setReferrerFrozenUseCase: SetReferrerFrozenUseCase,
		private readonly setDefaultReferralFeeUseCase: SetDefaultReferralFeeUseCase,
		private readonly setReferralTiersUseCase: SetReferralTiersUseCase,
		private readonly updateStakeConfigUseCase: UpdateStakeConfigUseCase,
		private readonly currencyService: CurrencyService,
	) {}

	@Put('contract/paused')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async setPaused(
		@Body() body: SetPausedBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const transaction = await this.setPausedUseCase.execute({
			isPaused: body.isPaused,
		})

		return { transaction: toTransactionDto(transaction) }
	}

	@Put('referral/default-fee')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async setDefaultReferralFee(
		@Body() body: SetDefaultReferralFeeBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const transaction = await this.setDefaultReferralFeeUseCase.execute({
			feePercent: body.feePercent,
		})

		return { transaction: toTransactionDto(transaction) }
	}

	@Put('referral/tiers/:currency')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async setReferralTiers(
		@Param() params: SetReferralTiersParamsDto,
		@Body() body: SetReferralTiersBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const transaction = await this.setReferralTiersUseCase.execute({
			currencyAddress: params.currency,
			tiers: body.tiers,
		})

		return { transaction: toTransactionDto(transaction) }
	}

	@Put('stakes/:stakeId/config')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async updateStakeConfig(
		@Param('stakeId') stakeId: string,
		@Body() body: UpdateStakeConfigBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const {
			durationSeconds,
			feePercent,
			prizeDistribution,
			ticketCap,
			ticketPrice,
		} = body.config

		const currency = await this.currencyService.fromAccount(
			ticketPrice.currencyChainAddress as ChainAddress,
		)
		const amount = BigInt(ticketPrice.amount)

		const transaction = await this.updateStakeConfigUseCase.execute({
			stakeId: Number(stakeId),
			config: {
				//TODO: think about types, I don't neet id here
				id: 0,
				durationSeconds: durationSeconds,
				feePercent: feePercent,
				prizeDistribution: prizeDistribution.map((prize) => {
					return {
						maxPrize: BigInt(prize.maxPrize),
						minPrize: BigInt(prize.minPrize),
						prizeCount: BigInt(prize.prizeCount),
					}
				}),
				ticketCup: ticketCap,
				ticketPrice: {
					currency,
					amount,
				},
			},
		})

		return { transaction: toTransactionDto(transaction) }
	}

	@Put('referrers/:address/frozen')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async setReferrerFrozen(
		@Param() params: SetReferrerFrozenParamsDto,
		@Body() body: SetReferrerFrozenBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const transaction = await this.setReferrerFrozenUseCase.execute({
			referrer: params.address,
			frozen: body.frozen,
		})

		return { transaction: toTransactionDto(transaction) }
	}
}
