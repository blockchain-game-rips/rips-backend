import { ChainId, chainIdSchema } from '../value-objects/chain-id'
import {
	ChainNamespace,
	toChainNamespace,
} from '../value-objects/chain-namespace'

export function parseChainId(chainId: ChainId): {
	namespace: ChainNamespace
	reference: string
} {
	const chainIdChecked = chainIdSchema.parse(chainId)

	const [namespace, reference] = chainIdChecked.split(':')

	return { namespace: toChainNamespace(namespace), reference }
}

export function composeChainId(
	namespace: ChainNamespace,
	reference: string,
): ChainId {
	return `${namespace}:${reference}`
}
