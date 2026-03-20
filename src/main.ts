import { TypeormDatabase } from '@subsquid/typeorm-store'
import { assertNotNull } from '@subsquid/util-internal'
import * as rips from './abi/rips'
import {
	CallbackGasLimitUpdated,
	FeeRecipientUpdated,
	PrizeClaim,
	PrizeTier,
	ProtocolFeeUpdated,
	Refund,
	Round,
	RoundStatus,
	StakeConfig,
	TicketPurchase,
} from './model'
import { Block, Context, Log, processor } from './processor'

interface EventContext {
	ctx: Context
	block: Block
	log: Log
	stakeConfigs: Map<string, StakeConfig>
	prizeTiers: PrizeTier[]
	rounds: Map<string, Round>
	ticketPurchases: TicketPurchase[]
	prizeClaims: PrizeClaim[]
	refunds: Refund[]
	protocolFeeUpdates: ProtocolFeeUpdated[]
	feeRecipientUpdates: FeeRecipientUpdated[]
	callbackGasLimitUpdates: CallbackGasLimitUpdated[]
}

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
	const stakeConfigs = new Map<string, StakeConfig>()
	const prizeTiers: PrizeTier[] = []
	const rounds = new Map<string, Round>()
	const ticketPurchases: TicketPurchase[] = []
	const prizeClaims: PrizeClaim[] = []
	const refunds: Refund[] = []
	const protocolFeeUpdates: ProtocolFeeUpdated[] = []
	const feeRecipientUpdates: FeeRecipientUpdated[] = []
	const callbackGasLimitUpdates: CallbackGasLimitUpdated[] = []

	const allLogs = ctx.blocks.flatMap((block) =>
		block.logs.map((log) => ({ log, header: block.header })),
	)

	// StakeCreated must be pre-processed before other events because the contract
	// emits RoundCreated before StakeCreated within the same createStake transaction
	for (const { log, header } of allLogs) {
		if (log.topics[0] === rips.events.StakeCreated.topic) {
			handleStakeCreated({
				ctx,
				block: header,
				log,
				stakeConfigs,
				prizeTiers,
				rounds,
				ticketPurchases,
				prizeClaims,
				refunds,
				protocolFeeUpdates,
				feeRecipientUpdates,
				callbackGasLimitUpdates,
			})
		}
	}

	for (const { log, header } of allLogs) {
		if (log.topics[0] === rips.events.StakeCreated.topic) continue

		const eventCtx: EventContext = {
			ctx,
			block: header,
			log,
			stakeConfigs,
			prizeTiers,
			rounds,
			ticketPurchases,
			prizeClaims,
			refunds,
			protocolFeeUpdates,
			feeRecipientUpdates,
			callbackGasLimitUpdates,
		}

		switch (log.topics[0]) {
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

			case rips.events.ProtocolFeeUpdated.topic:
				handleProtocolFeeUpdated(eventCtx)
				break

			case rips.events.FeeRecipientUpdated.topic:
				handleFeeRecipientUpdated(eventCtx)
				break

			case rips.events.CallbackGasLimitUpdated.topic:
				handleCallbackGasLimitUpdated(eventCtx)
				break
		}
	}

	await ctx.store.upsert([...stakeConfigs.values()])
	await ctx.store.insert(prizeTiers)
	await ctx.store.upsert([...rounds.values()])
	await ctx.store.insert(ticketPurchases)
	await ctx.store.insert(prizeClaims)
	await ctx.store.insert(refunds)
	await ctx.store.insert(protocolFeeUpdates)
	await ctx.store.insert(feeRecipientUpdates)
	await ctx.store.insert(callbackGasLimitUpdates)
})

function handleStakeCreated(eventCtx: EventContext): void {
	const { log, stakeConfigs, prizeTiers } = eventCtx

	const { stakeId } = rips.events.StakeCreated.decode(log)
	const config = decodeCreateStakeInput(log)

	if (config === undefined) {
		throw new Error(
			`Could not decode createStake input for stakeId ${stakeId}`,
		)
	}

	const stakeConfig = new StakeConfig({
		id: stakeId.toString(),
		ticketCap: config.ticketCap,
		duration: config.duration,
		ticketCost: config.ticketCost,
		deleted: false,
	})

	stakeConfigs.set(stakeConfig.id, stakeConfig)

	for (let i = 0; i < config.prizeDistribution.length; i++) {
		const tier = config.prizeDistribution[i]
		prizeTiers.push(
			new PrizeTier({
				id: `${stakeId}-${i}`,
				stakeConfig,
				tierIndex: i,
				prizeCount: tier.prizeCount,
				minPrize: tier.minPrize,
				maxPrize: tier.maxPrize,
			}),
		)
	}
}

async function handleStakeDeleted(eventCtx: EventContext): Promise<void> {
	const { ctx, log, stakeConfigs } = eventCtx

	const { stakeId } = rips.events.StakeDeleted.decode(log)
	const id = stakeId.toString()

	let stakeConfig = stakeConfigs.get(id)
	if (stakeConfig === undefined) {
		stakeConfig = await ctx.store.get(StakeConfig, id)
	}

	if (stakeConfig === undefined) {
		throw new Error(`StakeConfig ${id} not found for StakeDeleted`)
	}

	stakeConfig.deleted = true
	stakeConfigs.set(id, stakeConfig)
}

