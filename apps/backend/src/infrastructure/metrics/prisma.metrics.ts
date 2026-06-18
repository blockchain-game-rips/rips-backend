import { makeHistogramProvider } from '@willsoto/nestjs-prometheus'

export const PRISMA_QUERY_DURATION = makeHistogramProvider({
	name: 'prisma_query_duration_seconds',
	help: 'Duration of Prisma database queries in seconds',
	labelNames: [],
	buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})
