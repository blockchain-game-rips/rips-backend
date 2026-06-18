import * as rips from '../abi/rips'
import { Config, Round, RoundStatus, VrfRequestStatus } from '../model'
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
			status: RoundStatus.FILLING,
			config,
			stake: config.stake,
			startTime: new Date(block.timestamp),
			ticketsSold: 0n,
			ticketsClaimed: 0n,
			ticketsRefunded: 0n,
			vrfRequestStatus: VrfRequestStatus.NOT_REQUESTED,
		}),
	)
}
