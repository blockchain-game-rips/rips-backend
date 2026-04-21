import { z } from 'zod'

export const PlainChainAddressZ = z.object({
	address: z.string(),
	chain: z.object({
		reference: z.string(),
		namespace: z.string(),
	}),
})

export const PlainCurrencyZ = z.object({
	chainAddress: PlainChainAddressZ,
	symbol: z.string(),
	name: z.string(),
	decimals: z.number(),
})

export const PlainCurrencyAmountZ = z.object({
	currency: PlainCurrencyZ,
	amount: z.string(),
})

export const PlainTransactionZ = z.object({
	id: z.string(),
	cost: PlainCurrencyAmountZ.optional(),
})
