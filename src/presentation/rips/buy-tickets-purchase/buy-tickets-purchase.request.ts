import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ChainAddressDto } from '../../shared/chain-address.dto'

const buyTicketsPurchaseBodySchema = z.object({
	stakeId: z.number().int().min(1),
	ticketCount: z.number().int().min(1),
	paymentCurrencyChainAddress: ChainAddressDto.schema,
})

export class BuyTicketsPurchaseBodyDto extends createZodDto(
	buyTicketsPurchaseBodySchema,
) {}
