import { Inject, Injectable } from '@nestjs/common'
import { RoundStatus as RoundStatusRaw } from 'generated/graphql/generated'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { Round, RoundStatus } from 'src/domain/entities/round'
import { AddressesActions } from 'src/domain/value-objects/actions'
import { getAddress } from 'viem'
import { IndexerService } from './indexer.service'
import { fromStakeRaw } from './utils'

type RoundRaw = Awaited<
	ReturnType<IndexerService['sdk']['GetRounds']>
>['rounds'][number]

function isExpired(roundRaw: RoundRaw, nowSeconds) {
	const startTimeSeconds = BigInt(
		Math.floor(new Date(roundRaw.startTime).getTime() / 1000),
	)

	const duration = BigInt(roundRaw.stakeConfig.durationSeconds)

	const isExpired = nowSeconds - startTimeSeconds >= duration

	return isExpired
}

function isRefunding(roundRaw: RoundRaw) {
	const uniqueRefundedAddresses: Set<string> = new Set()

	for (const refund of roundRaw.refunds) {
		uniqueRefundedAddresses.add(refund.user)
	}

	for (const purchase of roundRaw.ticketPurchases) {
		if (uniqueRefundedAddresses.has(purchase.buyer)) continue

		return true
	}

	return false
}

function isClaiming(roundRaw: RoundRaw) {
	const uniqueClaimedAddresses: Set<string> = new Set()

	for (const claim of roundRaw.prizesClaimed) {
		uniqueClaimedAddresses.add(claim.claimer)
	}

	for (const purchase of roundRaw.ticketPurchases) {
		if (uniqueClaimedAddresses.has(purchase.buyer)) continue

		return true
	}

	return false
}

function resolveRoundStatus(
	roundRaw: RoundRaw,
	ticketPrice: bigint,
	nowSeconds: bigint,
): RoundStatus {
	switch (roundRaw.status) {
		case RoundStatusRaw.Active: {
			if (!isExpired(roundRaw, nowSeconds)) return RoundStatus.FILLING

			if (isRefunding(roundRaw)) return RoundStatus.REFUNDING

			return RoundStatus.REFUNDED
		}

		case RoundStatusRaw.SoldOut:
			return RoundStatus.SEALED

		case RoundStatusRaw.VrfRequested:
			return RoundStatus.VRFREQUESTED

		case RoundStatusRaw.Finalized: {
			if (isClaiming(roundRaw)) return RoundStatus.CLAIMING

			return RoundStatus.CLAIMED
		}
	}
}

function resolveActions(roundRaw: RoundRaw): AddressesActions {
	const addressesActions: AddressesActions = {
		claims: [],
		purchases: [],
		refunds: [],
	}

	for (const purchase of roundRaw.ticketPurchases) {
		addressesActions.purchases.push({
			ticketAmount: BigInt(purchase.count),
			userAddress: getAddress(purchase.buyer),
			startTicketIndex: BigInt(purchase.startTicketIndex),
		})
	}

	for (const refund of roundRaw.refunds) {
		addressesActions.refunds.push({
			amount: BigInt(refund.amount),
			userAddress: getAddress(refund.user),
		})
	}

	for (const claim of roundRaw.prizesClaimed) {
		addressesActions.claims.push({
			amount: BigInt(claim.amount),
			userAddress: getAddress(claim.claimer),
		})
	}

	return addressesActions
}

@Injectable()
export class IndexerRoundRepository extends RoundRepository {
	constructor(
		private readonly indexer: IndexerService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async getRounds(): Promise<Round[]> {
		const { rounds: roundsRaw } = await this.indexer.sdk.GetRounds()

		const nowSeconds = BigInt(Math.floor(Date.now() / 1000))

		return roundsRaw.map((roundRaw) => {
			const stake = fromStakeRaw(roundRaw.stakeConfig, this.mainCurrency)
			const actions = resolveActions(roundRaw)

			return {
				id: Number(roundRaw.id),
				stake,
				actions,
				status: resolveRoundStatus(
					roundRaw,
					stake.ticketPrice.amount,
					nowSeconds,
				),
				randoms:
					roundRaw.randomA != null && roundRaw.randomB != null
						? {
								a: BigInt(roundRaw.randomA),
								b: BigInt(roundRaw.randomB),
							}
						: undefined,
			}
		})
	}
}
