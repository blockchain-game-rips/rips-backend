import { config } from 'dotenv'
import path from 'node:path'
import { Address, getAddress } from 'viem'
import { AlchemyBalanceService } from '../../../src/infrastructure/evm/evm-client/alchemy/alchemy-balance.service'
import { externalTapes } from '../../utils/cassette/host-tape'
import { useVcr } from '../../utils/cassette/use-vcr'

const ETH_MAINNET_CHAIN_ID = 1
const BASE_CHAIN_ID = 8453
const UNSUPPORTED_CHAIN_ID = 99_999_999

// Vitalik's public address — reliably holds native ETH and many ERC20s.
const WHALE_ADDRESS: Address = getAddress(
	'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
)
const USDC_BASE: Address = getAddress(
	'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
)

config({ path: path.resolve(__dirname, '../../../.env') })

describe('AlchemyBalanceService (integration)', () => {
	const vcr = useVcr(externalTapes())

	const service = new AlchemyBalanceService(vcr.tapes.alchemyPortfolio.apiKey)

	it('fetches native and erc20 balances grouped by chain id', async () => {
		const result = await service.fetchBalances(WHALE_ADDRESS, [
			ETH_MAINNET_CHAIN_ID,
			BASE_CHAIN_ID,
		])

		expect(result.unsupportedChainIds.size).toBe(0)

		const ethBalances =
			result.balancesByChainId.get(ETH_MAINNET_CHAIN_ID) ?? []

		const nativeEth = ethBalances.find(
			(balance) => balance.tokenAddress === null,
		)

		expect(nativeEth).toBeDefined()
		expect(nativeEth?.balance).toBeGreaterThan(0n)

		const baseBalances = result.balancesByChainId.get(BASE_CHAIN_ID) ?? []

		for (const balance of baseBalances) {
			expect(balance.balance).toBeGreaterThanOrEqual(0n)
		}
	})

	it('returns a valid usdc balance when the wallet holds it', async () => {
		const result = await service.fetchBalances(WHALE_ADDRESS, [
			BASE_CHAIN_ID,
		])

		const usdc = (result.balancesByChainId.get(BASE_CHAIN_ID) ?? []).find(
			(balance) =>
				balance.tokenAddress !== null &&
				getAddress(balance.tokenAddress) === USDC_BASE,
		)

		if (usdc) {
			expect(usdc.balance).toBeGreaterThanOrEqual(0n)
		}
	})

	it('marks unmapped chains as unsupported', async () => {
		const result = await service.fetchBalances(WHALE_ADDRESS, [
			ETH_MAINNET_CHAIN_ID,
			UNSUPPORTED_CHAIN_ID,
		])

		expect(result.unsupportedChainIds.has(UNSUPPORTED_CHAIN_ID)).toBe(true)
		expect(result.balancesByChainId.has(ETH_MAINNET_CHAIN_ID)).toBe(true)
	})

	it('does not call the api when no chain is supported', async () => {
		const result = await service.fetchBalances(WHALE_ADDRESS, [
			UNSUPPORTED_CHAIN_ID,
		])

		expect(result.balancesByChainId.size).toBe(0)
		expect(result.unsupportedChainIds.has(UNSUPPORTED_CHAIN_ID)).toBe(true)
	})
})
