import { Config } from '../../domain/entities/config'
import { AvailableStake } from '../../domain/value-objects/available-stake'
import { ChainAddress } from '../../domain/value-objects/chain-address'

type PrizeTierDto = {
	prizeCount: string
	minPrize: string
	maxPrize: string
}

type ConfigDto = {
	ticketCap: number
	ticketPrice: {
		amount: string
		currency: {
			chainAddress: ChainAddress
			symbol: string
			name: string
			decimals: number
		}
	}
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
		ticketPrice: {
			amount: config.ticketPrice.amount.toString(),
			currency: {
				symbol: config.ticketPrice.currency.symbol,
				decimals: config.ticketPrice.currency.decimals,
				chainAddress: config.ticketPrice.currency.chainAddress,
				name: config.ticketPrice.currency.name,
			},
		},
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
