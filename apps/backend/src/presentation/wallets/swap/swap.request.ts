import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressInputSchema } from '../../shared/chain-address.dto'

const swapBodySchema = z.object({
	currencyInChainAddress: chainAddressInputSchema,
	currencyOutChainAddress: chainAddressInputSchema,
	amountIn: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => BigInt(v)),
})

export class SwapBodyDto extends createZodDto(swapBodySchema) {}
