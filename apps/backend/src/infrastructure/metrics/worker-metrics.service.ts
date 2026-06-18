import { Injectable } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Gauge, Histogram } from 'prom-client'

@Injectable()
export class WorkerMetricsService {
	constructor(
		@InjectMetric('worker_last_success_timestamp_seconds')
		private readonly lastSuccess: Gauge<string>,

		@InjectMetric('worker_run_duration_seconds')
		private readonly runDuration: Histogram<string>,
	) {}

	startRun(worker: string): (outcome: 'success' | 'failure') => void {
		const end = this.runDuration.startTimer({ worker })

		return (outcome: 'success' | 'failure') => {
			end({ outcome })

			if (outcome === 'success') {
				this.lastSuccess.set({ worker }, Date.now() / 1000)
			}
		}
	}
}
