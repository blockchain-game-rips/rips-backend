import { Currency } from 'src/domain/entities/currency'
import { ChainAddress } from 'src/domain/value-objects/chain-address'

export abstract class CurrencyService {
	abstract fromAccount(account: ChainAddress): Promise<Currency>
}
