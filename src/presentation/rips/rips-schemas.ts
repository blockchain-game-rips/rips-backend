import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Config } from '../../domain/entities/config'
import { toPlainCurrencyAmount } from '../to-plain'
import { CurrencyAmountDto } from '../to-plain-schemas'

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
