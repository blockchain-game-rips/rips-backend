import { getAddress } from 'viem'
import { EIP155 } from '../../src/constants'
import { Currency } from '../../src/domain/entities/currency'
import { User } from '../../src/domain/entities/user'
import { composeChainId } from '../../src/domain/services/chain-id-utils'
import { composeCurrencyId } from '../../src/domain/services/currency-id-utils'
import { toTelegramId } from '../../src/domain/value-objects/telegram-id'
import { Wallet } from '../../src/domain/value-objects/wallet'

const ANVIL_CHAIN_ID = 31337

export const TELEGRAM_ID = toTelegramId(123456n)
export const EVM_ADDRESS = getAddress(
	'0x1234567890abcdef1234567890abcdef12345678',
)
export const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MOCK_WALLET: Wallet = {
	kind: 'user',
	namespaceToAddress: { [EIP155]: EVM_ADDRESS },
}

export const MOCK_USER: User = {
	id: 1n,
	telegramProfile: { telegramId: TELEGRAM_ID },
	wallet: MOCK_WALLET,
	referrerAddress: null,
	createdAt: new Date('2026-01-01'),
}

export const MOCK_CURRENCY_CHAIN_ADDRESS = {
	chain: { namespace: EIP155, reference: '8453' },
	address: NATIVE_ADDRESS,
}

export const MOCK_CURRENCY: Currency = {
	id: composeCurrencyId(composeChainId(EIP155, '8453'), NATIVE_ADDRESS),
	chainAddress: MOCK_CURRENCY_CHAIN_ADDRESS,
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

export const ANVIL_NATIVE_CURRENCY: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, ANVIL_CHAIN_ID.toString()),
		NATIVE_ADDRESS,
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: ANVIL_CHAIN_ID.toString() },
		address: NATIVE_ADDRESS,
	},
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}
