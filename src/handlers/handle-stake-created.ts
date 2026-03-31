import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import { buildPrizeTiers } from '../helpers'
import { Stake, StakeConfig, StakeConfigStatus } from '../model'
import { Log } from '../processor'
import { EventContext } from '../types'

export function handleStakeCreated(eventCtx: EventContext): void {
	const { log, stakes, stakeConfigs, prizeTiers, stakeConfigIdCounter } =
		eventCtx

	const { stakeId } = rips.events.StakeCreated.decode(log)
	const stakeIdStr = stakeId.toString()

	const config = decodeInputOrThrow(log)

	const stake = new Stake({ id: stakeIdStr, deleted: false })
	stakes.set(stakeIdStr, stake)

	const stakeConfig = new StakeConfig({
		id: stakeConfigIdCounter.value.toString(),
		stake,
		status: StakeConfigStatus.Active,
		feePercent: config.feePercent,
		ticketCap: config.ticketCap,
		durationSeconds: config.duration,
		ticketCost: config.ticketCost,
		currency: config.currency,
	})

	stakeConfigIdCounter.value++
	stakeConfigs.set(stakeConfig.id, stakeConfig)
	prizeTiers.push(...buildPrizeTiers(stakeConfig, config.prizeDistribution))
}

function decodeInputOrThrow(log: Log) {
	try {
		return rips.functions.createStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode createStake with input ${log.transaction?.input}`,
		)
	}
}
