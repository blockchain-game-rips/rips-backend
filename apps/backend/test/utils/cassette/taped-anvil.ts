import { Anvil, ParamsUseAnvil, withTraces } from '@rips/test-harness'

/**
 * An anvil the cassette knows about. Recording runs a real one; replay stands
 * in for it with nothing but an address, since its traffic comes off the tape.
 * Both hand the test the same `rpcUrl`, so a spec never learns which it got.
 */
export type TapedAnvil =
	| { kind: 'live'; readonly rpcUrl: string; readonly anvil: Anvil }
	| { kind: 'replayed'; readonly rpcUrl: string }

export function liveAnvil(anvil: Anvil): TapedAnvil {
	return {
		kind: 'live',
		anvil,

		// Read through to the process rather than copied, so the address cannot
		// drift from the port anvil actually bound.
		get rpcUrl() {
			return `http://127.0.0.1:${anvil.port}`
		},
	}
}

export function replayedAnvil(params: ParamsUseAnvil): TapedAnvil {
	return {
		kind: 'replayed',
		rpcUrl: replayedAnvilUrl(params.chainId),
	}
}

/**
 * The address a replayed anvil answers on. It carries the chain id because
 * de-bridge brings up two chains at once, and a shared host would merge their
 * traffic into one indistinguishable pile.
 */
export function replayedAnvilUrl(chainId: number): string {
	return `http://anvil-${chainId}`
}

/**
 * Prints anvil's own logs when the wrapped call fails, which is the only place
 * a revert reason lives.
 *
 * On replay there is no process and so no logs. Saying that outright beats
 * printing an empty string, which reads as "the swap reverted without a
 * reason" rather than "look somewhere else".
 */
export async function withTapedTraces<T>(
	taped: TapedAnvil,
	noTracesReason: string,
	run: () => Promise<T>,
): Promise<T> {
	if (taped.kind === 'live') {
		return withTraces(taped.anvil, run)
	}

	return run().catch((error: unknown) => {
		console.log(noTracesReason)

		throw error
	})
}
