import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ChainAddressDto } from '../../shared/chain-address.dto'

const buyTicketsZapBodySchema = z.object({
	stakeId: z.number().int().min(1),
	ticketCount: z.number().int().min(1),
	paymentCurrencyChainAddress: ChainAddressDto.schema,
})

export class BuyTicketsZapBodyDto extends createZodDto(
	buyTicketsZapBodySchema,
) {}
