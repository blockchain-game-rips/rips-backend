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

//TODO: fee is missed, need to expose ticket count to all events or add fee to math or just lookup addresses
function resolveRoundStatus(
	roundRaw: RoundRaw,
	ticketPrice: bigint,
	nowSeconds: bigint,
): RoundStatus {
	const totalPool = BigInt(roundRaw.ticketsSold) * ticketPrice

	switch (roundRaw.status) {
		case RoundStatusRaw.Active: {
			const startTimeSeconds = BigInt(
				Math.floor(new Date(roundRaw.startTime).getTime() / 1000),
			)
			const duration = BigInt(roundRaw.stakeConfig.durationSeconds)
			const isExpired = nowSeconds - startTimeSeconds >= duration

			if (!isExpired) return RoundStatus.FILLING

			const totalRefunded = roundRaw.refunds.reduce(
				(sum, r) => sum + BigInt(r.amount),
				0n,
			)

			return totalRefunded >= totalPool
				? RoundStatus.REFUNDED
				: RoundStatus.REFUNDING
		}

		case RoundStatusRaw.SoldOut:
			return RoundStatus.SEALED

		case RoundStatusRaw.VrfRequested:
			return RoundStatus.VRFREQUESTED

		case RoundStatusRaw.Finalized: {
			const totalClaimed = roundRaw.prizesClaimed.reduce(
				(sum, c) => sum + BigInt(c.amount),
				0n,
			)

			return totalClaimed >= totalPool
				? RoundStatus.CLAIMED
				: RoundStatus.CLAIMING
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
		})
	}

	for (const refund of roundRaw.refunds) {
		addressesActions.refunds.push({
			ticketAmount:
				BigInt(refund.amount) / BigInt(roundRaw.stakeConfig.ticketCost),
			userAddress: getAddress(refund.user),
		})
	}

	for (const claim of roundRaw.prizesClaimed) {
		addressesActions.claims.push({
			ticketAmount:
				BigInt(claim.amount) / BigInt(roundRaw.stakeConfig.ticketCost),
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
			}
		})
	}
}
