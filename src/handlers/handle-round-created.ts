import * as rips from '../abi/rips'
import { Config, Round, VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRoundCreated(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, configId } = rips.events.RoundCreated.decode(log)
	const roundIdStr = roundId.toString()
	const configIdStr = configId.toString()

	let config = entities.configs.get(configIdStr)

	if (config === undefined) {
		config = await ctx.store.findOne(Config, {
			where: { id: configIdStr },
			relations: { stake: true },
		})
	}

	if (config === undefined) {
		throw new Error(
			`Config ${configIdStr} not found for round ${roundIdStr}`,
		)
	}

	entities.rounds.set(
		roundIdStr,
		new Round({
			id: roundIdStr,
			config,
			startTime: new Date(block.timestamp),
			ticketsSold: 0,
			ticketsClaimed: 0,
			ticketsRefunded: 0,
			vrfRequestStatus: VrfRequestStatus.NotRequested,
		}),
	)
}
