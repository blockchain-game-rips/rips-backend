import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const quoteWithdrawRewardBodySchema = z.object({
	currencyAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress),
})

export class QuoteWithdrawRewardBodyDto extends createZodDto(
	quoteWithdrawRewardBodySchema,
) {}
