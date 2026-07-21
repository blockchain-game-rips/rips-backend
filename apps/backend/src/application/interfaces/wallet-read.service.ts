import { Currency } from '../../domain/entities/currency'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class WalletReadService {
	abstract balanceOf(wallet: Wallet, currency: Currency): Promise<bigint>

	abstract balancesOf(
		wallet: Wallet,
		currencies: Currency[],
	): Promise<Map<CurrencyId, bigint>>
}
