import { Inject, Injectable } from '@nestjs/common'
import {
	ExecutorHealth,
	ExecutorHealthService,
} from '../../application/interfaces/executor-health.service'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { RIPS_CONTRACT } from './rips.constants'

@Injectable()
export class ExecutorHealthServiceImpl extends ExecutorHealthService {
	private readonly chainId: number

	constructor(
		private readonly evmClientService: EvmClientService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	async read(address: EvmAddress): Promise<ExecutorHealth> {
		const client = this.evmClientService.getClient(this.chainId)

		const [balance, pendingNonce, latestNonce] = await Promise.all([
			client.getBalance({ address }),
			client.getTransactionCount({ address, blockTag: 'pending' }),
			client.getTransactionCount({ address, blockTag: 'latest' }),
		])

		// The two nonce reads are not atomic: a transaction mined between them
		// would otherwise report a gap below zero, which has no meaning.
		const gap = Math.max(pendingNonce - latestNonce, 0)

		return { balance, pendingNonceGap: gap }
	}
}
