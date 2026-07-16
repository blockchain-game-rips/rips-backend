import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { EIP155 } from '../../constants'
import { Currency } from '../entities/currency'
import { EvmAddress, toEvmAddress } from '../value-objects/evm-address'
import { PrivateKey, toPrivateKey } from '../value-objects/private-key'
import { Wallet } from '../value-objects/wallet'

export function evmAddressFromWallet(wallet: Wallet): EvmAddress {
	return toEvmAddress(wallet.namespaceToAddress[EIP155])
}

export function createPrivateKey(): PrivateKey {
	return toPrivateKey(generatePrivateKey())
}

export function evmAddressFromPrivateKey(privateKey: PrivateKey): EvmAddress {
	return toEvmAddress(privateKeyToAddress(privateKey))
}

export function evmChainIdFromCurrency(currency: Currency) {
	return Number(currency.chainAddress.chain.reference)
}
