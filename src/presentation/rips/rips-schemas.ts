import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Config } from '../../domain/entities/config'
import {
	CompletedRound,
	OngoingRound,
	Round,
	RoundStatus,
} from '../../domain/entities/round'
import { toPlainCurrency, toPlainCurrencyAmount } from '../to-plain'
import { CurrencyAmountDto, CurrencyDto } from '../to-plain-schemas'

export const PrizeTierZ = z.object({
	prizeCount: z.string(),
	minPrize: z.string(),
	maxPrize: z.string(),
})

export const ConfigZ = z.object({
	ticketCap: z.number(),
	feePercent: z.number(),
	ticketPrice: CurrencyAmountDto.schema,
	durationSeconds: z.number(),
	prizeDistribution: z.array(PrizeTierZ),
})

export class ConfigDto extends createZodDto(ConfigZ) {}

export function toConfigDto(
	config: Config,
	ticketPriceInUsd: number,
): ConfigDto {
	return {
		ticketCap: config.ticketCup,
		feePercent: config.feePercent,
		ticketPrice: toPlainCurrencyAmount(
			config.ticketPrice,
			ticketPriceInUsd,
		),
		durationSeconds: config.durationSeconds,
		prizeDistribution: config.prizeDistribution.map((tier) => ({
			prizeCount: tier.prizeCount.toString(),
			minPrize: tier.minPrize.toString(),
			maxPrize: tier.maxPrize.toString(),
		})),
	}
}

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

export const RoundZ = z.object({
	id: z.number(),
	stakeId: z.number(),
	currency: CurrencyDto.schema,
	config: ConfigDto.schema,
	actions: AddressesActionsZ,
	status: z.enum(RoundStatus),
	startTime: z.string(),
	randoms: RandomsZ.optional(),
})

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

export function toRoundDto(
	round: OngoingRound | CompletedRound,
	priceUsd: number,
): RoundDto {
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

export class RoundDto extends createZodDto(RoundZ) {}
