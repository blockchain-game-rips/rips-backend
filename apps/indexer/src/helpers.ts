import { Config, PayoutTier, Preset, ReferrerReward, Rip } from './model'
import { Context } from './processor'

export function buildPayoutTiers(
	config: Config,
	payoutDistribution: {
		payoutCount: bigint
		minPayout: bigint
		maxPayout: bigint
	}[],
): PayoutTier[] {
	return payoutDistribution.map(
		(tier, i) =>
			new PayoutTier({
				id: `${config.id}-${i}`,
				config,
				tierIndex: i,
				payoutCount: tier.payoutCount,
				minPayout: tier.minPayout,
				maxPayout: tier.maxPayout,
			}),
	)
}

export async function resolveRipOrThrow(
	ctx: Context,
	rips: Map<string, Rip>,
	ripId: string,
): Promise<Rip> {
	let rip = rips.get(ripId)

	if (rip !== undefined) return rip

	rip = await ctx.store.findOne(Rip, {
		where: { id: ripId },
		relations: { config: { preset: true } },
	})

	if (rip === undefined) {
		throw new Error(`Rip ${ripId} not found`)
	}

	return rip
}

export async function resolveReferrerRewardState(
	ctx: Context,
	states: Map<string, ReferrerReward>,
	referrer: string,
	currency: string,
): Promise<ReferrerReward> {
	const id = `${referrer}:${currency}`

	let state = states.get(id)

	if (state !== undefined) return state

	state = await ctx.store.findOne(ReferrerReward, { where: { id } })

	if (state === undefined) {
		state = new ReferrerReward({
			id,
			referrer,
			currency,
			accrued: 0n,
			withdrawn: 0n,
			seized: 0n,
		})
	}

	states.set(id, state)

	return state
}

export async function resolvePresetOrThrow(
	ctx: Context,
	presets: Map<string, Preset>,
	presetId: string,
): Promise<Preset> {
	let preset = presets.get(presetId)

	if (preset !== undefined) return preset

	preset = await ctx.store.get(Preset, presetId)

	if (preset === undefined) {
		throw new Error(`Preset ${presetId} not found`)
	}

	return preset
}
