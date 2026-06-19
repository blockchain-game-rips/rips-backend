import * as rips from '../abi/rips'
import { Config, Rip, RipStatus, VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRipCreated(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, configId } = rips.events.RipCreated.decode(log)
	const ripIdStr = ripId.toString()
	const configIdStr = configId.toString()

	let config = entities.configs.get(configIdStr)

	if (config === undefined) {
		config = await ctx.store.findOne(Config, {
			where: { id: configIdStr },
			relations: { preset: true },
		})
	}

	if (config === undefined) {
		throw new Error(`Config ${configIdStr} not found for rip ${ripIdStr}`)
	}

	entities.rips.set(
		ripIdStr,
		new Rip({
			id: ripIdStr,
			status: RipStatus.FILLING,
			config,
			preset: config.preset,
			startTime: new Date(block.timestamp),
			entriesSold: 0n,
			entriesClaimed: 0n,
			entriesRefunded: 0n,
			vrfRequestStatus: VrfRequestStatus.NOT_REQUESTED,
		}),
	)
}
