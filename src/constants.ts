import { toChainNamespace } from './domain/value-objects/chain-namespace'
import { getEnvSafe } from './utils/common'

export const EIP155 = toChainNamespace('eip155')
export const isProd = getEnvSafe('NODE_ENV') === 'production'
