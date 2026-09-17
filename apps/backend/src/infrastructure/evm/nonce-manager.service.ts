import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { ChainAccount } from './chain-account'
import { EvmClientService } from './evm-client/evm-client.service'

/**
 * Long enough to span a send that waits for the first receipt, short enough
 * that a counter cannot outlive the request that created it. The app exports
 * private keys, so a user can send transactions the backend never sees and any
 * longer-lived counter would go stale.
 */
const NONCE_TTL_MS = 30_000

/** A write must not resurrect a counter whose window has already closed. */
const MIN_TTL_MS = 1

/**
 * Hands out nonces for consecutive sends from one account.
 *
 * The RPC path is eventually consistent: reading the nonce back right after a
 * send is not guaranteed to reflect it, so consecutive sends can be handed the
 * same one. The cached counter is the caller's own read-your-writes view,
 * written once from the node and advanced locally from then on.
 */
@Injectable()
export class NonceManagerService {
	constructor(
		private readonly evmClientService: EvmClientService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	/**
	 * Reserves the next nonce, reading from the node only when no counter is
	 * cached. The reservation is spent whether or not the send succeeds, so a
	 * failed send must release it.
	 *
	 * `withCache` does not fit here: it returns what it stores, while a
	 * reservation returns one value and stores its successor.
	 */
	async reserve(account: ChainAccount): Promise<number> {
		const key = nonceKey(account)

		const cached = await this.cacheManager.get<number>(key)

		if (cached === undefined) {
			const nonce = await this.evmClientService
				.getClient(account.chainId)
				.getTransactionCount({
					address: account.address,
					blockTag: 'pending',
				})

			await this.cacheManager.set(key, nonce + 1, NONCE_TTL_MS)

			return nonce
		}

		await this.cacheManager.set(
			key,
			cached + 1,
			await this.remainingTtl(key),
		)

		return cached
	}

	/**
	 * Drops the counter so the next send reads the node again. A failed send
	 * leaves a hole at the reserved nonce, and only the node knows whether the
	 * transaction was really broadcast.
	 */
	async release(account: ChainAccount): Promise<void> {
		await this.cacheManager.del(nonceKey(account))
	}

	/**
	 * The TTL runs from the first read, so an advancing counter expires on
	 * schedule instead of being kept alive by its own use. The cache reports an
	 * absolute expiry while writes take a duration, so it is converted back.
	 */
	private async remainingTtl(key: string): Promise<number> {
		const expiresAt = await this.cacheManager.ttl(key)

		if (expiresAt === undefined) return NONCE_TTL_MS

		return Math.max(expiresAt - Date.now(), MIN_TTL_MS)
	}
}

/* ======== helpers ======== */

function nonceKey({ chainId, address }: ChainAccount): string {
	return `nonce-${chainId}-${address}`
}
