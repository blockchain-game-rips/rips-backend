import { resolveStakeOrThrow } from '../helpers'
import * as rips from '../abi/rips'
import { EventContext } from '../types'

export async function handleStakeDeleted(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, stakes } = eventCtx

	const { stakeId } = rips.events.StakeDeleted.decode(log)
	const stakeIdStr = stakeId.toString()

	const stake = await resolveStakeOrThrow(ctx, stakes, stakeIdStr)

	stake.deleted = true
	stakes.set(stakeIdStr, stake)
}
