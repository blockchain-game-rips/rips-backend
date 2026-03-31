import * as rips from '../abi/rips'
import { PrizeTier, Stake, StakeConfig, StakeConfigStatus } from '../model'
import { Log } from '../processor'
import { EventContext } from '../types'
import { assertNotNull } from '@subsquid/util-internal'

export async function handleStakeCreated(eventCtx: EventContext): Promise<void> {
	const { log, stakes, stakeConfigs, prizeTiers, stakeConfigIdCounter } =
		eventCtx

	const { stakeId } = rips.events.StakeCreated.decode(log)
	const stakeIdStr = stakeId.toString()

	const config = decodeCreateStakeInput(log)
	if (config === undefined) {
		throw new Error(`Could not decode createStake input for stakeId ${stakeId}`)
	}

	const stake = new Stake({
		id: stakeIdStr,
		deleted: false,
	})

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

function decodeCreateStakeInput(log: Log) {
	try {
		return rips.functions.createStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		return undefined
	}
}
