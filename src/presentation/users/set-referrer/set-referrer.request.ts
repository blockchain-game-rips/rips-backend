import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const setReferrerBodySchema = z.object({
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress)
		.nullable(),
})

export class SetReferrerBodyDto extends createZodDto(setReferrerBodySchema) {}
