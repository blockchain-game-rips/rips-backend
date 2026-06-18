import { createZodDto } from 'nestjs-zod'
import { isAddress } from 'viem'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const setReferralTiersParamsSchema = z.object({
	currency: z
		.string()
		.refine(isAddress, 'Invalid EVM address')
		.transform(toEvmAddress),
})

const referralTierSchema = z.object({
	minVolume: z.string().transform(BigInt),
	feePercent: z.number().int().min(0).max(10000),
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
