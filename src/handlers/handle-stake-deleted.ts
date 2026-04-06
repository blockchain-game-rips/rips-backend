import * as rips from '../abi/rips'
import { resolveStakeOrThrow } from '../helpers'
import { HandlerArgs } from '../types'

export async function handleStakeDeleted(args: HandlerArgs): Promise<void> {
	const { ctx, entities, log } = args

	const { stakeId } = rips.events.StakeDeleted.decode(log)
	const stakeIdStr = stakeId.toString()

	const stake = await resolveStakeOrThrow(ctx, entities.stakes, stakeIdStr)

	stake.deleted = true
	entities.stakes.set(stakeIdStr, stake)
}
