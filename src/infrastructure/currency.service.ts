import { Injectable } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { Currency } from 'src/domain/entities/currency'
import { Account } from 'src/domain/value-objects/account'
import { toChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { EvmCurrencyService } from './evm/evm-currency.service'

const EIP155 = toChainNamespace('eip155')

@Injectable()
export class CurrencyServiceImpl extends CurrencyService {
	constructor(private readonly evmCurrencyService: EvmCurrencyService) {
		super()
	}

	async fromAccount(account: Account): Promise<Currency> {
		if (account.chain.namespace === EIP155) {
			const chainId = Number(account.chain.reference)
			return this.evmCurrencyService.getNative(chainId)
		}

		throw new Error(`Unsupported chain namespace: ${account.chain.namespace}`)
	}
}
