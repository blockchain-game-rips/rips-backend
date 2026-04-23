import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const withdrawRewardBodySchema = z.object({
	currencyAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress),
})

export class WithdrawRewardBodyDto extends createZodDto(
	withdrawRewardBodySchema,
) {}
