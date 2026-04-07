import { ChildProcess, exec } from 'child_process'
import getPort from 'get-port'
import { Chain, Client, defineChain, toHex } from 'viem'
import { Address } from 'viem/accounts'
import * as chains from 'viem/chains'
import { AnvilConfig, ParamsUseAnvil } from './types'

/* ======== useAnvil ======== */

const testMnemonic =
	'spy record fury either collect ill pony monkey praise cool matter state'

/**
 * Starts anvil in describe() and replace viem rpc url and private key
 */
export function useAnvil(paramsUseAnvil: ParamsUseAnvil | ParamsUseAnvil[]) {
	const anvilAndChains: { anvil: Anvil; chain: Chain }[] = []

	if (paramsUseAnvil instanceof Array) {
		paramsUseAnvil.forEach((params) =>
			anvilAndChains.push(createAnvil(params)),
		)
	} else {
		anvilAndChains.push(createAnvil(paramsUseAnvil))
	}

	beforeAll(async () => {
		const anvilStartPromises = anvilAndChains.map((anvilAndChain) =>
			anvilAndChain.anvil.start(),
		)

		await Promise.all(anvilStartPromises)
	})

	afterAll(() => {
		anvilAndChains.forEach((anvilAndChain) => anvilAndChain.anvil.stop())
	})

	return {
		anvils: anvilAndChains.map((anvilAndChain) => anvilAndChain.anvil),
	}
}

function createAnvil(paramsUseAnvil: ParamsUseAnvil) {
	let chain: chains.Chain | undefined

	chain = Object.values(chains).find(
		(chain) => chain.id === paramsUseAnvil.chainId,
	)

	if (!chain) {
		chain = createUnknownChain(paramsUseAnvil)
	}

	const defaultRpcUrl = chain.rpcUrls.default.http[0]

	const anvil = new Anvil({
		...paramsUseAnvil,
		fork: paramsUseAnvil.fork
			? {
					rpcUrl: paramsUseAnvil.fork.rpcUrl ?? defaultRpcUrl,
					blockNumber: paramsUseAnvil.fork.blockNumber,
				}
			: undefined,
	})

	return { anvil, chain }
}

function createUnknownChain(anvilConfig: ParamsUseAnvil) {
	if (anvilConfig.fork) {
		if (!anvilConfig.fork.rpcUrl)
			throw new Error(
				`Chain with id ${anvilConfig.chainId} not found in viem chains and no rpcUrl provided for creating unknown chain`,
			)

		return defineChain({
			...unknowChain(anvilConfig.chainId),
			rpcUrls: {
				default: { http: [anvilConfig.fork.rpcUrl] },
			},
		})
	} else {
		return defineChain({
			...unknowChain(anvilConfig.chainId),
			rpcUrls: {
				default: { http: ['http://localhost:8545'] },
			},
		})
	}
}

function unknowChain(id: number) {
	return {
		id: id,
		name: 'Unknown chain',
		nativeCurrency: {
			name: 'Unknown currency',
			symbol: 'UNKNOWN',
			decimals: 18,
		},
	}
}

export class Anvil {
	readonly config: ParamsUseAnvil
	private _port: number | undefined
	private _process: ChildProcess | undefined
	logs: string = ''

	get port() {
		if (!this._port) {
			throw new Error('Anvil not started')
		}

		return this._port
	}

	get process() {
		if (!this._process) {
			throw new Error('Anvil not started')
		}

		return this._process
	}

	constructor(config: AnvilConfig) {
		this.config = config
	}

	public async start() {
		this._port = this.config.port ?? (await getPort())

		const command = this.buildCommand()

		this._process = exec(command)

		this._process.stdout?.on('data', (data) => {
			this.logs += data.toString()
		})

		this._process.stderr?.on('data', (data) => {
			this.logs += data.toString()
		})

		await this.onAnvilStart()
	}

	public stop() {
		if (this.process) {
			this.process.kill('SIGTERM')
		}
	}

	logFromLastEthCall() {
		const lastEthCallIdx = this.logs.lastIndexOf('eth_call')

		if (lastEthCallIdx !== -1) {
			console.log(`last eth_call: ${this.logs.slice(lastEthCallIdx)}`)
		} else {
			console.log('No eth_call found in logs')
		}
	}

	private buildCommand() {
		let command = `anvil --chain-id ${this.config.chainId} --port ${this.port} --mnemonic "${testMnemonic}"`

		if (this.config.fork) {
			command += ` --fork-url "${this.config.fork.rpcUrl}"`

			if (typeof this.config.fork.blockNumber === 'number') {
				command += ` --fork-block-number ${this.config.fork.blockNumber}`
			}
		}

		if (typeof this.config.blockTime === 'number') {
			command += ` --block-time ${this.config.blockTime}`
		}

		if (this.config.printTraces) {
			command += ` --print-traces`
		}

		if (this.config.pathToState) {
			command += ` --load-state "${this.config.pathToState}"`
		}

		return command
	}

	private onAnvilStart() {
		return new Promise<void>((resolve, reject) => {
			const anvilProcess = this.process

			anvilProcess?.stdout?.on('data', (data) => {
				if (
					(data as string).includes(
						`Listening on 127.0.0.1:${this.port}`,
					)
				) {
					resolve()
				}
			})

			anvilProcess?.stderr?.on('data', (data) => {
				if ((data as string).includes('Error:')) {
					console.log(data)
					reject(new Error('Anvil failed to start'))
					process.exit(1)
				}
			})

			const timer = setTimeout(() => {
				reject(new Error('Anvil failed to start'))
			}, this.config.timeoutStartAnvil || 5000)

			anvilProcess?.stdout?.on('data', () => clearTimeout(timer))
		})
	}
}

/* ======== storage helpers ======== */

export async function setTokenBalance(
	userAddress: Address,
	tokenAddress: Address,
	balance: bigint,
	client: Client,
) {
	await client.request({
		// @ts-expect-error viem doesn't know about this method
		method: 'anvil_dealERC20',
		params: [userAddress, tokenAddress, toHex(balance, { size: 32 })],
	})
}

export async function setNativeBalance(
	client: Client,
	address: Address,
	balance: bigint,
) {
	await client.request({
		// @ts-expect-error viem doesn't know about this method
		method: 'anvil_setBalance',
		params: [address, toHex(balance, { size: 32 })],
	})
}

export async function increaseTime(client: Client, seconds: number) {
	await client.request({
		// @ts-expect-error viem doesn't know about this method
		method: 'evm_increaseTime',
		params: [toHex(seconds)],
	})
	await client.request({
		// @ts-expect-error viem doesn't know about this method
		method: 'anvil_mine',
		params: [],
	})
}
