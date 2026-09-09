import { EvmAddress } from '../../domain/value-objects/evm-address'

export type ExecutorHealth = {
	/** Native currency balance, in wei. */
	balance: bigint

	/** Pending minus latest nonce; a sustained positive value means a stuck queue. */
	pendingNonceGap: number
}

/**
 * Reads liveness signals of an executor wallet on the chain the keeper sends to.
 */
export abstract class ExecutorHealthService {
	abstract read(address: EvmAddress): Promise<ExecutorHealth>
}
