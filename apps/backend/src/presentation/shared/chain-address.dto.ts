import { createZodDto } from 'nestjs-zod'
import { getAddress, isAddress } from 'viem'
import { z } from 'zod'
import { EIP155 } from '../../constants'
import { Chain } from '../../domain/value-objects/chain'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'

const chainSchema = z
	.object({
		reference: z.string(),
		namespace: z.string(),
	})
	.meta({ id: 'ChainDto' })

export class ChainDto extends createZodDto(chainSchema) {}

export function toChainDto(chain: Chain): ChainDto {
	return {
		reference: chain.reference,
		namespace: chain.namespace,
	}
}

const chainAddressSchema = z
	.object({
		address: z.string(),
		chain: chainSchema,
	})
	.meta({ id: 'ChainAddressDto' })

type RawChainAddress = {
	namespace: string
	reference: string
	address: string
}

function normalizeChainAddress(
	{ namespace, reference, address }: RawChainAddress,
	ctx: z.RefinementCtx,
): ChainAddress | typeof z.NEVER {
	const chain = { namespace: toChainNamespace(namespace), reference }

	if (chain.namespace === EIP155) {
		if (!isAddress(address)) {
			ctx.addIssue({
				code: 'custom',
				message: `Invalid ${namespace} address: ${address}`,
			})

			return z.NEVER
		}

		return { address: getAddress(address), chain }
	}

	ctx.addIssue({
		code: 'custom',
		message: `Unsupported chain namespace: ${namespace}`,
	})

	return z.NEVER
}

export const chainAddressInputSchema = z
	.object({
		address: z.string(),
		chain: z.object({
			reference: z.string(),
			namespace: z.string(),
		}),
	})
	.transform(({ address, chain }, ctx) =>
		normalizeChainAddress(
			{ namespace: chain.namespace, reference: chain.reference, address },
			ctx,
		),
	)

export const chainAddressQuerySchema = z
	.string()
	.transform((v) => v.split(':'))
	.pipe(z.tuple([z.string(), z.string(), z.string()]))
	.transform(([namespace, reference, address], ctx) =>
		normalizeChainAddress({ namespace, reference, address }, ctx),
	)

export const chainAddressQueryArraySchema = z.preprocess(
	(v): unknown[] => (Array.isArray(v) ? v : [v]),
	z.array(chainAddressQuerySchema).min(1),
)

export class ChainAddressDto extends createZodDto(chainAddressSchema) {}

export function toChainAddressDto(chainAddress: ChainAddress): ChainAddressDto {
	return {
		address: chainAddress.address,
		chain: toChainDto(chainAddress.chain),
	}
}
