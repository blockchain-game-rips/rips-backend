import { Address, getAddress, isAddress } from 'viem'
import { EvmClientService } from '../../evm-client/evm-client.service'

export abstract class BaseContract {
	public readonly address: Address

	constructor(
		public readonly evmClientService: EvmClientService,
		address: Address,
		public readonly chainId: number,
	) {
		this.validateAddress(address)
		this.address = getAddress(address)
	}

	private validateAddress(address: Address) {
		if (!isAddress(address)) {
			throw new Error(`Contract address is invalid `)
		}
	}

	get client() {
		return this.evmClientService.getClient(this.chainId)
	}
}
