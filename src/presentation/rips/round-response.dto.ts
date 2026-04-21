import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
	CompletedRound,
	OngoingRound,
	RoundStatus,
} from '../../domain/entities/round'
import { toPlainCurrency, toPlainCurrencyAmount } from '../to-plain'
import { PlainCurrencyAmountZ, PlainCurrencyZ } from '../to-plain-schemas'

const PrizeTierZ = z.object({
	prizeCount: z.string(),
	minPrize: z.string(),
	maxPrize: z.string(),
})

const RoundConfigZ = z.object({
	ticketCap: z.number(),
	feePercent: z.number(),
	ticketPrice: PlainCurrencyAmountZ,
	durationSeconds: z.number(),
	prizeDistribution: z.array(PrizeTierZ),
})

const PurchaseActionZ = z.object({
	userAddress: z.string(),
	ticketCount: z.string(),
	startTicketIndex: z.string(),
})

const ClaimActionZ = z.object({
	userAddress: z.string(),
	amount: z.string(),
})

const RefundActionZ = z.object({
	userAddress: z.string(),
	amount: z.string(),
})

const AddressesActionsZ = z.object({
	purchases: z.array(PurchaseActionZ),
	claims: z.array(ClaimActionZ),
	refunds: z.array(RefundActionZ),
})

const RoundBaseZ = z.object({
	id: z.number(),
	stakeId: z.number(),
	currency: PlainCurrencyZ,
	config: RoundConfigZ,
	actions: AddressesActionsZ,
	status: z.nativeEnum(RoundStatus),
	startTime: z.string(),
})

const GetCompletedRoundsResponseZ = z.object({
	rounds: z.array(RoundBaseZ),
	nextCursor: z.number().nullable(),
})

export class OngoingRoundResponseDto extends createZodDto(RoundBaseZ) {}
export class CompletedRoundResponseDto extends createZodDto(RoundBaseZ) {}
export class GetCompletedRoundsResponseDto extends createZodDto(
	GetCompletedRoundsResponseZ,
) {}

function toActionsDto(
	actions: OngoingRound['actions'],
): z.infer<typeof AddressesActionsZ> {
	return {
		purchases: actions.purchases.map((p) => ({
			userAddress: p.userAddress,
			ticketCount: p.ticketCount.toString(),
			startTicketIndex: p.startTicketIndex.toString(),
		})),
		claims: actions.claims.map((c) => ({
			userAddress: c.userAddress,
			amount: c.amount.toString(),
		})),
		refunds: actions.refunds.map((r) => ({
			userAddress: r.userAddress,
			amount: r.amount.toString(),
		})),
	}
}

function toRoundConfigDto(
	config: OngoingRound['config'],
): z.infer<typeof RoundConfigZ> {
	return {
		ticketCap: config.ticketCup,
		feePercent: config.feePercent,
		ticketPrice: toPlainCurrencyAmount(config.ticketPrice),
		durationSeconds: config.durationSeconds,
		prizeDistribution: config.prizeDistribution.map((tier) => ({
			prizeCount: tier.prizeCount.toString(),
			minPrize: tier.minPrize.toString(),
			maxPrize: tier.maxPrize.toString(),
		})),
	}
}

function toRoundBaseDto(
	round: OngoingRound | CompletedRound,
): z.infer<typeof RoundBaseZ> {
	return {
		id: round.id,
		stakeId: round.stake.id,
		currency: toPlainCurrency(round.currency),
		config: toRoundConfigDto(round.config),
		actions: toActionsDto(round.actions),
		status: round.status,
		startTime: round.startTime.toISOString(),
	}
}

export function toOngoingRoundResponseDto(
	round: OngoingRound,
): OngoingRoundResponseDto {
	return toRoundBaseDto(round)
}

export function toCompletedRoundResponseDto(
	round: CompletedRound,
): CompletedRoundResponseDto {
	return toRoundBaseDto(round)
}
