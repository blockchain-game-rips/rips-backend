import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toChainNamespace } from '../../../domain/value-objects/chain-namespace'

const getCurrencyIdQuerySchema = z.object({
	chainAddress: z.string().transform((v) => {
		const [namespace, reference, address] = v.split(':')
		return {
			address,
			chain: {
				namespace: toChainNamespace(namespace),
				reference,
			},
		}
	}),
})

export class GetCurrencyIdQueryDto extends createZodDto(
	getCurrencyIdQuerySchema,
) {}
