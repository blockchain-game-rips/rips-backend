import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressQueryArraySchema } from '../../shared/chain-address.dto'

const getBalancesQuerySchema = z.object({
	chainAddress: chainAddressQueryArraySchema,
})

export class GetBalancesQueryDto extends createZodDto(getBalancesQuerySchema) {}
