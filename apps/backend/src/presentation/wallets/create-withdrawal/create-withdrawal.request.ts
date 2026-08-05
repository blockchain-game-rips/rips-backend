import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressInputSchema } from '../../shared/chain-address.dto'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const createWithdrawalBodySchema = z.object({
	amountIn: z.object({
		amount: z
			.string()
			.regex(/^\d+$/)
			.transform((v) => BigInt(v)),
		currencyChainAddress: chainAddressInputSchema,
	}),
	currencyOutChainAddress: chainAddressInputSchema,
	recipientAddress: evmAddressSchema,
})

export class CreateWithdrawalBodyDto extends createZodDto(
	createWithdrawalBodySchema,
) {}
