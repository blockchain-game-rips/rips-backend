import {
	GetCompletedRipsQuery,
	RipStatus as RipStatusRaw,
} from '../../../generated/graphql/generated'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { Rip, RipStatus } from '../../domain/entities/rip'
import { AddressesActions } from '../../domain/value-objects/actions'
import { toEvmAddress } from '../../domain/value-objects/evm-address'

export type RipRaw = GetCompletedRipsQuery['rips'][number]

export function fromConfigRaw(
	configRaw: RipRaw['config'],
	currency: Currency,
): Config {
	return {
		id: Number(configRaw.id),
		entryCap: Number(configRaw.entryCap),
		feePercent: Number(configRaw.feePercent),
		entryPrice: {
			currency,
			amount: BigInt(configRaw.entryCost),
		},
		durationSeconds: Number(configRaw.durationSeconds),
		payoutDistribution: configRaw.payoutDistribution.map((tier) => ({
			payoutCount: BigInt(tier.payoutCount),
			minPayout: BigInt(tier.minPayout),
			maxPayout: BigInt(tier.maxPayout),
		})),
	}
}

export function resolveRipStatus(status: RipStatusRaw): RipStatus {
	switch (status) {
		case RipStatusRaw.Filling:
			return RipStatus.FILLING
		case RipStatusRaw.Sealed:
			return RipStatus.SEALED
		case RipStatusRaw.VrfRequested:
			return RipStatus.VRF_REQUESTED
		case RipStatusRaw.Claiming:
			return RipStatus.CLAIMING
		case RipStatusRaw.Claimed:
			return RipStatus.CLAIMED
		case RipStatusRaw.Refunding:
			return RipStatus.REFUNDING
		case RipStatusRaw.Refunded:
			return RipStatus.REFUNDED
	}
}

function resolveActions(ripRaw: RipRaw): AddressesActions {
	return {
		purchases: ripRaw.entryPurchases.map((p) => ({
			userAddress: toEvmAddress(p.user),
			entryCount: BigInt(p.entryCount),
			startEntryIndex: BigInt(p.startEntryIndex),
		})),
		claims: ripRaw.payoutsClaimed.map((c) => ({
			userAddress: toEvmAddress(c.user),
			amount: BigInt(c.amount),
		})),
		refunds: ripRaw.refunds.map((r) => ({
			userAddress: toEvmAddress(r.user),
			amount: BigInt(r.amount),
		})),
	}
}

export function fromRipRaw(ripRaw: RipRaw, currency: Currency): Rip {
	return {
		id: Number(ripRaw.id),
		preset: { id: Number(ripRaw.presetId), currentConfig: null },
		config: fromConfigRaw(ripRaw.config, currency),
		currency,
		actions: resolveActions(ripRaw),
		status: resolveRipStatus(ripRaw.status),
		startTime: new Date(ripRaw.startTime),
		randoms:
			ripRaw.randomA != null && ripRaw.randomB != null
				? { a: BigInt(ripRaw.randomA), b: BigInt(ripRaw.randomB) }
				: undefined,
	}
}
