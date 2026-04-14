import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'

export abstract class CurrencyService {
	abstract fromAccount(account: ChainAddress): Promise<Currency>
}
