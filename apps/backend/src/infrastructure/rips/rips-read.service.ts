import { Inject, Injectable } from '@nestjs/common'
import { RipsReadService } from '../../application/interfaces/rips-read.service'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { ripsAbi } from './rips-abi'
import { RIPS_CONTRACT } from './rips.constants'

@Injectable()
export class RipsReadServiceImpl extends RipsReadService {
	private readonly contractAddress: EvmAddress
	private readonly chainId: number

	constructor(
		private readonly evmClientService: EvmClientService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.contractAddress = toEvmAddress(contract.address)
		this.chainId = Number(contract.chain.reference)
	}

	async isPaused(): Promise<boolean> {
		const client = this.evmClientService.getClient(this.chainId)

		return client.readContract({
			address: this.contractAddress,
			abi: ripsAbi,
			functionName: 'paused',
			args: [],
		})
	}
}
