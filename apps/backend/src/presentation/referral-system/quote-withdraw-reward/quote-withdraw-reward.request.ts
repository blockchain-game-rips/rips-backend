import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const quoteWithdrawRewardBodySchema = z.object({
	currencyAddress: evmAddressSchema,
})

export class QuoteWithdrawRewardBodyDto extends createZodDto(
	quoteWithdrawRewardBodySchema,
) {}
