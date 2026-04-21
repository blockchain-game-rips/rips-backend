import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const PlainChainAddressZ = z.object({
	address: z.string(),
	chain: z.object({
		reference: z.string(),
		namespace: z.string(),
	}),
})

export const PlainCurrencyZ = z.object({
	priceUsd: z.number(),
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

export class ChainAddressDto extends createZodDto(PlainChainAddressZ) {}
export class CurrencyDto extends createZodDto(PlainCurrencyZ) {}
export class CurrencyAmountDto extends createZodDto(PlainCurrencyAmountZ) {}
export class TransactionDto extends createZodDto(PlainTransactionZ) {}
