import { getAddress, isAddressEqual } from 'viem'
import * as chains from 'viem/chains'
import { CurrencyMetadata } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { wait } from '../../utils/common'
import {
	NATIVE_ADDRESS,
	WRAPPED_TOKENS,
} from '../evm/primitives/currencies/constants'
import { chainIdToGeckoChainId } from './constants'
import {
	GeckoTerminalService,
	GeckoTerminalTokenData,
} from './gecko-terminal.service'

const INTER_NETWORK_DELAY_MS = 1000 * 12

/**
 * Pure fetch logic shared by the price-provider service (live refresh) and the
 * enrichment script (artifact build). Depends only on a gecko client and static
 * maps — no cache, no seed, no EvmCurrencyService, no Nest.
 */

export interface EnrichedCurrencyData {
	metadata: CurrencyMetadata
	price: number
}

export function geckoNetworkOf(chainId: number): string {
	const key = String(chainId) as keyof typeof chainIdToGeckoChainId
	const network = chainIdToGeckoChainId[key]

	if (!network) {
		throw new Error(`Unsupported chainId for gecko: ${chainId}`)
	}

	return network
}

/**
 * Gecko prices wrapped tokens, not native. A native address resolves to its
 * wrapped equivalent — a static map lookup, not an RPC call.
 */
export function priceableAddress(chainId: number, address: string): string {
	if (!isAddressEqual(getAddress(address), NATIVE_ADDRESS)) {
		return getAddress(address)
	}

	const wrapped = WRAPPED_TOKENS[chainId]

	if (!wrapped) {
		throw new Error(`No wrapped native for chain ${chainId}`)
	}

	return wrapped
}

function isNative(address: string): boolean {
	return isAddressEqual(getAddress(address), NATIVE_ADDRESS)
}

/**
 * Native metadata comes from the viem chain definition (static data, no RPC),
 * not from gecko — gecko would return the wrapped token's metadata (e.g. WETH
 * for native ETH).
 */
function nativeMetadata(chainId: number): CurrencyMetadata {
	const chain = Object.values(chains).find((c) => c.id === chainId)

	if (!chain) {
		throw new Error(`No viem chain definition for chain ${chainId}`)
	}

	return {
		symbol: chain.nativeCurrency.symbol,
		name: chain.nativeCurrency.name,
		decimals: chain.nativeCurrency.decimals,
	}
}

function metadataFrom(
	chainAddress: ChainAddress,
	token: GeckoTerminalTokenData,
): CurrencyMetadata {
	if (isNative(chainAddress.address)) {
		return nativeMetadata(Number(chainAddress.chain.reference))
	}

	return {
		symbol: token.attributes.symbol,
		name: token.attributes.name,
		decimals: token.attributes.decimals,
	}
}

/**
 * Batched enrichment: one gecko request per network (native resolved to its
 * wrapped address for the lookup), with a delay between networks to respect
 * rate limits. Fails loud if any requested token is missing from the response.
 */
export async function fetchCurrenciesData(
	gecko: GeckoTerminalService,
	chainAddresses: ChainAddress[],
): Promise<Map<ChainAddress, EnrichedCurrencyData>> {
	const byNetwork = new Map<string, ChainAddress[]>()

	for (const chainAddress of chainAddresses) {
		const network = geckoNetworkOf(Number(chainAddress.chain.reference))

		const group = byNetwork.get(network) ?? []
		group.push(chainAddress)
		byNetwork.set(network, group)
	}

	const result = new Map<ChainAddress, EnrichedCurrencyData>()
	const networks = Array.from(byNetwork.entries())

	for (let i = 0; i < networks.length; i++) {
		if (i > 0) await wait(INTER_NETWORK_DELAY_MS)

		const [network, group] = networks[i]

		const addresses = group.map((entry) =>
			priceableAddress(Number(entry.chain.reference), entry.address),
		)

		const tokens = await gecko.getTokensData(addresses, network)

		for (let j = 0; j < group.length; j++) {
			const chainAddress = group[j]
			const address = addresses[j]

			const token = tokens.find((t) =>
				isAddressEqual(
					getAddress(t.attributes.address),
					getAddress(address),
				),
			)

			if (!token) {
				throw new Error(
					`Gecko returned no data for ${network}:${address}`,
				)
			}

			result.set(chainAddress, {
				metadata: metadataFrom(chainAddress, token),
				price: Number(token.attributes.price_usd),
			})
		}
	}

	return result
}
