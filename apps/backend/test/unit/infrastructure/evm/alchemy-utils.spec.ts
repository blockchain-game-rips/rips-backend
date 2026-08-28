import {
	getAlchemyPortfolioUrl,
	getAlchemyRpcUrl,
	readAlchemyApiKey,
} from '../../../../src/infrastructure/evm/evm-client/alchemy/alchemy-utils'

const BASE_CHAIN_ID = 8453
const UNKNOWN_CHAIN_ID = 99_999_999

const API_KEY = 'test-api-key'

describe('alchemy urls', () => {
	it('puts the key it was handed in the rpc url', () => {
		expect(getAlchemyRpcUrl(BASE_CHAIN_ID, API_KEY)).toBe(
			`https://base-mainnet.g.alchemy.com/v2/${API_KEY}`,
		)
	})

	it('puts the key it was handed in the portfolio url', () => {
		expect(getAlchemyPortfolioUrl(API_KEY)).toBe(
			`https://api.g.alchemy.com/data/v1/${API_KEY}/assets/tokens/by-address`,
		)
	})

	it('refuses a chain alchemy has no network for', () => {
		expect(() => getAlchemyRpcUrl(UNKNOWN_CHAIN_ID, API_KEY)).toThrow(
			`Chain ID ${UNKNOWN_CHAIN_ID} not found in alchemy networks`,
		)
	})
})

describe('reading the alchemy key', () => {
	const KEY_ENV = 'ALCHEMY_API_KEY'

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it('reads the key from the environment', () => {
		vi.stubEnv(KEY_ENV, API_KEY)

		expect(readAlchemyApiKey()).toBe(API_KEY)
	})

	it('comes up undefined rather than throwing when unset', () => {
		vi.stubEnv(KEY_ENV, '')

		expect(readAlchemyApiKey()).toBeUndefined()
	})
})
