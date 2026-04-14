import { base } from 'viem/chains'
import { EIP155 } from '../../constants'
import { ChainAddress } from '../../domain/value-objects/chain-address'

const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MAIN_CURRENCY_VALUE: ChainAddress = {
	address: NATIVE_ADDRESS,
	chain: {
		namespace: EIP155,
		reference: base.id.toString(),
	},
}
