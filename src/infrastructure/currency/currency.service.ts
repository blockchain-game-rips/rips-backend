import { Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { EIP155 } from '../../constants'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmCurrencyService } from '../evm/evm-currency.service'

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
