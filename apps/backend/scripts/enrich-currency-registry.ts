import fs from 'fs'
import path from 'path'
import z from 'zod'
import { ChainAddress } from '../src/domain/value-objects/chain-address'
import { toChainNamespace } from '../src/domain/value-objects/chain-namespace'
import { EnrichedCurrency } from '../src/infrastructure/currency-registry/enriched-currency'
import { fetchCurrenciesData } from '../src/infrastructure/price-provider/currency-fetcher'
import { GeckoTerminalService } from '../src/infrastructure/price-provider/gecko-terminal.service'

/**
 * raw-input.json -> enriched-output.json
 *
 * Standalone: no Nest, no registry, no EvmCurrencyService. Fetches metadata and
 * price for each raw currency via gecko. Loud all-or-nothing — any failure
 * aborts the whole run, leaving the last committed artifact untouched.
 */

const REGISTRY_DIR = path.join(
	__dirname,
	'../src/infrastructure/currency-registry',
)
const RAW_INPUT_PATH = path.join(REGISTRY_DIR, 'raw-input.json')
const ENRICHED_OUTPUT_PATH = path.join(REGISTRY_DIR, 'enriched-registry.json')

const rawInputSchema = z.array(
	z.object({
		chain: z.object({
			namespace: z.string(),
			reference: z.string(),
		}),
		address: z.string(),
	}),
)

function loadRawInput(): ChainAddress[] {
	const raw: unknown = JSON.parse(fs.readFileSync(RAW_INPUT_PATH, 'utf-8'))

	return rawInputSchema.parse(raw).map((entry) => ({
		chain: {
			namespace: toChainNamespace(entry.chain.namespace),
			reference: entry.chain.reference,
		},
		address: entry.address,
	}))
}

async function main() {
	const gecko = new GeckoTerminalService()
	const rawCurrencies = loadRawInput()

	const dataByCurrency = await fetchCurrenciesData(gecko, rawCurrencies)

	const enriched: EnrichedCurrency[] = rawCurrencies.map((chainAddress) => {
		const data = dataByCurrency.get(chainAddress)

		if (!data) {
			throw new Error(
				`No enriched data for ${chainAddress.chain.reference}:${chainAddress.address}`,
			)
		}

		return {
			chain: chainAddress.chain,
			address: chainAddress.address,
			metadata: data.metadata,
			lastKnownPrice: data.price,
		}
	})

	fs.writeFileSync(
		ENRICHED_OUTPUT_PATH,
		`${JSON.stringify(enriched, null, '\t')}\n`,
	)

	console.log(
		`Enriched ${enriched.length} currencies -> ${ENRICHED_OUTPUT_PATH}`,
	)
}

void main()
