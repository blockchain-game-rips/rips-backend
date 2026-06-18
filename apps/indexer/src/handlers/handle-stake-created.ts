import { assertNotNull } from '@subsquid/util-internal'
import * as rips from '../abi/rips'
import { buildPrizeTiers } from '../helpers'
import { Config, Stake } from '../model'
import { Log } from '../processor'
import { HandlerArgs } from '../types'

export function handleStakeCreated(args: HandlerArgs): void {
	const { entities, log } = args

	const { stakeId, configId } = rips.events.StakeCreated.decode(log)
	const stakeIdStr = stakeId.toString()
	const configIdStr = configId.toString()

	const txConfig = decodeInputOrThrow(log)

	const stake = new Stake({ id: stakeIdStr, deleted: false })
	entities.stakes.set(stakeIdStr, stake)

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
		return rips.functions.createStake.decode(
			assertNotNull(log.transaction).input,
		).config
	} catch {
		throw new Error(
			`Could not decode createStake with input ${log.transaction?.input}`,
		)
	}
}
