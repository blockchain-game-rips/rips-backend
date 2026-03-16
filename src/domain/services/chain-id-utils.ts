import { ChainId, chainIdSchema } from '../value-objects/chain-id'

export function parseChainId(chainId: ChainId): {
	namespace: string
	reference: string
} {
	const chainIdChecked = chainIdSchema.parse(chainId)

	const [namespace, reference] = chainIdChecked.split(':')

	return { namespace, reference }
}

export function composeChainId(namespace: string, reference: string): ChainId {
	return `${namespace}:${reference}`
}
