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

export abstract class ZapService {
	abstract quoteEnterCrosschain(
		wallet: Wallet,
		args: {
			presetId: number
			config: Config
			paymentCurrency: Currency
			entryCount: number
		},
	): Promise<ZapQuoteEnterResult>

	abstract enterCrosschain(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			presetId: number
			config: Config
			entryCount: number
		},
	): Promise<PendingZap>

	abstract quoteEnterSamechain(
		wallet: Wallet,
		args: {
			presetId: number
			config: Config
			paymentCurrency: Currency
			entryCount: number
		},
	): Promise<SamechainEnterQuoteResult>

	abstract enterSamechain(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			presetId: number
			config: Config
			entryCount: number
		},
	): Promise<SamechainEnterResult>

	abstract quoteSwapCrosschain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<ZapQuoteSwapResult>

	abstract swapCrosschain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap>

	abstract quoteSwapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapQuoteResult>

	abstract swapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapResult>

	abstract getBuyResult(zapId: string): Promise<ZapBuyResult | null>

	abstract getSwapResult(zapId: string): Promise<ZapSwapResult | null>
}
