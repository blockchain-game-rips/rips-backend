import { Inject, Injectable, Logger } from '@nestjs/common'
import { CompletedRip, RipStatus } from '../../../domain/entities/rip'
import { resolvePayout } from '../../../domain/services/payout-utils'
import { PurchaseAction } from '../../../domain/value-objects/actions'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { RipSyncRepository } from '../../interfaces/repositories/rip-sync.repository'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { PRESET_TO_TIER_BIASES } from '../../interfaces/tokens'
import { SyncCompletedRipsUseCase } from './sync-completed-rips.use-case'

@Injectable()
export class SyncCompletedRipsService extends SyncCompletedRipsUseCase {
	private readonly logger = new Logger(SyncCompletedRipsService.name)

	constructor(
		private readonly ripRepository: RipRepository,
		private readonly userRepository: UserRepository,
		private readonly entryPayoutRepository: EntryPayoutRepository,
		private readonly ripSyncRepository: RipSyncRepository,

		@Inject(PRESET_TO_TIER_BIASES)
		private readonly presetToBiases: Map<number, number[]>,
	) {
		super()
	}

	async execute(): Promise<void> {
		const highestRipId =
			(await this.ripSyncRepository.getHighestSyncedRipId()) ?? 0

		const rip = await this.ripRepository.getNextCompletedRip(highestRipId)

		if (!rip) return

		if (rip.status === RipStatus.CLAIMED) {
			await this.syncClaimedRip(rip)
		} else {
			await this.syncRefundedRip(rip)
		}
	}

	private async syncClaimedRip(rip: CompletedRip): Promise<void> {
		const payouts = await this.resolveRipPayouts(rip)

		await this.ripSyncRepository.syncClaimedRip({
			ripId: rip.id,
			payouts,
		})

		for (const payout of payouts) {
			this.logger.log(
				{
					userId: payout.userAddress,
					cardDefinitionId: payout.card.id,
					tier: payout.card.tier,
					presetId: rip.preset.id,
				},
				'Card assigned',
			)
		}

		const totalEntries = rip.actions.purchases.reduce(
			(sum, p) => sum + p.entryCount,
			0n,
		)

		this.logger.log(
			{
				ripId: rip.id,
				totalEntries: totalEntries.toString(),
				winnersCount: payouts.filter((p) => p.payoutAmount > 0n).length,
			},
			'Rip completed',
		)
	}

	private async syncRefundedRip(rip: CompletedRip): Promise<void> {
		const userIds = await this.resolveParticipantUserIds(rip)

		await this.ripSyncRepository.syncRefundedRip({
			ripId: rip.id,
			userIds,
		})
	}

	private async resolveParticipantUserIds(
		rip: CompletedRip,
	): Promise<bigint[]> {
		const uniqueAddresses = [
			...new Set(rip.actions.purchases.map((p) => p.userAddress)),
		]

		const userIds: bigint[] = []

		for (const address of uniqueAddresses) {
			const user = await this.userRepository.findByEvmAddress(address)
			if (user) userIds.push(user.id)
		}

		return userIds
	}

	private hasRandoms(rip: CompletedRip): rip is CompletedRip & {
		randoms: NonNullable<CompletedRip['randoms']>
	} {
		return rip.randoms !== undefined
	}

	private async resolveRipPayouts(rip: CompletedRip): Promise<EntryPayout[]> {
		if (!this.hasRandoms(rip))
			throw new Error(`Rip ${rip.id} is missing randoms`)

		const purchasesByAddress = new Map<EvmAddress, PurchaseAction[]>()

		for (const purchase of rip.actions.purchases) {
			const existing = purchasesByAddress.get(purchase.userAddress) ?? []
			purchasesByAddress.set(purchase.userAddress, [
				...existing,
				purchase,
			])
		}

		const payouts: EntryPayout[] = []

		for (const [address, purchases] of purchasesByAddress) {
			const userPayouts = await this.resolveUserPayouts(
				rip,
				address,
				purchases,
			)

			payouts.push(...userPayouts)
		}

		return payouts
	}

	private async resolveUserPayouts(
		rip: CompletedRip & {
			randoms: NonNullable<CompletedRip['randoms']>
		},
		address: EvmAddress,
		purchases: PurchaseAction[],
	): Promise<EntryPayout[]> {
		const presetCardCollections =
			await this.entryPayoutRepository.getCardCollectionsByPreset(
				address,
				rip.preset.id,
			)

		const tierBiases = this.presetToBiases.get(rip.preset.id) ?? []
		const payouts: EntryPayout[] = []

		for (const purchase of purchases) {
			for (let i = 0; i < purchase.entryCount; i++) {
				const entryNumber = Number(purchase.startEntryIndex) + i + 1

				const payout = resolvePayout(
					entryNumber,
					rip.randoms,
					rip.config,
					presetCardCollections,
					tierBiases,
				)

				const tierCollection = presetCardCollections[payout.card.tier]
				const cardIndex = tierCollection.findIndex(
					(c) => c.card.id === payout.card.id,
				)
				tierCollection[cardIndex].count += 1

				payouts.push({
					card: payout.card,
					payoutAmount: payout.payoutAmount,
					revealed: false,
					ripId: rip.id,
					entryNumber,
					userAddress: address,
				})
			}
		}

		return payouts
	}
}
