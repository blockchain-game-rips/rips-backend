import { getAddress } from 'viem'
import { Prisma } from '../../../generated/prisma-indexer'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { Rip, RipStatus } from '../../domain/entities/rip'
import { AddressesActions } from '../../domain/value-objects/actions'
import { toEvmAddress } from '../../domain/value-objects/evm-address'
import { EvmCurrencyService } from '../evm/evm-currency.service'

export const ripInclude = {
	config: {
		include: {
			payout_tier: {
				orderBy: { tier_index: 'asc' },
			},
		},
	},
	entry_purchase: true,
	payout_claim: true,
	refund: true,
} satisfies Prisma.ripInclude

export type RipRaw = Prisma.ripGetPayload<{ include: typeof ripInclude }>

export type ConfigRaw = NonNullable<RipRaw['config']>

export type PresetConfigRaw = Prisma.configGetPayload<{
	include: { payout_tier: true }
}>

export function requireConfig(ripRaw: RipRaw): ConfigRaw {
	if (ripRaw.config == null) {
		throw new Error(`Rip ${ripRaw.id} has no config`)
	}

	return ripRaw.config
}

function toBigInt(value: Prisma.Decimal): bigint {
	if (!value.isInteger()) {
		throw new Error(`Expected integer Decimal, got ${value.toString()}`)
	}

	return BigInt(value.toFixed(0))
}

export function fromConfigRaw(
	configRaw: ConfigRaw,
	currency: Currency,
): Config {
	return {
		id: Number(configRaw.id),
		entryCap: Number(configRaw.entry_cap),
		feePercent: Number(configRaw.fee_percent),
		entryPrice: {
			currency,
			amount: toBigInt(configRaw.entry_price),
		},
		durationSeconds: Number(configRaw.duration_seconds),
		payoutDistribution: configRaw.payout_tier.map((tier) => ({
			payoutCount: toBigInt(tier.payout_count),
			minPayout: toBigInt(tier.min_payout),
			maxPayout: toBigInt(tier.max_payout),
		})),
	}
}

export function resolveRipStatus(status: string): RipStatus {
	switch (status) {
		case 'FILLING':
			return RipStatus.FILLING
		case 'SEALED':
			return RipStatus.SEALED
		case 'VRF_REQUESTED':
			return RipStatus.VRF_REQUESTED
		case 'CLAIMING':
			return RipStatus.CLAIMING
		case 'CLAIMED':
			return RipStatus.CLAIMED
		case 'REFUNDING':
			return RipStatus.REFUNDING
		case 'REFUNDED':
			return RipStatus.REFUNDED
		default:
			throw new Error(`Unknown rip status: ${status}`)
	}
}

function resolveActions(ripRaw: RipRaw): AddressesActions {
	return {
		purchases: ripRaw.entry_purchase.map((p) => ({
			userAddress: toEvmAddress(p.user),
			entryCount: toBigInt(p.entry_count),
			startEntryIndex: toBigInt(p.start_entry_index),
		})),
		claims: ripRaw.payout_claim.map((c) => ({
			userAddress: toEvmAddress(c.user),
			amount: toBigInt(c.amount),
		})),
		refunds: ripRaw.refund.map((r) => ({
			userAddress: toEvmAddress(r.user),
			amount: toBigInt(r.amount),
		})),
	}
}

export function fromRipRaw(ripRaw: RipRaw, currency: Currency): Rip {
	const config = requireConfig(ripRaw)

	return {
		id: Number(ripRaw.id),
		preset: { id: Number(ripRaw.preset_id), currentConfig: null },
		config: fromConfigRaw(config, currency),
		currency,
		actions: resolveActions(ripRaw),
		status: resolveRipStatus(ripRaw.status),
		startTime: ripRaw.start_time,
		randoms:
			ripRaw.random_a != null && ripRaw.random_b != null
				? { a: toBigInt(ripRaw.random_a), b: toBigInt(ripRaw.random_b) }
				: undefined,
	}
}

export async function toRip(
	ripRaw: RipRaw,
	evmCurrencyService: EvmCurrencyService,
	chainId: number,
): Promise<Rip> {
	const config = requireConfig(ripRaw)

	const currency = await evmCurrencyService.fromAddress(
		getAddress(config.currency),
		chainId,
	)

	return fromRipRaw(ripRaw, currency)
}
