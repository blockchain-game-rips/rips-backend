import { Config, PrizeTier, ReferrerReward, Round, Stake } from './model'
import { Context } from './processor'

export function buildPrizeTiers(
	config: Config,
	prizeDistribution: {
		prizeCount: bigint
		minPrize: bigint
		maxPrize: bigint
	}[],
): PrizeTier[] {
	return prizeDistribution.map(
		(tier, i) =>
			new PrizeTier({
				id: `${config.id}-${i}`,
				config,
				tierIndex: i,
				prizeCount: tier.prizeCount,
				minPrize: tier.minPrize,
				maxPrize: tier.maxPrize,
			}),
	)
}

export async function resolveRoundOrThrow(
	ctx: Context,
	rounds: Map<string, Round>,
	roundId: string,
): Promise<Round> {
	let round = rounds.get(roundId)

	if (round !== undefined) return round

	round = await ctx.store.findOne(Round, {
		where: { id: roundId },
		relations: { config: { stake: true } },
	})

	if (round === undefined) {
		throw new Error(`Round ${roundId} not found`)
	}

	return round
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

export async function resolveStakeOrThrow(
	ctx: Context,
	stakes: Map<string, Stake>,
	stakeId: string,
): Promise<Stake> {
	let stake = stakes.get(stakeId)

	if (stake !== undefined) return stake

	stake = await ctx.store.get(Stake, stakeId)

	if (stake === undefined) {
		throw new Error(`Stake ${stakeId} not found`)
	}

	return stake
}
