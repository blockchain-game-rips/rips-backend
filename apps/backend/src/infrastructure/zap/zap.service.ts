import { Injectable } from '@nestjs/common'
import { ZapService } from '../../application/interfaces/zap.service'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	PendingZap,
	SamechainEnterQuoteResult,
	SamechainEnterResult,
	SamechainSwapQuoteResult,
	SamechainSwapResult,
	ZapBuyResult,
	ZapQuoteEnterResult,
	ZapQuoteSwapResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'
import { DeBridgeService } from '../de-bridge/de-bridge.service'
import { LiFiService } from '../li-fi/li-fi.service'

@Injectable()
export class ZapServiceImpl implements ZapService {
	constructor(
		private readonly deBridgeService: DeBridgeService,
		private readonly liFiService: LiFiService,
	) {}

	quoteEnterCrosschain(
		wallet: Wallet,
		args: {
			presetId: number
			config: Config
			paymentCurrency: Currency
			entryCount: number
		},
	): Promise<ZapQuoteEnterResult> {
		return this.deBridgeService.quoteEnterCrosschain(wallet, args)
	}

	enterCrosschain(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			presetId: number
			config: Config
			entryCount: number
		},
	): Promise<PendingZap> {
		return this.deBridgeService.enterCrosschain(wallet, args)
	}

	quoteEnterSamechain(
		wallet: Wallet,
		args: {
			presetId: number
			config: Config
			paymentCurrency: Currency
			entryCount: number
		},
	): Promise<SamechainEnterQuoteResult> {
		return this.liFiService.quoteEnterSamechain(wallet, args)
	}

	enterSamechain(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			presetId: number
			config: Config
			entryCount: number
		},
	): Promise<SamechainEnterResult> {
		return this.liFiService.enterSamechain(wallet, args)
	}

	quoteSwapCrosschain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<ZapQuoteSwapResult> {
		return this.deBridgeService.quoteSwapCrosschain(wallet, args)
	}

	swapCrosschain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap> {
		return this.deBridgeService.swapCrosschain(wallet, args)
	}

	quoteSwapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapQuoteResult> {
		return this.deBridgeService.quoteSwapSamechain(wallet, args)
	}

	swapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapResult> {
		return this.deBridgeService.swapSamechain(wallet, args)
	}

	getBuyResult(zapId: string): Promise<ZapBuyResult | null> {
		return this.deBridgeService.getBuyResult(zapId)
	}

	getSwapResult(zapId: string): Promise<ZapSwapResult | null> {
		return this.deBridgeService.getSwapResult(zapId)
	}
}
