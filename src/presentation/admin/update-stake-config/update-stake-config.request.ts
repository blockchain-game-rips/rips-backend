import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { prizeTierSchema } from '../../rips/shared/config.dto'
import { ChainAddressDto } from '../../shared/chain-address.dto'

const configSchema = z.object({
	ticketCap: z.number(),
	feePercent: z.number(),
	ticketPrice: z.object({
		currencyChainAddress: ChainAddressDto.schema,

		amount: z.string(),
	}),
	durationSeconds: z.number(),
	prizeDistribution: z.array(prizeTierSchema),
})

const updateStakeConfigBodySchema = z.object({
	config: configSchema,
})

export class UpdateStakeConfigBodyDto extends createZodDto(
	updateStakeConfigBodySchema,
) {}
