import { Injectable } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Gauge } from 'prom-client'
import { formatEther } from 'viem'
import { ExecutorHealth } from '../../application/interfaces/executor-health.service'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { TransactionAttempt } from '../../domain/value-objects/transaction-attempt'

export type KeeperActionName = 'claim' | 'refund' | 'request-vrf'

@Injectable()
export class KeeperMetricsService {
	constructor(
		@InjectMetric('executor_native_balance_eth')
		private readonly nativeBalance: Gauge<string>,

		@InjectMetric('executor_pending_nonce_gap')
		private readonly pendingNonceGap: Gauge<string>,

		@InjectMetric('keeper_actions_total')
		private readonly actionsTotal: Counter<string>,
	) {}

	recordHealth(executor: EvmAddress, health: ExecutorHealth): void {
		this.nativeBalance.set(
			{ executor },
			Number(formatEther(health.balance)),
		)

		this.pendingNonceGap.set({ executor }, health.pendingNonceGap)
	}

	countAction(
		executor: EvmAddress,
		action: KeeperActionName,
		attempt: TransactionAttempt,
	): void {
		this.actionsTotal.inc({ executor, action, outcome: attempt.status })
	}
}
