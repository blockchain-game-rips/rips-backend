import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { chainAddressQueryArraySchema } from '../../shared/chain-address.dto'

const getCurrenciesQuerySchema = z.object({
	chainAddress: chainAddressQueryArraySchema,
})

export class GetCurrenciesQueryDto extends createZodDto(
	getCurrenciesQuerySchema,
) {}
