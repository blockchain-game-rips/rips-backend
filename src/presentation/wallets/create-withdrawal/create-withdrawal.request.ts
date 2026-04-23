import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressInputSchema } from '../../shared/chain-address.dto'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const createWithdrawalBodySchema = z.object({
	amountIn: z.object({
		amount: z
			.string()
			.regex(/^\d+$/)
			.transform((v) => BigInt(v)),
		currencyChainAddress: chainAddressInputSchema,
	}),
	currencyOutChainAddress: chainAddressInputSchema,
	recipientAddress: z.string().regex(EVM_ADDRESS_REGEX),
})

export class CreateWithdrawalBodyDto extends createZodDto(
	createWithdrawalBodySchema,
) {}
