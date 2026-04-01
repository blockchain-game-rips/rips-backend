import {
	CompletedRound,
	OngoingRound,
	RoundStatus,
} from 'src/domain/entities/round'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

type PurchaseActionDto = {
	userAddress: string
	ticketAmount: string
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

export type OngoingRoundResponseDto = {
	id: number
	stake: StakeResponseDto
	actions: AddressesActionsDto
	status: RoundStatus
	startTime: string
}

export type CompletedRoundResponseDto = {
	id: number
	stake: StakeResponseDto
	actions: AddressesActionsDto
	status: RoundStatus
	startTime: string
}

export type GetCompletedRoundsResponseDto = {
	rounds: CompletedRoundResponseDto[]
	nextCursor: number | null
}

function toActionsDto(actions: OngoingRound['actions']): AddressesActionsDto {
	return {
		purchases: actions.purchases.map((p) => ({
			userAddress: p.userAddress,
			ticketAmount: p.ticketAmount.toString(),
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

export function toOngoingRoundResponseDto(
	round: OngoingRound,
): OngoingRoundResponseDto {
	return {
		id: round.id,
		stake: toStakeResponseDto(round.stake),
		actions: toActionsDto(round.actions),
		status: round.status,
		startTime: round.startTime.toISOString(),
	}
}

export function toCompletedRoundResponseDto(
	round: CompletedRound,
): CompletedRoundResponseDto {
	return {
		id: round.id,
		stake: toStakeResponseDto(round.stake),
		actions: toActionsDto(round.actions),
		status: round.status,
		startTime: round.startTime.toISOString(),
	}
}
