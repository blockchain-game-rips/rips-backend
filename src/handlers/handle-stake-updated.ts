import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import {
	buildPrizeTiers,
	resolveStakeConfig,
	resolveStakeOrThrow,
} from '../helpers'
import { StakeConfig, StakeConfigStatus } from '../model'
import { Log } from '../processor'
import { EventContext } from '../types'

export async function handleStakeUpdated(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, stakeConfigs, prizeTiers, stakeConfigIdCounter } =
		eventCtx

	const { stakeId } = rips.events.StakeUpdated.decode(log)
	const stakeIdStr = stakeId.toString()

	const config = decodeInputOrThrow(log)

	const stake = await resolveStakeOrThrow(ctx, eventCtx.stakes, stakeIdStr)

	const existingPending = await resolveStakeConfig(
		ctx,
		stakeConfigs,
		stakeIdStr,
		StakeConfigStatus.Pending,
	)

	if (existingPending !== undefined) {
		existingPending.status = StakeConfigStatus.Superseded
		stakeConfigs.set(existingPending.id, existingPending)
	}

	const newConfig = new StakeConfig({
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
	stakeConfigs.set(newConfig.id, newConfig)
	prizeTiers.push(...buildPrizeTiers(newConfig, config.prizeDistribution))
}

function decodeInputOrThrow(log: Log) {
	try {
		return rips.functions.updateStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode createStake with input ${log.transaction?.input}`,
		)
	}
}
