import z from 'zod'
import { ChainId } from './chain-id'

const namespacePattern = '[-a-z0-9]{3,8}'
const referencePattern = '[-_a-zA-Z0-9]{1,32}'
const accountPattern = '[-.%a-zA-Z0-9]{1,128}'

const currencyIdRegex = new RegExp(
	`^${namespacePattern}:${referencePattern}:${accountPattern}$`,
)

export const currencyIdSchema = z.custom<CurrencyId>(
	(value) => typeof value === 'string' && currencyIdRegex.test(value),
)

type Account = string
/**
 * implements https://chainagnostic.org/CAIPs/caip-10
 */
export type CurrencyId = `${ChainId}:${Account}`
