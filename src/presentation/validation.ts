import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toChainNamespace } from '../domain/value-objects/chain-namespace'
import { toEvmAddress } from '../domain/value-objects/evm-address'
import { toTelegramId } from '../domain/value-objects/telegram-id'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const telegramIdSchema = z
	.string()
	.regex(/^\d+$/)
	.transform((v) => toTelegramId(BigInt(v)))

export const TELEGRAM_ID_PARAM = 'telegramId'
const telegramIdParamsSchema = z.object({
	[TELEGRAM_ID_PARAM]: telegramIdSchema,
})

export class TelegramIdParamsDto extends createZodDto(telegramIdParamsSchema) {}

const revealBodySchema = z.object({
	revealAll: z.boolean(),
})

export class RevealBodyDto extends createZodDto(revealBodySchema) {}

const createUserBodySchema = z.object({
	telegramId: z
		.union([z.string(), z.number()])
		.transform((v) => toTelegramId(BigInt(v))),
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress)
		.nullable()
		.default(null),
})

export class CreateUserBodyDto extends createZodDto(createUserBodySchema) {}

const chainAddressSchema = z.object({
	address: z.string().min(1),
	chain: z.object({
		namespace: z.string().transform(toChainNamespace),
		reference: z.string().min(1),
	}),
})

const getBalanceBodySchema = z.object({
	currencyChainAddress: chainAddressSchema,
})

export class GetBalanceBodyDto extends createZodDto(getBalanceBodySchema) {}

const withdrawBodySchema = z.object({
	amount: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => BigInt(v)),
	currencyChainAddress: chainAddressSchema,
	recipientAddress: z.string().regex(EVM_ADDRESS_REGEX),
})

export class WithdrawBodyDto extends createZodDto(withdrawBodySchema) {}

const buyTicketsBodySchema = z.object({
	stakeId: z.number().int().positive(),
	ticketCount: z.number().int().positive(),
	paymentCurrencyChainAddress: chainAddressSchema,
})

export class BuyTicketsBodyDto extends createZodDto(buyTicketsBodySchema) {}

const completedRoundsQuerySchema = z.object({
	limit: z.coerce.number().int().positive().optional().default(20),
	cursor: z.coerce.number().int().positive().optional(),
})

export class CompletedRoundsQueryDto extends createZodDto(
	completedRoundsQuerySchema,
) {}
