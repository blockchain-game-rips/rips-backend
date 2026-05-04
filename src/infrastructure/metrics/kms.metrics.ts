import {
	makeCounterProvider,
	makeHistogramProvider,
} from '@willsoto/nestjs-prometheus'

export const KMS_OPERATION_DURATION = makeHistogramProvider({
	name: 'kms_operation_duration_seconds',
	help: 'Duration of KMS signing operations in seconds',
	labelNames: ['provider', 'operation'],
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const KMS_OPERATIONS_TOTAL = makeCounterProvider({
	name: 'kms_operations_total',
	help: 'Total number of KMS operations, labeled by outcome',
	labelNames: ['provider', 'operation', 'outcome'],
})
