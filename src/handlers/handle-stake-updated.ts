import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import { buildPrizeTiers, resolveStakeOrThrow } from '../helpers'
import { Config } from '../model'
import { Log } from '../processor'
import { HandlerArgs } from '../types'

export async function handleStakeUpdated(args: HandlerArgs): Promise<void> {
	const { ctx, entities, log } = args

	const { stakeId, configId } = rips.events.StakeUpdated.decode(log)
	const stakeIdStr = stakeId.toString()
	const configIdStr = configId.toString()

	const txConfig = decodeInputOrThrow(log)

	const stake = await resolveStakeOrThrow(ctx, entities.stakes, stakeIdStr)

	const config = new Config({
		id: configIdStr,
		stake,
		ticketCap: txConfig.ticketCap,
		currency: txConfig.currency.toLowerCase(),
		durationSeconds: BigInt(txConfig.duration),
		ticketCost: txConfig.ticketCost,
		feePercent: BigInt(txConfig.feePercent),
	})

	entities.configs.set(configIdStr, config)
	entities.prizeTiers.push(...buildPrizeTiers(config, txConfig.tiers))
}

function decodeInputOrThrow(log: Log) {
	try {
		return rips.functions.updateStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode updateStake with input ${log.transaction?.input}`,
		)
	}
}
