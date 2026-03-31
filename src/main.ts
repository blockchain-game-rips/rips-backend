import { TypeormDatabase } from '@subsquid/typeorm-store'
import * as rips from './abi/rips'
import { handleCallbackGasLimitUpdated } from './handlers/handle-callback-gas-limit-updated'
import { handleFeeRecipientUpdated } from './handlers/handle-fee-recipient-updated'
import { handlePrizesClaimed } from './handlers/handle-prizes-claimed'
import { handleRandomnessRequested } from './handlers/handle-randomness-requested'
import { handleRefundIssued } from './handlers/handle-refund-issued'
import { handleRoundCreated } from './handlers/handle-round-created'
import { handleRoundFinalized } from './handlers/handle-round-finalized'
import { handleStakeCreated } from './handlers/handle-stake-created'
import { handleStakeDeleted } from './handlers/handle-stake-deleted'
import { handleStakeUpdated } from './handlers/handle-stake-updated'
import { handleTicketsPurchased } from './handlers/handle-tickets-purchased'
import {
	CallbackGasLimitUpdated,
	FeeRecipientUpdated,
	PrizeClaim,
	PrizeTier,
	Refund,
	Round,
	Stake,
	StakeConfig,
	TicketPurchase,
} from './model'
import { processor } from './processor'
import { EventContext } from './types'

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
	const stakes = new Map<string, Stake>()
	const stakeConfigs = new Map<string, StakeConfig>()
	const prizeTiers: PrizeTier[] = []
	const rounds = new Map<string, Round>()
	const ticketPurchases: TicketPurchase[] = []
	const prizeClaims: PrizeClaim[] = []
	const refunds: Refund[] = []
	const feeRecipientUpdates: FeeRecipientUpdated[] = []
	const callbackGasLimitUpdates: CallbackGasLimitUpdated[] = []

	const stakeConfigCount = await ctx.store.count(StakeConfig)
	const stakeConfigIdCounter = { value: stakeConfigCount + 1 }

	const allLogs = ctx.blocks.flatMap((block) =>
		block.logs.map((log) => ({ log, header: block.header })),
	)

	// StakeCreated and StakeUpdated must be pre-processed before other events
	// because the contract emits RoundCreated before StakeCreated within the
	// same createStake transaction
	for (const { log, header } of allLogs) {
		const isStakeCreated = log.topics[0] === rips.events.StakeCreated.topic
		const isStakeUpdated = log.topics[0] === rips.events.StakeUpdated.topic

		if (!isStakeCreated && !isStakeUpdated) continue

		const eventCtx: EventContext = {
			ctx,
			block: header,
			log,
			stakes,
			stakeConfigs,
			prizeTiers,
			rounds,
			ticketPurchases,
			prizeClaims,
			refunds,
			feeRecipientUpdates,
			callbackGasLimitUpdates,
			stakeConfigIdCounter,
		}

		if (isStakeCreated) {
			await handleStakeCreated(eventCtx)
		} else {
			await handleStakeUpdated(eventCtx)
		}
	}

	for (const { log, header } of allLogs) {
		const topic = log.topics[0]

		if (
			topic === rips.events.StakeCreated.topic ||
			topic === rips.events.StakeUpdated.topic
		) {
			continue
		}

		const eventCtx: EventContext = {
			ctx,
			block: header,
			log,
			stakes,
			stakeConfigs,
			prizeTiers,
			rounds,
			ticketPurchases,
			prizeClaims,
			refunds,
			feeRecipientUpdates,
			callbackGasLimitUpdates,
			stakeConfigIdCounter,
		}

		switch (topic) {
			case rips.events.StakeDeleted.topic:
				await handleStakeDeleted(eventCtx)
				break

			case rips.events.RoundCreated.topic:
				await handleRoundCreated(eventCtx)
				break

			case rips.events.TicketsPurchased.topic:
				await handleTicketsPurchased(eventCtx)
				break

			case rips.events.RandomnessRequested.topic:
				await handleRandomnessRequested(eventCtx)
				break

			case rips.events.RoundFinalized.topic:
				await handleRoundFinalized(eventCtx)
				break

			case rips.events.PrizesClaimed.topic:
				await handlePrizesClaimed(eventCtx)
				break

			case rips.events.RefundIssued.topic:
				await handleRefundIssued(eventCtx)
				break

			case rips.events.FeeRecipientUpdated.topic:
				handleFeeRecipientUpdated(eventCtx)
				break

			case rips.events.CallbackGasLimitUpdated.topic:
				handleCallbackGasLimitUpdated(eventCtx)
				break
		}
	}

	await ctx.store.upsert([...stakes.values()])
	await ctx.store.upsert([...stakeConfigs.values()])
	await ctx.store.insert(prizeTiers)
	await ctx.store.upsert([...rounds.values()])
	await ctx.store.insert(ticketPurchases)
	await ctx.store.insert(prizeClaims)
	await ctx.store.insert(refunds)
	await ctx.store.insert(feeRecipientUpdates)
	await ctx.store.insert(callbackGasLimitUpdates)
})
