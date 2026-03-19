import { Injectable } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { getAddress } from 'viem'
import { EvmCurrencyService } from './evm/evm-currency.service'

@Injectable()
export class CurrencyServiceImpl extends CurrencyService {
	constructor(private readonly evmCurrencyService: EvmCurrencyService) {
		super()
	}

	async fromAccount(account: ChainAddress): Promise<Currency> {
		if (account.chain.namespace === EIP155) {
			const chainId = Number(account.chain.reference)

			const address = getAddress(account.address)

			return this.evmCurrencyService.fromAddress(address, chainId)
		}

		throw new Error(
			`Unsupported chain namespace: ${account.chain.namespace}`,
		)
	}
}
