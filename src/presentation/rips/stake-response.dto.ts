import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Config } from '../../domain/entities/config'
import { AvailableStake } from '../../domain/value-objects/available-stake'
import { toPlainCurrencyAmount } from '../to-plain'
import { PlainCurrencyAmountZ } from '../to-plain-schemas'

const PrizeTierZ = z.object({
	prizeCount: z.string(),
	minPrize: z.string(),
	maxPrize: z.string(),
})

const ConfigZ = z.object({
	ticketCap: z.number(),
	feePercent: z.number(),
	ticketPrice: PlainCurrencyAmountZ,
	durationSeconds: z.number(),
	prizeDistribution: z.array(PrizeTierZ),
})

const StakeResponseZ = z.object({
	stakeId: z.number(),
	config: ConfigZ,
	fillingRoundId: z.number().nullable(),
})

export class StakeResponseDto extends createZodDto(StakeResponseZ) {}

function toConfigDto(config: Config): z.infer<typeof ConfigZ> {
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

export function toStakeResponseDto(
	availableStake: AvailableStake,
): StakeResponseDto {
	const config =
		availableStake.fillingRound !== null
			? availableStake.fillingRound.config
			: availableStake.stake.currentConfig

	return {
		stakeId: availableStake.stake.id,
		config: toConfigDto(config),
		fillingRoundId: availableStake.fillingRound?.id ?? null,
	}
}
