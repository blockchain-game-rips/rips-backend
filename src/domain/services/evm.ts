import { EIP155 } from '../../constants'
import { Currency } from '../entities/currency'
import { EvmAddress, toEvmAddress } from '../value-objects/evm-address'
import { Wallet } from '../value-objects/wallet'

export function evmAddressFromWallet(wallet: Wallet): EvmAddress {
	return toEvmAddress(wallet.namespaceToAddress[EIP155])
}

export function evmChainIdFromCurrency(currency: Currency) {
	return Number(currency.chainAddress.chain.reference)
}
