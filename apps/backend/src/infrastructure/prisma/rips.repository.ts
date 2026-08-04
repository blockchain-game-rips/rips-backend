import { Inject, Injectable } from '@nestjs/common'
import { PresetRepository } from '../../application/interfaces/repositories/preset.repository'
import {
	FinishedCursor,
	FinishedPage,
	GetFinishedRipsArgs,
	RipRepository,
} from '../../application/interfaces/repositories/rip.repository'
import {
	isFinishedRip,
	OngoingRip,
	Rip,
	RipStatus,
	SettlingRip,
	SettlingStatus,
} from '../../domain/entities/rip'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { IndexerPrismaService } from '../indexer/indexer-prisma.service'
import {
	ON_CHAIN_TERMINAL_STATUSES,
	ripInclude,
	RipRaw,
	toRip,
} from '../indexer/utils'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { PrismaService } from './prisma.service'

type OnChainTerminalStatus = (typeof ON_CHAIN_TERMINAL_STATUSES)[number]

const SETTLING_STATUS_BY_ON_CHAIN_STATUS: Record<
	OnChainTerminalStatus,
	SettlingStatus
> = {
	CLAIMED: RipStatus.CLAIM_SETTLING,
	REFUNDED: RipStatus.REFUND_SETTLING,
}

function toSettlingStatus(onChainStatus: string): SettlingStatus | null {
	return isOnChainTerminalStatus(onChainStatus)
		? SETTLING_STATUS_BY_ON_CHAIN_STATUS[onChainStatus]
		: null
}

function isOnChainTerminalStatus(
	status: string,
): status is OnChainTerminalStatus {
	const terminalStatuses: readonly string[] = ON_CHAIN_TERMINAL_STATUSES

	return terminalStatuses.includes(status)
}

