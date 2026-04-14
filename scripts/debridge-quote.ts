import { AxiosError } from 'axios'
import { Config } from '../src/domain/entities/config'
import { Currency } from '../src/domain/entities/currency'
import { composeChainId } from '../src/domain/services/chain-id-utils'
import { composeCurrencyId } from '../src/domain/services/currency-id-utils'
import { toChainNamespace } from '../src/domain/value-objects/chain-namespace'
import { UserWallet } from '../src/domain/value-objects/wallet'
import { DeBridgeService } from '../src/infrastructure/de-bridge/de-bridge.service'

const EIP155 = toChainNamespace('eip155')

const ARBITRUM_CHAIN_ID = '42161'
const BASE_CHAIN_ID = '8453'

const USDC_ARBITRUM: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, ARBITRUM_CHAIN_ID),
		'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: ARBITRUM_CHAIN_ID },
		address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
	},
	symbol: 'USDC',
	name: 'USD Coin',
	decimals: 6,
}

const ETH_BASE: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, BASE_CHAIN_ID),
		'0x0000000000000000000000000000000000000000',
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: BASE_CHAIN_ID },
		address: '0x0000000000000000000000000000000000000000',
	},
	symbol: 'ETH',
	name: 'Ethereum',
	decimals: 18,
}

const MOCK_WALLET: UserWallet = {
	kind: 'user',
	namespaceToAddress: {
		[EIP155]: '0x1234567890abcdef1234567890abcdef12345678',
	},
}

const MOCK_CONFIG: Config = {
	id: 1,
	ticketCup: 1000,
	feePercent: 1,
	ticketPrice: {
		currency: ETH_BASE,
		amount: 10000000000000000n, // 0.01 ETH
	},
	durationSeconds: 3600,
	prizeDistribution: [],
}

const RIPS_CONTRACT_ADDRESS = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

async function main() {
	const service = new DeBridgeService(RIPS_CONTRACT_ADDRESS as `0x${string}`)

	try {
		const result = await service.quote(MOCK_WALLET, {
			stakeId: 1,
			config: MOCK_CONFIG,
			paymentCurrency: USDC_ARBITRUM,
			ticketCount: 5,
		})

		console.log('Quote result:', result)
	} catch (error) {
		if (error instanceof AxiosError) {
			console.log(error.cause)
		}
	}
}

main().catch(console.error)
