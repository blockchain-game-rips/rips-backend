import {
	Body,
	Controller,
	Get,
	Param,
	Put,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common'
import { ApiHeader } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetAdminWalletUseCase } from '../../application/use-cases/get-admin-wallet/get-admin-wallet.use-case'
import { SetDefaultReferralFeeUseCase } from '../../application/use-cases/set-default-referral-fee/set-default-referral-fee.use-case'
import { SetPausedUseCase } from '../../application/use-cases/set-paused/set-paused.use-case'
import { SetReferralTiersUseCase } from '../../application/use-cases/set-referral-tiers/set-referral-tiers.use-case'
import { SetReferrerCustomFeeUseCase } from '../../application/use-cases/set-referrer-custom-fee/set-referrer-custom-fee.use-case'
import { SetReferrerFrozenUseCase } from '../../application/use-cases/set-referrer-frozen/set-referrer-frozen.use-case'
import { UpdatePresetConfigUseCase } from '../../application/use-cases/update-preset-config/update-preset-config.use-case'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
import { toTransactionDto } from '../shared/transaction.dto'
import { AdminApiKeyGuard } from './admin-api-key.guard'
import { ADMIN_API_KEY_HEADER } from './admin-api-key.header'
import { SetDefaultReferralFeeBodyDto } from './set-default-referral-fee/set-default-referral-fee.request'
import { SetPausedBodyDto } from './set-paused/set-paused.request'
import {
	SetReferralTiersBodyDto,
	SetReferralTiersParamsDto,
} from './set-referral-tiers/set-referral-tiers.request'
import {
	SetReferrerCustomFeeBodyDto,
	SetReferrerCustomFeeParamsDto,
} from './set-referrer-custom-fee/set-referrer-custom-fee.request'
import {
	SetReferrerFrozenBodyDto,
	SetReferrerFrozenParamsDto,
} from './set-referrer-frozen/set-referrer-frozen.request'
import { AdminTransactionResponseDto } from './shared/admin-transaction.response'
import {
	AdminWalletResponseDto,
	toAdminWalletResponseDto,
} from './shared/admin-wallet.response'
import { UpdatePresetConfigBodyDto } from './update-preset-config/update-preset-config.request'

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
@UseInterceptors(PriceEnrichmentInterceptor)
@ApiHeader({ name: ADMIN_API_KEY_HEADER, required: true })
export class AdminController {
	constructor(
		private readonly getAdminWalletUseCase: GetAdminWalletUseCase,
		private readonly setPausedUseCase: SetPausedUseCase,
		private readonly setReferrerFrozenUseCase: SetReferrerFrozenUseCase,
		private readonly setDefaultReferralFeeUseCase: SetDefaultReferralFeeUseCase,
		private readonly setReferralTiersUseCase: SetReferralTiersUseCase,
		private readonly updatePresetConfigUseCase: UpdatePresetConfigUseCase,
		private readonly setReferrerCustomFeeUseCase: SetReferrerCustomFeeUseCase,
		private readonly currencyService: CurrencyService,
	) {}

	@Get()
	@ZodResponse({ type: AdminWalletResponseDto })
	async getAdminWallet(): Promise<AdminWalletResponseDto> {
		const result = await this.getAdminWalletUseCase.execute()

		return toAdminWalletResponseDto(result)
	}

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
			feeBps: body.feeBps,
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

	@Put('presets/:presetId/config')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async updatePresetConfig(
		@Param('presetId') presetId: string,
		@Body() body: UpdatePresetConfigBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const {
			durationSeconds,
			feeBps,
			payoutDistribution,
			entryCap,
			entryPrice,
		} = body.config

		const currency = await this.currencyService.fromAccount(
			entryPrice.currencyChainAddress as ChainAddress,
		)

		const transaction = await this.updatePresetConfigUseCase.execute({
			presetId: Number(presetId),
			config: {
				durationSeconds: durationSeconds,
				feeBps: feeBps,
				payoutDistribution: payoutDistribution,
				entryCap: entryCap,
				entryPrice: {
					currency,
					amount: entryPrice.amount,
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

	@Put('referrers/:address/custom-fee')
	@ZodResponse({ type: AdminTransactionResponseDto })
	async setReferrerCustomFee(
		@Param() params: SetReferrerCustomFeeParamsDto,
		@Body() body: SetReferrerCustomFeeBodyDto,
	): Promise<AdminTransactionResponseDto> {
		const transaction = await this.setReferrerCustomFeeUseCase.execute({
			referrer: params.address,
			feeBps: body.feeBps,
		})

		return { transaction: toTransactionDto(transaction) }
	}
}
