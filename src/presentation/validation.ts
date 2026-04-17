import { z } from 'zod'
import { toChainNamespace } from '../domain/value-objects/chain-namespace'
import { toTelegramId } from '../domain/value-objects/telegram-id'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

export const telegramIdParamSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

export const revealBodySchema = z.object({
	revealAll: z.boolean(),
})

export const createUserBodySchema = z.object({
	telegramId: z
		.union([z.string(), z.number()])
		.transform((v) => toTelegramId(BigInt(v))),
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.nullable()
		.default(null),
})

export const withdrawBodySchema = z.object({
	amount: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => BigInt(v)),
	recipientAddress: z.string().regex(EVM_ADDRESS_REGEX),
})

const chainAddressSchema = z.object({
	address: z.string().min(1),
	chain: z.object({
		namespace: z.string().transform(toChainNamespace),
		reference: z.string().min(1),
	}),
})

export const buyTicketsBodySchema = z.object({
	stakeId: z.number().int().positive(),
	ticketCount: z.number().int().positive(),
	paymentCurrencyChainAddress: chainAddressSchema,
})

export const completedRoundsQuerySchema = z.object({
	limit: z.coerce.number().int().positive().optional().default(20),
	cursor: z.coerce.number().int().positive().optional(),
})
