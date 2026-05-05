import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { Round, RoundStatus } from '../../domain/entities/round'
import { AddressesActions } from '../../domain/value-objects/actions'
import { toEvmAddress } from '../../domain/value-objects/evm-address'
import {
	GetCompletedRoundsQuery,
	RoundStatus as RoundStatusRaw,
} from '../../generated/graphql/generated'

export type RoundRaw = GetCompletedRoundsQuery['rounds'][number]

export function fromConfigRaw(
	configRaw: RoundRaw['config'],
	currency: Currency,
): Config {
	return {
		id: Number(configRaw.id),
		ticketCap: Number(configRaw.ticketCap),
		feePercent: Number(configRaw.feePercent),
		ticketPrice: {
			currency,
			amount: BigInt(configRaw.ticketCost),
		},
		durationSeconds: Number(configRaw.durationSeconds),
		prizeDistribution: configRaw.prizeDistribution.map((tier) => ({
			prizeCount: BigInt(tier.prizeCount),
			minPrize: BigInt(tier.minPrize),
			maxPrize: BigInt(tier.maxPrize),
		})),
	}
}

export function resolveRoundStatus(status: RoundStatusRaw): RoundStatus {
	switch (status) {
		case RoundStatusRaw.Filling:
			return RoundStatus.FILLING
		case RoundStatusRaw.Sealed:
			return RoundStatus.SEALED
		case RoundStatusRaw.VrfRequested:
			return RoundStatus.VRF_REQUESTED
		case RoundStatusRaw.Claiming:
			return RoundStatus.CLAIMING
		case RoundStatusRaw.Claimed:
			return RoundStatus.CLAIMED
		case RoundStatusRaw.Refunding:
			return RoundStatus.REFUNDING
		case RoundStatusRaw.Refunded:
			return RoundStatus.REFUNDED
	}
}

function resolveActions(roundRaw: RoundRaw): AddressesActions {
	return {
		purchases: roundRaw.ticketPurchases.map((p) => ({
			userAddress: toEvmAddress(p.user),
			ticketCount: BigInt(p.ticketCount),
			startTicketIndex: BigInt(p.startTicketIndex),
		})),
		claims: roundRaw.prizesClaimed.map((c) => ({
			userAddress: toEvmAddress(c.user),
			amount: BigInt(c.amount),
		})),
		refunds: roundRaw.refunds.map((r) => ({
			userAddress: toEvmAddress(r.user),
			amount: BigInt(r.amount),
		})),
	}
}

export function fromRoundRaw(roundRaw: RoundRaw, currency: Currency): Round {
	return {
		id: Number(roundRaw.id),
		stake: { id: Number(roundRaw.stakeId), currentConfig: null },
		config: fromConfigRaw(roundRaw.config, currency),
		currency,
		actions: resolveActions(roundRaw),
		status: resolveRoundStatus(roundRaw.status),
		startTime: new Date(roundRaw.startTime),
		randoms:
			roundRaw.randomA != null && roundRaw.randomB != null
				? { a: BigInt(roundRaw.randomA), b: BigInt(roundRaw.randomB) }
				: undefined,
	}
}
