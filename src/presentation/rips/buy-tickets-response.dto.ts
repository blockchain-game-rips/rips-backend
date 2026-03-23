import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Purchase } from 'src/domain/value-objects/purchase'

export type BuyTicketsResponseDto = {
	txId: string
	cost: {
		currency: {
			chainAddress: ChainAddress
			symbol: string
			name: string
			decimals: number
		}
		amount: string
	}
	roundId: number
	ticketAmount: number
}

export function toBuyTicketsResponseDto(
	purchase: Purchase,
): BuyTicketsResponseDto {
	return {
		txId: purchase.transaction.id,
		cost: {
			currency: {
				chainAddress: purchase.transaction.cost.currency.chainAddress,
				symbol: purchase.transaction.cost.currency.symbol,
				name: purchase.transaction.cost.currency.name,
				decimals: purchase.transaction.cost.currency.decimals,
			},
			amount: purchase.transaction.cost.amount.toString(),
		},
		roundId: purchase.ticketAmount.roundId,
		ticketAmount: purchase.ticketAmount.amount,
	}
}
