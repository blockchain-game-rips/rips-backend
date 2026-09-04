import { Injectable, Logger } from '@nestjs/common'
import {
	RandomnessFulfillment,
	RipStatus,
	SettlingRip,
} from '../../../domain/entities/rip'
import { renderDrawRulesFingerprint } from '../../../domain/services/draw-rules-fingerprint'
import { resolvePayout } from '../../../domain/services/payout-utils'
import { resolveSyncProgress } from '../../../domain/services/sync-progress-utils'
import { getTierBiases } from '../../../domain/services/tier-biases'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { RipSyncRepository } from '../../interfaces/repositories/rip-sync.repository'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { SyncSettlingRipsUseCase } from './sync-settling-rips.use-case'

type FulfilledRip = SettlingRip & {
	fulfillment: NonNullable<SettlingRip['fulfillment']>
}

@Injectable()
export class SyncSettlingRipsService extends SyncSettlingRipsUseCase {
	private readonly logger = new Logger(SyncSettlingRipsService.name)

	constructor(
		private readonly ripRepository: RipRepository,
		private readonly userRepository: UserRepository,
		private readonly entryPayoutRepository: EntryPayoutRepository,
		private readonly ripSyncRepository: RipSyncRepository,
	) {
		super()
	}

	async execute(): Promise<void> {
		const rip = await this.getRipToSync()

		if (!rip) return

		if (rip.status === RipStatus.CLAIM_SETTLING) {
			await this.syncClaimedRip(rip)
		} else {
			await this.syncRefundedRip(rip)
		}
	}

	private async getRipToSync(): Promise<SettlingRip | null> {
		const syncedIds = await this.ripSyncRepository.getSyncedRipIds()

		const progress = resolveSyncProgress(syncedIds)

		return this.ripRepository.getFirstUnsyncedSettlingRip(progress)
	}

	private async syncClaimedRip(rip: SettlingRip): Promise<void> {
		if (!this.isFulfilled(rip))
			throw new Error(`Rip ${rip.id} has no randomness fulfillment`)

		const cardTiers = await this.entryPayoutRepository.getCardDefinitions()

		const drawRulesFingerprint = renderDrawRulesFingerprint(cardTiers)

		await this.assertDrawRulesUnchanged(
			rip.fulfillment,
			drawRulesFingerprint,
		)

		const payouts = await this.resolveRipPayouts(
			rip,
			getTierBiases(cardTiers.length),
		)

		await this.ripSyncRepository.syncClaimedRip({
			ripId: rip.id,
			settlementKey: rip.fulfillment,
			drawRulesFingerprint,
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
			0,
		)

		this.logger.log(
			{
				ripId: rip.id,
				totalEntries: totalEntries.toString(),
				winnersCount: payouts.filter((p) => p.payoutAmount > 0n).length,
			},
			'Rip finished',
		)
	}

	/**
	 * Guards against the cards or the biases changing under rips that already
	 * settled. Only rips before this one in settlement order matter: their
	 * payouts are what `k` counts, so a fingerprint of theirs that disagrees
	 * with the current one means this draw would differ from the one already
	 * awarded.
	 */
	private async assertDrawRulesUnchanged(
		fulfillment: RandomnessFulfillment,
		current: string,
	): Promise<void> {
		const recorded =
			await this.ripSyncRepository.getDrawRulesFingerprintsSettledBefore(
				fulfillment,
			)

		const mismatched = recorded.filter(
			(fingerprint) => fingerprint !== current,
		)

		if (mismatched.length > 0)
			throw new Error(
				`Draw rules changed: earlier rips settled under [${mismatched.join(' / ')}], current rules are ${current}`,
			)
	}

	private async syncRefundedRip(rip: SettlingRip): Promise<void> {
		const userIds = await this.resolveParticipantUserIds(rip)

		await this.ripSyncRepository.syncRefundedRip({
			ripId: rip.id,
			userIds,
		})
	}

	private async resolveParticipantUserIds(
		rip: SettlingRip,
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

	private isFulfilled(rip: SettlingRip): rip is FulfilledRip {
		return rip.fulfillment !== undefined
	}

	/**
	 * Walks the whole rip in ascending `entryNumber` — the order the chain
	 * itself defines — rather than grouping by address. Each player's
	 * collection grows as their entries are drawn, so `k` accumulates within
	 * the rip exactly as it would have on any other run.
	 */
	private async resolveRipPayouts(
		rip: FulfilledRip,
		tierBiases: readonly bigint[],
	): Promise<EntryPayout[]> {
		const entries = rip.actions.purchases
			.flatMap((purchase) =>
				Array.from({ length: purchase.entryCount }, (_, i) => ({
					entryNumber: purchase.startEntryIndex + i + 1,
					userAddress: purchase.userAddress,
				})),
			)
			.sort((a, b) => a.entryNumber - b.entryNumber)

		const collectionsByAddress = new Map<EvmAddress, CardCollection[]>()

		const payouts: EntryPayout[] = []

		for (const { entryNumber, userAddress } of entries) {
			let cardCollections = collectionsByAddress.get(userAddress)

			if (!cardCollections) {
				cardCollections =
					await this.entryPayoutRepository.getAssignedCardCollections(
						userAddress,
						rip.fulfillment,
					)

				collectionsByAddress.set(userAddress, cardCollections)
			}

			const payout = resolvePayout({
				entryNumber,
				fulfillment: rip.fulfillment,
				config: rip.config,
				cardCollections,
				tierBiases,
			})

			const drawnCard = cardCollections[payout.card.tier].find(
				(entry) => entry.card.id === payout.card.id,
			)

			if (!drawnCard)
				throw new Error(
					`Card ${payout.card.id} is missing from tier ${payout.card.tier}`,
				)

			drawnCard.count += 1

			payouts.push({
				card: payout.card,
				payoutAmount: payout.payoutAmount,
				revealed: false,
				ripId: rip.id,
				entryNumber,
				userAddress,
			})
		}

		return payouts
	}
}
