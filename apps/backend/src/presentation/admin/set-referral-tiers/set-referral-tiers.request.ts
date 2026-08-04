import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const setReferralTiersParamsSchema = z.object({
	currency: evmAddressSchema,
})

const referralTierSchema = z.object({
	minVolume: z.string().transform(BigInt),
	feeBps: z.number().int().min(0).max(10000),
})

const setReferralTiersBodySchema = z.object({
	tiers: z.array(referralTierSchema),
})

export class SetReferralTiersParamsDto extends createZodDto(
	setReferralTiersParamsSchema,
) {}

export class SetReferralTiersBodyDto extends createZodDto(
	setReferralTiersBodySchema,
) {}
