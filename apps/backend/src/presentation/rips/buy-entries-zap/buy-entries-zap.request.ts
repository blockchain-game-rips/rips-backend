import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressInputSchema } from '../../shared/chain-address.dto'

const buyEntriesZapBodySchema = z.object({
	presetId: z.number().int().min(1),
	entryCount: z.number().int().min(1),
	paymentCurrencyChainAddress: chainAddressInputSchema,
})

export class BuyEntriesZapBodyDto extends createZodDto(
	buyEntriesZapBodySchema,
) {}
