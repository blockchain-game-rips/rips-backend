import * as rips from '../abi/rips'
import { resolveStakeConfig } from '../helpers'
import { Round, RoundStatus, StakeConfigStatus } from '../model'
import { EventContext } from '../types'

export async function handleRoundCreated(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, block, log, stakeConfigs, rounds } = eventCtx

	const { roundId, stakeId } = rips.events.RoundCreated.decode(log)
	const stakeIdStr = stakeId.toString()

	const pendingConfig = await resolveStakeConfig(
		ctx,
		stakeConfigs,
		stakeIdStr,
		StakeConfigStatus.Pending,
	)

	const activeConfig = await resolveStakeConfig(
		ctx,
		stakeConfigs,
		stakeIdStr,
		StakeConfigStatus.Active,
	)

	if (pendingConfig !== undefined && activeConfig !== undefined) {
		activeConfig.status = StakeConfigStatus.Superseded
		pendingConfig.status = StakeConfigStatus.Active
		stakeConfigs.set(activeConfig.id, activeConfig)
		stakeConfigs.set(pendingConfig.id, pendingConfig)
	}

	const roundConfig = pendingConfig ?? activeConfig

	if (roundConfig === undefined) {
		throw new Error(
			`No active or pending StakeConfig found for stake ${stakeIdStr} on round ${roundId}`,
		)
	}

	rounds.set(
		roundId.toString(),
		new Round({
			id: roundId.toString(),
			stakeConfig: roundConfig,
			startTime: new Date(block.timestamp),
			ticketsSold: 0,
			ticketsClaimed: 0,
			ticketsRefunded: 0,
			status: RoundStatus.Unsettled,
		}),
	)
}
