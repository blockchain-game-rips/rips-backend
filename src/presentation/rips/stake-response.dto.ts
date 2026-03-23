import { Stake } from 'src/domain/entities/stake'
import { ChainAddress } from 'src/domain/value-objects/chain-address'

export type StakeResponseDto = {
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
	duration: number
}

export function toStakeResponseDto(stake: Stake): StakeResponseDto {
	return {
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
		duration: stake.duration,
	}
}
