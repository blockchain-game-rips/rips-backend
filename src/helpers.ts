import { Round, Stake, StakeConfig, StakeConfigStatus } from './model'
import { Context } from './processor'

export async function resolveRoundOrThrow(
	ctx: Context,
	rounds: Map<string, Round>,
	roundId: string,
): Promise<Round> {
	let round = rounds.get(roundId)

	if (round !== undefined) return round

	round = await ctx.store.findOne(Round, {
		where: { id: roundId },
		relations: { stakeConfig: { stake: true } },
	})

	if (round === undefined) {
		throw new Error(`Round ${roundId} not found`)
	}

	return round
}

export async function resolveStakeConfig(
	ctx: Context,
	stakeConfigs: Map<string, StakeConfig>,
	stakeId: string,
	status: StakeConfigStatus,
): Promise<StakeConfig | undefined> {
	const cachedConfig = [...stakeConfigs.values()].find(
		(c) => c.stake.id === stakeId && c.status === status,
	)

	if (cachedConfig !== undefined) return cachedConfig

	return ctx.store.findOne(StakeConfig, {
		where: { stake: { id: stakeId }, status },
		relations: { stake: true },
	})
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
