import { externalTapes, hostTape } from '../../utils/cassette/host-tape'

describe('host tape', () => {
	it('claims the interactions of the origin it was given', () => {
		const tape = hostTape('https://li.quest')

		expect(
			tape.owns({ scope: 'https://li.quest:443', path: '/v1/quote' }),
		).toBe(true)
	})

	it('does not claim a host that merely ends in its own name', () => {
		const tape = hostTape('https://li.quest')

		expect(
			tape.owns({ scope: 'https://evil-li.quest:443', path: '/' }),
		).toBe(false)
	})

	it('hands the test the same thing in either mode', () => {
		const tape = hostTape('https://li.quest')

		expect(tape.recorded()).toEqual(tape.replayed())
	})

	it('leaves an interaction alone, having nothing that drifts between runs', () => {
		const definition = {
			scope: 'https://li.quest:443',
			path: '/v1/quote',
			method: 'GET',
		}

		expect(hostTape('https://li.quest').normalize(definition)).toEqual(
			definition,
		)
	})

	it('brings nothing up and tears nothing down', async () => {
		const tape = hostTape('https://li.quest')

		await expect(tape.record()).resolves.toBeUndefined()
		await expect(tape.stop()).resolves.toBeUndefined()
	})
})

describe('external tapes', () => {
	it('names every api the backend talks to, so no test has to', () => {
		expect(Object.keys(externalTapes())).toEqual([
			'liFi',
			'deBridgeSwap',
			'deBridgeOrders',
			'deBridgeDln',
			'geckoTerminal',
			'alchemyBase',
			'alchemyEthereum',
			'alchemyPortfolio',
		])
	})

	// Postgres, Docker and supertest live on localhost: taping them would put
	// the test infrastructure itself under interception.
	it('leaves the test infrastructure alone', () => {
		const claimsLocalhost = Object.values(externalTapes()).some((tape) =>
			tape.owns({ scope: 'http://localhost:80', path: '/info' }),
		)

		expect(claimsLocalhost).toBe(false)
	})
})
