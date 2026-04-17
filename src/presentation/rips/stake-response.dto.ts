import { Config } from '../../domain/entities/config'
import { AvailableStake } from '../../domain/value-objects/available-stake'
import { PlainCurrencyAmount, toPlainCurrencyAmount } from '../to-plain'

type PrizeTierDto = {
	prizeCount: string
	minPrize: string
	maxPrize: string
}

type ConfigDto = {
	ticketCap: number
	feePercent: number
	ticketPrice: PlainCurrencyAmount
	durationSeconds: number
	prizeDistribution: PrizeTierDto[]
}

export type StakeResponseDto = {
	stakeId: number
	config: ConfigDto
	fillingRoundId: number | null
}

function toConfigDto(config: Config): ConfigDto {
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
