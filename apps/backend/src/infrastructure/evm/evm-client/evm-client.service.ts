import { Inject, Injectable, Optional } from '@nestjs/common'
import {
	Chain,
	createPublicClient,
	fallback,
	FallbackTransport,
	http,
	HttpTransportConfig,
	PublicClient,
	Transport,
} from 'viem'
import * as chains from 'viem/chains'
import { createCustomError } from '../../../utils/common'
import { EvmRpcMetricsService } from '../../metrics/evm-rpc-metrics.service'
import { EVM_CLIENT_CONFIG, ResolvedEvmClientConfig } from './types'

// Batches are re-split across upstreams by the proxy, and a batch response is
// HTTP 200 even when every sub-request inside it failed. Smaller batches keep
// that blast radius small.
const DEFAULT_BATCH_SIZE = 50

// The proxy's own per-call budget is 2s, spent across its retries and hedges.
// Sitting just above it means a slow call surfaces as the proxy's own error,
// naming the upstream that failed, rather than as an opaque client-side abort.
const REQUEST_TIMEOUT_MS = 2_500

// Both values are what the client carried before retries were handed to the
// proxy.
const RETRY_COUNT = 3
const RETRY_DELAY_MS = 500

@Injectable()
export class EvmClientService {
	constructor(
		@Inject(EVM_CLIENT_CONFIG)
		private readonly config?: ResolvedEvmClientConfig,

		@Optional()
		private readonly evmRpcMetrics?: EvmRpcMetricsService,
	) {}

	public customError = createCustomError('ChainClientService')

	private clients: Map<
		number,
		PublicClient<FallbackTransport, Chain, undefined, undefined>
	> = new Map()

	/**
	 * Creates new client for passed chainId, or retrieves instance if it already exists
	 * @param chainId
	 * @returns PublicClient
	 * @dev If custom rpc url is set, it will be used ONCE the client is created
	 */
	getClient(
		chainId: number,
	): PublicClient<FallbackTransport, Chain, undefined, undefined> {
		const existingClient = this.clients.get(chainId)

		if (existingClient) {
			return existingClient
		}

		const chain = this.getChain(chainId)
		const transport = this.getTransport(chainId)

		const client = createPublicClient<
			FallbackTransport,
			Chain,
			undefined,
			undefined
		>({
			chain,
			transport,
		})

		this.clients.set(chainId, client)

		return client
	}

	getTransport(chainId: number): FallbackTransport {
		const chain = this.findChainById(chainId)

		const transports: Transport[] = []

		const batchSize =
			this.config?.rpcSettings?.[chainId]?.batchSize || DEFAULT_BATCH_SIZE

		const defaultTransportConfig: HttpTransportConfig = {
			timeout: REQUEST_TIMEOUT_MS,
			batch: {
				batchSize: batchSize,
			},
		}

		const chainName = this.getChainNameById(chainId)

		const wrap = (t: Transport): Transport =>
			this.evmRpcMetrics
				? this.evmRpcMetrics.wrapTransport(t, chainName)
				: t

		/* ======== Insert Default Transport ======== */

		const disableDefaultRpcUrl =
			this.config?.rpcSettings?.[chainId]?.disableDefaultRpcUrl

		const defaultRpcUrl = chain.rpcUrls.default.http[0]

		if (defaultRpcUrl && !disableDefaultRpcUrl) {
			transports.push(wrap(http(defaultRpcUrl, defaultTransportConfig)))
		}

		/* ======== Insert Additional Transports ======== */

		const additionalRpcUrls = this.config?.rpcSettings?.[chainId]?.rpcUrls

		if (additionalRpcUrls) {
			additionalRpcUrls.forEach((rpcUrl) => {
				transports.push(wrap(http(rpcUrl, defaultTransportConfig)))
			})
		}

		/* ======== Build Fallback Transport ======== */

		// Retries were handed to the proxy alone, and consecutive sends started
		// failing with "nonce too low" right after. Restored here to test that
		// connection: viem probes eth_fillTransaction before every send, and
		// without a retry the first failure drops it onto a separate nonce read.
		return fallback(transports, {
			retryCount: RETRY_COUNT,
			retryDelay: RETRY_DELAY_MS,
			// rank: true results in strange behavior
			// significantly slows down process while doing many requests
			rank: false,
		})
	}

	getChain(chainId: number): Chain {
		const chain = this.findChainById(chainId)
		return {
			...chain,
			fees: {
				baseFeeMultiplier: () => 1.5,
			},
		}
	}

	findChainById(chainId: number): Chain {
		let chain: Chain | undefined = Object.values(chains).find(
			(chain) => chain.id === chainId,
		)

		if (!chain) {
			chain = this.config?.customChains?.find(
				(chain) => chain.id === chainId,
			)
		}

		if (!chain) {
			throw new this.customError(
				`Chain with id ${chainId} not found in viem chains and custom chains`,
			)
		}

		return chain
	}

	findChainByName(chainName: string): Chain {
		chainName = chainName.toLowerCase()

		if (chainName === 'bsc' || chainName === 'bnb') return chains.bsc

		if (chainName === 'ethereum' || chainName === 'mainnet')
			return chains.mainnet

		const chain = Object.values(chains).find((chain) => {
			if (chain.name.toLowerCase().includes('testnet')) return false
			if (chain.name.toLowerCase().includes('goerli')) return false
			if (chain.name.toLowerCase().includes('sepolia')) return false
			return chain.name.toLowerCase().includes(chainName.toLowerCase())
		})
		return chain as Chain
	}

	clearClients(): void {
		this.clients.clear()
	}

	getChainNameById(id: number): string {
		const fullName = this.findChainById(id).name
		const keywords = ['Mainnet']

		const nameWithoutKeywords = keywords
			.reduce((acc, keyword) => {
				return acc.replace(keyword, '')
			}, fullName)
			.trim()

		return nameWithoutKeywords
	}
}
