import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toChainNamespace } from '../../../domain/value-objects/chain-namespace'

const chainAddressQuerySchema = z.string().transform((v) => {
	const [namespace, reference, address] = v.split(':')
	return {
		address,
		chain: {
			namespace: toChainNamespace(namespace),
			reference,
		},
	}
})

const getCurrenciesQuerySchema = z.object({
	chainAddress: z.preprocess(
		(v) => (Array.isArray(v) ? v : [v]),
		z.array(chainAddressQuerySchema).min(1),
	),
})

export class GetCurrenciesQueryDto extends createZodDto(
	getCurrenciesQuerySchema,
) {}