async function handleRoundCreated(eventCtx: EventContext): Promise<void> {
	const { ctx, block, log, stakeConfigs, rounds } = eventCtx

	const { roundId, stakeId } = rips.events.RoundCreated.decode(log)
	const stakeConfigId = stakeId.toString()

	let stakeConfig = stakeConfigs.get(stakeConfigId)
	if (stakeConfig === undefined) {
		stakeConfig = await ctx.store.get(StakeConfig, stakeConfigId)
	}

	if (stakeConfig === undefined) {
		throw new Error(
			`StakeConfig ${stakeConfigId} not found for round ${roundId}`,
		)
	}

	rounds.set(
		roundId.toString(),
		new Round({
			id: roundId.toString(),
			stakeConfig,
			startTime: BigInt(block.timestamp) / 1000n,
			ticketsSold: 0,
			status: RoundStatus.Active,
		}),
	)
}

async function handleTicketsPurchased(eventCtx: EventContext): Promise<void> {
	const { ctx, block, log, rounds, ticketPurchases } = eventCtx

	const { roundId, buyer, count } = rips.events.TicketsPurchased.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRound(ctx, rounds, roundIdStr)
	if (round === undefined) {
		throw new Error(`Round ${roundIdStr} not found for TicketsPurchased`)
	}

	round.ticketsSold += Number(count)
	rounds.set(roundIdStr, round)

	ticketPurchases.push(
		new TicketPurchase({
			id: log.id,
			round,
			buyer: buyer.toLowerCase(),
			count,
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

async function handleRandomnessRequested(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, rounds } = eventCtx

	const { roundId, vrfRequestId } =
		rips.events.RandomnessRequested.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRound(ctx, rounds, roundIdStr)
	if (round === undefined) {
		throw new Error(`Round ${roundIdStr} not found for RandomnessRequested`)
	}

	round.status = RoundStatus.VRFRequested
	round.vrfRequestId = vrfRequestId

	rounds.set(roundIdStr, round)
}

async function handleRoundFinalized(eventCtx: EventContext): Promise<void> {
	const { ctx, log, rounds } = eventCtx

	const { roundId, randomA, randomB } = rips.events.RoundFinalized.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRound(ctx, rounds, roundIdStr)
	if (round === undefined) {
		throw new Error(`Round ${roundIdStr} not found for RoundFinalized`)
	}

	round.status = RoundStatus.Finalized
	round.randomA = randomA
	round.randomB = randomB

	rounds.set(roundIdStr, round)
}

async function handlePrizesClaimed(eventCtx: EventContext): Promise<void> {
	const { ctx, block, log, rounds, prizeClaims } = eventCtx

	const { roundId, claimer, amount } = rips.events.PrizesClaimed.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRound(ctx, rounds, roundIdStr)
	if (round === undefined) {
		throw new Error(`Round ${roundIdStr} not found for PrizesClaimed`)
	}

	rounds.set(roundIdStr, round)

	prizeClaims.push(
		new PrizeClaim({
			id: log.id,
			round,
			claimer: claimer.toLowerCase(),
			amount,
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

async function handleRefundIssued(eventCtx: EventContext): Promise<void> {
	const { ctx, block, log, rounds, refunds } = eventCtx

	const { roundId, user, amount } = rips.events.RefundIssued.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRound(ctx, rounds, roundIdStr)
	if (round === undefined) {
		throw new Error(`Round ${roundIdStr} not found for RefundIssued`)
	}

	rounds.set(roundIdStr, round)

	refunds.push(
		new Refund({
			id: log.id,
			round,
			user: user.toLowerCase(),
			amount,
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

function handleProtocolFeeUpdated(eventCtx: EventContext): void {
	const { block, log, protocolFeeUpdates } = eventCtx

	const { newFeePercent } = rips.events.ProtocolFeeUpdated.decode(log)

	protocolFeeUpdates.push(
		new ProtocolFeeUpdated({
			id: log.id,
			feePercent: newFeePercent,
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

function handleFeeRecipientUpdated(eventCtx: EventContext): void {
	const { block, log, feeRecipientUpdates } = eventCtx

	const { newRecipient } = rips.events.FeeRecipientUpdated.decode(log)

	feeRecipientUpdates.push(
		new FeeRecipientUpdated({
			id: log.id,
			feeRecipient: newRecipient.toLowerCase(),
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

function handleCallbackGasLimitUpdated(eventCtx: EventContext): void {
	const { block, log, callbackGasLimitUpdates } = eventCtx

	const { newLimit } = rips.events.CallbackGasLimitUpdated.decode(log)

	callbackGasLimitUpdates.push(
		new CallbackGasLimitUpdated({
			id: log.id,
			callbackGasLimit: newLimit,
			blockNumber: BigInt(block.height),
			timestamp: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}

async function resolveRound(
	ctx: Context,
	rounds: Map<string, Round>,
	roundId: string,
): Promise<Round | undefined> {
	return rounds.get(roundId) ?? (await ctx.store.get(Round, roundId))
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
