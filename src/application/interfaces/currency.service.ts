import { Currency } from 'src/domain/entities/currency'
import { Account } from 'src/domain/value-objects/account'

export abstract class CurrencyService {
	abstract fromAccount(account: Account): Promise<Currency>
}
