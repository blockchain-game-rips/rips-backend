import {
	makeGaugeProvider,
	makeHistogramProvider,
} from '@willsoto/nestjs-prometheus'

export const WORKER_LAST_SUCCESS = makeGaugeProvider({
	name: 'worker_last_success_timestamp_seconds',
	help: 'Unix timestamp of the last successful worker run',
	labelNames: ['worker'],
})

export const WORKER_RUN_DURATION = makeHistogramProvider({
	name: 'worker_run_duration_seconds',
	help: 'Worker run duration in seconds, labeled by outcome',
	labelNames: ['worker', 'outcome'],
	buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
})
