import { Stake } from 'src/domain/entities/stake'
import { ChainAddress } from 'src/domain/value-objects/chain-address'

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
}

export function toStakeResponseDto(stake: Stake): StakeResponseDto {
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
	}
}
