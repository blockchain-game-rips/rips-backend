import { ChildProcess, spawn } from 'child_process'
import path from 'path'

const STARTUP_MARKER = 'using chain RPC data source'
const STARTUP_TIMEOUT_MS = 30_000

export type ProcessorEnv = {
	RPC_ENDPOINT: string
	CONTRACT_ADDRESS: string
	CONTRACT_DEPLOYED_AT: string
	DB_URL: string
	HEAD_POLL_INTERVAL_MS: string
}

export class Processor {
	private _process: ChildProcess | undefined
	logs: string = ''

	async start(env: ProcessorEnv) {
		const mainPath = path.resolve(__dirname, '../../lib/main.js')

		this._process = spawn('node', [mainPath], {
			env: { ...process.env, ...env },
		})

		this._process.stdout?.on('data', (data: Buffer) => {
			const text = data.toString()
			this.logs += text
			process.stderr.write(`[processor] ${text}`)
		})

		this._process.stderr?.on('data', (data: Buffer) => {
			const text = data.toString()
			this.logs += text
			process.stderr.write(`[processor] ${text}`)
		})

		await this.waitForStartup()
	}

	stop() {
		this._process?.kill('SIGTERM')
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

			this._process?.stdout?.on('data', checkLogs)
			this._process?.stderr?.on('data', checkLogs)

			this._process?.on('exit', (code) => {
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

export function useProcessor(getEnv: () => ProcessorEnv) {
	const processor = new Processor()

	beforeAll(async () => {
		await processor.start(getEnv())
	})

	afterAll(() => {
		processor.stop()
	})

	return { processor }
}
