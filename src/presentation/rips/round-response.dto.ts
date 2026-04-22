import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
	CompletedRound,
	OngoingRound,
	Round,
	RoundStatus,
} from '../../domain/entities/round'
import { toPlainCurrency } from '../to-plain'
import { CurrencyDto } from '../to-plain-schemas'
import { ConfigDto, toConfigDto } from './rips-schemas'

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

const RandomsZ = z.object({
	a: z.string(),
	b: z.string(),
})

const RoundResponseZ = z.object({
	id: z.number(),
	stakeId: z.number(),
	currency: CurrencyDto.schema,
	config: ConfigDto.schema,
	actions: AddressesActionsZ,
	status: z.enum(RoundStatus),
	startTime: z.string(),
	randoms: RandomsZ.optional(),
})

const GetCompletedRoundsResponseZ = z.object({
	rounds: z.array(RoundResponseZ),
	nextCursor: z.number().nullable(),
})

export class RoundResponseDto extends createZodDto(RoundResponseZ) {}
export class GetCompletedRoundsResponseDto extends createZodDto(
	GetCompletedRoundsResponseZ,
) {}

function toActionsDto(
	actions: Round['actions'],
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

export function toRoundResponseDto(
	round: OngoingRound | CompletedRound,
	priceUsd: number,
): RoundResponseDto {
	return {
		id: round.id,
		stakeId: round.stake.id,
		currency: toPlainCurrency(round.currency, priceUsd),
		config: toConfigDto(round.config, priceUsd),
		actions: toActionsDto(round.actions),
		status: round.status,
		startTime: round.startTime.toISOString(),
		randoms:
			round.randoms !== undefined
				? {
						a: round.randoms.a.toString(),
						b: round.randoms.b.toString(),
					}
				: undefined,
	}
}