@Injectable()
export class PrismaRipRepository extends RipRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerPrismaService,
		private readonly prisma: PrismaService,
		private readonly presetRepository: PresetRepository,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	private toRip(ripRaw: RipRaw): Promise<Rip> {
		return toRip(ripRaw, this.evmCurrencyService, this.chainId)
	}

	// rip.id is a stringified uint stored as varchar while SyncedRip.ripId is an
	// int, so the two are matched on the numeric value rather than the text.
	private async findUnsyncedTerminalRipIds(): Promise<string[]> {
		const terminalRows = await this.indexer.$queryRaw<
			{ id: string; ripId: number }[]
		>`
			SELECT id, (id::numeric)::int AS "ripId"
			FROM rip
			WHERE status IN ('CLAIMED', 'REFUNDED')
		`

		if (terminalRows.length === 0) {
			return []
		}

		const syncedRows = await this.prisma.syncedRip.findMany({
			where: { ripId: { in: terminalRows.map((row) => row.ripId) } },
			select: { ripId: true },
		})

		const syncedIds = new Set(syncedRows.map((row) => row.ripId))

		return terminalRows
			.filter((row) => !syncedIds.has(row.ripId))
			.map((row) => row.id)
	}

	private async hydrateSettlingRips(ids: string[]): Promise<SettlingRip[]> {
		if (ids.length === 0) {
			return []
		}

		const ripsRaw = await this.indexer.rip.findMany({
			where: { id: { in: ids } },
			include: ripInclude,
		})

		const rips = await Promise.all(
			ripsRaw.map(async (ripRaw) => {
				const settlingStatus = toSettlingStatus(ripRaw.status)

				if (settlingStatus == null) {
					return null
				}

				const rip = await this.toRip(ripRaw)

				return { ...rip, status: settlingStatus }
			}),
		)

		return rips.filter((rip): rip is SettlingRip => rip != null)
	}

	private async loadRipsByIdsOrdered(ids: string[]): Promise<Rip[]> {
		if (ids.length === 0) {
			return []
		}

		const ripsRaw = await this.indexer.rip.findMany({
			where: { id: { in: ids } },
			include: ripInclude,
		})

		const byId = new Map<string, RipRaw>(ripsRaw.map((r) => [r.id, r]))

		const ordered = ids
			.map((id) => byId.get(id))
			.filter((r): r is RipRaw => r != null)

		return Promise.all(ordered.map((r) => this.toRip(r)))
	}

	private async resolveSyncedRipIds(ids: number[]): Promise<Set<number>> {
		if (ids.length === 0) {
			return new Set()
		}

		const rows = await this.prisma.syncedRip.findMany({
			where: { ripId: { in: ids } },
			select: { ripId: true },
		})

		return new Set(rows.map((row) => row.ripId))
	}

	// A rip the chain has finished with is only FINISHED once the backend has
	// written its SyncedRip row; until then it is still settling.
	private applySyncAwareStatus(rip: Rip, syncedIds: Set<number>): Rip {
		const settlingStatus = toSettlingStatus(rip.status)

		if (settlingStatus == null || syncedIds.has(rip.id)) {
			return rip
		}

		return { ...rip, status: settlingStatus }
	}

	async getRipsByIds(ids: Set<number>): Promise<Rip[]> {
		const sortedIds = [...ids].sort((a, b) => a - b)

		const rips = await this.loadRipsByIdsOrdered(sortedIds.map(String))

		const terminalIds = rips
			.filter((rip) => toSettlingStatus(rip.status) != null)
			.map((rip) => rip.id)

		const syncedIds = await this.resolveSyncedRipIds(terminalIds)

		return rips.map((rip) => this.applySyncAwareStatus(rip, syncedIds))
	}

	async getOngoingRips(): Promise<OngoingRip[]> {
		const presetsWithRips =
			await this.presetRepository.getPresetsWithOngoingRips()

		const unsyncedIds = await this.findUnsyncedTerminalRipIds()

		const settlingRips = await this.hydrateSettlingRips(unsyncedIds)

		// The two queries are separate reads, so a rip can go terminal on chain
		// between them and show up in both. The settling set is read second and
		// is therefore the fresher observation, so it wins.
		const settlingIds = new Set(settlingRips.map((rip) => rip.id))

		const presetRips = presetsWithRips
			.flatMap(({ ongoingRips }) => ongoingRips)
			.filter((rip) => !settlingIds.has(rip.id))

		return [...presetRips, ...settlingRips]
	}

	async getFinishedRips({
		limit,
		cursor,
	}: GetFinishedRipsArgs): Promise<FinishedPage> {
		const syncedPage = await this.prisma.syncedRip.findMany({
			where: cursor && {
				OR: [
					{ syncedAt: { lt: cursor.syncedAt } },
					{
						syncedAt: cursor.syncedAt,
						ripId: { lt: cursor.ripId },
					},
				],
			},
			orderBy: [{ syncedAt: 'desc' }, { ripId: 'desc' }],
			take: limit,
			select: { ripId: true, syncedAt: true },
		})

		const rips = await this.loadRipsByIdsOrdered(
			syncedPage.map((row) => String(row.ripId)),
		)

		if (rips.length !== syncedPage.length) {
			throw new Error(
				`Finished rips hydration is short: expected ${syncedPage.length} indexer rips, got ${rips.length}`,
			)
		}

		const finishedRips = rips.filter(isFinishedRip)

		if (finishedRips.length !== rips.length) {
			throw new Error(
				'A synced rip is not on-chain terminal; the databases disagree',
			)
		}

		const lastRow = syncedPage[syncedPage.length - 1]

		const nextCursor: FinishedCursor | null =
			syncedPage.length === limit && lastRow != null
				? { syncedAt: lastRow.syncedAt, ripId: lastRow.ripId }
				: null

		return { rips: finishedRips, nextCursor }
	}

	async getNextSettlingRip(afterRipId: number): Promise<SettlingRip | null> {
		const rows = await this.indexer.$queryRaw<{ id: string }[]>`
			SELECT id
			FROM rip
			WHERE status IN ('CLAIMED', 'REFUNDED')
				AND id::numeric > ${afterRipId}::numeric
			ORDER BY id::numeric ASC
			LIMIT 1
		`

		const id = rows[0]?.id

		if (id == null) {
			return null
		}

		const alreadySynced = await this.prisma.syncedRip.findUnique({
			where: { ripId: Number(id) },
			select: { ripId: true },
		})

		if (alreadySynced != null) {
			return null
		}

		const [rip] = await this.hydrateSettlingRips([id])

		return rip ?? null
	}
}
