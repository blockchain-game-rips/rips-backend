import { isAddress } from 'viem'
import * as z from 'zod'
import { HexSchema } from '../../schemas/hex.schema'

export const ContractCallsTransactionRequestSchema = z.object({
	to: z.string().refine(isAddress),
	data: HexSchema,
	value: HexSchema,
	chainId: z.number(),
	gasPrice: HexSchema.optional(),
	gasLimit: HexSchema.optional(),
})

export const ContractCallsActionSchema = z.object({
	fromAmount: z.string(),
	fromChainId: z.number(),
	toChainId: z.number(),
})

export const ContractCallsGasCostSchema = z.object({
	type: z.string(),
	amount: z.string(),
	limit: z.string().optional(),
	price: z.string().optional(),
})

export const ContractCallsEstimateSchema = z.object({
	approvalAddress: z.string().refine(isAddress),
	gasCosts: z.array(ContractCallsGasCostSchema).default([]),
})

export const ContractCallsQuoteSchema = z.object({
	action: ContractCallsActionSchema,
	estimate: ContractCallsEstimateSchema,
	transactionRequest: ContractCallsTransactionRequestSchema,
})

export type ContractCallsQuote = z.infer<typeof ContractCallsQuoteSchema>
