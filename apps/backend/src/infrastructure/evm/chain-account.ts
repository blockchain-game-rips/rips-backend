import { EvmAddress } from '../../domain/value-objects/evm-address'

/**
 * One account on one EVM chain. Nonces, balances and allowances are all held
 * per account per chain, so the pair travels together wherever they do.
 */
export type ChainAccount = {
	address: EvmAddress
	chainId: number
}
