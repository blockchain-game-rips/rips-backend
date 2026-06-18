import { GeckoTerminalService } from '../../../src/infrastructure/price-provider/gecko-terminal.service'

const USDT_ETH = '0xdac17f958d2ee523a2206206994597c13d831ec7'
const USDC_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETH_ETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const WBTC_ETH = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const DAI_ETH = '0x6b175474e89094c44da98b954eedeac495271d0f'

const OVER_30_TOKENS_ETH = [
	'0xdac17f958d2ee523a2206206994597c13d831ec7',
	'0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
	'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
	'0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
	'0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
	'0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
	'0x514910771af9ca656af840dff83e8264ecf986ca',
	'0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
	'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
	'0xdC035D45d973E3EC169d2276DDab16f1e407384F',
	'0x582d872a1b094fc48f5de31d3b73f2d9be47def1',
	'0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
	'0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
	'0x54D2252757e1672EEaD234D27B1270728fF90581',
	'0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
	'0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
	'0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
	'0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
	'0x4da27a545c0c5b758a6ba100e3a049001de870f5',
	'0x6982508145454ce325ddbe47a25d4ec3d2311933',
	'0x6b175474e89094c44da98b954eedeac495271d0f',
	'0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
	'0x75231f58b43240c9718dd58b4967c5114342a86c',
	'0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4',
	'0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
	'0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
	'0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3',
	'0x3c3a81e81dc49a522a592e7622a7e711c06bf354',
	'0xe66747a101bff2dba3697199dcce5b743b454759',
	'0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85',
	'0x56072C95FAA701256059aa122697B133aDEd9279',
]

describe('GeckoTerminalService', () => {
	let service: GeckoTerminalService

	beforeEach(() => {
		service = new GeckoTerminalService()
	})

	describe('getTokenPrice', () => {
		it('should return price for a single token', async () => {
			const price = await service.getTokenPrice(USDT_ETH, 'eth')

			expect(price).toBeGreaterThan(0)
		})

		it('should throw for an invalid chain', async () => {
			await expect(
				service.getTokenPrice(USDT_ETH, 'invalidChain'),
			).rejects.toThrow('Chain invalidChain not found')
		})
	})

	describe('getTokenPrices', () => {
		it('should return prices for multiple tokens', async () => {
			const addresses = [USDT_ETH, USDC_ETH, WETH_ETH, WBTC_ETH, DAI_ETH]

			const prices = await service.getTokenPrices(addresses, 'eth')

			expect(prices).toHaveLength(addresses.length)
			for (const token of prices) {
				expect(token.price).toBeGreaterThan(0)
			}
		})

		it('should handle batch larger than 30 addresses', async () => {
			const MIN_LIVE_TOKENS = 25

			const prices = await service.getTokenPrices(
				OVER_30_TOKENS_ETH,
				'eth',
			)

			const liveTokens = prices.filter((t) => t.price > 0)
			expect(liveTokens.length).toBeGreaterThanOrEqual(MIN_LIVE_TOKENS)
		})
	})
})
