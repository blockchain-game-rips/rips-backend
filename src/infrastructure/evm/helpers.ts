import { Address, getAddress } from 'viem'
import { EIP155 } from '../../constants'
import { Currency } from '../../domain/entities/currency'
import { Wallet } from '../../domain/value-objects/wallet'

export function evmAddressFromWallet(wallet: Wallet): Address {
	return getAddress(wallet.namespaceToAddress[EIP155])
}

export function evmChainIdFromCurrency(currency: Currency) {
	return Number(currency.chainAddress.chain.reference)
}
