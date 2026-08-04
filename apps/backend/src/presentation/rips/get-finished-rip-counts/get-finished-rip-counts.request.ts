import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const getFinishedRipCountsQuerySchema = z.object({
	userAddress: evmAddressSchema,
})

export class GetFinishedRipCountsQueryDto extends createZodDto(
	getFinishedRipCountsQuerySchema,
) {}
