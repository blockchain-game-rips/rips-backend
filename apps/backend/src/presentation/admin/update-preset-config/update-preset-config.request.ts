import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { payoutTierSchema } from '../../rips/shared/config.dto'
import { ChainAddressDto } from '../../shared/chain-address.dto'

const configSchema = z.object({
	entryCap: z.number(),
	feePercent: z.number(),
	entryPrice: z.object({
		currencyChainAddress: ChainAddressDto.schema,
		amount: z.string().transform((value) => BigInt(value)),
	}),
	durationSeconds: z.number(),
	payoutDistribution: z.array(payoutTierSchema).transform((value) => {
		return value.map((payout) => {
			return {
				maxPayout: BigInt(payout.maxPayout),
				minPayout: BigInt(payout.minPayout),
				payoutCount: BigInt(payout.payoutCount),
			}
		})
	}),
})

const updatePresetConfigBodySchema = z.object({
	config: configSchema,
})

export class UpdatePresetConfigBodyDto extends createZodDto(
	updatePresetConfigBodySchema,
) {}
