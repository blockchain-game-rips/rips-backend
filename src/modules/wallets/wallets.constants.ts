import { EIP155 } from 'src/constants'
import { Account } from 'src/domain/value-objects/account'
import { base } from 'viem/chains'

export const MAIN_CURRENCY_ACCOUNT = Symbol('MAIN_CURRENCY')

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MAIN_CURRENCY_VALUE: Account = {
	address: NATIVE_ADDRESS,
	chain: {
		namespace: EIP155,
		reference: base.id.toString(),
	},
}
