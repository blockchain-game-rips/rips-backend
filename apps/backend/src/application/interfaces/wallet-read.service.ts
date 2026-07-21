import { Currency } from '../../domain/entities/currency'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class WalletReadService {
	abstract balanceOf(wallet: Wallet, currency: Currency): Promise<bigint>
}
