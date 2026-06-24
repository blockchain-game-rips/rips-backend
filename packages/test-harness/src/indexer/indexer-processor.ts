import { ChildProcess, spawn } from 'child_process'
import { INDEXER_PROCESSOR_MAIN, INDEXER_ROOT } from './indexer-paths'

const STARTUP_MARKER = 'using chain RPC data source'
const STARTUP_TIMEOUT_MS = 30_000

export type ProcessorEnv = {
	RPC_ENDPOINT: string
	CONTRACT_ADDRESS: string
	CONTRACT_DEPLOYED_AT: string
	DB_URL: string
	HEAD_POLL_INTERVAL_MS: string
}

export class IndexerProcessor {
	private process: ChildProcess | undefined
	private logs = ''

	async start(env: ProcessorEnv) {
		this.process = spawn('node', [INDEXER_PROCESSOR_MAIN], {
			cwd: INDEXER_ROOT,
			env: { ...process.env, ...env },
		})

		this.captureOutput()

		await this.waitForStartup()
	}

	stop() {
		this.process?.kill('SIGTERM')
	}

	private captureOutput() {
		const onData = (data: Buffer) => {
			const text = data.toString()
			this.logs += text
			process.stderr.write(`[processor] ${text}`)
		}

		this.process?.stdout?.on('data', onData)
		this.process?.stderr?.on('data', onData)
	}

	private waitForStartup(): Promise<void> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(
					new Error(
						`Processor failed to start within ${STARTUP_TIMEOUT_MS}ms`,
					),
				)
			}, STARTUP_TIMEOUT_MS)

			const checkLogs = (data: Buffer) => {
				if (data.toString().includes(STARTUP_MARKER)) {
					clearTimeout(timer)
					resolve()
				}
			}

			this.process?.stdout?.on('data', checkLogs)
			this.process?.stderr?.on('data', checkLogs)

			this.process?.on('exit', (code) => {
				clearTimeout(timer)
				reject(
					new Error(
						`Processor exited unexpectedly with code ${code}\n${this.logs}`,
					),
				)
			})
		})
	}
}
