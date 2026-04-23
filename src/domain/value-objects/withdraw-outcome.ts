import { Transaction } from './transaction'
import { PendingZap } from './zap'

export type WithdrawOutcome =
	| { type: 'transferred'; transaction: Transaction }
	| { type: 'zap'; pendingZap: PendingZap }
