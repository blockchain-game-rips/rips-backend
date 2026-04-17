import {
	CompletedRound,
	OngoingRound,
	RoundStatus,
} from '../../domain/entities/round'
import {
	PlainCurrency,
	PlainCurrencyAmount,
	toPlainCurrency,
	toPlainCurrencyAmount,
} from '../to-plain'

type PurchaseActionDto = {
	userAddress: string
	ticketCount: string
	startTicketIndex: string
}

type ClaimActionDto = {
	userAddress: string
	amount: string
}

type RefundActionDto = {
	userAddress: string
	amount: string
}

type AddressesActionsDto = {
	purchases: PurchaseActionDto[]
	claims: ClaimActionDto[]
	refunds: RefundActionDto[]
}

type PrizeTierDto = {
	prizeCount: string
	minPrize: string
	maxPrize: string
}

type RoundConfigDto = {
	ticketCap: number
	feePercent: number
	ticketPrice: PlainCurrencyAmount
	durationSeconds: number
	prizeDistribution: PrizeTierDto[]
}

type RoundBaseDto = {
	id: number
	stakeId: number
	currency: PlainCurrency
	config: RoundConfigDto
	actions: AddressesActionsDto
	status: RoundStatus
	startTime: string
}

export type OngoingRoundResponseDto = RoundBaseDto
export type CompletedRoundResponseDto = RoundBaseDto

export type GetCompletedRoundsResponseDto = {
	rounds: CompletedRoundResponseDto[]
	nextCursor: number | null
}

function toActionsDto(actions: OngoingRound['actions']): AddressesActionsDto {
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

function toRoundConfigDto(config: OngoingRound['config']): RoundConfigDto {
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

function toRoundBaseDto(round: OngoingRound | CompletedRound): RoundBaseDto {
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
