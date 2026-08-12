import { CacheModule } from '@nestjs/cache-manager'
import { Test } from '@nestjs/testing'
import { encodeFunctionData, getAddress, parseEther } from 'viem'
import { NativeCurrency } from '../../../src/infrastructure/evm/primitives/currencies/native-currency'
import { Token } from '../../../src/infrastructure/evm/primitives/currencies/token'
import { LiFiApiService } from '../../../src/infrastructure/li-fi/li-fi-api.service'
import { LIFI_API_KEY } from '../../../src/infrastructure/li-fi/li-fi.constants'
import {
	ENTER_RIP_GAS_LIMIT,
	SLIPPAGE,
} from '../../../src/infrastructure/li-fi/li-fi.service'
import { ripsAbi } from '../../../src/infrastructure/rips/rips-abi'

const BASE_CHAIN_ID = 8453
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6
const USER_ADDRESS = getAddress('0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0')
const RIPS_CONTRACT_ADDRESS = getAddress(
	'0xc18d9e84b8687a2645447a61e52c455dac1675e1',
)
const ENTRY_PRICE = parseEther('0.0005')

const USDC_BASE = new Token(USDC_BASE_ADDRESS, BASE_CHAIN_ID, {
	symbol: 'USDC',
	name: 'USD Coin',
	decimals: USDC_DECIMALS,
})

const ETH_BASE = new NativeCurrency(BASE_CHAIN_ID, {
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
})

const enterRipCallData = encodeFunctionData({
	abi: ripsAbi,
	functionName: 'enterRip',
	args: [1n, 1n, USER_ADDRESS],
})

describe('LiFiApiService', () => {
	let service: LiFiApiService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [CacheModule.register()],
			providers: [
				{
					provide: LIFI_API_KEY,
					useValue: process.env.LIFI_API_KEY ?? null,
				},
				LiFiApiService,
			],
		}).compile()

		service = moduleRef.get(LiFiApiService)
	})

	const fetchQuote = (amountOut: bigint) =>
		service.fetchContractCallsQuote({
			userAddress: USER_ADDRESS,
			currencyIn: USDC_BASE,
			currencyOut: ETH_BASE,
			amountOut,
			slippage: SLIPPAGE,
			call: {
				targetAddress: RIPS_CONTRACT_ADDRESS,
				callData: enterRipCallData,
				gasLimit: ENTER_RIP_GAS_LIMIT,
			},
		})

	it('quotes a same-chain ERC-20 to native swap with a contract call', async () => {
		const quote = await fetchQuote(ENTRY_PRICE)

		expect(quote.action.fromChainId).toBe(BASE_CHAIN_ID)
		expect(quote.action.toChainId).toBe(BASE_CHAIN_ID)
		expect(BigInt(quote.action.fromAmount)).toBeGreaterThan(0n)
		expect(quote.transactionRequest.chainId).toBe(BASE_CHAIN_ID)
		expect(quote.estimate.approvalAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('solves the input amount backwards from the requested output', async () => {
		const single = await fetchQuote(ENTRY_PRICE)
		const double = await fetchQuote(ENTRY_PRICE * 2n)

		const singleIn = BigInt(single.action.fromAmount)
		const doubleIn = BigInt(double.action.fromAmount)

		expect(doubleIn).toBeGreaterThan(singleIn)
	})
})
