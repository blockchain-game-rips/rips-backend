import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Config } from '../../../domain/entities/config'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

export const payoutTierSchema = z.object({
	payoutCount: z.string(),
	minPayout: z.string(),
	maxPayout: z.string(),
})

export const configSchema = z.object({
	entryCap: z.number(),
	feeBps: z.number(),
	entryPrice: CurrencyAmountDto.schema,
	durationSeconds: z.number(),
	payoutDistribution: z.array(payoutTierSchema),
})

export class ConfigDto extends createZodDto(configSchema) {}

export function toConfigDto(config: Config): ConfigDto {
	return {
		entryCap: config.entryCap,
		feeBps: config.feeBps,
		entryPrice: toPricedCurrencyAmountDto(config.entryPrice),
		durationSeconds: config.durationSeconds,
		payoutDistribution: config.payoutDistribution.map((tier) => ({
			payoutCount: tier.payoutCount.toString(),
			minPayout: tier.minPayout.toString(),
			maxPayout: tier.maxPayout.toString(),
		})),
	}
}
