import { assertNotNull } from '@subsquid/util-internal'
import { resolveStakeOrThrow } from 'src/helpers'
import * as rips from '../abi/rips'
import { PrizeTier, StakeConfig, StakeConfigStatus } from '../model'
import { Log } from '../processor'
import { EventContext } from '../types'

export async function handleStakeUpdated(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, stakes, stakeConfigs, prizeTiers, stakeConfigIdCounter } =
		eventCtx

	const { stakeId } = rips.events.StakeUpdated.decode(log)
	const stakeIdStr = stakeId.toString()

	const config = decodeUpdateStakeInput(log)
	if (config === undefined) {
		throw new Error(
			`Could not decode updateStake input for stakeId ${stakeId}`,
		)
	}

	const stake = await resolveStakeOrThrow(ctx, stakes, stakeIdStr)

	// Mark existing pending config (if any) as superseded — only one pending allowed
	for (const existingConfig of stakeConfigs.values()) {
		if (
			existingConfig.stake.id === stakeIdStr &&
			existingConfig.status === StakeConfigStatus.Pending
		) {
			existingConfig.status = StakeConfigStatus.Superseded
		}
	}

	const pendingInDb = await ctx.store.findOne(StakeConfig, {
		where: { stake: { id: stakeIdStr }, status: StakeConfigStatus.Pending },
		relations: { stake: true },
	})

	if (pendingInDb !== undefined) {
		pendingInDb.status = StakeConfigStatus.Superseded
		stakeConfigs.set(pendingInDb.id, pendingInDb)
	}

	const stakeConfig = new StakeConfig({
		id: stakeConfigIdCounter.value.toString(),
		stake,
		status: StakeConfigStatus.Pending,
		feePercent: config.feePercent,
		ticketCap: config.ticketCap,
		durationSeconds: config.duration,
		ticketCost: config.ticketCost,
		currency: config.currency,
	})

	stakeConfigIdCounter.value++
	stakeConfigs.set(stakeConfig.id, stakeConfig)

	for (let i = 0; i < config.prizeDistribution.length; i++) {
		const tier = config.prizeDistribution[i]
		prizeTiers.push(
			new PrizeTier({
				id: `${stakeConfig.id}-${i}`,
				stakeConfig,
				tierIndex: i,
				prizeCount: tier.prizeCount,
				minPrize: tier.minPrize,
				maxPrize: tier.maxPrize,
			}),
		)
	}
}

function decodeUpdateStakeInput(log: Log) {
	try {
		return rips.functions.updateStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		return undefined
	}
}
