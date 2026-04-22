import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'

const chainAddressSchema = z.object({
	address: z.string(),
	chain: z.object({
		reference: z.string(),
		namespace: z.string().transform(toChainNamespace),
	}),
})

export class ChainAddressDto extends createZodDto(chainAddressSchema) {}

export function toChainAddressDto(chainAddress: ChainAddress): ChainAddressDto {
	return {
		address: chainAddress.address,
		chain: {
			reference: chainAddress.chain.reference,
			namespace: chainAddress.chain.namespace,
		},
	}
}
