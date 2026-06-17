import { isAddress } from 'viem'
import * as z from 'zod'

export const SameChainSwapTokenSchema = z.object({
	address: z.string(),
	name: z.string(),
	symbol: z.string(),
	decimals: z.number(),
	amount: z.string(),
})

export const SameChainSwapTxSchema = z.object({
	to: z.string().refine(isAddress),
	data: z.string().refine((s): s is `0x${string}` => s.startsWith('0x')),
	value: z.string(),
})

export const SameChainSwapEstimatedTransactionFeeDetailsSchema = z.object({
	gasLimit: z.string(),
	baseFee: z.string().optional(),
	maxFeePerGas: z.string().optional(),
	maxPriorityFeePerGas: z.string().optional(),
})

export const SameChainSwapEstimatedTransactionFeeSchema = z.object({
	total: z.string(),
	details: SameChainSwapEstimatedTransactionFeeDetailsSchema,
})

export const SameChainSwapSchema = z.object({
	tx: SameChainSwapTxSchema,
	tokenIn: SameChainSwapTokenSchema,
	tokenOut: SameChainSwapTokenSchema.extend({ minAmount: z.string() }),
	estimatedTransactionFee: SameChainSwapEstimatedTransactionFeeSchema,
})

export type SameChainSwapResponse = z.infer<typeof SameChainSwapSchema>
