import {
	makeCounterProvider,
	makeGaugeProvider,
} from '@willsoto/nestjs-prometheus'

/**
 * Denominated in ether rather than wei: float64 loses integer precision above
 * roughly 9e15 wei, which is already hundredths of an ether.
 */
export const EXECUTOR_NATIVE_BALANCE = makeGaugeProvider({
	name: 'executor_native_balance_eth',
	help: 'Native currency balance of an executor wallet, in ether',
	labelNames: ['executor'],
})

export const EXECUTOR_PENDING_NONCE_GAP = makeGaugeProvider({
	name: 'executor_pending_nonce_gap',
	help: 'Pending minus latest nonce of an executor wallet; a sustained positive value means a stuck queue',
	labelNames: ['executor'],
})

export const KEEPER_ACTIONS_TOTAL = makeCounterProvider({
	name: 'keeper_actions_total',
	help: 'Total keeper actions sent on chain, labeled by action and transaction outcome',
	labelNames: ['executor', 'action', 'outcome'],
})
