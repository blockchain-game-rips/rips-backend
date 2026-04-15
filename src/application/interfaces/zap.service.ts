import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	PendingZap,
	ZapBuyResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'

export abstract class ZapService {
	abstract quote(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<bigint>

	abstract buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<PendingZap>

	abstract swap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap>

	abstract waitForSwap(pendingZap: PendingZap): Promise<ZapSwapResult>

	abstract waitForBuyTickets(pendingZap: PendingZap): Promise<ZapBuyResult>
}
