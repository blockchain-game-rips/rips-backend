import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const withdrawRewardBodySchema = z.object({
	currencyAddress: evmAddressSchema,
})

export class WithdrawRewardBodyDto extends createZodDto(
	withdrawRewardBodySchema,
) {}
