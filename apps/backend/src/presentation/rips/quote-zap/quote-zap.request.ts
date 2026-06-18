import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressInputSchema } from '../../shared/chain-address.dto'

const quoteZapBodySchema = z.object({
	stakeId: z.number().int().min(1),
	ticketCount: z.number().int().min(1),
	paymentCurrencyChainAddress: chainAddressInputSchema,
})

export class QuoteZapBodyDto extends createZodDto(quoteZapBodySchema) {}
