import * as rips from '../abi/rips'
import { ReferralTier, ReferralTiersUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferralTiersUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { currency, tiers } = rips.events.ReferralTiersUpdated.decode(log)

	const update = new ReferralTiersUpdated({
		id: log.id,
		currency: currency,
		blockNumber: BigInt(block.height),
		time: new Date(block.timestamp),
		txHash: log.transactionHash,
	})

	entities.referralTiersUpdates.push(update)

	tiers.forEach((tier, i) => {
		entities.referralTiers.push(
			new ReferralTier({
				id: `${log.id}-${i}`,
				update,
				minVolume: tier.minVolume,
				feePercent: tier.feePercent,
			}),
		)
	})
}
