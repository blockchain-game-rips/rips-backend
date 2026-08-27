import { Anvil } from '@rips/test-harness'
import {
	liveAnvil,
	replayedAnvil,
	withTapedTraces,
} from '../../utils/cassette/taped-anvil'

const BASE_CHAIN_ID = 8453
const ARBITRUM_CHAIN_ID = 42161
const ANVIL_PORT = 45003

describe('taped anvil', () => {
	it('keeps two chains apart, since de-bridge tapes both at once', () => {
		const base = replayedAnvil({ chainId: BASE_CHAIN_ID })
		const arbitrum = replayedAnvil({ chainId: ARBITRUM_CHAIN_ID })

		expect(base.rpcUrl).not.toBe(arbitrum.rpcUrl)
	})

	it('resolves a live url only once anvil has bound a port', () => {
		const anvil = new Anvil({ chainId: BASE_CHAIN_ID })
		const taped = liveAnvil(anvil)

		expect(() => taped.rpcUrl).toThrow('Anvil not started')

		vi.spyOn(anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		expect(taped.rpcUrl).toBe(`http://127.0.0.1:${ANVIL_PORT}`)
	})

	it('says a replayed run has no traces rather than printing none', async () => {
		const logged: string[] = []

		const spy = vi
			.spyOn(console, 'log')
			.mockImplementation((line: string) => void logged.push(line))

		const failure = new Error('swap reverted')

		await expect(
			withTapedTraces(
				replayedAnvil({ chainId: BASE_CHAIN_ID }),
				'anvil never started',
				() => Promise.reject(failure),
			),
		).rejects.toThrow(failure)

		spy.mockRestore()

		expect(logged).toContain('anvil never started')
	})
})
