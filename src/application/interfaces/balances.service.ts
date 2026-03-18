import { Currency } from 'src/domain/entities/currency'
import { User } from 'src/domain/entities/user'

export abstract class BalancesService {
	abstract balanceOf(user: User, currency: Currency): Promise<bigint>
}
