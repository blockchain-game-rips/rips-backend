import {
	Body,
	Controller,
	Get,
	Headers,
	Patch,
	Post,
	Query,
	UseInterceptors,
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { ZodResponse } from 'nestjs-zod'
import { BuyEntriesPurchaseUseCase } from '../../application/use-cases/buy-entries-purchase/buy-entries-purchase.use-case'
import { BuyEntriesZapSamechainUseCase } from '../../application/use-cases/buy-entries-zap-samechain/buy-entries-zap-samechain.use-case'
import { BuyEntriesZapUseCase } from '../../application/use-cases/buy-entries-zap/buy-entries-zap.use-case'
import { GetAvailablePresetsUseCase } from '../../application/use-cases/get-available-presets/get-available-presets.use-case'
import { GetCardCollectionUseCase } from '../../application/use-cases/get-card-collection/get-card-collection.use-case'
import { GetCardDefinitionsUseCase } from '../../application/use-cases/get-card-definitions/get-card-definitions.use-case'
import { GetFinishedRipsUseCase } from '../../application/use-cases/get-finished-rips/get-finished-rips.use-case'
import { GetOngoingRipsUseCase } from '../../application/use-cases/get-ongoing-rips/get-ongoing-rips.use-case'
import { GetPayoutsUseCase } from '../../application/use-cases/get-payouts/get-payouts.use-case'
import { GetRipsStateUseCase } from '../../application/use-cases/get-rips-state/get-rips-state.use-case'
import { GetRipsUseCase } from '../../application/use-cases/get-rips/get-rips.use-case'
import { GetZapResultUseCase } from '../../application/use-cases/get-zap-result/get-zap-result.use-case'
import { QuotePurchaseUseCase } from '../../application/use-cases/quote-purchase/quote-purchase.use-case'
import { QuoteZapSamechainUseCase } from '../../application/use-cases/quote-zap-samechain/quote-zap-samechain.use-case'
import { QuoteZapUseCase } from '../../application/use-cases/quote-zap/quote-zap.use-case'
import { RevealEntryPayoutsUseCase } from '../../application/use-cases/reveal-entry-payouts/reveal-entry-payouts.use-case'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
import {
	TELEGRAM_ID_HEADER,
	TelegramIdHeaderDto,
} from '../shared/telegram-id.header'
import { BuyEntriesPurchaseBodyDto } from './buy-entries-purchase/buy-entries-purchase.request'
import {
	BuyEntriesPurchaseResponseDto,
	toBuyEntriesPurchaseResponseDto,
} from './buy-entries-purchase/buy-entries-purchase.response'
import {
	BuyEntriesZapSamechainResponseDto,
	toBuyEntriesZapSamechainResponseDto,
} from './buy-entries-zap-samechain/buy-entries-zap-samechain.response'
import { BuyEntriesZapBodyDto } from './buy-entries-zap/buy-entries-zap.request'
import {
	BuyEntriesZapResponseDto,
	toBuyEntriesZapResponseDto,
} from './buy-entries-zap/buy-entries-zap.response'
import {
	GetCardCollectionResponseDto,
	toGetCardCollectionResponseDto,
} from './get-card-collection/get-card-collection.response'
import {
	GetCardDefinitionsResponseDto,
	toGetCardDefinitionsResponseDto,
} from './get-card-definitions/get-card-definitions.response'
import {
	decodeFinishedCursor,
	encodeFinishedCursor,
} from './get-finished-rips/finished-cursor'
import { GetFinishedRipsQueryDto } from './get-finished-rips/get-finished-rips.request'
import { GetFinishedRipsResponseDto } from './get-finished-rips/get-finished-rips.response'
import { GetOngoingRipsResponseDto } from './get-ongoing-rips/get-ongoing-rips.response'
import { GetPayoutsQueryDto } from './get-payouts/get-payouts.request'
import { GetPayoutsResponseDto } from './get-payouts/get-payouts.response'
import { GetPresetsResponseDto } from './get-presets/get-presets.response'
import { GetRipsStateResponseDto } from './get-rips-state/get-rips-state.response'
import { GetRipsQueryDto } from './get-rips/get-rips.request'
import { GetRipsResponseDto } from './get-rips/get-rips.response'
import { GetZapResultQueryDto } from './get-zap-result/get-zap-result.request'
import {
	GetZapResultResponseDto,
	toGetZapResultResponseDto,
} from './get-zap-result/get-zap-result.response'
import { QuotePurchaseBodyDto } from './quote-purchase/quote-purchase.request'
import {
	QuotePurchaseResponseDto,
	toQuotePurchaseResponseDto,
} from './quote-purchase/quote-purchase.response'
import {
	QuoteZapSamechainResponseDto,
	toQuoteZapSamechainResponseDto,
} from './quote-zap-samechain/quote-zap-samechain.response'
import { QuoteZapBodyDto } from './quote-zap/quote-zap.request'
import {
	QuoteZapResponseDto,
	toQuoteZapResponseDto,
} from './quote-zap/quote-zap.response'
import { RevealPayoutsBodyDto } from './reveal-payouts/reveal-payouts.request'
import { RevealPayoutsResponseDto } from './reveal-payouts/reveal-payouts.response'
import { toAvailablePresetDto } from './shared/available-preset.dto'
import { toPayoutDto } from './shared/payout.dto'
import { toRipDto } from './shared/rip.dto'

@Controller('rips')
@UseInterceptors(PriceEnrichmentInterceptor)
export class RipsController {
	constructor(
		private readonly getRipsStateUseCase: GetRipsStateUseCase,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly buyEntriesPurchaseUseCase: BuyEntriesPurchaseUseCase,
		private readonly buyEntriesZapUseCase: BuyEntriesZapUseCase,
		private readonly buyEntriesZapSamechainUseCase: BuyEntriesZapSamechainUseCase,
		private readonly quotePurchaseUseCase: QuotePurchaseUseCase,
		private readonly quoteZapUseCase: QuoteZapUseCase,
		private readonly quoteZapSamechainUseCase: QuoteZapSamechainUseCase,
		private readonly getZapResultUseCase: GetZapResultUseCase,
		private readonly getOngoingRipsUseCase: GetOngoingRipsUseCase,
		private readonly getFinishedRipsUseCase: GetFinishedRipsUseCase,
		private readonly getPayoutsUseCase: GetPayoutsUseCase,
		private readonly revealEntryPayoutsUseCase: RevealEntryPayoutsUseCase,
		private readonly getRipsUseCase: GetRipsUseCase,
		private readonly getCardCollectionUseCase: GetCardCollectionUseCase,
		private readonly getCardDefinitionsUseCase: GetCardDefinitionsUseCase,
	) {}

	@Get('state')
	@ZodResponse({ type: GetRipsStateResponseDto })
	async getRipsState(): Promise<GetRipsStateResponseDto> {
		const state = await this.getRipsStateUseCase.execute()

		return {
			availablePresets: state.availablePresets.map(toAvailablePresetDto),
			isPaused: state.isPaused,
		}
	}

	@Get('presets')
	@ZodResponse({ type: GetPresetsResponseDto })
	async getPresets(): Promise<GetPresetsResponseDto> {
		const presets = await this.getAvailablePresetsUseCase.execute()

		return {
			availablePresets: presets.map(toAvailablePresetDto),
		}
	}

	@Post('entries/purchase')
	@ZodResponse({ type: BuyEntriesPurchaseResponseDto })
	async buyEntriesPurchase(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: BuyEntriesPurchaseBodyDto,
	): Promise<BuyEntriesPurchaseResponseDto> {
		const purchaseReceipt = await this.buyEntriesPurchaseUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toBuyEntriesPurchaseResponseDto(purchaseReceipt)
	}

	@Post('entries/quote-purchase')
	@ZodResponse({ type: QuotePurchaseResponseDto })
	async quotePurchase(
		@Body() body: QuotePurchaseBodyDto,
	): Promise<QuotePurchaseResponseDto> {
		const quote = await this.quotePurchaseUseCase.execute({
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toQuotePurchaseResponseDto(quote)
	}

	@Post('entries/zap/crosschain')
	@ZodResponse({ type: BuyEntriesZapResponseDto })
	async buyEntriesZapCrosschain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: BuyEntriesZapBodyDto,
	): Promise<BuyEntriesZapResponseDto> {
		const pendingZap = await this.buyEntriesZapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toBuyEntriesZapResponseDto(pendingZap)
	}

	@Post('entries/zap/samechain')
	@ZodResponse({ type: BuyEntriesZapSamechainResponseDto })
	async buyEntriesZapSamechain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: BuyEntriesZapBodyDto,
	): Promise<BuyEntriesZapSamechainResponseDto> {
		const result = await this.buyEntriesZapSamechainUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toBuyEntriesZapSamechainResponseDto(result)
	}

	@Post('entries/quote-zap/crosschain')
	@ZodResponse({ type: QuoteZapResponseDto })
	async quoteZapCrosschain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteZapBodyDto,
	): Promise<QuoteZapResponseDto> {
		const quote = await this.quoteZapUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toQuoteZapResponseDto(quote)
	}

	@Post('entries/quote-zap/samechain')
	@ZodResponse({ type: QuoteZapSamechainResponseDto })
	async quoteZapSamechain(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: QuoteZapBodyDto,
	): Promise<QuoteZapSamechainResponseDto> {
		const quote = await this.quoteZapSamechainUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			presetId: body.presetId,
			entryCount: body.entryCount,
			paymentCurrencyChainAddress: body.paymentCurrencyChainAddress,
		})

		return toQuoteZapSamechainResponseDto(quote)
	}

	@Get('entries/zap/crosschain/result')
	@ZodResponse({ type: GetZapResultResponseDto })
	async getZapResult(
		@Query() query: GetZapResultQueryDto,
	): Promise<GetZapResultResponseDto> {
		const result = await this.getZapResultUseCase.execute({
			zapId: query.zapId,
		})

		return toGetZapResultResponseDto(result)
	}

	@Get('payouts')
	@ApiOperation({
		description:
			"Narrows a user's entry payouts. An omitted field applies no constraint.",
	})
	@ZodResponse({ type: GetPayoutsResponseDto })
	async getPayouts(
		@Headers() headers: TelegramIdHeaderDto,
		@Query() query: GetPayoutsQueryDto,
	): Promise<GetPayoutsResponseDto> {
		const payouts = await this.getPayoutsUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			filter: { ripId: query.ripId, revealed: query.revealed },
		})

		return {
			payouts: payouts.map(toPayoutDto),
		}
	}

	@Patch('payouts')
	@ZodResponse({ type: RevealPayoutsResponseDto })
	async revealPayouts(
		@Headers() headers: TelegramIdHeaderDto,
		@Body() body: RevealPayoutsBodyDto,
	): Promise<RevealPayoutsResponseDto> {
		const payouts = await this.revealEntryPayoutsUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
			revealAll: body.revealAll,
		})

		return {
			payouts: payouts.map(toPayoutDto),
		}
	}

	@Get('rips/ongoing')
	@ZodResponse({ type: GetOngoingRipsResponseDto })
	async getOngoingRips(): Promise<GetOngoingRipsResponseDto> {
		const rips = await this.getOngoingRipsUseCase.execute()

		return {
			rips: rips.map(toRipDto),
		}
	}

	@Get('rips')
	@ZodResponse({ type: GetRipsResponseDto })
	async getRips(
		@Query() query: GetRipsQueryDto,
	): Promise<GetRipsResponseDto> {
		const result = await this.getRipsUseCase.execute({
			ids: new Set(query.ids),
		})

		return {
			rips: result.rips.map(toRipDto),
		}
	}

	@Get('rips/finished')
	@ApiOperation({
		description:
			'Rips the backend has settled, most recently settled first. The order is by settlement time, not by rip id, so a rip that finished on chain earlier can appear later in the feed.',
	})
	@ZodResponse({ type: GetFinishedRipsResponseDto })
	async getFinishedRips(
		@Query() query: GetFinishedRipsQueryDto,
	): Promise<GetFinishedRipsResponseDto> {
		const result = await this.getFinishedRipsUseCase.execute({
			limit: query.limit,
			cursor:
				query.cursor != null
					? decodeFinishedCursor(query.cursor)
					: undefined,
		})

		return {
			rips: result.rips.map(toRipDto),
			nextCursor:
				result.nextCursor != null
					? encodeFinishedCursor(result.nextCursor)
					: null,
		}
	}

	@Get('card-collection')
	@ZodResponse({ type: GetCardCollectionResponseDto })
	async getCardCollection(
		@Headers() headers: TelegramIdHeaderDto,
	): Promise<GetCardCollectionResponseDto> {
		const tiers = await this.getCardCollectionUseCase.execute({
			telegramId: headers[TELEGRAM_ID_HEADER],
		})

		return toGetCardCollectionResponseDto(tiers)
	}

	@Get('card-definition')
	@ZodResponse({ type: GetCardDefinitionsResponseDto })
	async getCardDefinitions(): Promise<GetCardDefinitionsResponseDto> {
		const tiers = await this.getCardDefinitionsUseCase.execute()

		return toGetCardDefinitionsResponseDto(tiers)
	}
}
