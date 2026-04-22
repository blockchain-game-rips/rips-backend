import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Round, RoundStatus } from '../../../domain/entities/round'
import { CurrencyDto, toCurrencyDto } from '../../shared/currency.dto'
import { configSchema, toConfigDto } from './config.dto'

const purchaseActionSchema = z.object({
	userAddress: z.string(),
	ticketCount: z.string(),
	startTicketIndex: z.string(),
})

const claimActionSchema = z.object({
	userAddress: z.string(),
	amount: z.string(),
})

const refundActionSchema = z.object({
	userAddress: z.string(),
	amount: z.string(),
})

const actionsSchema = z.object({
	purchases: z.array(purchaseActionSchema),
	claims: z.array(claimActionSchema),
	refunds: z.array(refundActionSchema),
})

const randomsSchema = z.object({
	a: z.string(),
	b: z.string(),
})

export const roundSchema = z.object({
	id: z.number(),
	stakeId: z.number(),
	currency: CurrencyDto.schema,
	config: configSchema,
	actions: actionsSchema,
	status: z.enum(RoundStatus),
	startTime: z.string(),
	randoms: randomsSchema.optional(),
})

export class RoundDto extends createZodDto(roundSchema) {}

function toActionsDto(
	actions: Round['actions'],
): z.infer<typeof actionsSchema> {
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

export function toRoundDto(round: Round, priceUsd: number): RoundDto {
	return {
		id: round.id,
		stakeId: round.stake.id,
		currency: toCurrencyDto(round.currency, priceUsd),
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
