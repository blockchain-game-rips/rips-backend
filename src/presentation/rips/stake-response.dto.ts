import { Config } from 'src/domain/entities/stake'
import { ChainAddress } from 'src/domain/value-objects/chain-address'

type PrizeTierDto = {
	prizeCount: string
	minPrize: string
	maxPrize: string
}

export type StakeResponseDto = {
	id: number
	ticketCup: number
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

export function toStakeResponseDto(stake: Config): StakeResponseDto {
	return {
		id: stake.id,
		ticketCup: stake.ticketCup,
		ticketPrice: {
			amount: stake.ticketPrice.amount.toString(),
			currency: {
				symbol: stake.ticketPrice.currency.symbol,
				decimals: stake.ticketPrice.currency.decimals,
				chainAddress: stake.ticketPrice.currency.chainAddress,
				name: stake.ticketPrice.currency.name,
			},
		},
		durationSeconds: stake.durationSeconds,
		prizeDistribution: stake.prizeDistribution.map((tier) => ({
			prizeCount: tier.prizeCount.toString(),
			minPrize: tier.minPrize.toString(),
			maxPrize: tier.maxPrize.toString(),
		})),
	}
}
