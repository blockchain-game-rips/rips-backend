import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { toChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { base } from 'viem/chains'

export const MAIN_CURRENCY = Symbol('MAIN_CURRENCY')

const EIP155 = toChainNamespace('eip155')
const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MAIN_CURRENCY_VALUE: CurrencyId = composeCurrencyId(
	composeChainId(EIP155, String(base.id)),
	NATIVE_ADDRESS,
)
