import { Currency } from 'src/domain/entities/currency'

export function fromStakeRaw(
	stakeRaw: {
		__typename?: 'StakeConfig'
		id: string
		ticketCap: string
		ticketCost: string
		durationSeconds: string
	},
	mainCurrency: Currency,
) {
	return {
		id: Number(stakeRaw.id),
		ticketCup: Number(stakeRaw.ticketCap),
		ticketPrice: {
			currency: mainCurrency,
			amount: BigInt(stakeRaw.ticketCost),
		},
		durationSeconds: Number(stakeRaw.durationSeconds),
	}
}
