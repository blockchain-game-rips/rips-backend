import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Config } from '../../../domain/entities/config'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

export const prizeTierSchema = z.object({
	prizeCount: z.string(),
	minPrize: z.string(),
	maxPrize: z.string(),
})

export const configSchema = z.object({
	ticketCap: z.number(),
	feePercent: z.number(),
	ticketPrice: CurrencyAmountDto.schema,
	durationSeconds: z.number(),
	prizeDistribution: z.array(prizeTierSchema),
})

export class ConfigDto extends createZodDto(configSchema) {}

export function toConfigDto(config: Config): ConfigDto {
	return {
		ticketCap: config.ticketCap,
		feePercent: config.feePercent,
		ticketPrice: toPricedCurrencyAmountDto(config.ticketPrice),
		durationSeconds: config.durationSeconds,
		prizeDistribution: config.prizeDistribution.map((tier) => ({
			prizeCount: tier.prizeCount.toString(),
			minPrize: tier.minPrize.toString(),
			maxPrize: tier.maxPrize.toString(),
		})),
	}
}
