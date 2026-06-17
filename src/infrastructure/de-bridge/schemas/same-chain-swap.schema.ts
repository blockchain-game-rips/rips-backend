import * as z from 'zod'

export const SameChainSwapTokenSchema = z.object({
	address: z.string(),
	name: z.string(),
	symbol: z.string(),
	decimals: z.number(),
	amount: z.string(),
})

export const SameChainSwapTxSchema = z.object({
	to: z.string(),
	data: z.string(),
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
