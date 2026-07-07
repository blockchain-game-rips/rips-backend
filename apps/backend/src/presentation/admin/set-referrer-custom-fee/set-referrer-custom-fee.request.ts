import { createZodDto } from 'nestjs-zod'
import { isAddress } from 'viem'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const setReferrerCustomFeeParamsSchema = z.object({
	address: z
		.string()
		.refine(isAddress, 'Invalid EVM address')
		.transform(toEvmAddress),
})

const setReferrerCustomFeeBodySchema = z.object({
	feeBps: z.number().int().min(0).max(10000),
})

export class SetReferrerCustomFeeParamsDto extends createZodDto(
	setReferrerCustomFeeParamsSchema,
) {}

export class SetReferrerCustomFeeBodyDto extends createZodDto(
	setReferrerCustomFeeBodySchema,
) {}
