import { Injectable } from '@nestjs/common'
import { BalancesService } from 'src/application/interfaces/balances.service'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { User } from 'src/domain/entities/user'
import { getAddress } from 'viem'
import { EvmCurrency } from './evm/primitives/currencies/currency'

@Injectable()
export class BalancesServiceImpl extends BalancesService {
	balanceOf(user: User, currency: Currency): Promise<bigint> {
		if (currency instanceof EvmCurrency) {
			const userAddress = getAddress(user.wallets[EIP155])

			const balance = currency.balanceOf(userAddress)

			return balance
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}
}
