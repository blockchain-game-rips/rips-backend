import { Wallet } from '../value-objects/wallet'

export type Executor = {
	id: bigint
	wallet: Wallet
}
