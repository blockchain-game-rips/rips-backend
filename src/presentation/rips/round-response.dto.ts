import { Round, RoundStatus } from 'src/domain/entities/round'
import { Address } from 'viem'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

type PurchaseActionDto = {
	userAddress: Address
	ticketAmount: string
	startTicketIndex: string
}

type ClaimActionDto = {
	userAddress: Address
	amount: string
}

type RefundActionDto = {
	userAddress: Address
	amount: string
}

type AddressesActionsDto = {
	purchases: PurchaseActionDto[]
	claims: ClaimActionDto[]
	refunds: RefundActionDto[]
}

export type RoundResponseDto = {
	id: number
	stake: StakeResponseDto
	actions: AddressesActionsDto
	status: RoundStatus
	startTime: string
}

export function toRoundResponseDto(round: Round): RoundResponseDto {
	return {
		id: round.id,
		stake: toStakeResponseDto(round.stake),
		actions: {
			purchases: round.actions.purchases.map((p) => ({
				userAddress: p.userAddress,
				ticketAmount: p.ticketAmount.toString(),
				startTicketIndex: p.startTicketIndex.toString(),
			})),
			claims: round.actions.claims.map((c) => ({
				userAddress: c.userAddress,
				amount: c.amount.toString(),
			})),
			refunds: round.actions.refunds.map((r) => ({
				userAddress: r.userAddress,
				amount: r.amount.toString(),
			})),
		},
		status: round.status,
		startTime: round.startTime.toISOString(),
	}
}
