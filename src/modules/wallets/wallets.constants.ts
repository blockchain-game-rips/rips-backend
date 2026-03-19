import { EIP155 } from 'src/constants'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { base } from 'viem/chains'

export const MAIN_CURRENCY_CHAIN_ADDRESS = Symbol('MAIN_CURRENCY')

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MAIN_CURRENCY_VALUE: ChainAddress = {
	address: NATIVE_ADDRESS,
	chain: {
		namespace: EIP155,
		reference: base.id.toString(),
	},
}
