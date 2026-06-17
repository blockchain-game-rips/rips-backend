import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	OnchainSwapQuoteResult,
	OnchainSwapResult,
	PendingZap,
	ZapBuyResult,
	ZapQuoteBuyResult,
	ZapQuoteSwapResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'

export abstract class ZapService {
	abstract quoteBuyTickets(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<ZapQuoteBuyResult>

	abstract buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<PendingZap>

	abstract quoteSwap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<ZapQuoteSwapResult>

	abstract swap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap>

	abstract quoteSwapOnchain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<OnchainSwapQuoteResult>

	abstract swapOnchain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<OnchainSwapResult>

	abstract getBuyResult(zapId: string): Promise<ZapBuyResult | null>

	abstract getSwapResult(zapId: string): Promise<ZapSwapResult | null>
}
