import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import {
	GetCompletedRipsArgs,
	RipRepository,
} from '../../application/interfaces/repositories/rip.repository'
import { CompletedRip, isCompletedRip, Rip } from '../../domain/entities/rip'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerPrismaService } from './indexer-prisma.service'
import { INDEXER_TTL_MS } from './indexer.constants'
import { ripInclude, RipRaw, toRip } from './utils'

@Injectable()
export class IndexerRipRepository extends RipRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerPrismaService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	private toRip(ripRaw: RipRaw): Promise<Rip> {
		return toRip(ripRaw, this.evmCurrencyService, this.chainId)
	}

	// rip.id is a stringified uint stored as varchar, so it must be
	// ordered/compared numerically rather than lexicographically.
	private async findCompletedRipIds(
		afterRipId: bigint | null,
		limit: number,
	): Promise<string[]> {
		const rows = await this.indexer.$queryRaw<{ id: string }[]>`
			SELECT id
			FROM rip
			WHERE status IN ('CLAIMED', 'REFUNDED')
				AND (${afterRipId}::numeric IS NULL OR id::numeric > ${afterRipId}::numeric)
			ORDER BY id::numeric ASC
			LIMIT ${limit}
		`

		return rows.map((row) => row.id)
	}

	private async loadRipsByIdsOrdered(ids: string[]): Promise<Rip[]> {
		if (ids.length === 0) {
			return []
		}

		const rips = await this.indexer.rip.findMany({
			where: { id: { in: ids } },
			include: ripInclude,
		})

		const byId = new Map<string, RipRaw>(rips.map((r) => [r.id, r]))

		const ordered = ids
			.map((id) => byId.get(id))
			.filter((r): r is RipRaw => r != null)

		return Promise.all(ordered.map((r) => this.toRip(r)))
	}

	async getCompletedRips({
		limit,
		cursor,
	}: GetCompletedRipsArgs): Promise<CompletedRip[]> {
		const rips = await withCache(
			this.cacheManager,
			`indexer-completed-rips-${limit}-${cursor ?? ''}`,
			INDEXER_TTL_MS,
			async () => {
				const ids = await this.findCompletedRipIds(
					cursor != null ? BigInt(cursor) : null,
					limit,
				)

				return this.loadRipsByIdsOrdered(ids)
			},
		)

		return rips.filter(isCompletedRip)
	}

	async getRipsByIds(ids: Set<number>): Promise<Rip[]> {
		const sortedIds = [...ids].sort((a, b) => a - b)

		return withCache(
			this.cacheManager,
			`indexer-rips-by-ids-${sortedIds.join(',')}`,
			INDEXER_TTL_MS,
			() => this.loadRipsByIdsOrdered(sortedIds.map(String)),
		)
	}

	async getNextCompletedRip(
		afterRipId: number,
	): Promise<CompletedRip | null> {
		const rips = await withCache(
			this.cacheManager,
			`indexer-next-completed-rip-${afterRipId}`,
			INDEXER_TTL_MS,
			async () => {
				const ids = await this.findCompletedRipIds(
					BigInt(afterRipId),
					1,
				)

				return this.loadRipsByIdsOrdered(ids)
			},
		)

		const rip = rips[0]

		if (rip == null || !isCompletedRip(rip)) {
			return null
		}

		return rip
	}
}
