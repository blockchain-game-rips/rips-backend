import { createZodDto } from 'nestjs-zod'
import { isAddress } from 'viem'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const setReferrerFrozenParamsSchema = z.object({
	address: z
		.string()
		.refine(isAddress, 'Invalid EVM address')
		.transform(toEvmAddress),
})

const setReferrerFrozenBodySchema = z.object({
	frozen: z.boolean(),
})

export class SetReferrerFrozenParamsDto extends createZodDto(
	setReferrerFrozenParamsSchema,
) {}

export class SetReferrerFrozenBodyDto extends createZodDto(
	setReferrerFrozenBodySchema,
) {}
